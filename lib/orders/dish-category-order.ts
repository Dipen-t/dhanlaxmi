import type { CategoryWithDishes, DishItem } from "@/app/menus/actions";

type ReferenceSection = {
  name: string;
  matches: RegExp;
  dishOrder: string[];
};

// Read from the three grand-menu reference pages, top to bottom.
const referenceSections: ReferenceSection[] = [
  {
    name: "Welcome Drinks",
    matches: /welcome drinks?|soft drinks?|mocktails?/,
    dishOrder: [
      "Soft Drinks",
      "Pineapple",
      "Cocktail",
      "Fruit Punch",
      "Water Melon",
      "Khus Delight",
      "Pure Pineapple",
      "Kiwi Pineapple",
      "Grapes Glory",
      "Orange Blossom",
      "Musk Melon",
      "Banana Shake",
      "Chocolate Shake",
      "Chikoo Shake",
    ],
  },
  {
    name: "Welcome Starters",
    matches: /starters?/,
    dishOrder: [
      "Cocktail Samosa",
      "Chinese Samosa",
      "Dry Malaysian",
      "Paneer Hong Kong",
      "Veg Dry Manchurian",
      "Cheese Balls",
      "Hara Bara Kabab",
      "Veg Koliwada",
      "Dragon Roll",
      "Schezwan Idli",
      "Sandwich Dhokla",
      "Quite Palak Roll",
      "Sismi Toast",
      "Veg Lolly Pop",
      "Paneer Sathe",
      "Paneer Koliwada",
      "Cheese Tukdi",
      "Spinach Roll with Thai Sauce",
      "Veg Chilly Milly in Sez. Sauce",
      "Salsa Stick",
      "Magic Ball",
      "Paneer Kurkure",
      "Golden Mushroom",
      "Veg Shami Kabab",
      "Russian Ball",
      "Veg Fire Fighter",
      "Veg Crispy",
      "Cauliflower Chilly",
      "Veg Table Pasta Sauce",
      "Live Snacks Bar",
    ],
  },
  {
    name: "Our Spl. Chaats",
    matches: /chaa?ts?/,
    dishOrder: [
      "Pani Puri",
      "Sev Puri",
      "Tikki Chaat",
      "Ragda Patice",
    ],
  },
  {
    name: "South Indian and Gourmet",
    matches: /south indian|gourmet/,
    dishOrder: [
      "Pani Puri",
      "Sev Puri",
      "Assorted Dosa",
      "Assorted Uttappa",
      "Taat Idli",
      "Masala Idli",
      "Tikki Chaat",
      "Ragda Patice",
      "Khasta Kachori",
      "Paneer Chilla",
      "Makai Chat",
      "Makai Paties Chaat",
      "Sindhi Chat",
      "Delhi Chat",
      "Alu Adraki Chat on Tawa",
      "Cheese Pizza",
      "Grill Sandwich",
      "Grill Panini",
    ],
  },
  {
    name: "Chinese Counter",
    matches: /chinese|soups?/,
    dishOrder: [
      "Fried Rice",
      "Schezwan Fried Rice",
      "Singapore Rice",
      "Hot Garlic Sauce Rice",
      "Veg Burnt Garlic Rice",
      "Malaysian Rice",
      "Pot Rice",
      "Tozzer Rice",
      "Hakka Noodles",
      "Schezwan Noodles",
      "Singapore Noodles",
      "Hot Garlic Sauce Noodles",
      "Malaysian Noodles",
      "Veg Burnt Garlic Noodles",
      "Veg Manchurian",
      "Veg Malaysian",
      "Mix Chilly",
      "Paneer in Green Sauce",
      "Paneer in Mint Sauce",
      "Veg 65",
      "Corn Manchurian",
      "Mushroom Babycorn in Garlic Sauce",
      "Paneer Malaysian Chilly",
      "Chinese Bhel",
      "American Chopsey",
    ],
  },
  {
    name: "Indian Counter",
    matches: /rice|indian counter/,
    dishOrder: [
      "Veg Pulao",
      "Peas Pulao",
      "Jeera Rice",
      "Tiranga Rice",
      "Steam Rice",
      "Lemon Rice",
      "Kashmiri Pulao",
    ],
  },
  {
    name: "Paneer Ki Sabji",
    matches: /paneer ki sab(?:ji|zi)|paneer.*(main|sabji|sabzi)/,
    dishOrder: [
      "Paneer Corn Masala",
      "DLC Spl. Paneer Kaleji",
      "Paneer Balliram",
      "Paneer Mushroom Baby Corn",
      "Butter Paneer Masala",
      "Paneer Tikka Laheri Masala",
      "Paneer Hyderabadi",
      "Paneer Lababdar",
      "Shahi Paneer",
      "Haryali Paneer",
    ],
  },
  {
    name: "Indian Main Course",
    matches: /main course|veg main/,
    dishOrder: [
      "Cheese Malai Kofta",
      "Navratan Korma",
      "Veg Kadai",
      "Bhee Palak",
      "Veg 65 Schezwan",
      "Mix Veg Makhanwala",
      "Palak Kofta with Palak Gravy",
      "Methi Malai Mutter with Corn",
      "Veg Haryali",
      "Mutter Mushroom Masala",
      "Methi Mushroom Dolakia",
      "Delhi Ke Chhole",
      "Chana Palak",
      "Bhee 65",
    ],
  },
  {
    name: "Tawa Bahar",
    matches: /tawa/,
    dishOrder: [
      "Mutter Mushroom with Bun on Tawa",
      "DLC Spl. Tawa Mushroom with Bun",
      "Tawa Bhaji",
      "Sarson Da Saag - Makki Di Roti",
      "Spl. Hyderabadi Biryani",
      "Spl. Veg Keema Kaleji with Bun",
      "Tawa Nawabi Paav",
      "Veg Anda Curry",
      "Spl. DLC Shahi Kofta",
    ],
  },
  {
    name: "Daal or Kadi",
    matches: /daal|dal|kadi|kadhi|curry/,
    dishOrder: [
      "Yellow Daal Tadka",
      "Chana Masala",
      "Butter Rajma",
      "Daal Maharani",
      "Sindhi Kadi",
      "Punjabi Kadi",
      "Spl. Daal Palak",
    ],
  },
  {
    name: "Raita Ka Chaska",
    matches: /raita/,
    dishOrder: [
      "Dahi Wada",
      "Dahi Boondi Raita",
      "Pineapple Raita",
      "Aaloo Palak Raita",
      "Mix Veg Raita",
      "Mixfruit Raita",
    ],
  },
  {
    name: "Mithas Ki Bahar",
    matches: /sweet|mithas|mitas|mithai/,
    dishOrder: [
      "Gajar Halwa",
      "Moong Daal Halwa",
      "Spl. Gulab Jamun",
      "Kesar Jalebi Rabri",
      "Malai Malpura Rabri",
      "Traffic Jam",
      "Pizza Rab",
      "Coconut Halwa with Dry Fruit",
    ],
  },
  {
    name: "Roti Ki Tokri",
    matches: /rotis?|breads?/,
    dishOrder: [
      "Methi Roti",
      "Roomali Roti",
      "Baby Naan on Tawa",
      "Reshmi Paratha",
      "Missi Roti",
      "Sindhi Phulka",
      "Koki",
      "Puri",
      "Masala Puri",
      "Masala Koki",
      "Assorted Tandoor",
      "Assorted Tawa Paratha",
    ],
  },
  {
    name: "Green Salad, Papad, Pickle, Fryums",
    matches: /salad|papad|pickle|fryums/,
    dishOrder: [
      "Green Salad",
      "Papad",
      "Pickle",
      "Fryums",
    ],
  },
  {
    name: "Ice Cream Parlour",
    matches: /ice cream|dessert/,
    dishOrder: [
      "Vanilla with Chocolate Sauce",
      "Strawberry",
      "Two in One",
      "Drinking Falooda",
      "Pineapple Roll",
      "DLC Spl. Falooda",
      "Pista",
      "Butterscotch",
      "Kaju Kishmish",
      "Mello Jello",
      "Pan Bahar",
      "Sunday",
    ],
  },
  { name: "Paan or Mukhwas", matches: /paan|mukhwas/, dishOrder: [] },
  {
    name: "Fresh Fruits, Hot Kadai Milk, Cold Masala Milk, Malai Ice Gola",
    matches: /fruit|juice|milk|ice gola/,
    dishOrder: [
      "Fresh Fruits",
      "Hot Kadai Milk",
      "Cold Masala Milk",
      "Malai Ice Gola",
    ],
  },
  { name: "Mineral Water Glasses", matches: /mineral water|water glasses/, dishOrder: [] },
  {
    name: "New Attraction (Seasonal)",
    matches: /new attraction|seasonal|strawberry station|mango station/,
    dishOrder: [
      "Strawberry Station",
      "Mango Station",
      "Desert Temptation",
    ],
  },
  {
    name: "Extras",
    matches: /extras?|italian/,
    dishOrder: [
      "Tandoor Bazaar",
      "Corn Bhel",
      "Cheese Pizza",
      "Chhole Boura",
      "Chhole Kulche on Cycle",
      "Grilled Stuff Kulcha",
      "Ragda Pattice",
      "Mocktail Counter",
      "Kadai Milk Masala",
      "Espresso Coffee",
      "Pop Corn Candy",
      "Ice Gola",
      "Assorted Barbeque",
      "Bombay Paan",
      "Grill Paneni",
      "Live Pasta Counter",
      "Live Pastry Counter",
    ],
  },
];

export const orderDishSectionNames = referenceSections.map((section) => section.name);

function normalizedName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isNonVeg(name: string) {
  return /\b(non\s*veg(?:etarian)?|chicken|chi|mutton|fish|prawns?|sea\s*food|meat|lamb|eggs?)\b/.test(normalizedName(name));
}

const sectionIndex = {
  drinks: 0,
  southIndian: 3,
  chinese: 4,
  indianRice: 5,
  paneer: 6,
  indianMain: 7,
  tawa: 8,
  fruits: 16,
  extras: 19,
} as const;

function sectionForDish(category: CategoryWithDishes, dish: DishItem) {
  const key = dishKey(dish.name);
  const matchingSections = referenceSections.filter((section) => section.dishOrder.some((name) => dishKey(name) === key));
  if (matchingSections.length === 1) return referenceSections.indexOf(matchingSections[0]);
  const name = normalizedName(category.name);
  const dishName = normalizedName(dish.name);
  if (/fruit.*juice|juice.*fruit/.test(name)) {
    if (/mocktail counter/.test(dishName)) return sectionIndex.extras;
    if (/juice|mocktail|cocktail|shake|soft drink/.test(dishName)) return sectionIndex.drinks;
    return sectionIndex.fruits;
  }
  if (/italian/.test(name)) return /pizza/.test(dishName) ? sectionIndex.southIndian : sectionIndex.extras;
  if (/south indian|gourmet/.test(name)) return sectionIndex.southIndian;
  if (/rice|indian counter/.test(name)) {
    if (/sch[ez]*wan|fried|fry/.test(dishName)) return sectionIndex.chinese;
    if (/hyd[er]*abadi.*biryani/.test(dishName)) return sectionIndex.tawa;
    return sectionIndex.indianRice;
  }
  if (/main course|veg main/.test(name) && !/chinese|tawa/.test(name)) {
    return /paneer/.test(dishName) ? sectionIndex.paneer : sectionIndex.indianMain;
  }
  const index = referenceSections.findIndex((section) => section.matches.test(name));
  return index < 0 ? sectionIndex.extras : index;
}

const dishAliases: Record<string, string> = {
  cocktelsamosa: "cocktailsamosa",
  harabharakabab: "harabarakabab",
  vegdrymanchurian: "vegmanchurian",
  vegdriganroll: "dragonroll",
  cheeseketukdi: "cheesetukdi",
  spinachinthaisauce: "spinachrollwiththaisauce",
  flowerchilly: "cauliflowerchilly",
  vegfriedrice: "friedrice",
  vegfryrice: "friedrice",
  schzwanrice: "schezwanfriedrice",
  veghakkanoodles: "hakkanoodles",
  vegschzwannoodles: "schezwannoodles",
  jeeramutterrice: "jeerarice",
  kashmiripulav: "kashmiripulao",
  paneerbuttermasala: "butterpaneermasala",
  paneertikkamasala: "paneertikkalaherimasala",
  masaladossa: "assorteddosa",
  mysuridossa: "assorteddosa",
  buttermasaladossa: "assorteddosa",
  uttappa: "assorteduttappa",
  pizza: "cheesepizza",
  vegkadaiwithmixvegetable: "vegkadai",
  vegmakhanwala: "mixvegmakhanwala",
  palakkoftasagwala: "palakkoftawithpalakgravy",
  daltadka: "yellowdaaltadka",
  dalmahrani: "daalmaharani",
  dalpalak: "spldaalpalak",
  butternaan: "babynaanontawa",
  chapati: "sindhiphulka",
  tandooriroti: "assortedtandoor",
  mungdalhalwa: "moongdaalhalwa",
  jalebirabdi: "kesarjalebirabri",
  vanillawithhotchocklet: "vanillawithchocolatesauce",
  strawberryicecream: "strawberry",
  kesherpista: "pista",
  butterscoach: "butterscotch",
  kajukissmiss: "kajukishmish",
  freshfruit: "freshfruits",
};

function dishKey(name: string) {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (dishAliases[key] ?? key).replace(/schzwan/g, "schezwan");
}

export function buildOrderDishCatalog(categories: CategoryWithDishes[]): CategoryWithDishes[] {
  if (categories.length === 0) return [];
  const sections = referenceSections.map((reference, index) => ({
    // These display sections save selections using the original catalog dish IDs.
    id: -(index + 1),
    name: reference.name,
    dishes: [] as DishItem[],
    sourceRules: new Map<number, string>(),
  }));
  const nonVegCategories: CategoryWithDishes[] = [];
  const customCategories: CategoryWithDishes[] = [];
  for (const category of categories) {
    if (isNonVeg(category.name)) {
      nonVegCategories.push(category);
      continue;
    }
    const name = normalizedName(category.name);
    // Reference ordering must not swallow user-created categories into Extras,
    // or move familiar dishes out of an explicitly separate Hi-tea selection.
    if (/\bhi(?:gh)?\s*tea\b/.test(name) || !referenceSections.some(section => section.matches.test(name))) {
      customCategories.push(category);
      continue;
    }
    for (const dish of category.dishes) {
      const section = sections[sectionForDish(category, dish)];
      section.dishes.push(dish);
      const rule = category.selectionRule ? `${category.name} (${category.selectionRule})` : category.name;
      section.sourceRules.set(category.id, rule);
    }
  }
  const grouped = sections.map((section, index) => {
    const ranks = new Map(referenceSections[index].dishOrder.map((name, rank) => [dishKey(name), rank]));
    const rank = (dish: DishItem) => ranks.get(dishKey(dish.name)) ?? ranks.size;
    return {
      id: section.id,
      name: section.name,
      selectionRule: [...section.sourceRules.values()].join(" / "),
      dishes: [...section.dishes].sort((a, b) => rank(a) - rank(b)),
    };
  });
  return [...grouped, ...customCategories, ...nonVegCategories];
}
