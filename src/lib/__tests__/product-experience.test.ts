import { describe, expect, it } from "vitest";

import { formatStorageLabel, getFamilyOptionTarget, resolveBundleCartSelection, sanitizeProductExperienceProfile } from "../product-experience";

describe("sanitizeProductExperienceProfile", () => {
  it("fails closed with every storefront section disabled", () => {
    const profile = sanitizeProductExperienceProfile({});
    expect(Object.values(profile.enabledSections).every((enabled) => enabled === false)).toBe(true);
    expect(profile.packageContents).toEqual([]);
    expect(profile.conditionGuide).toEqual([]);
    expect(profile.bundleProductIds).toEqual([]);
  });

  it("keeps localized configured evidence while dropping unsafe or invalid values", () => {
    const profile = sanitizeProductExperienceProfile({
      enabledSections: { packageContents: true, conditionGuide: true, sizeComparison: true },
      packageContents: [
        { label: { de: "USB-C Kabel", en: "USB-C cable" }, included: true },
        { label: { de: "", en: "" }, included: true },
      ],
      conditionGuide: [
        { condition: "open_box", label: { de: "Open-Box", en: "Open box" }, description: { de: "Geöffnet.", en: "Opened." }, imageUrls: ["/uploads/conditions/open-box.webp", "javascript:alert(1)"] },
      ],
      dimensions: { heightMm: 146.6, widthMm: 70.6, depthMm: -4, weightG: 187, screenInches: 6.1 },
      comparisonProductIds: ["11111111-1111-4111-8111-111111111111", "bad"],
      bundleProductIds: ["22222222-2222-4222-8222-222222222222"],
    });

    expect(profile.packageContents).toHaveLength(1);
    expect(profile.conditionGuide[0].imageUrls).toEqual(["/uploads/conditions/open-box.webp"]);
    expect(profile.dimensions.depthMm).toBeUndefined();
    expect(profile.dimensions.heightMm).toBe(146.6);
    expect(profile.comparisonProductIds).toEqual(["11111111-1111-4111-8111-111111111111"]);
  });
});

describe("getFamilyOptionTarget", () => {
  it("preserves color for storage choices and keeps downstream selection when changing color", () => {
    const base = { image: "", price: 1, stock: 1 };
    const family = { id: "f", name: "Phone", slug: "phone", optionAxes: ["Storage", "Color"], members: [
      { ...base, productId: "a", slug: "a", title: "A", optionValues: { Storage: "128", Color: "Black" }, selected: true },
      { ...base, productId: "b", slug: "b", title: "B", optionValues: { Storage: "128", Color: "Blue" }, selected: false },
      { ...base, productId: "c", slug: "c", title: "C", optionValues: { Storage: "256", Color: "Blue" }, selected: false },
    ] };
    expect(getFamilyOptionTarget(family, "Color", "Blue")?.productId).toBe("b");
    expect(getFamilyOptionTarget(family, "Storage", "256")).toBeNull();
    const blue = {...family,members:family.members.map(member=>({...member,selected:member.productId==='b'}))};
    expect(getFamilyOptionTarget(blue,"Storage","256")?.productId).toBe('c');
    expect(getFamilyOptionTarget(family, "Storage", "512")).toBeNull();
  });
  it('prefers the same condition and ignores individual device IDs', () => {
    const base = {image:'',price:1,stock:1,title:'Phone',slug:'phone'};
    const family = {id:'f',name:'Phone',slug:'phone',optionAxes:['color','storage','condition','device'],members:[
      {...base,productId:'red',selected:true,optionValues:{color:'Rot',storage:'64',condition:'used',device:'red'}},
      {...base,productId:'white-new',selected:false,optionValues:{color:'Weiß',storage:'64',condition:'new',device:'white-new'}},
      {...base,productId:'white-used',selected:false,optionValues:{color:'Weiß',storage:'128',condition:'used',device:'white-used'}},
    ]};
    expect(getFamilyOptionTarget(family,'color','Weiß')?.productId).toBe('white-used');
  });
  it('keeps downstream choices within the selected condition and color',()=>{
    const offer=(id:string,color:string,storage:string,health:string,stock=1,selected=false)=>({productId:id,slug:id,title:id,image:'',price:399,stock,selected,optionValues:{condition:'used',color,storage,batteryHealth:health}});
    const family={id:'f',name:'Phone',slug:'phone',optionAxes:['condition','color','storage','batteryHealth'],members:[offer('black','Black','128','95%',1,true),offer('sold','Black','128 GB','100%',0),offer('blue','Blue','256 GB','90%'),offer('large','Black','256GB','90%')]};
    expect(getFamilyOptionTarget(family,'batteryHealth','90%')).toBeNull();
    expect(getFamilyOptionTarget(family,'storage','256 GB')?.productId).toBe('large');
    expect(getFamilyOptionTarget(family,'color','Blue')?.productId).toBe('blue');
    expect(getFamilyOptionTarget(family,'batteryHealth','100%')?.stock).toBe(0);
    family.members.push(offer('health','Black','128GB','90%'));
    expect(getFamilyOptionTarget(family,'batteryHealth','90%')?.productId).toBe('health');
    const newOnly={...offer('new-only','Gold','128','100%'),optionValues:{condition:'new',color:'Gold',storage:'128',batteryHealth:''}};
    family.members.push(newOnly);expect(getFamilyOptionTarget(family,'color','Gold')).toBeNull();
    expect(getFamilyOptionTarget(family,'condition','new')?.productId).toBe('new-only');
  });
});

describe('formatStorageLabel', () => {
  it('adds GB to bare capacities without duplicating existing units', () => {
    expect(formatStorageLabel('64')).toBe('64 GB');
    expect(formatStorageLabel(' 128 ')).toBe('128 GB');
    expect(formatStorageLabel('256 GB')).toBe('256 GB');
    expect(formatStorageLabel('1 TB')).toBe('1 TB');
  });
});

describe("resolveBundleCartSelection", () => {
  it("adds only products with no variants or one unambiguous variant", () => {
    expect(resolveBundleCartSelection([])).toEqual({ requiresVariantSelection: false, variantColor: null, variantStorage: null });
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB", stock: 1, isActive: true }])).toEqual({ requiresVariantSelection: false, variantColor: "Black", variantStorage: "128 GB" });
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB", stock: 0, isActive: true }]).requiresVariantSelection).toBe(true);
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB", stock: 1, isActive: false }]).requiresVariantSelection).toBe(true);
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB" }]).requiresVariantSelection).toBe(true);
    expect(resolveBundleCartSelection([{ color: "Black", storage: "128 GB" }, { color: "Blue", storage: "256 GB" }]).requiresVariantSelection).toBe(true);
  });
});
