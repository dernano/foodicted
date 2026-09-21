/**
 * Thin client for the Open Food Facts API (https://world.openfoodfacts.org).
 * Open Food Facts is a free, open, crowd-sourced food products database -
 * no API key required. Used here to enrich ingredient search with real
 * product names and nutrition facts, and to look up scanned barcodes.
 */

const BASE_URL = "https://world.openfoodfacts.org";
const USER_AGENT = "Foodicted/0.1 (https://github.com/dernano/foodicted)";

export interface FoodProduct {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutriments?: {
    energyKcal100g?: number;
    proteins100g?: number;
    carbohydrates100g?: number;
    fat100g?: number;
    sugars100g?: number;
    salt100g?: number;
  };
  nutriScoreGrade?: string;
  categories?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(raw: any): FoodProduct {
  const n = raw.nutriments ?? {};
  return {
    code: raw.code ?? raw._id ?? "",
    name: raw.product_name || raw.generic_name || "Unknown product",
    brand: raw.brands,
    imageUrl: raw.image_front_small_url || raw.image_url,
    nutriments: {
      energyKcal100g: n["energy-kcal_100g"],
      proteins100g: n["proteins_100g"],
      carbohydrates100g: n["carbohydrates_100g"],
      fat100g: n["fat_100g"],
      sugars100g: n["sugars_100g"],
      salt100g: n["salt_100g"],
    },
    nutriScoreGrade: raw.nutriscore_grade,
    categories: typeof raw.categories === "string" ? raw.categories.split(",").map((c: string) => c.trim()) : undefined,
  };
}

/**
 * Free-text search for food products, e.g. to autocomplete an ingredient name
 * with real nutrition data.
 */
export async function searchFoodProducts(query: string, pageSize = 10): Promise<FoodProduct[]> {
  const url = new URL(`${BASE_URL}/cgi/search.pl`);
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set(
    "fields",
    "code,product_name,generic_name,brands,image_front_small_url,image_url,nutriments,nutriscore_grade,categories"
  );

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Open Food Facts search failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { products?: unknown[] };
  return (data.products ?? []).map(mapProduct);
}

/** Look up a single product by barcode (EAN/UPC). */
export async function getProductByBarcode(barcode: string): Promise<FoodProduct | null> {
  const url = `${BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Open Food Facts lookup failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as { status: number; product?: unknown };
  if (data.status !== 1 || !data.product) {
    return null;
  }
  return mapProduct(data.product);
}
