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
  if (value === "console" || value === "consoles" || value === "gaming" || value === "game") return "consoles";
  if (value === "laptop" || value === "laptops") return "laptops";
  return null;
};

const fallbackImageByCategory: Record<Product["category"], string> = {
  smartphones: "/images/slider_images/iphone.png",
  accessories: "/images/slider_images/accessories.png",
  consoles: "/images/slider_images/ps5.png",
  laptops: "/images/slider_images/laptop.png",
};

const categoryFilters: Record<Product["category"], string> = {
  smartphones: "category.ilike.*smartphone*,category.ilike.*smartphones*",
  accessories: "category.ilike.*accessory*,category.ilike.*accessories*",
  consoles: "category.ilike.*console*,category.ilike.*consoles*,category.ilike.*gaming*,category.ilike.*game*",
  laptops: "category.ilike.*laptop*,category.ilike.*laptops*",
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
 * If `category` is provided, filtering is applied in the database query to reduce payload size.
 * A final in-memory filter still runs after normalization for safety.
 */
export async function getProducts(category?: Product["category"], limit?: number): Promise<Product[]> {
  const { createStaticClient } = await import("./supabase/static");
  const supabase = createStaticClient();

  let query = supabase
    .from("products")
    .select("id,title,description,price,category,brand,stock,images")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (category) {
    const filter = categoryFilters[category];
    query = query.or(filter);
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
