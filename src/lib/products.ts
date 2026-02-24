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

// Map high-level categories to database string variations for querying
const dbCategories: Record<Product["category"], string[]> = {
  smartphones: ["smartphone", "smartphones"],
  accessories: ["accessory", "accessories"],
  consoles: ["console", "consoles", "gaming"],
  laptops: ["laptop", "laptops"],
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

/**
 * Fetches products from the database.
 *
 * Performance optimization:
 * - If `category` is provided, we filter at the database level using `.or()` with all valid variations.
 * - This reduces data transfer and server processing compared to fetching all items and filtering in JS.
 * - `limit` is applied after the category filter, ensuring we get the correct number of items for that category.
 */
export async function getProducts(category?: Product["category"], limit?: number): Promise<Product[]> {
  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id,title,description,price,category,brand,stock,images")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    // Filter by category at the database level using known variations
    // This uses ILIKE for case-insensitive matching, mirroring the logic in normalizeCategory
    const filters = dbCategories[category].map((c) => `category.ilike.${c}`).join(",");
    query = query.or(filters);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const products = (data as DbProduct[])
    .map(mapProduct)
    .filter((item): item is Product => item !== null);

  // If we filtered by category in the DB, this JS filter is redundant but safe.
  // It handles any edge cases where DB ILIKE might match something normalizeCategory rejects
  // (though with the current mapping they should be identical).
  if (!category) return products;
  return products.filter((product) => product.category === category);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts(undefined, 4);
  return products.map((product) => ({ ...product, isFeatured: true }));
}
