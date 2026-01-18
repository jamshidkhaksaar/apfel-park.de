export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "smartphones" | "accessories" | "consoles" | "laptops";
  image: string;
  isFeatured?: boolean;
};

export const products: Product[] = [
  {
    id: "1",
    title: "iPhone 15 Pro Max - 256GB",
    description: "Titanium Blue, Excellent Condition, 1 Year Warranty",
    price: 1199,
    category: "smartphones",
    image: "/images/slider_images/iphone.png",
    isFeatured: true,
  },
  {
    id: "2",
    title: "PlayStation 5 Slim",
    description: "Digital Edition, New sealed box",
    price: 449,
    category: "consoles",
    image: "/images/slider_images/ps5.png",
    isFeatured: true,
  },
  {
    id: "3",
    title: "MacBook Air M2",
    description: "13-inch, Midnight, 8GB/256GB",
    price: 1099,
    category: "laptops",
    image: "/images/slider_images/laptop.png",
    isFeatured: true,
  },
  {
    id: "4",
    title: "MagSafe Charger",
    description: "Original Apple MagSafe Charger, Fast Wireless Charging",
    price: 39,
    category: "accessories",
    image: "/images/slider_images/accessories.png",
    isFeatured: true,
  },
  {
    id: "5",
    title: "Samsung Galaxy S24 Ultra",
    description: "Titanium Gray, 512GB, Like New",
    price: 1249,
    category: "smartphones",
    image: "/images/slider_images/iphone.png", // Placeholder
  },
  {
    id: "6",
    title: "AirPods Pro 2",
    description: "USB-C Case, Noise Cancellation",
    price: 239,
    category: "accessories",
    image: "/images/slider_images/accessories.png", // Placeholder
  },
];

export async function getProducts(category?: string) {
  // Simulate DB fetch
  if (category) {
    return products.filter((p) => p.category === category);
  }
  return products;
}

export async function getFeaturedProducts() {
  return products.filter((p) => p.isFeatured);
}
