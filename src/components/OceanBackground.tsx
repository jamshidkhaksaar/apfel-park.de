"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { useTheme } from "./ThemeProvider";

type Bubble = {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  angle: number;
  density: number;
  speed: number;
  wind: number;
  fill: string;
};

const bubbleColors = [
  "rgba(186, 230, 253, ",
  "rgba(56, 189, 248, ",
  "rgba(14, 165, 233, ",
  "rgba(2, 132, 199, ",
  "rgba(3, 105, 161, ",
];

type BubbleSystem = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: Bubble[];
};

const createBubbleSystem = (canvas: HTMLCanvasElement): BubbleSystem => {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  return {
    canvas,
    ctx,
    particles: [],
  };
};

export default function OceanBackground() {
  const { theme } = useTheme();
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const jellyfishRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (theme !== "ocean") return;

    const leftCanvas = leftCanvasRef.current;
    const rightCanvas = rightCanvasRef.current;
    const jellyfish = jellyfishRef.current;

    if (!leftCanvas || !rightCanvas || !jellyfish) return;

    const bubbleCount = 28;
    const random = (min: number, max: number) => min + Math.random() * (max - min);

    const initSystem = (canvas: HTMLCanvasElement) => {
      const system = createBubbleSystem(canvas);

      const resize = () => {
        system.ctx.canvas.width = canvas.offsetWidth;
        system.ctx.canvas.height = canvas.offsetHeight;
      };

      const createBubble = (): Bubble => {
        const radius = random(0.6, 9.5);
        const fill = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
        return {
          x: random(0, canvas.offsetWidth),
          y: random(0, canvas.offsetHeight),
          alpha: random(0.4, 0.95),
          radius,
          angle: random(-1, 1),
          density: random(0, 1000),
          speed: 0,
          wind: 0,
          fill,
        };
      };

      const drawBubble = (bubble: Bubble) => {
        system.ctx.beginPath();
        system.ctx.strokeStyle = `${bubble.fill}1)`;
        system.ctx.lineWidth = 1.2;
        system.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, 2 * Math.PI);
        system.ctx.stroke();
        system.ctx.fillStyle = `${bubble.fill}${bubble.alpha})`;
        system.ctx.fill();
        system.ctx.closePath();
      };

      const updateBubble = (bubble: Bubble) => {
        const hitTop = bubble.y < 0;
        bubble.angle += 0.02;

        if (hitTop) {
          bubble.y = canvas.offsetHeight;
          bubble.x = random(0, canvas.offsetWidth);
        } else {
          bubble.y -= bubble.speed;
          bubble.x += bubble.wind;
          bubble.speed = 0.02 * (Math.cos(bubble.angle + bubble.density) + 1 + bubble.radius * 3);
          bubble.wind = 0.1 * (Math.sin(bubble.angle) * 2);
        }
      };

      const draw = () => {
        system.ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        system.particles.forEach((bubble) => {
          drawBubble(bubble);
          updateBubble(bubble);
        });
      };

      const initBubbles = () => {
        system.particles.length = 0;
        for (let i = 0; i < bubbleCount; i += 1) {
          system.particles.push(createBubble());
        }
      };

      resize();
      initBubbles();

      return { system, resize, draw };
    };

    const left = initSystem(leftCanvas);
    const right = initSystem(rightCanvas);

    let animationFrame = 0;
    const loop = () => {
      left.draw();
      right.draw();
      animationFrame = window.requestAnimationFrame(loop);
    };

    const handleResize = () => {
      left.resize();
      right.resize();
    };

    window.addEventListener("resize", handleResize);
    loop();

    const leftLeg = jellyfish.querySelector("#left-leg");
    const rightLeg = jellyfish.querySelector("#right-leg");
    const head = jellyfish.querySelector("#head");

    const timeline = gsap
      .timeline({ repeat: -1, repeatDelay: 2 })
      .to(
        jellyfish,
        {
          duration: 2,
          transformOrigin: "0% 0%",
          xPercent: -6,
          yPercent: -16,
          ease: "power2.out",
          rotation: -2,
        },
        0.5,
      )
      .to(jellyfish, {
        duration: 4,
        yPercent: 0,
        xPercent: 0,
        ease: "power1.inOut",
        rotation: 0,
      })
      .to(
        head,
        {
          duration: 1.5,
          transformOrigin: "50% 50%",
          scaleY: 1.2,
          scaleX: 0.9,
          yoyo: true,
          repeat: 1,
          yoyoEase: "power1.inOut",
          ease: "power2.out",
        },
        0,
      )
      .to(
        leftLeg,
        {
          transformOrigin: "100% 0",
          duration: 2,
          rotation: -25,
          yoyo: true,
          repeat: 1,
          ease: "power3.out",
        },
        0.5,
      )
      .to(
        rightLeg,
        {
          transformOrigin: "0 0",
          duration: 2,
          rotation: 25,
          yoyo: true,
          repeat: 1,
          ease: "power3.out",
        },
        1,
      );

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      timeline.kill();
    };
  }, [theme]);

  if (theme !== "ocean") return null;

  return (
    <div className="ocean-background">
      <div className="ocean-side ocean-side-left">
        <canvas id="bubbles-canvas-left" ref={leftCanvasRef} />
      </div>
      <div className="ocean-side ocean-side-right">
        <canvas id="bubbles-canvas-right" ref={rightCanvasRef} />
        <svg
          className="jellyfish jellyfish-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 278.8 291.7"
          ref={jellyfishRef}
          aria-hidden="true"
        >
          <path className="cls-1" d="M177.4,279.8h-.1a1.1,1.1,0,0,1-1-1.2h0c0-.3.6-8.1,4.1-30.7s.1-45,0-45.3a1,1,0,0,1,.8-1.2h.1a1.1,1.1,0,0,1,1.3.9h0c0,.2,3.6,23.2,0,46s-4.1,30.3-4.1,30.4a1.1,1.1,0,0,1-1.1,1.1Z" transform="translate(0 0)" />
          <path className="cls-1" d="M175,266.1a1.2,1.2,0,0,1-1.1-.9l-3-21.6a290.3,290.3,0,0,1-2.6-38.4,1.3,1.3,0,0,1,1.2-1.1.9.9,0,0,1,1,.8v.2h0a285.8,285.8,0,0,0,2.6,38.1l3,21.6a1.2,1.2,0,0,1-1,1.2Z" transform="translate(0 0)" />
          <path id="left-leg" className="cls-1" d="M26.8,226.3a87.8,87.8,0,0,1-26-3.6,1.1,1.1,0,0,1-.7-1.4h0c.1-.5.8-.8,1.4-.7s21.3,6.9,44.4,1.3,27-15.4,27-15.5a1.3,1.3,0,0,1,1.5-.6,1.2,1.2,0,0,1,.6,1.4c-.2.5-4.6,11.1-28.6,16.9A86,86,0,0,1,26.8,226.3Z" transform="translate(0 0)" />
          <path className="cls-1" d="M31.3,282.5a1.1,1.1,0,0,1-.9-.5,1.1,1.1,0,0,1,.3-1.5c.2-.1,19.9-13.8,33.9-33.6s16.7-37,16.8-37.2a.9.9,0,0,1,.9-.9h.3a1.1,1.1,0,0,1,.9,1.3h0c-.1.7-2.8,17.8-17.1,38s-34.3,34.1-34.5,34.2Z" transform="translate(0 0)" />
          <path className="cls-1" d="M79.9,291.7a1.2,1.2,0,0,1-1.1-.9c0-.3-1.4-7.8,0-31.6a412.1,412.1,0,0,1,6.9-49.5,1.1,1.1,0,0,1,1.3-.8,1.1,1.1,0,0,1,.9,1.3h0A371,371,0,0,0,81,259.4c-1.4,23.5,0,30.9,0,31a1.1,1.1,0,0,1-.9,1.3h-.2Z" transform="translate(0 0)" />
          <path className="cls-1" d="M101.4,286.6a1.3,1.3,0,0,1-1.1-1.1c0-.1-.5-8-4.1-30.4s0-45.8,0-46a1.1,1.1,0,0,1,1.3-.9h0a.9.9,0,0,1,.9.9v.2h0c0,.3-3.5,22.9,0,45.3s4.1,30.4,4.2,30.7a1.3,1.3,0,0,1-1.1,1.2Z" transform="translate(0 0)" />
          <path className="cls-1" d="M103.9,272.9h-.2a.9.9,0,0,1-.9-.9v-.2h0l2.9-21.6a285.8,285.8,0,0,0,2.6-38.1,1.1,1.1,0,0,1,2.2,0,290.3,290.3,0,0,1-2.6,38.4L105,272A1.2,1.2,0,0,1,103.9,272.9Z" transform="translate(0 0)" />
          <path id="right-leg" className="cls-1" d="M252,219.5a86,86,0,0,1-19.6-2.2c-24-5.8-28.4-16.4-28.6-16.9a1.1,1.1,0,0,1,.7-1.4h0a1.2,1.2,0,0,1,1.4.6c.1.2,4.3,10.1,27,15.5s44.3-1.2,44.5-1.3a1.3,1.3,0,0,1,1.4.7,1.1,1.1,0,0,1-.7,1.4h0A88.9,88.9,0,0,1,252,219.5Z" transform="translate(0 0)" />
          <path className="cls-1" d="M247.5,275.7l-.6-.2c-.2-.1-20.2-14-34.4-34.2s-17.1-37.3-17.2-38a1.1,1.1,0,1,1,2.2-.4h0c0,.2,2.8,17.4,16.8,37.2s33.7,33.5,33.9,33.6a1,1,0,0,1,.3,1.4h-.1A1.1,1.1,0,0,1,247.5,275.7Z" transform="translate(0 0)" />
          <path className="cls-1" d="M127.4,291h-.1a1.1,1.1,0,0,1-.9-1.3h0l2.8-20.2c2.7-19.9-4.6-55.6-4.7-56a1.1,1.1,0,0,1,.8-1.3,1.1,1.1,0,0,1,1.3.9h0c.3,1.5,7.5,36.4,4.7,56.7L128.5,290a.9.9,0,0,1-.8,1h-.3Z" transform="translate(0 0)" />
          <path className="cls-1" d="M160,279.8a1.8,1.8,0,0,1-.9-.4c-.3-.3-7.8-8.4-12.8-23.1s-7.8-45-7.9-46.2a1,1,0,0,1,.8-1.2h.2a1,1,0,0,1,1.2.8h0v.2c0,.3,2.9,31.4,7.8,45.7s12.3,22.2,12.4,22.3a1.2,1.2,0,0,1,0,1.6h-.1A.9.9,0,0,1,160,279.8Z" transform="translate(0 0)" />
          <path id="bottom-clr" className="cls-2" d="M65.5,199.5s8.4,10.8,19.4,10.5,15.5-1.2,15.5-1.2,7.5,5,25.2,4.5c10.3-.3,18.2-8.2,18.2-8.2s7.5,4.6,22.1,2.7,16.8-7.1,16.8-7.1,11.9,4.1,20.6-.6,11.6-9.2,11.6-9.2-18.6-32.6-52.7-39.8-88.3,5.4-88.3,5.4Z" transform="translate(0 0)" />
          <path className="cls-3" d="M64.2,199.6s-2.4,5.3,1.5,7.2,3.4,4,7.1,4.2,6.3,3.5,10.9,3.5,7.8-1.4,9.5-.3,5.9-3,5.9-3,3.3,3.4,7.3,4,5.2,3.6,9.6,2.7a30.7,30.7,0,0,1,11.3-.2c4.2.5,5.6-2.5,9-3.6s5.8-2.3,6.8-4.3l.9-2s4.7,3,7.7,3,4.3,3.5,8.2,2.7,4.8-2.8,9.2-2.5a16.6,16.6,0,0,0,10.5-1.7c4.2-1.9,4.1-5.1,4.1-5.1s4.7,2,7.9,1.9,3.4-2.8,8.1-.3,6.5-4.9,9.9-6.2,7.9-7.3,5.3-8.7-7.4,3.5-11.8,4.9-5.2,0-7.1,2-7.7,3.9-9.7,1.7-4-8.2-6.4-6.2.4,4.9-1.7,7.9-5.1,2.1-7,4.1-5.7.4-9.3.5-7.6.5-11.9-1-2.4-9.4-6.8-9.3-3.2,10.9-6.3,12.2-5.5-.3-9.1,2-8.5,1.2-10.8.3-3.4-1.1-8.4-1.5-3.4-7.7-5.4-8.1-6.2,6.3-9.1,6-4.3-2.3-7-2-5.1.7-7.3-1-6-.4-7-2.2S67.5,195.1,64.2,199.6Z" transform="translate(0 0)" />
          <g id="head">
            <path id="top-clr" className="cls-4" d="M232.4,157.2h0a78.1,78.1,0,0,1-11.5,11.5c-4.1,3.2-6,22.3-6,22.3s-4.5.1-12.7-4.9a20.3,20.3,0,0,1-9.7-13s-6,5.4-20,5.8a25.4,25.4,0,0,1-20.9-9.8s-3.6,4.5-15.3,6.3a47.8,47.8,0,0,1-22.2-2.3s-.5,6.6-16.6,10-17-.2-17-.2l-2,6.7c-2.1,6.6-10.1,10.5-13,9.9s-2.9-11.1-20.8-21.2L39.6,175h0c-25.1-18.2-40-60-19-107.7C69.7-44.3,217.1-.4,241.2,78.2,252.9,116.1,245.1,141.1,232.4,157.2Z" transform="translate(0 0)" />
            <path id="middle-clr" className="cls-5" d="M198,182.9a20.8,20.8,0,0,1-5.5-9.8s-6,5.4-20,5.8a25.9,25.9,0,0,1-18-6.6c-1-1-2-2.1-2.9-3.2s-3.6,4.5-15.3,6.3a45.2,45.2,0,0,1-16.4-.7,38.3,38.3,0,0,1-5.8-1.6s-.5,6.6-16.6,10-17-.2-17-.2l-2,6.7s-15.8-9.9-26-33.2S40.8,80.8,76.3,57.7,169.2,30.8,200,80.1,198,182.9,198,182.9Z" transform="translate(0 0)" />
            <path className="cls-6" d="M232.4,157.2c.3-.6,12.4-24.1,6.4-55.9S201.4,12.1,141.2,9.6,49.6,28.4,32.5,64.2s-14.3,67-8,85S39.1,174.5,39.6,175c-25.1-18.2-40-60-19-107.7C69.7-44.3,217.1-.4,241.2,78.2,252.9,116.1,245.1,141.1,232.4,157.2Z" transform="translate(0 0)" />
            <path className="cls-7" d="M121.2,17.5s29.7-3,40.6,4.4-8.7,11.3-26.1,9.6S108.7,20.1,121.2,17.5Z" transform="translate(0 0)" />
            <path className="cls-7" d="M198.6,47.1s8.2,1.5,17.9,21.6,14.7,51.9,9.8,60.2-.1-3.7-8.2-29.7-17.2-36-23.6-42.4S188.6,44.4,198.6,47.1Z" transform="translate(0 0)" />
            <path className="cls-7" d="M86,25.9S66.6,30.1,63.6,40.5,74.3,41.7,84.1,37,98.9,25.2,86,25.9Z" transform="translate(0 0)" />
          </g>
          <g id="legs">
            <path className="cls-8" d="M28,273.3a1,1,0,0,1-1-.7,1.2,1.2,0,0,1,.6-1.5c.3,0,23.3-8.3,34.8-40.5,6.1-17.1,7.9-25.8,8.4-30.1a14.1,14.1,0,0,0,0-4.1.6.6,0,0,1-.1-.4,1.1,1.1,0,0,1-.2-1.4,1.2,1.2,0,0,1,1.6-.3c1.4.9,3.4,6.4-7.6,37-11.9,33.3-35.2,41.6-36.1,41.9Z" transform="translate(0 0)" />
            <path className="cls-8" d="M59.3,263.4a.9.9,0,0,1-.7-.3,1.1,1.1,0,0,1-.2-1.4h.1c0-.1,6.5-7.5,12.5-28.1s6.4-43.6,6.4-43.9a1.1,1.1,0,0,1,1.1-1.1h0a1.3,1.3,0,0,1,1.1,1.2c0,.2-.4,23.3-6.5,44.4s-12.7,28.7-13,29A1.1,1.1,0,0,1,59.3,263.4Z" transform="translate(0 0)" />
            <path className="cls-7" d="M34.3,260.4a1.2,1.2,0,0,1-1.1-.7,1.1,1.1,0,0,1,.7-1.4h0c.2-.1,23.2-8.6,30.6-25.1s9.9-40.1,9.9-40.3a1.1,1.1,0,1,1,2.2.2c0,.2-2.5,24-10.1,41.1S35.6,260,34.6,260.3Z" transform="translate(0 0)" />
            <path className="cls-7" d="M65.5,273.3a.9.9,0,0,1-.7-.3,1.1,1.1,0,0,1-.2-1.4h.1c0-.1,7.3-8.7,12.7-35.6A215.9,215.9,0,0,0,81,184a1.1,1.1,0,0,1,1-1.2h.1a1,1,0,0,1,1.1.9h0a210.9,210.9,0,0,1-3.6,52.6c-5.6,27.6-13,36.3-13.3,36.6A.9.9,0,0,1,65.5,273.3Z" transform="translate(0 0)" />
            <path className="cls-8" d="M85.5,263.4h-.4a1.1,1.1,0,0,1-.7-1.4h0c0-.1,2.2-6.9,2.5-28.2s0-49.6,0-49.9a1,1,0,0,1,.9-1.1H88a1.1,1.1,0,0,1,1.1,1.1h0c0,.3.3,28.2,0,49.9s-2.5,28.6-2.6,28.9A1.2,1.2,0,0,1,85.5,263.4Z" transform="translate(0 0)" />
            <path className="cls-7" d="M97.3,282.5h-.2a1.1,1.1,0,0,1-.9-1.3h0c.1-.1,2.2-9.9,3.9-38.2s-7.9-61.2-8-61.6a1.1,1.1,0,0,1,.8-1.3,1,1,0,0,1,1.2.4.4.4,0,0,1,.1.3c.1.4,9.9,33.8,8.1,62.4s-3.8,38-3.9,38.4A1.2,1.2,0,0,1,97.3,282.5Z" transform="translate(0 0)" />
            <path className="cls-8" d="M109.4,263.4a1.1,1.1,0,0,1-1.1-1.1h0V243.5c0-18.5-9.8-61.7-9.9-62.1a1.1,1.1,0,0,1,.5-1.5h0a1.2,1.2,0,0,1,1.5.6.6.6,0,0,1,.1.4c.4,1.8,10,43.9,10,62.6v18.7a1.1,1.1,0,0,1-1,1.2h-.1Z" transform="translate(0 0)" />
            <path className="cls-7" d="M116.8,265.2h-.1a1.1,1.1,0,0,1-1-1.2h0a194.5,194.5,0,0,0-1.9-35.8c-2.9-20-10.4-48.6-10.4-48.9a1.3,1.3,0,0,1,.7-1.4,1.2,1.2,0,0,1,1.4.8c.1.3,7.6,29,10.5,49.1a201.5,201.5,0,0,1,1.9,36.4A1.4,1.4,0,0,1,116.8,265.2Z" transform="translate(0 0)" />
            <path className="cls-8" d="M126,284h-.3a1.2,1.2,0,0,1-.8-1.4c0-.1,2.9-13.1,0-41.6s-15.1-65.3-15.3-65.7a1.3,1.3,0,0,1,.7-1.4,1.1,1.1,0,0,1,1.4.7h0c.2.4,12.4,37.3,15.4,66.2s.1,41.8-.1,42.3A1.1,1.1,0,0,1,126,284Z" transform="translate(0 0)" />
            <path className="cls-7" d="M88.1,275.1h-.3a1.2,1.2,0,0,1-.8-1.4,194.1,194.1,0,0,0,6.6-40.1c1-20.8-3.7-49.3-3.7-49.6a1.1,1.1,0,1,1,2.2-.4c0,.3,4.8,29.1,3.7,50.2a213.9,213.9,0,0,1-6.6,40.5A1.2,1.2,0,0,1,88.1,275.1Z" transform="translate(0 0)" />
            <path className="cls-8" d="M144.4,272.2a1.2,1.2,0,0,1-1.1-.8L137,252.7c-6.2-18.7-18.1-77.1-18.2-77.7a1.1,1.1,0,0,1,.9-1.3h0a1,1,0,0,1,1.3.6h0v.2c.1.6,11.9,58.9,18.1,77.4l6.3,18.8a1.1,1.1,0,0,1-.7,1.4h-.3Z" transform="translate(0 0)" />
            <path className="cls-8" d="M246.9,253.4h0c-.7,0-17.1-1.4-34.6-26.9s-15.5-43-15.4-43.7a1.2,1.2,0,0,1,1.3-1,.9.9,0,0,1,.9.9v.2h0c0,.2-1.9,17.7,15,42.3s32.7,25.9,32.9,25.9a1.1,1.1,0,0,1,1,1.2h0a.9.9,0,0,1-.8,1h-.3Z" transform="translate(0 0)" />
          </g>
          <path className="cls-9" d="M62.1,194.8s-2.5,6.4,1.4,6.6,5.1-1.5,8.3-2,5.1-1.6,6.5-5.1,3.9-1.8,4.8-4.9-.2-4-.2-4,2.6,3.4,6.2,2,5.6-2.8,7.8-2.4,4.7.9,7.9-1.4,6.8-1.7,8.7-3.7a6.9,6.9,0,0,0,1.8-4.7s4.3,3.5,7.2,3.5,3.7,2.7,8.2,2.4,5.8-3.1,9-3.2,5.7.9,8.1-1.4a24.2,24.2,0,0,0,3.1-3.3s1.6,4.9,4.6,5,4.4,1.8,8.1,2,3.8,2.4,7.2,2.3,5.8-1.9,8.1-1.5,6.4.3,9-1.5l2.7-1.7s-.6,6.4,2.6,7.2,4.3,3.6,7.3,3.8,3.5,2.6,6.9,2.7a31.7,31.7,0,0,0,7.5-.6s-9.1-4.4-10.4-6.3-1.6-3.6-4.4-5.4-5.9-4.5-4.8-7.2,3.3-6.3.3-6.4-6.9,6.8-9.3,7.4-14.7,4.1-18.7,1.9-9.1-.6-10.4-4.6.7-10.8-3.2-10.9-6.2,9.2-9.1,10.5-8.8.3-11.5,1.1-7.3,1.1-13.8-.9-6.9-9.4-10.5-8.3,1.2,9.8,0,11.1-6.6.4-8.5,2.2-6.5,4.1-11.7,4.7-8.1-8.1-12.2-6.5.8,10-.4,12.8-5,4.5-7.2,6.1S62.1,194.8,62.1,194.8Z" transform="translate(0 0)" />
          <path className="cls-1" d="M198.9,284.9h-.2a1.1,1.1,0,0,1-.9-1.3h0c0-.1,1.4-7.6,0-31s-6.8-49-6.8-49.2a1.1,1.1,0,0,1,.8-1.3,1,1,0,0,1,1.3.6h0v.2c.1.3,5.5,25.8,6.9,49.5s.1,31.3,0,31.6A1.2,1.2,0,0,1,198.9,284.9Z" transform="translate(0 0)" />
        </svg>
      </div>
    </div>
  );
}
