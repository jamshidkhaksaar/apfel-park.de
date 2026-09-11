"use client";

import { useEffect, useRef, useState } from "react";

import {
  ACESFilmicToneMapping,
  AnimationMixer,
  Box3,
  Color,
  EquirectangularReflectionMapping,
  type Group,
  type Material,
  type Mesh,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  type Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import {
  SAMSUNG_DRACO_PATH,
  SAMSUNG_FINISHES,
  SAMSUNG_MODEL_CONFIG,
  SAMSUNG_MODEL_LABEL,
  type SamsungModelId,
  type SamsungViewerConfig,
  samsungHdrUrl,
  samsungPosterUrl,
  samsungScreenTextureUrl,
} from "@/lib/samsung-fold3d";

export type Fold3DViewerProps = {  /** Single model, or "lineup" to render Fold8 + Ultra side by side. */
  model: SamsungModelId | "lineup";
  /** Official finish key applied to the primary model. */
  finish: string;
  /** When true the device is shown in its folded pose. */
  folded?: boolean;
  className?: string;
};

type LoadedModel = {
  id: SamsungModelId;
  group: Group;
  materials: Map<string, Material>;
  originals: Map<Material, MaterialSnapshot>;
  mixer: AnimationMixer;
  clipDuration: number;
};

type MaterialSnapshot = {
  color: Color;
  emissive: Color;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  emissiveIntensity: number;
  toneMapped: boolean;
  envMap: Texture | null;
  emissiveMap: Texture | null;
};

const EMPTY_SNAPSHOT: MaterialSnapshot = {
  color: new Color(0xffffff),
  emissive: new Color(0x000000),
  metalness: 1,
  roughness: 1,
  opacity: 1,
  transparent: false,
  emissiveIntensity: 1,
  toneMapped: true,
  envMap: null,
  emissiveMap: null,
};

function snapshotMaterial(material: Material): MaterialSnapshot {
  const std = material as MeshStandardMaterial;
  return {
    color: std.color ? std.color.clone() : EMPTY_SNAPSHOT.color.clone(),
    emissive: std.emissive ? std.emissive.clone() : EMPTY_SNAPSHOT.emissive.clone(),
    metalness: typeof std.metalness === "number" ? std.metalness : EMPTY_SNAPSHOT.metalness,
    roughness: typeof std.roughness === "number" ? std.roughness : EMPTY_SNAPSHOT.roughness,
    opacity: typeof std.opacity === "number" ? std.opacity : EMPTY_SNAPSHOT.opacity,
    transparent: Boolean(std.transparent),
    emissiveIntensity: typeof std.emissiveIntensity === "number" ? std.emissiveIntensity : EMPTY_SNAPSHOT.emissiveIntensity,
    toneMapped: std.toneMapped !== false,
    envMap: (std.envMap as Texture | null) ?? null,
    emissiveMap: (std.emissiveMap as Texture | null) ?? null,
  };
}

function restoreMaterial(material: Material, snapshot: MaterialSnapshot): void {
  const std = material as MeshStandardMaterial;
  std.color?.copy(snapshot.color);
  std.emissive?.copy(snapshot.emissive);
  if ("metalness" in std) std.metalness = snapshot.metalness;
  if ("roughness" in std) std.roughness = snapshot.roughness;
  std.opacity = snapshot.opacity;
  std.transparent = snapshot.transparent;
  if ("emissiveIntensity" in std) std.emissiveIntensity = snapshot.emissiveIntensity;
  std.toneMapped = snapshot.toneMapped;
  std.envMap = snapshot.envMap;
  std.emissiveMap = snapshot.emissiveMap;
  std.needsUpdate = true;
}

/** Imperative three.js scene, kept out of React's render cycle. */
class FoldScene {
  private readonly container: HTMLElement;
  private readonly modelIds: SamsungModelId[];

  private renderer!: WebGLRenderer;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private controls!: OrbitControls;
  private pmrem!: PMREMGenerator;
  private gltfLoader!: GLTFLoader;
  private rgbeLoader!: RGBELoader;

  private readonly models: LoadedModel[] = [];
  private readonly configs = new Map<SamsungModelId, SamsungViewerConfig>();
  private readonly envCache = new Map<string, Texture | null>();
  private readonly textureCache = new Map<string, Promise<Texture | null>>();
  private textureLoader!: TextureLoader;

  private frame = 0;
  private disposed = false;
  private reducedMotion = false;
  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private visible = true;
  private lastTime = 0;
  private profileTarget: number | null = null;

  constructor(container: HTMLElement, modelIds: SamsungModelId[]) {
    this.container = container;
    this.modelIds = modelIds;
  }

  async init(): Promise<void> {
    if (this.disposed) return;

    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.cursor = "grab";
    this.renderer.domElement.style.touchAction = "none";
    this.container.appendChild(this.renderer.domElement);

    this.scene = new Scene();
    this.camera = new PerspectiveCamera(35, this.aspect, 0.01, 5000);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.enableZoom = true;
    this.controls.minDistance = 0.4;
    this.controls.maxDistance = 60;
    this.controls.rotateSpeed = 0.85;

    this.pmrem = new PMREMGenerator(this.renderer);
    this.pmrem.compileEquirectangularShader();

    const draco = new DRACOLoader();
    draco.setDecoderPath(SAMSUNG_DRACO_PATH);
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(draco);
    this.rgbeLoader = new RGBELoader();
    this.textureLoader = new TextureLoader();

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.controls.autoRotate = !this.reducedMotion;
    this.controls.autoRotateSpeed = 1.1;

    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);

    await Promise.all([...this.modelIds.map((id) => this.loadModel(id)), ...this.modelIds.map((id) => this.loadConfig(id))]);

    if (this.disposed) return;

    this.layout();
    this.applyPose();
    this.observe();
    this.resize();
    this.lastTime = performance.now();
    this.tick();
  }

  private get aspect(): number {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    return w / h;
  }

  private async loadConfig(id: SamsungModelId): Promise<void> {
    try {
      const res = await fetch(SAMSUNG_MODEL_CONFIG[id].configUrl);
      if (!res.ok) return;
      this.configs.set(id, (await res.json()) as SamsungViewerConfig);
    } catch {
      // Config is an enhancement; the model still renders without it.
    }
  }

  private async loadModel(id: SamsungModelId): Promise<void> {
    const spec = SAMSUNG_MODEL_CONFIG[id];
    const gltf = await this.gltfLoader.loadAsync(spec.glb);
    if (this.disposed) return;

    const group = gltf.scene;
    const materials = new Map<string, Material>();
    const originals = new Map<Material, MaterialSnapshot>();

    group.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const material of meshMaterials) {
        if (!material) continue;
        const name = material.name || `material_${materials.size}`;
        if (!materials.has(name)) materials.set(name, material);
        if (!originals.has(material)) originals.set(material, snapshotMaterial(material));
      }
    });

    const mixer = new AnimationMixer(group);
    let clipDuration = 0;
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip);
      action.play();
      clipDuration = Math.max(clipDuration, clip.duration);
    }

    this.models.push({ id, group, materials, originals, mixer, clipDuration });
    this.scene.add(group);
  }

  /** Position/scale the loaded models and fit the camera. */
  private layout(): void {
    if (this.models.length === 0) return;

    for (const model of this.models) {
      const box = new Box3().setFromObject(model.group);
      const center = box.getCenter(new Vector3());
      model.group.position.sub(center);
    }

    if (this.models.length > 1) {
      const widths = this.models.map((m) => new Box3().setFromObject(m.group).getSize(new Vector3()).x || 1);
      const gap = Math.max(...widths) * 0.28;
      const total = widths.reduce((sum, w) => sum + w, 0) + gap * (this.models.length - 1);
      let cursor = -total / 2;
      this.models.forEach((model, index) => {
        model.group.position.x += cursor + widths[index] / 2;
        cursor += widths[index] + gap;
      });
    }

    const bounds = new Box3();
    for (const model of this.models) bounds.expandByObject(model.group);
    const size = bounds.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fov = (this.camera.fov * Math.PI) / 180;
    const distance = (maxDim / 2 / Math.tan(fov / 2)) * 1.7;

    this.camera.position.set(0, size.y * 0.04, distance);
    this.camera.near = distance / 100;
    this.camera.far = distance * 100;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = distance * 0.45;
    this.controls.maxDistance = distance * 2.4;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private applyPose(): void {
    if (this.profileTarget !== null) {
      for (const model of this.models) model.group.rotation.y = this.profileTarget;
    }
    for (const model of this.models) {
      if (model.clipDuration > 0) {
        model.mixer.setTime(this.profileTarget !== null ? model.clipDuration : 0);
      }
    }
  }

  setProfile(active: boolean): void {
    this.profileTarget = active ? Math.PI / 2 : null;
    this.controls.autoRotate = !active && !this.reducedMotion;
    this.applyPose();
  }

  async setFinish(primary: SamsungModelId, finishKey: string): Promise<void> {
    await Promise.all(
      this.models.map((model) =>
        this.applyFinish(model, model.id === primary ? finishKey : undefined),
      ),
    );
  }

  private async applyFinish(model: LoadedModel, requestedKey?: string): Promise<void> {
    const config = this.configs.get(model.id);
    const modelConfig = config?.[SAMSUNG_MODEL_CONFIG[model.id].configKey];
    if (!modelConfig) return;

    const colorConfig =
      modelConfig.color.find((c) => c.key === requestedKey) ??
      modelConfig.color.find((c) => c.default) ??
      modelConfig.color[0];
    if (!colorConfig) return;

    for (const [material, snapshot] of model.originals) restoreMaterial(material, snapshot);

    const baseEnv = colorConfig.envtype ? await this.getEnv(colorConfig.envtype) : null;
    if (baseEnv) this.scene.environment = baseEnv;

    for (const custom of colorConfig.custumMaterial ?? []) {
      for (const target of custom.target) {
        const material = model.materials.get(target);
        if (material) this.applyOptions(material, custom.options, model.id, colorConfig.key);
      }
    }

    for (const custom of colorConfig.envCustom ?? []) {
      if (!custom.target || custom.target.length === 0) continue;
      const env = await this.getEnv(custom.type);
      if (!env) continue;
      for (const target of custom.target) {
        const material = model.materials.get(target) as MeshStandardMaterial | undefined;
        if (material) {
          material.envMap = env;
          material.needsUpdate = true;
        }
      }
    }
  }

  private applyOptions(
    material: Material,
    options: Record<string, string | number | boolean>,
    modelId: SamsungModelId,
    finishKey: string,
  ): void {
    const std = material as MeshStandardMaterial;
    for (const [key, value] of Object.entries(options)) {
      switch (key) {
        case "color":
          if (std.color && typeof value === "string") std.color = new Color(value);
          break;
        case "emissive":
          if (std.emissive && typeof value === "string") std.emissive = new Color(value);
          break;
        case "metalness":
          if (typeof value === "number") std.metalness = value;
          break;
        case "roughness":
          if (typeof value === "number") std.roughness = value;
          break;
        case "opacity":
          if (typeof value === "number") {
            std.opacity = value;
            std.transparent = value < 1;
          }
          break;
        case "emissiveIntensity":
          if (typeof value === "number") std.emissiveIntensity = value;
          break;
        case "toneMapped":
          if (typeof value === "boolean") std.toneMapped = value;
          break;
        default:
          break;
      }
    }

    const name = material.name;
    if (name === "Display_ActiveArea" || name === "Display_ActiveArea_Front") {
      const side = name === "Display_ActiveArea" ? "main" : "front";
      void this.getScreenTexture(modelId, side, finishKey).then((texture) => {
        if (!texture || this.disposed) return;
        std.emissiveMap = texture;
        std.emissive = new Color(0xffffff);
        std.emissiveIntensity = 1;
        std.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
      });
    }
  }

  private getEnv(type: string): Promise<Texture | null> {
    const url = samsungHdrUrl(type);
    if (!url) return Promise.resolve(null);
    const cached = this.envCache.get(url);
    if (cached !== undefined) return Promise.resolve(cached);

    return new Promise((resolve) => {
      this.rgbeLoader.load(
        url,
        (texture) => {
          if (this.disposed) {
            resolve(null);
            return;
          }
          texture.mapping = EquirectangularReflectionMapping;
          const target = this.pmrem.fromEquirectangular(texture);
          texture.dispose();
          this.envCache.set(url, target.texture);
          resolve(target.texture);
        },
        undefined,
        () => {
          this.envCache.set(url, null);
          resolve(null);
        },
      );
    });
  }

  private getScreenTexture(modelId: SamsungModelId, side: "main" | "front", finishKey: string): Promise<Texture | null> {
    const url = samsungScreenTextureUrl(modelId, side, finishKey);
    const cached = this.textureCache.get(url);
    if (cached) return cached;

    const promise = new Promise<Texture | null>((resolve) => {
      this.textureLoader.load(
        url,
        (texture: Texture) => {
          texture.colorSpace = SRGBColorSpace;
          texture.flipY = false;
          texture.needsUpdate = true;
          resolve(texture);
        },
        undefined,
        () => resolve(null),
      );
    });

    this.textureCache.set(url, promise);
    return promise;
  }

  private readonly onPointerDown = (): void => {
    this.controls.autoRotate = false;
    this.renderer.domElement.style.cursor = "grabbing";
  };

  private readonly onPointerUp = (): void => {
    this.renderer.domElement.style.cursor = "grab";
  };

  private observe(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.visible = entries.some((entry) => entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    this.intersectionObserver.observe(this.container);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private readonly tick = (): void => {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.visible) {
      for (const model of this.models) model.mixer.update(delta);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
  };

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    window.removeEventListener("pointerup", this.onPointerUp);
    this.renderer?.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.controls?.dispose();
    for (const model of this.models) {
      model.mixer.stopAllAction();
      this.scene?.remove(model.group);
    }
    this.pmrem?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}

export default function Fold3DViewer({ model, finish, folded = false, className }: Fold3DViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<FoldScene | null>(null);
  const [ready, setReady] = useState(false);

  const modelIds: SamsungModelId[] = model === "lineup" ? ["fold8", "ultra"] : [model];
  const primary: SamsungModelId = model === "lineup" ? "fold8" : model;
  const posterFinish = SAMSUNG_FINISHES[primary].some((f) => f.id === finish)
    ? finish
    : SAMSUNG_FINISHES[primary][0].id;
  const poster = samsungPosterUrl(primary, posterFinish);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new FoldScene(host, modelIds);
    sceneRef.current = scene;
    let active = true;

    scene
      .init()
      .then(() => scene.setFinish(primary, finish))
      .then(() => scene.setProfile(folded))
      .then(() => {
        if (active) setReady(true);
      })
      .catch(() => {
        if (active) setReady(false);
      });

    return () => {
      active = false;
      sceneRef.current = null;
      scene.dispose();
    };
    // Intentionally initialise once per mounted model; prop changes handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setFinish(primary, finish);
  }, [primary, finish]);

  useEffect(() => {
    sceneRef.current?.setProfile(folded);
  }, [folded]);

  return (
    <div className={className}>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl sm:aspect-[4/3]">
        {/* Official Samsung render used as a poster while the 3D scene loads. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt={SAMSUNG_MODEL_LABEL[primary]}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
            ready ? "opacity-0" : "opacity-100"
          }`}
          loading="lazy"
        />
        <div ref={hostRef} className="absolute inset-0" aria-label={`${SAMSUNG_MODEL_LABEL[primary]} 360 view`} />
      </div>
    </div>
  );
}
