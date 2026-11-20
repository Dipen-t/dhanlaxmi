import catalog from "./category-image-catalog.json";

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string> = {
  welcomedrinks: "fruit-juices",
  welcomedrinkseasonal: "fruit-juices", welcomedrinksseasonal: "fruit-juices",
  soup: "veg-soup", welcomesoup: "veg-soup", vegsoup: "veg-soup",
  paneermushroomstarter: "paneer-mushroom-starter", vegstarter: "veg-starter",
  palakspecial: "palak-starter", palakstarter: "palak-starter",
  nonvegstarter: "non-veg-starter", chaatcounter: "chat-counter",
  welcomestarters: "veg-starter", oursplchaats: "chat-counter",
  southindiangourmet: "south-indian-counter", southindianandgourmet: "south-indian-counter",
  chineserice: "chinese-rice", chinesenoodles: "chinese-counter", chinesemaincourse: "chinese-counter",
  indiancounter: "rice", paneerkisabji: "veg-main-course", paneerkisabzi: "veg-main-course",
  indianmaincourse: "veg-main-course", tawabahar: "tawa-bahar",
  rotikitokri: "rotis", raitakachaska: "raita", icecreamparlour: "dessert", icecreamparlor: "dessert",
  mitaskibahar: "sweet-counter", mithaskibahar: "sweet-counter",
  panmukhwas: "paan-mukhwas", paanmukhwas: "paan-mukhwas", paanormukhwas: "paan-mukhwas",
  mineralwater: "mineral-water", mineralwaterglasses: "mineral-water",
  extra: "assorted-extras", extras: "assorted-extras",
  freshfruitshotkadaicoldmasalamilkmalaiicegola: "fruit-milk-ice-gola",
  freshfruitshotkadaimilkcoldmasalamilkmalaiicegola: "fruit-milk-ice-gola",
};

function imageKeyByName(name: string): string | undefined {
  const normalized = normalize(name);
  return aliases[normalized] ?? catalog.find(entry => normalize(entry.name) === normalized)?.key;
}

// Match known names first: clients can repurpose an old category for a different food section.
// Original IDs still preserve an image when a category receives an otherwise unknown name.
export function categoryImageKeyById(id: number, name?: string): string | undefined {
  return (name ? imageKeyByName(name) : undefined) ?? catalog.find(entry => entry.catalogId === id)?.key;
}

export function getCategoryImageKey(category: { name: string; imageKey?: string }): string | undefined {
  const named = imageKeyByName(category.name);
  if (named) return named;
  if (category.imageKey && catalog.some(entry => entry.key === category.imageKey)) return category.imageKey;
  return undefined;
}

export type CategoryPhotoSources = Record<string, string>;
