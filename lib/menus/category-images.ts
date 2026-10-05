import catalog from "./category-image-catalog.json";

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string> = {
  welcomedrinks: "fruit-juices",
  soup: "veg-soup", welcomesoup: "veg-soup", vegsoup: "veg-soup",
  paneermushroomstarter: "paneer-mushroom-starter", vegstarter: "veg-starter",
  palakspecial: "palak-starter", palakstarter: "palak-starter",
  nonvegstarter: "non-veg-starter", chaatcounter: "chat-counter",
};

// Catalog IDs preserve the supplied mapping when clients edit category names.
export function categoryImageKeyById(id: number): string | undefined {
  return catalog.find(entry => entry.catalogId === id)?.key;
}

export function getCategoryImageKey(category: { name: string; imageKey?: string }): string | undefined {
  if (category.imageKey && catalog.some(entry => entry.key === category.imageKey)) return category.imageKey;
  const name = normalize(category.name);
  return catalog.find(entry => normalize(entry.name) === name)?.key ?? aliases[name];
}

export type CategoryPhotoSources = Record<string, string>;
