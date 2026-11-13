import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getProductBySlug: vi.fn(),
  getInStockAlternatives: vi.fn(),
  getRelatedProducts: vi.fn(),
  getCurrentSlugForOldSlug: vi.fn(),
  getProductExperienceView: vi.fn(),
  getApprovedReviews: vi.fn(),
  getRatingSummary: vi.fn(),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  permanentRedirect: mocks.permanentRedirect,
}));

vi.mock("@/lib/products", () => ({
  getProductBySlug: mocks.getProductBySlug,
  getInStockAlternatives: mocks.getInStockAlternatives,
  getRelatedProducts: mocks.getRelatedProducts,
  getCurrentSlugForOldSlug: mocks.getCurrentSlugForOldSlug,
}));

vi.mock("@/lib/product-reviews", () => ({
  getApprovedReviews: mocks.getApprovedReviews,
  getRatingSummary: mocks.getRatingSummary,
}));

vi.mock("@/lib/product-experience-repository", () => ({
  getProductExperienceView: mocks.getProductExperienceView,
}));

vi.mock("@/lib/payment-availability.server", () => ({
  isPayPalConfigured: vi.fn(async () => false),
}));

vi.mock("@/components/ProductReviews", () => ({ default: vi.fn() }));
vi.mock("@/components/ProductViewTracker", () => ({ default: vi.fn() }));
vi.mock("@/components/ProductDetailExperience", () => ({ default: vi.fn() }));
vi.mock("@/components/RelatedProductsCarousel", () => ({ default: vi.fn() }));
vi.mock("@/components/ProductProfessionalExperience", () => ({ default: vi.fn() }));

import StoreProductPage from "./page";

const soldOutProduct = {
  id: "sold-out-1",
  slug: "apple-iphone-13-gebraucht-a-plus-verkauft",
  title: "Apple iPhone 13 128 GB Gebraucht – Zustand A+",
  subtitle: "",
  description: "Geprüftes Gebrauchtgerät mit Zustand A+.",
  brand: "Apple",
  category: "smartphones",
  subcategory: "iphone",
  condition: "used",
  price: 399,
  stock: 0,
  pickupStock: 0,
  image: "/images/placeholder.png",
  images: ["/images/placeholder.png"],
  model: "iPhone 13",
  specs: [{ label: "Speicher", value: "128 GB" }],
  faq: [],
  variants: [],
  sku: "AP-13-128-USED",
  gtin: "",
  mpn: "",
};

const alternative = {
  ...soldOutProduct,
  id: "alternative-1",
  slug: "apple-iphone-14-gebraucht-a-plus",
  title: "Apple iPhone 14 128 GB Gebraucht – Zustand A+",
  price: 499,
  stock: 2,
};

type TreeNode = {
  props?: { children?: unknown; dangerouslySetInnerHTML?: { __html?: string } };
};

const collectText = (node: unknown, out: string[] = []): string[] => {
  if (node === null || node === undefined || typeof node === "boolean") return out;
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => collectText(child, out));
    return out;
  }
  const element = node as TreeNode;
  if (!element.props) return out;
  if (element.props.dangerouslySetInnerHTML?.__html) {
    out.push(element.props.dangerouslySetInnerHTML.__html);
  }
  collectText(element.props.children, out);
  return out;
};

describe("sold-out product page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getProductBySlug.mockResolvedValue(soldOutProduct);
    mocks.getInStockAlternatives.mockResolvedValue([alternative]);
    mocks.getRelatedProducts.mockResolvedValue([]);
    mocks.getApprovedReviews.mockResolvedValue([]);
    mocks.getRatingSummary.mockResolvedValue({ average: 0, count: 0 });
    mocks.getProductExperienceView.mockResolvedValue({
      profile: { dimensions: {}, facts: [], highlights: [] },
      comparisons: [],
      bundles: [],
    });
  });

  it("keeps rendering the page, marks offers OutOfStock and offers in-stock alternatives", async () => {
    const tree = await StoreProductPage({ params: Promise.resolve({ lang: "de", slug: soldOutProduct.slug }) });
    const text = collectText(tree).join("\n");

    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.getInStockAlternatives).toHaveBeenCalledWith(expect.objectContaining({ id: soldOutProduct.id }), 6, "de");
    expect(text).toContain("https://schema.org/OutOfStock");
    expect(text).not.toContain("https://schema.org/InStock");
    expect(text).toContain("Verfügbare Alternativen");
    expect(text).toContain(alternative.title);
  });
});
