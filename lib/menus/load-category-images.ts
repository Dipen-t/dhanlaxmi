import { readFile } from "node:fs/promises";
import path from "node:path";
import type { MenuDetail } from "@/app/menus/actions";
import { getCategoryImageKey, type CategoryPhotoSources } from "./category-images";

export async function loadCategoryImages(categories: MenuDetail["categories"]): Promise<CategoryPhotoSources> {
  const keys = [...new Set(categories.map(getCategoryImageKey).filter((key): key is string => !!key))];
  const entries = await Promise.all(keys.map(async key => {
    const file = await readFile(path.join(process.cwd(), "public/menu-category-images", `${key}.png`));
    return [key, `data:image/png;base64,${file.toString("base64")}`] as const;
  }));
  return Object.fromEntries(entries);
}
