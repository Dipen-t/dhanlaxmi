import { db } from "@/db";
import { kitchenDishCategories, kitchenDishes } from "@/db/schema";

/**
 * Kitchen dish catalog derived from menu_schema.md.
 * Each category is in the exact order from the schema file.
 */
const KITCHEN_CATALOG = [
  {
    name: "Welcome Snacks",
    selectionRule: "Select any number of dishes.",
    isQtyField: false,
    dishes: [
      "Cocktail Samosa",
      "Dry Manchurian",
      "Paneer Angara",
      "Paneer Koliwada",
      "Cheese Tukdi",
      "Spinach Roll",
      "Paneer Kurkure",
      "Golden Mushroom",
      "Mushroom Multani",
      "Veg Crispy",
      "Stuffed Mushroom",
      "Paneer Popcorn",
      "Corn Roll",
      "Schezwan Mushroom",
      "Naram Dil Kabab",
      "Paneer Basil Sauce",
      "Paneer Black Bean Sauce",
      "Mushroom Pesto",
      "Malai Soya Chaap",
      "American Ball",
      "Paneer Devil Sauce",
      "Afghani Slice",
      "Paneer Rosemary",
      "Bullet Stick",
      "Cheese Ball",
      "Palak Toast",
      "Veg Lolly Pop",
    ],
  },
  {
    name: "QTY TAKER",
    selectionRule: "Write qty beside these.",
    isQtyField: true,
    dishes: [
      "Malai Paneer",
      "Sada Paneer",
      "Mushroom",
      "Extra Paneer",
    ],
  },
  {
    name: "Indian Rice Counter",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Veg Pulao",
      "Peas Pulao",
      "Jeera Rice",
      "Tiranga Rice",
      "Steam Rice",
      "Lemon Rice",
    ],
  },
  {
    name: "Paneer Main Course",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "DLC Special Paneer Kaleji",
      "Paneer Balliram",
      "Paneer Mushroom Baby Corn",
      "Paneer Tikka Laheri Masala",
      "Paneer Hyderabadi",
      "Paneer Lababdar",
      "Shahi Paneer",
      "Hariyali Paneer",
    ],
  },
  {
    name: "Indian Main Course",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Cheese Malai Kofta",
      "Navratan Korma",
      "Veg Kadai",
      "Bhee Palak",
      "Mix Veg Makhanwala",
      "Palak Kofta",
      "Methi Malai Mutter",
      "Veg Hariyali",
      "Mutter Mushroom Masala",
      "Methi Mushroom",
      "Veg Lapeta",
      "Deewani Handi",
      "Bhee 65",
      "Spinach Punch",
      "Delhi Ki Chole",
      "Keema Nawabi",
    ],
  },
  {
    name: "Tawa Bahar",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Tawa Mushroom With Bun",
      "Tawa Bhaji",
      "Sarson Da Saag",
      "Makki Di Roti",
      "Hyderabadi Biryani",
      "Veg Keema Kaleji With Bun",
      "Tawa Nawabi Pav",
      "Chole Bhature",
      "Veg Tawa Chicken",
    ],
  },
  {
    name: "Dal / Kadhi",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Yellow Dal Tadka",
      "Chana Masala",
      "Dal Maharani",
      "Dal Palak",
    ],
  },
  {
    name: "Raita Ka Chaska",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Dahi Wada",
      "Dahi Boondi Raita",
      "Pineapple Raita",
      "Aloo Palak Raita",
      "Mix Veg Raita",
      "Mix Fruit Raita",
    ],
  },
  {
    name: "Roti Ki Tokri",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Baby Naan On Tawa",
      "Koki",
      "Masala Koki",
      "Masala Puri",
      "Puri",
      "Reshmi Paratha",
      "Roomali Roti",
      "Sindhi Phulka",
      "Tandoor Bazaar",
      "Tawa Paratha",
    ],
  },
  {
    name: "Desserts",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Gajar Halwa (Seasonal)",
      "Moong Dal Halwa",
      "Gulab Jamun",
      "Kesar Jalebi Rabri",
      "Malai Malpura Rabri",
      "Traffic Jam",
      "Pizzy Rab",
      "Coconut Halwa With Dry Fruit",
      "Pineapple Jalebi",
      "Sham Savera",
      "Akhrot Halwa",
    ],
  },
  {
    name: "Salad & Accompaniments",
    selectionRule: "Select any.",
    isQtyField: false,
    dishes: [
      "Green Salad",
      "Papad",
      "Pickle",
      "Chana",
      "Moong",
      "Chawli",
      "Makroli",
      "Sweet Corn",
    ],
  },
  {
    name: "Counter Requirements",
    selectionRule: "Write required counts for each.",
    isQtyField: true,
    dishes: [
      "Tandoor",
      "Bhai",
      "Paneer",
      "Mushroom",
      "Hi-Tea",
    ],
  },
  {
    name: "Special Attractions",
    selectionRule: "These are optional.",
    isQtyField: false,
    dishes: [
      "VIP Salad",
      "Live Restaurant",
      "Kadai Milk",
    ],
  },
];

export async function seedKitchenDishes() {
  // Check if already seeded
  const existing = await db.query.kitchenDishCategories.findMany();
  if (existing.length > 0) {
    console.log("Kitchen dishes already seeded, skipping.");
    return;
  }

  console.log("Seeding kitchen dish catalog...");

  for (let catIdx = 0; catIdx < KITCHEN_CATALOG.length; catIdx++) {
    const cat = KITCHEN_CATALOG[catIdx];

    const [inserted] = await db
      .insert(kitchenDishCategories)
      .values({
        name: cat.name,
        selectionRule: cat.selectionRule,
        isQtyField: cat.isQtyField,
        sortOrder: catIdx,
      })
      .returning({ id: kitchenDishCategories.id });

    if (cat.dishes.length > 0) {
      await db.insert(kitchenDishes).values(
        cat.dishes.map((name, dishIdx) => ({
          categoryId: inserted.id,
          name,
          sortOrder: dishIdx,
        })),
      );
    }
  }

  console.log(`Seeded ${KITCHEN_CATALOG.length} kitchen categories.`);
}
