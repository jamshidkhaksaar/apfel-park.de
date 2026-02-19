export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "smartphones" | "accessories" | "consoles" | "laptops";
  image: string;
  isFeatured?: boolean;
  brand?: string;
  stock?: number;
};

type DbProduct = {
  id: string;
  title: string;
  description: string | null;
  price: number | string;
  category: string;
  brand: string | null;
  stock: number | null;
  images: string[] | null;
};

const normalizeCategory = (category: string): Product["category"] | null => {
  const value = category.toLowerCase().trim();
  if (value === "smartphone" || value === "smartphones") return "smartphones";
  if (value === "accessory" || value === "accessories") return "accessories";
  if (value === "console" || value === "consoles" || value === "gaming") return "consoles";
  if (value === "laptop" || value === "laptops") return "laptops";
  return null;
};

const fallbackImageByCategory: Record<Product["category"], string> = {
  smartphones: "/images/slider_images/iphone.png",
  accessories: "/images/slider_images/accessories.png",
  consoles: "/images/slider_images/ps5.png",
  laptops: "/images/slider_images/laptop.png",
};

const mapProduct = (row: DbProduct): Product | null => {
  const category = normalizeCategory(row.category);
  if (!category) return null;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: typeof row.price === "string" ? Number(row.price) : row.price,
    category,
    image: row.images?.[0] ?? fallbackImageByCategory[category],
    brand: row.brand ?? undefined,
    stock: row.stock ?? undefined,
  };
};

const categoryVariations: Record<Product["category"], string[]> = {
  smartphones: ["smartphone", "smartphones"],
  accessories: ["accessory", "accessories"],
  consoles: ["console", "consoles", "gaming"],
  laptops: ["laptop", "laptops"],
};

/**
 * Fetches products from the database.
 *
 * Optimization: If `category` is provided, we filter at the database level using `category.ilike`
 * for known variations. This significantly reduces data transfer and ensures `limit` is applied
 * correctly to the filtered dataset.
 */
export async function getProducts(
  category?: Product["category"],
  limit?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockClient?: any,
): Promise<Product[]> {
  let supabase;
  if (mockClient) {
    supabase = mockClient;
  } else {
    const { createClient } = await import("./supabase/server");
    supabase = await createClient();
  }

  let query = supabase
    .from("products")
    .select("id,title,description,price,category,brand,stock,images")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    const variations = categoryVariations[category];
    // Create an OR filter for variations (case-insensitive via ilike)
    const filterString = variations.map((v) => `category.ilike.${v}`).join(",");
    query = query.or(filterString);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const products = (data as DbProduct[])
    .map(mapProduct)
    .filter((item): item is Product => item !== null);

  if (!category) return products;
  return products.filter((product) => product.category === category);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts(undefined, 4);
  return products.map((product) => ({ ...product, isFeatured: true }));
}
