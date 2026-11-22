// Self-contained client menu migration script
// Contains all 31 categories, 328 dishes, 3 client menus, and 57 menu-category mappings.
// Zero network calls to remote — connects directly to your local DATABASE_URL.

import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config({ path: [".env.local", ".env"] });

const targetUrl = process.argv.slice(2).find((a) => a.startsWith("--to="))?.slice(5)
  || process.env.LOCAL_DATABASE_URL
  || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error("Error: Target database URL is not set.");
  console.error("Please set DATABASE_URL in .env / .env.local, or pass --to='postgresql://...'");
  process.exit(1);
}

const isLocal = targetUrl.includes("localhost") || targetUrl.includes("127.0.0.1") || targetUrl.includes("@host.docker.internal");
const sql = postgres(targetUrl, {
  ssl: isLocal ? false : "require",
  max: 1,
});

const clientMenuData = {
  "exportedAt": "2026-11-22T12:59:33.073Z",
  "source": "remote",
  "summary": {
    "categories": 31,
    "dishes": 328,
    "menus": 3,
    "menuCategories": 57
  },
  "categories": [
    {
      "id": 1,
      "name": "Choice of Veg Soup",
      "selectionRule": "Any one",
      "sortOrder": 0
    },
    {
      "id": 5,
      "name": "Choice of Non Veg Starter",
      "selectionRule": "Any three",
      "sortOrder": 4
    },
    {
      "id": 6,
      "name": "Fish Starter",
      "selectionRule": "Any one",
      "sortOrder": 5
    },
    {
      "id": 7,
      "name": "Paneer ki Sabji",
      "selectionRule": "Any one",
      "sortOrder": 6
    },
    {
      "id": 8,
      "name": "Non Veg Main Course",
      "selectionRule": "Any two",
      "sortOrder": 7
    },
    {
      "id": 9,
      "name": "Dal / Curry",
      "selectionRule": "Any one",
      "sortOrder": 8
    },
    {
      "id": 10,
      "name": "Roti ki Tokri",
      "selectionRule": "Any Two",
      "sortOrder": 9
    },
    {
      "id": 12,
      "name": "Salad",
      "selectionRule": "Any two",
      "sortOrder": 11
    },
    {
      "id": 14,
      "name": "Ice Cream Parlour",
      "selectionRule": "3 regular + 3 premium",
      "sortOrder": 13
    },
    {
      "id": 15,
      "name": "Mitas Ki Bahar",
      "selectionRule": "Any one",
      "sortOrder": 14
    },
    {
      "id": 18,
      "name": "Chinese rice",
      "selectionRule": "Any one",
      "sortOrder": 17
    },
    {
      "id": 23,
      "name": "Welcome Drink (seasonal)",
      "selectionRule": "Any Three",
      "sortOrder": 21
    },
    {
      "id": 24,
      "name": "Pan & Mukhwas",
      "selectionRule": "",
      "sortOrder": 22
    },
    {
      "id": 25,
      "name": "Raita Ka Chaska",
      "selectionRule": "Any one",
      "sortOrder": 23
    },
    {
      "id": 26,
      "name": "Mineral water",
      "selectionRule": "",
      "sortOrder": 24
    },
    {
      "id": 27,
      "name": "Extra",
      "selectionRule": "",
      "sortOrder": 25
    },
    {
      "id": 28,
      "name": "Fresh Fruits,Hot kadai, Cold Masala Milk,Malai Ice gola",
      "selectionRule": "",
      "sortOrder": 26
    },
    {
      "id": 29,
      "name": "Chinese Noodles",
      "selectionRule": "Any One",
      "sortOrder": 27
    },
    {
      "id": 30,
      "name": "Chinese main Course",
      "selectionRule": "Any one",
      "sortOrder": 28
    },
    {
      "id": 31,
      "name": "Indian Counter",
      "selectionRule": "",
      "sortOrder": 29
    },
    {
      "id": 34,
      "name": "Tawa Bahar",
      "selectionRule": "Any one",
      "sortOrder": 31
    },
    {
      "id": 35,
      "name": "Indian Main Course",
      "selectionRule": "",
      "sortOrder": 32
    },
    {
      "id": 36,
      "name": "South Indian & Gourmet",
      "selectionRule": "Any one",
      "sortOrder": 33
    },
    {
      "id": 37,
      "name": "Welcome Starters",
      "selectionRule": "Any Three",
      "sortOrder": 34
    },
    {
      "id": 38,
      "name": "Our Spl. Chaats",
      "selectionRule": "Any one",
      "sortOrder": 35
    },
    {
      "id": 42,
      "name": "Hi-tea",
      "selectionRule": "",
      "sortOrder": 36
    },
    {
      "id": 43,
      "name": "Green Salad , Papad , Pickle , Fryums",
      "selectionRule": "",
      "sortOrder": 37
    },
    {
      "id": 44,
      "name": "Paneer / Mushroom Starter",
      "selectionRule": "",
      "sortOrder": 38
    },
    {
      "id": 45,
      "name": "Choice of Veg Starter",
      "selectionRule": "",
      "sortOrder": 39
    },
    {
      "id": 46,
      "name": "Choice of Palak Starter",
      "selectionRule": "Any one",
      "sortOrder": 40
    },
    {
      "id": 47,
      "name": "Choice of Veg Main Course",
      "selectionRule": "Any one",
      "sortOrder": 41
    }
  ],
  "dishes": [
    {
      "id": 1,
      "categoryId": 1,
      "name": "Veg Manchow Soup",
      "sortOrder": 0
    },
    {
      "id": 2,
      "categoryId": 1,
      "name": "Veg Hot n Sour Soup",
      "sortOrder": 1
    },
    {
      "id": 3,
      "categoryId": 1,
      "name": "Tomato Soup",
      "sortOrder": 2
    },
    {
      "id": 4,
      "categoryId": 1,
      "name": "Lemon Soup",
      "sortOrder": 3
    },
    {
      "id": 5,
      "categoryId": 1,
      "name": "Tamato Sorba",
      "sortOrder": 4
    },
    {
      "id": 6,
      "categoryId": 1,
      "name": "Cheese Corn Soup",
      "sortOrder": 5
    },
    {
      "id": 7,
      "categoryId": 1,
      "name": "Veg Thai Soup",
      "sortOrder": 6
    },
    {
      "id": 42,
      "categoryId": 5,
      "name": "Chi Jafrani Tikka",
      "sortOrder": 0
    },
    {
      "id": 43,
      "categoryId": 5,
      "name": "Chi Hajari Kebab",
      "sortOrder": 1
    },
    {
      "id": 44,
      "categoryId": 5,
      "name": "Chi Resmi Kebab",
      "sortOrder": 2
    },
    {
      "id": 45,
      "categoryId": 5,
      "name": "Chi Pahadi Kebab",
      "sortOrder": 3
    },
    {
      "id": 46,
      "categoryId": 5,
      "name": "Chi Seekh Kebab",
      "sortOrder": 4
    },
    {
      "id": 47,
      "categoryId": 5,
      "name": "Chi Banjara Kebab",
      "sortOrder": 5
    },
    {
      "id": 48,
      "categoryId": 5,
      "name": "Chi Kalimeri Tikka",
      "sortOrder": 6
    },
    {
      "id": 49,
      "categoryId": 5,
      "name": "Chi Chilly",
      "sortOrder": 7
    },
    {
      "id": 50,
      "categoryId": 5,
      "name": "Chi Koliwada",
      "sortOrder": 8
    },
    {
      "id": 51,
      "categoryId": 5,
      "name": "Chi Manchurian",
      "sortOrder": 9
    },
    {
      "id": 52,
      "categoryId": 5,
      "name": "Chi Lollypop",
      "sortOrder": 10
    },
    {
      "id": 53,
      "categoryId": 5,
      "name": "Chi Irani Tikka",
      "sortOrder": 11
    },
    {
      "id": 54,
      "categoryId": 5,
      "name": "Mutton Seekh Kebab",
      "sortOrder": 12
    },
    {
      "id": 55,
      "categoryId": 6,
      "name": "Fish Koliwada",
      "sortOrder": 0
    },
    {
      "id": 56,
      "categoryId": 6,
      "name": "Fish Amritsari",
      "sortOrder": 1
    },
    {
      "id": 57,
      "categoryId": 6,
      "name": "Fish Chatniwala",
      "sortOrder": 2
    },
    {
      "id": 58,
      "categoryId": 6,
      "name": "Fish Tawa Fry",
      "sortOrder": 3
    },
    {
      "id": 59,
      "categoryId": 6,
      "name": "Prawns Hot Garlic",
      "sortOrder": 4
    },
    {
      "id": 60,
      "categoryId": 6,
      "name": "Prawan Butter Garlic",
      "sortOrder": 5
    },
    {
      "id": 61,
      "categoryId": 6,
      "name": "Prawns Schzwan",
      "sortOrder": 6
    },
    {
      "id": 62,
      "categoryId": 6,
      "name": "Prawns Kolwada",
      "sortOrder": 7
    },
    {
      "id": 63,
      "categoryId": 6,
      "name": "Prawns Chilly",
      "sortOrder": 8
    },
    {
      "id": 65,
      "categoryId": 7,
      "name": "Paneer Tikka Laheri Masala",
      "sortOrder": 1
    },
    {
      "id": 67,
      "categoryId": 7,
      "name": "Butter Paneer Masala",
      "sortOrder": 3
    },
    {
      "id": 268,
      "categoryId": 7,
      "name": "Paneer Corn Masala",
      "sortOrder": 11
    },
    {
      "id": 269,
      "categoryId": 7,
      "name": "DLC Paneer Kaleji",
      "sortOrder": 12
    },
    {
      "id": 270,
      "categoryId": 7,
      "name": "Paneer Balliram",
      "sortOrder": 13
    },
    {
      "id": 271,
      "categoryId": 7,
      "name": "Paneer Mushroom Baby Corn",
      "sortOrder": 14
    },
    {
      "id": 272,
      "categoryId": 7,
      "name": "Paneer Hyderabadi",
      "sortOrder": 15
    },
    {
      "id": 273,
      "categoryId": 7,
      "name": "Paneer lababdar",
      "sortOrder": 16
    },
    {
      "id": 274,
      "categoryId": 7,
      "name": "sahi paneer",
      "sortOrder": 17
    },
    {
      "id": 275,
      "categoryId": 7,
      "name": "Haryali Paneer",
      "sortOrder": 18
    },
    {
      "id": 75,
      "categoryId": 8,
      "name": "Chi Handi",
      "sortOrder": 0
    },
    {
      "id": 76,
      "categoryId": 8,
      "name": "Chi Kadai",
      "sortOrder": 1
    },
    {
      "id": 77,
      "categoryId": 8,
      "name": "Chi Adraki",
      "sortOrder": 2
    },
    {
      "id": 78,
      "categoryId": 8,
      "name": "Chi Makhani",
      "sortOrder": 3
    },
    {
      "id": 79,
      "categoryId": 8,
      "name": "Chi Malwani",
      "sortOrder": 4
    },
    {
      "id": 80,
      "categoryId": 8,
      "name": "Chi Do Pyaza",
      "sortOrder": 5
    },
    {
      "id": 81,
      "categoryId": 8,
      "name": "Chi Masala",
      "sortOrder": 6
    },
    {
      "id": 82,
      "categoryId": 8,
      "name": "Chi Kolhapuri",
      "sortOrder": 7
    },
    {
      "id": 83,
      "categoryId": 8,
      "name": "Chi Amritsari Masala",
      "sortOrder": 8
    },
    {
      "id": 84,
      "categoryId": 8,
      "name": "Chi Handi Agari Style",
      "sortOrder": 9
    },
    {
      "id": 85,
      "categoryId": 8,
      "name": "Mutton Rogan Josh",
      "sortOrder": 10
    },
    {
      "id": 86,
      "categoryId": 8,
      "name": "Mutton Handi",
      "sortOrder": 11
    },
    {
      "id": 87,
      "categoryId": 8,
      "name": "Mutton Khema Kalaji with Pav",
      "sortOrder": 12
    },
    {
      "id": 88,
      "categoryId": 9,
      "name": "Dal Fry",
      "sortOrder": 0
    },
    {
      "id": 89,
      "categoryId": 9,
      "name": "Dal Tadka",
      "sortOrder": 1
    },
    {
      "id": 90,
      "categoryId": 9,
      "name": "Dal Mahrani Sindhi Kadi",
      "sortOrder": 2
    },
    {
      "id": 91,
      "categoryId": 9,
      "name": "Dal Hydrabadi",
      "sortOrder": 3
    },
    {
      "id": 92,
      "categoryId": 9,
      "name": "Dal Triveni",
      "sortOrder": 4
    },
    {
      "id": 93,
      "categoryId": 9,
      "name": "Dal Kandhari",
      "sortOrder": 5
    },
    {
      "id": 94,
      "categoryId": 9,
      "name": "Dal Palak",
      "sortOrder": 6
    },
    {
      "id": 95,
      "categoryId": 9,
      "name": "Dal Makhani",
      "sortOrder": 7
    },
    {
      "id": 96,
      "categoryId": 9,
      "name": "Dal Sahi Bhaji",
      "sortOrder": 8
    },
    {
      "id": 189,
      "categoryId": 9,
      "name": "Chana Masala",
      "sortOrder": 9
    },
    {
      "id": 190,
      "categoryId": 9,
      "name": "Butter Rajma",
      "sortOrder": 10
    },
    {
      "id": 191,
      "categoryId": 9,
      "name": "Daal Maharani",
      "sortOrder": 11
    },
    {
      "id": 192,
      "categoryId": 9,
      "name": "Punjabi Kadi",
      "sortOrder": 12
    },
    {
      "id": 193,
      "categoryId": 9,
      "name": "Daal Palak",
      "sortOrder": 13
    },
    {
      "id": 97,
      "categoryId": 10,
      "name": "Tandoori Roti",
      "sortOrder": 0
    },
    {
      "id": 98,
      "categoryId": 10,
      "name": "Methi Roti",
      "sortOrder": 1
    },
    {
      "id": 99,
      "categoryId": 10,
      "name": "Roomali Roti",
      "sortOrder": 2
    },
    {
      "id": 100,
      "categoryId": 10,
      "name": "Butter Naan",
      "sortOrder": 3
    },
    {
      "id": 101,
      "categoryId": 10,
      "name": "Butter Kulcha",
      "sortOrder": 4
    },
    {
      "id": 102,
      "categoryId": 10,
      "name": "Chapati",
      "sortOrder": 5
    },
    {
      "id": 103,
      "categoryId": 10,
      "name": "Koki",
      "sortOrder": 6
    },
    {
      "id": 174,
      "categoryId": 10,
      "name": "Baby Naan on Tawa",
      "sortOrder": 7
    },
    {
      "id": 175,
      "categoryId": 10,
      "name": "Missi Roti",
      "sortOrder": 8
    },
    {
      "id": 176,
      "categoryId": 10,
      "name": "Sindhi Phulka",
      "sortOrder": 9
    },
    {
      "id": 177,
      "categoryId": 10,
      "name": "Puri",
      "sortOrder": 10
    },
    {
      "id": 178,
      "categoryId": 10,
      "name": "Masala Puri",
      "sortOrder": 11
    },
    {
      "id": 179,
      "categoryId": 10,
      "name": "Masala Koki",
      "sortOrder": 12
    },
    {
      "id": 180,
      "categoryId": 10,
      "name": "Assorted Tandoor",
      "sortOrder": 13
    },
    {
      "id": 181,
      "categoryId": 10,
      "name": "Assorted Tawa Paratha",
      "sortOrder": 14
    },
    {
      "id": 111,
      "categoryId": 12,
      "name": "Green Salad",
      "sortOrder": 0
    },
    {
      "id": 112,
      "categoryId": 12,
      "name": "Tossed Salad",
      "sortOrder": 1
    },
    {
      "id": 113,
      "categoryId": 12,
      "name": "Coleslaw Salad",
      "sortOrder": 2
    },
    {
      "id": 114,
      "categoryId": 12,
      "name": "Sprout Salad",
      "sortOrder": 3
    },
    {
      "id": 115,
      "categoryId": 12,
      "name": "Veg Russian Salad",
      "sortOrder": 4
    },
    {
      "id": 122,
      "categoryId": 14,
      "name": "Vanilla with Hot Chocklet",
      "sortOrder": 0
    },
    {
      "id": 123,
      "categoryId": 14,
      "name": "Strawberry Ice Cream",
      "sortOrder": 1
    },
    {
      "id": 124,
      "categoryId": 14,
      "name": "Rajbhog Ice Cream",
      "sortOrder": 2
    },
    {
      "id": 125,
      "categoryId": 14,
      "name": "Mello Jello",
      "sortOrder": 3
    },
    {
      "id": 126,
      "categoryId": 14,
      "name": "Butter Scoach",
      "sortOrder": 4
    },
    {
      "id": 127,
      "categoryId": 14,
      "name": "Kesher Pista",
      "sortOrder": 5
    },
    {
      "id": 128,
      "categoryId": 14,
      "name": "Rajwadi Kulfi",
      "sortOrder": 6
    },
    {
      "id": 129,
      "categoryId": 14,
      "name": "Kaju Kiss Miss",
      "sortOrder": 7
    },
    {
      "id": 221,
      "categoryId": 14,
      "name": "Vanilla with Chocolate sauce",
      "sortOrder": 8
    },
    {
      "id": 222,
      "categoryId": 14,
      "name": "two In one",
      "sortOrder": 9
    },
    {
      "id": 223,
      "categoryId": 14,
      "name": "Pan Bahar",
      "sortOrder": 10
    },
    {
      "id": 224,
      "categoryId": 14,
      "name": "Sunday (any one)",
      "sortOrder": 11
    },
    {
      "id": 225,
      "categoryId": 14,
      "name": "Pista",
      "sortOrder": 12
    },
    {
      "id": 226,
      "categoryId": 14,
      "name": "DLC special falooda",
      "sortOrder": 13
    },
    {
      "id": 227,
      "categoryId": 14,
      "name": "Drinking falooda",
      "sortOrder": 14
    },
    {
      "id": 228,
      "categoryId": 14,
      "name": "Pineapple Roll",
      "sortOrder": 15
    },
    {
      "id": 130,
      "categoryId": 15,
      "name": "Jalebi Rabdi",
      "sortOrder": 0
    },
    {
      "id": 131,
      "categoryId": 15,
      "name": "Rasmalai",
      "sortOrder": 1
    },
    {
      "id": 132,
      "categoryId": 15,
      "name": "Rasgulla",
      "sortOrder": 2
    },
    {
      "id": 133,
      "categoryId": 15,
      "name": "Gajar Halwa",
      "sortOrder": 3
    },
    {
      "id": 134,
      "categoryId": 15,
      "name": "Mung Dal Halwa",
      "sortOrder": 4
    },
    {
      "id": 135,
      "categoryId": 15,
      "name": "Malai Sandwich",
      "sortOrder": 5
    },
    {
      "id": 215,
      "categoryId": 15,
      "name": "Spl Gulaab Jamun",
      "sortOrder": 6
    },
    {
      "id": 216,
      "categoryId": 15,
      "name": "Kesar Jalebi rabri",
      "sortOrder": 7
    },
    {
      "id": 217,
      "categoryId": 15,
      "name": "Malai malpura Rabri",
      "sortOrder": 8
    },
    {
      "id": 218,
      "categoryId": 15,
      "name": "Traffic Jam",
      "sortOrder": 9
    },
    {
      "id": 219,
      "categoryId": 15,
      "name": "Pizzy Rab",
      "sortOrder": 10
    },
    {
      "id": 220,
      "categoryId": 15,
      "name": "Coconut Halwa With Dry Fruit",
      "sortOrder": 11
    },
    {
      "id": 146,
      "categoryId": 18,
      "name": "Veg Fried Rice",
      "sortOrder": 0
    },
    {
      "id": 149,
      "categoryId": 18,
      "name": "Schzwan Rice",
      "sortOrder": 3
    },
    {
      "id": 229,
      "categoryId": 18,
      "name": "Singapore rice",
      "sortOrder": 4
    },
    {
      "id": 230,
      "categoryId": 18,
      "name": "Hot Garlic Sauce Rice",
      "sortOrder": 5
    },
    {
      "id": 231,
      "categoryId": 18,
      "name": "Veg Burnt rice",
      "sortOrder": 6
    },
    {
      "id": 232,
      "categoryId": 18,
      "name": "Malaysian Rice",
      "sortOrder": 7
    },
    {
      "id": 233,
      "categoryId": 18,
      "name": "Pat Rice",
      "sortOrder": 8
    },
    {
      "id": 234,
      "categoryId": 18,
      "name": "Tazzer Rice",
      "sortOrder": 9
    },
    {
      "id": 160,
      "categoryId": 23,
      "name": "soft Drinks",
      "sortOrder": 0
    },
    {
      "id": 161,
      "categoryId": 23,
      "name": "pineapple",
      "sortOrder": 1
    },
    {
      "id": 162,
      "categoryId": 23,
      "name": "cocktail",
      "sortOrder": 2
    },
    {
      "id": 163,
      "categoryId": 23,
      "name": "fruit punch",
      "sortOrder": 3
    },
    {
      "id": 164,
      "categoryId": 23,
      "name": "water melon",
      "sortOrder": 4
    },
    {
      "id": 165,
      "categoryId": 23,
      "name": "Khus Delight",
      "sortOrder": 5
    },
    {
      "id": 166,
      "categoryId": 23,
      "name": "pure pineapple",
      "sortOrder": 6
    },
    {
      "id": 167,
      "categoryId": 23,
      "name": "Kiwi pineapple",
      "sortOrder": 7
    },
    {
      "id": 168,
      "categoryId": 23,
      "name": "grapes Glory",
      "sortOrder": 8
    },
    {
      "id": 169,
      "categoryId": 23,
      "name": "Orange Blossom",
      "sortOrder": 9
    },
    {
      "id": 170,
      "categoryId": 23,
      "name": "Musk Melon",
      "sortOrder": 10
    },
    {
      "id": 433,
      "categoryId": 23,
      "name": "Soda",
      "sortOrder": 11
    },
    {
      "id": 434,
      "categoryId": 23,
      "name": "Mineral water",
      "sortOrder": 12
    },
    {
      "id": 172,
      "categoryId": 24,
      "name": "Pan",
      "sortOrder": 0
    },
    {
      "id": 173,
      "categoryId": 24,
      "name": "Mukhwas",
      "sortOrder": 1
    },
    {
      "id": 182,
      "categoryId": 25,
      "name": "Dahi wada",
      "sortOrder": 0
    },
    {
      "id": 183,
      "categoryId": 25,
      "name": "Aloo Boondi Raita",
      "sortOrder": 1
    },
    {
      "id": 184,
      "categoryId": 25,
      "name": "Pineapple Raita",
      "sortOrder": 2
    },
    {
      "id": 185,
      "categoryId": 25,
      "name": "Aloo palak Raita",
      "sortOrder": 3
    },
    {
      "id": 186,
      "categoryId": 25,
      "name": "Mix Veg Raita",
      "sortOrder": 4
    },
    {
      "id": 187,
      "categoryId": 25,
      "name": "Mix Fruit Raita",
      "sortOrder": 5
    },
    {
      "id": 354,
      "categoryId": 25,
      "name": "Kasmeri Raita",
      "sortOrder": 6
    },
    {
      "id": 188,
      "categoryId": 26,
      "name": "Water",
      "sortOrder": 0
    },
    {
      "id": 194,
      "categoryId": 27,
      "name": "tandoor Bazar",
      "sortOrder": 0
    },
    {
      "id": 195,
      "categoryId": 27,
      "name": "Chhole Kulche on Cycle",
      "sortOrder": 1
    },
    {
      "id": 196,
      "categoryId": 27,
      "name": "Grilled Stuff Kulcha",
      "sortOrder": 2
    },
    {
      "id": 197,
      "categoryId": 27,
      "name": "Kadai Milk Masala",
      "sortOrder": 3
    },
    {
      "id": 198,
      "categoryId": 27,
      "name": "Espresso Coffee",
      "sortOrder": 4
    },
    {
      "id": 199,
      "categoryId": 27,
      "name": "Popcorn Candy",
      "sortOrder": 5
    },
    {
      "id": 200,
      "categoryId": 27,
      "name": "ice gola",
      "sortOrder": 6
    },
    {
      "id": 201,
      "categoryId": 27,
      "name": "Assorted Barbeque",
      "sortOrder": 7
    },
    {
      "id": 202,
      "categoryId": 27,
      "name": "Bombay Paan",
      "sortOrder": 8
    },
    {
      "id": 203,
      "categoryId": 27,
      "name": "Grill paini",
      "sortOrder": 9
    },
    {
      "id": 204,
      "categoryId": 27,
      "name": "Live Pasta Counter",
      "sortOrder": 10
    },
    {
      "id": 205,
      "categoryId": 27,
      "name": "Live Pastry Counter",
      "sortOrder": 11
    },
    {
      "id": 206,
      "categoryId": 27,
      "name": "Mocktail Counter",
      "sortOrder": 12
    },
    {
      "id": 207,
      "categoryId": 27,
      "name": "Corn Bhel",
      "sortOrder": 13
    },
    {
      "id": 208,
      "categoryId": 27,
      "name": "Chhole Bhatura",
      "sortOrder": 14
    },
    {
      "id": 209,
      "categoryId": 27,
      "name": "Cheese Pizza",
      "sortOrder": 15
    },
    {
      "id": 210,
      "categoryId": 27,
      "name": "Bombay Paan",
      "sortOrder": 16
    },
    {
      "id": 211,
      "categoryId": 28,
      "name": "Fresh Fruit",
      "sortOrder": 0
    },
    {
      "id": 212,
      "categoryId": 28,
      "name": "Hot Kadai Milk",
      "sortOrder": 1
    },
    {
      "id": 213,
      "categoryId": 28,
      "name": "Cold Masala Milk",
      "sortOrder": 2
    },
    {
      "id": 214,
      "categoryId": 28,
      "name": "Malai Ice gola",
      "sortOrder": 3
    },
    {
      "id": 235,
      "categoryId": 29,
      "name": "Hakka Noodles",
      "sortOrder": 0
    },
    {
      "id": 236,
      "categoryId": 29,
      "name": "Schezwan Noodles",
      "sortOrder": 1
    },
    {
      "id": 237,
      "categoryId": 29,
      "name": "Singapore Noodles",
      "sortOrder": 2
    },
    {
      "id": 238,
      "categoryId": 29,
      "name": "Hot Garlic Sauce Noodles",
      "sortOrder": 3
    },
    {
      "id": 239,
      "categoryId": 29,
      "name": "Malaysian Noodles",
      "sortOrder": 4
    },
    {
      "id": 240,
      "categoryId": 29,
      "name": "Veg Burnt Garlic Noodles",
      "sortOrder": 5
    },
    {
      "id": 241,
      "categoryId": 30,
      "name": "Veg Manchurian",
      "sortOrder": 0
    },
    {
      "id": 242,
      "categoryId": 30,
      "name": "veg malayasian",
      "sortOrder": 1
    },
    {
      "id": 243,
      "categoryId": 30,
      "name": "Mix chilly",
      "sortOrder": 2
    },
    {
      "id": 244,
      "categoryId": 30,
      "name": "Paneer in Green Sauce",
      "sortOrder": 3
    },
    {
      "id": 245,
      "categoryId": 30,
      "name": "Paneer In Mint sauce",
      "sortOrder": 4
    },
    {
      "id": 246,
      "categoryId": 30,
      "name": "Veg 65",
      "sortOrder": 5
    },
    {
      "id": 247,
      "categoryId": 30,
      "name": "Corn Manchurian",
      "sortOrder": 6
    },
    {
      "id": 248,
      "categoryId": 30,
      "name": "Mushroom babycorn  in Garlic Sauce",
      "sortOrder": 7
    },
    {
      "id": 249,
      "categoryId": 30,
      "name": "Paneer Malaysian Chilly",
      "sortOrder": 8
    },
    {
      "id": 250,
      "categoryId": 30,
      "name": "Chinese Bel",
      "sortOrder": 9
    },
    {
      "id": 251,
      "categoryId": 30,
      "name": "American Chopsey",
      "sortOrder": 10
    },
    {
      "id": 252,
      "categoryId": 31,
      "name": "Veg Pulao",
      "sortOrder": 0
    },
    {
      "id": 253,
      "categoryId": 31,
      "name": "Peas pulao",
      "sortOrder": 1
    },
    {
      "id": 254,
      "categoryId": 31,
      "name": "Jeera Rice",
      "sortOrder": 2
    },
    {
      "id": 255,
      "categoryId": 31,
      "name": "Tirange Rice",
      "sortOrder": 3
    },
    {
      "id": 256,
      "categoryId": 31,
      "name": "Steam Rice",
      "sortOrder": 4
    },
    {
      "id": 257,
      "categoryId": 31,
      "name": "Lemon Rice",
      "sortOrder": 5
    },
    {
      "id": 258,
      "categoryId": 31,
      "name": "Kashmiri Pulao",
      "sortOrder": 6
    },
    {
      "id": 276,
      "categoryId": 34,
      "name": "mutter Mushroom with Bun on Tawa",
      "sortOrder": 0
    },
    {
      "id": 277,
      "categoryId": 34,
      "name": "Tawa Nawabi Pav",
      "sortOrder": 1
    },
    {
      "id": 278,
      "categoryId": 34,
      "name": "Veg Anda Curry",
      "sortOrder": 2
    },
    {
      "id": 279,
      "categoryId": 34,
      "name": "Tawa Nawabi Pav",
      "sortOrder": 3
    },
    {
      "id": 280,
      "categoryId": 34,
      "name": "Spl Veg Keema Kaleji with Bun",
      "sortOrder": 4
    },
    {
      "id": 281,
      "categoryId": 34,
      "name": "Spl Hyderabadi Biryani",
      "sortOrder": 5
    },
    {
      "id": 282,
      "categoryId": 34,
      "name": "Sarson Da Saag – Makki Di Roti (Seasonal)",
      "sortOrder": 6
    },
    {
      "id": 283,
      "categoryId": 34,
      "name": "Tawa Bhaji",
      "sortOrder": 7
    },
    {
      "id": 284,
      "categoryId": 34,
      "name": "D.L.C. Special Tawa Mushroom with Bun",
      "sortOrder": 8
    },
    {
      "id": 285,
      "categoryId": 35,
      "name": "Cheese Malai Kofta",
      "sortOrder": 0
    },
    {
      "id": 286,
      "categoryId": 35,
      "name": "Navratan Korma",
      "sortOrder": 1
    },
    {
      "id": 287,
      "categoryId": 35,
      "name": "Veg Kadai",
      "sortOrder": 2
    },
    {
      "id": 288,
      "categoryId": 35,
      "name": "Bhee Palak",
      "sortOrder": 3
    },
    {
      "id": 289,
      "categoryId": 35,
      "name": "Veg 65 Schezwan",
      "sortOrder": 4
    },
    {
      "id": 290,
      "categoryId": 35,
      "name": "Mix Veg Makhaniwala",
      "sortOrder": 5
    },
    {
      "id": 291,
      "categoryId": 35,
      "name": "Palak Kofta with Palak Gravy",
      "sortOrder": 6
    },
    {
      "id": 292,
      "categoryId": 35,
      "name": "Methi Malai Mutter with Corn",
      "sortOrder": 7
    },
    {
      "id": 293,
      "categoryId": 35,
      "name": "Veg Haryali",
      "sortOrder": 8
    },
    {
      "id": 294,
      "categoryId": 35,
      "name": "Mutter Mushroom Masala",
      "sortOrder": 9
    },
    {
      "id": 295,
      "categoryId": 35,
      "name": "Methi Mushroom Dolakia",
      "sortOrder": 10
    },
    {
      "id": 296,
      "categoryId": 35,
      "name": "Delhi Ke Chhole",
      "sortOrder": 11
    },
    {
      "id": 297,
      "categoryId": 35,
      "name": "Chana Palak",
      "sortOrder": 12
    },
    {
      "id": 298,
      "categoryId": 36,
      "name": "Masala Dosa",
      "sortOrder": 0
    },
    {
      "id": 299,
      "categoryId": 36,
      "name": "Mysore Dosa",
      "sortOrder": 1
    },
    {
      "id": 300,
      "categoryId": 36,
      "name": "Butter Masala Dosa",
      "sortOrder": 2
    },
    {
      "id": 301,
      "categoryId": 36,
      "name": "Uttapam",
      "sortOrder": 3
    },
    {
      "id": 302,
      "categoryId": 36,
      "name": "Paneer Chilla",
      "sortOrder": 4
    },
    {
      "id": 303,
      "categoryId": 36,
      "name": "Khasta Kachori",
      "sortOrder": 5
    },
    {
      "id": 304,
      "categoryId": 36,
      "name": "Cheese Pizza",
      "sortOrder": 6
    },
    {
      "id": 305,
      "categoryId": 36,
      "name": "Grilled Sandwich",
      "sortOrder": 7
    },
    {
      "id": 306,
      "categoryId": 36,
      "name": "Grilled Panini",
      "sortOrder": 8
    },
    {
      "id": 307,
      "categoryId": 36,
      "name": "taat idli",
      "sortOrder": 9
    },
    {
      "id": 308,
      "categoryId": 36,
      "name": "Masala idli",
      "sortOrder": 10
    },
    {
      "id": 309,
      "categoryId": 36,
      "name": "Pani Puri",
      "sortOrder": 11
    },
    {
      "id": 310,
      "categoryId": 36,
      "name": "Sev Puri",
      "sortOrder": 12
    },
    {
      "id": 311,
      "categoryId": 36,
      "name": "Dahi Puri",
      "sortOrder": 13
    },
    {
      "id": 312,
      "categoryId": 36,
      "name": "Dahi Wada",
      "sortOrder": 14
    },
    {
      "id": 313,
      "categoryId": 36,
      "name": "Anguri Dahi Wada",
      "sortOrder": 15
    },
    {
      "id": 314,
      "categoryId": 36,
      "name": "Bhavnagari Chaat",
      "sortOrder": 16
    },
    {
      "id": 315,
      "categoryId": 36,
      "name": "makai chat",
      "sortOrder": 17
    },
    {
      "id": 316,
      "categoryId": 36,
      "name": "makai paties",
      "sortOrder": 18
    },
    {
      "id": 317,
      "categoryId": 36,
      "name": "Sindhi Chat",
      "sortOrder": 19
    },
    {
      "id": 318,
      "categoryId": 36,
      "name": "Delhi Chat",
      "sortOrder": 20
    },
    {
      "id": 319,
      "categoryId": 36,
      "name": "Alu Adraki Chat on Tawa",
      "sortOrder": 21
    },
    {
      "id": 320,
      "categoryId": 37,
      "name": "Cocktail Samosa",
      "sortOrder": 0
    },
    {
      "id": 321,
      "categoryId": 37,
      "name": "Chinese Samosa",
      "sortOrder": 1
    },
    {
      "id": 322,
      "categoryId": 37,
      "name": "Dry Malaysian",
      "sortOrder": 2
    },
    {
      "id": 323,
      "categoryId": 37,
      "name": "Paneer Hong Kong",
      "sortOrder": 3
    },
    {
      "id": 324,
      "categoryId": 37,
      "name": "Veg Dry Manchurian",
      "sortOrder": 4
    },
    {
      "id": 325,
      "categoryId": 37,
      "name": "Cheese Balls",
      "sortOrder": 5
    },
    {
      "id": 326,
      "categoryId": 37,
      "name": "Hara Bhara Kebab",
      "sortOrder": 6
    },
    {
      "id": 327,
      "categoryId": 37,
      "name": "Hara Bhara Kebab",
      "sortOrder": 7
    },
    {
      "id": 328,
      "categoryId": 37,
      "name": "Veg Koliwada",
      "sortOrder": 8
    },
    {
      "id": 329,
      "categoryId": 37,
      "name": "Dragon Roll",
      "sortOrder": 9
    },
    {
      "id": 330,
      "categoryId": 37,
      "name": "Schezwan Idli",
      "sortOrder": 10
    },
    {
      "id": 331,
      "categoryId": 37,
      "name": "Sandwich Dhokla",
      "sortOrder": 11
    },
    {
      "id": 332,
      "categoryId": 37,
      "name": "Quiche Palak Roll",
      "sortOrder": 12
    },
    {
      "id": 333,
      "categoryId": 37,
      "name": "Sismi Toast",
      "sortOrder": 13
    },
    {
      "id": 334,
      "categoryId": 37,
      "name": "Veg Lolly Pop",
      "sortOrder": 14
    },
    {
      "id": 335,
      "categoryId": 37,
      "name": "Paneer Sathe",
      "sortOrder": 15
    },
    {
      "id": 336,
      "categoryId": 37,
      "name": "Paneer Koliwada",
      "sortOrder": 16
    },
    {
      "id": 337,
      "categoryId": 37,
      "name": "Cheese Tukdi",
      "sortOrder": 17
    },
    {
      "id": 338,
      "categoryId": 37,
      "name": "Spinach Roll with Thai Sauce",
      "sortOrder": 18
    },
    {
      "id": 339,
      "categoryId": 37,
      "name": "Veg Chilly Milly in Schezwan Sauce",
      "sortOrder": 19
    },
    {
      "id": 340,
      "categoryId": 37,
      "name": "Salsa Stick",
      "sortOrder": 20
    },
    {
      "id": 341,
      "categoryId": 37,
      "name": "Magic Ball",
      "sortOrder": 21
    },
    {
      "id": 342,
      "categoryId": 37,
      "name": "Paneer Kurkure",
      "sortOrder": 22
    },
    {
      "id": 343,
      "categoryId": 37,
      "name": "Golden Mushroom",
      "sortOrder": 23
    },
    {
      "id": 344,
      "categoryId": 37,
      "name": "Veg Shami Kebab",
      "sortOrder": 24
    },
    {
      "id": 345,
      "categoryId": 37,
      "name": "Russian Ball",
      "sortOrder": 25
    },
    {
      "id": 346,
      "categoryId": 37,
      "name": "Veg Frieghter",
      "sortOrder": 26
    },
    {
      "id": 347,
      "categoryId": 37,
      "name": "Veg Crispy",
      "sortOrder": 27
    },
    {
      "id": 348,
      "categoryId": 37,
      "name": "Cauliflower Chilly",
      "sortOrder": 28
    },
    {
      "id": 349,
      "categoryId": 37,
      "name": "Veg Table Pasta Sauce",
      "sortOrder": 29
    },
    {
      "id": 350,
      "categoryId": 38,
      "name": "Spl Pani puri",
      "sortOrder": 0
    },
    {
      "id": 351,
      "categoryId": 38,
      "name": "Spl Sev Puri",
      "sortOrder": 1
    },
    {
      "id": 352,
      "categoryId": 38,
      "name": "Spl Tikki Chaat",
      "sortOrder": 2
    },
    {
      "id": 353,
      "categoryId": 38,
      "name": "Spl Ragda Patice",
      "sortOrder": 3
    },
    {
      "id": 373,
      "categoryId": 42,
      "name": "Pav Bhaji",
      "sortOrder": 0
    },
    {
      "id": 374,
      "categoryId": 42,
      "name": "Chole Bhature",
      "sortOrder": 1
    },
    {
      "id": 375,
      "categoryId": 42,
      "name": "Assorted Dosa",
      "sortOrder": 2
    },
    {
      "id": 376,
      "categoryId": 42,
      "name": "Assorted Uttapam",
      "sortOrder": 3
    },
    {
      "id": 377,
      "categoryId": 42,
      "name": "Lava Idli Platter",
      "sortOrder": 4
    },
    {
      "id": 378,
      "categoryId": 42,
      "name": "Italian Pizza",
      "sortOrder": 5
    },
    {
      "id": 379,
      "categoryId": 42,
      "name": "Grilled Sandwich",
      "sortOrder": 6
    },
    {
      "id": 380,
      "categoryId": 42,
      "name": "Chole Kulche on Cycle",
      "sortOrder": 7
    },
    {
      "id": 381,
      "categoryId": 42,
      "name": "Ragda Pattice",
      "sortOrder": 8
    },
    {
      "id": 382,
      "categoryId": 42,
      "name": "Ice Bhel",
      "sortOrder": 9
    },
    {
      "id": 383,
      "categoryId": 42,
      "name": "Tea",
      "sortOrder": 10
    },
    {
      "id": 384,
      "categoryId": 42,
      "name": "Coffee",
      "sortOrder": 11
    },
    {
      "id": 385,
      "categoryId": 42,
      "name": "Bottled Beverages (200 ml)",
      "sortOrder": 12
    },
    {
      "id": 386,
      "categoryId": 42,
      "name": "Cold Drink",
      "sortOrder": 13
    },
    {
      "id": 387,
      "categoryId": 42,
      "name": "Fresh Juice",
      "sortOrder": 14
    },
    {
      "id": 388,
      "categoryId": 44,
      "name": "Paneer / Mushroom Chilli",
      "sortOrder": 0
    },
    {
      "id": 389,
      "categoryId": 44,
      "name": "Paneer Schezwan",
      "sortOrder": 1
    },
    {
      "id": 390,
      "categoryId": 44,
      "name": "Paneer in Red Pepper Sauce",
      "sortOrder": 2
    },
    {
      "id": 391,
      "categoryId": 44,
      "name": "Paneer Tikka",
      "sortOrder": 3
    },
    {
      "id": 392,
      "categoryId": 44,
      "name": "Paneer Tangy Sauce",
      "sortOrder": 4
    },
    {
      "id": 393,
      "categoryId": 44,
      "name": "Kaju Methi Roll",
      "sortOrder": 5
    },
    {
      "id": 394,
      "categoryId": 44,
      "name": "Veg Dragon Roll",
      "sortOrder": 6
    },
    {
      "id": 395,
      "categoryId": 44,
      "name": "Paneer Hakka Style",
      "sortOrder": 7
    },
    {
      "id": 396,
      "categoryId": 44,
      "name": "Cheese Corn Roll",
      "sortOrder": 8
    },
    {
      "id": 397,
      "categoryId": 44,
      "name": "Paneer Koliwada",
      "sortOrder": 9
    },
    {
      "id": 398,
      "categoryId": 44,
      "name": "Paneer Amritsari Tikki",
      "sortOrder": 10
    },
    {
      "id": 399,
      "categoryId": 45,
      "name": "Hara Bhara Kebab",
      "sortOrder": 0
    },
    {
      "id": 400,
      "categoryId": 45,
      "name": "Khus Khus Tikki",
      "sortOrder": 1
    },
    {
      "id": 401,
      "categoryId": 45,
      "name": "Cheese Ke Tukde",
      "sortOrder": 2
    },
    {
      "id": 402,
      "categoryId": 45,
      "name": "Methi Corn Tikki",
      "sortOrder": 3
    },
    {
      "id": 403,
      "categoryId": 45,
      "name": "Veg Manchurian",
      "sortOrder": 4
    },
    {
      "id": 404,
      "categoryId": 45,
      "name": "Veg 65",
      "sortOrder": 5
    },
    {
      "id": 405,
      "categoryId": 45,
      "name": "Veg Spring Roll",
      "sortOrder": 6
    },
    {
      "id": 406,
      "categoryId": 45,
      "name": "Veg Crispy",
      "sortOrder": 7
    },
    {
      "id": 407,
      "categoryId": 45,
      "name": "Veg Gold Finger",
      "sortOrder": 8
    },
    {
      "id": 408,
      "categoryId": 45,
      "name": "Veg Schezwan Finger",
      "sortOrder": 9
    },
    {
      "id": 409,
      "categoryId": 45,
      "name": "Flower Chilli",
      "sortOrder": 10
    },
    {
      "id": 410,
      "categoryId": 45,
      "name": "Veg Canopy",
      "sortOrder": 11
    },
    {
      "id": 411,
      "categoryId": 45,
      "name": "Veg Ball in Hot Garlic Sauce",
      "sortOrder": 12
    },
    {
      "id": 412,
      "categoryId": 45,
      "name": "Cocktail Samosa",
      "sortOrder": 13
    },
    {
      "id": 413,
      "categoryId": 45,
      "name": "Veg Wonton Fry",
      "sortOrder": 14
    },
    {
      "id": 414,
      "categoryId": 45,
      "name": "Veg Coin in Schezwan Sauce",
      "sortOrder": 15
    },
    {
      "id": 415,
      "categoryId": 46,
      "name": "Palak Cheese Roll",
      "sortOrder": 0
    },
    {
      "id": 416,
      "categoryId": 46,
      "name": "Palak Chilli",
      "sortOrder": 1
    },
    {
      "id": 417,
      "categoryId": 46,
      "name": "Palak Manchurian",
      "sortOrder": 2
    },
    {
      "id": 418,
      "categoryId": 46,
      "name": "Palak Schezwan",
      "sortOrder": 3
    },
    {
      "id": 419,
      "categoryId": 46,
      "name": "Palak 65",
      "sortOrder": 4
    },
    {
      "id": 420,
      "categoryId": 46,
      "name": "Palak Paneer Tossed",
      "sortOrder": 5
    },
    {
      "id": 421,
      "categoryId": 46,
      "name": "Spinach in Thai Sauce",
      "sortOrder": 6
    },
    {
      "id": 422,
      "categoryId": 47,
      "name": "Paneer Amritsari Masala",
      "sortOrder": 0
    },
    {
      "id": 423,
      "categoryId": 47,
      "name": "Paneer Tikka Masala",
      "sortOrder": 1
    },
    {
      "id": 424,
      "categoryId": 47,
      "name": "Paneer Lazeez",
      "sortOrder": 2
    },
    {
      "id": 425,
      "categoryId": 47,
      "name": "Paneer Butter Masala",
      "sortOrder": 3
    },
    {
      "id": 426,
      "categoryId": 47,
      "name": "Paneer Palak",
      "sortOrder": 4
    },
    {
      "id": 427,
      "categoryId": 47,
      "name": "Veg Kadai with Mix Vegetables",
      "sortOrder": 5
    },
    {
      "id": 428,
      "categoryId": 47,
      "name": "Veg Makhanwala",
      "sortOrder": 6
    },
    {
      "id": 429,
      "categoryId": 47,
      "name": "Veg Kolhapuri",
      "sortOrder": 7
    },
    {
      "id": 430,
      "categoryId": 47,
      "name": "Veg Diwani Handi",
      "sortOrder": 8
    },
    {
      "id": 431,
      "categoryId": 47,
      "name": "Veg Bhuna Masala",
      "sortOrder": 9
    },
    {
      "id": 432,
      "categoryId": 47,
      "name": "Palak Kofta Sagwala",
      "sortOrder": 10
    }
  ],
  "menus": [
    {
      "id": 10,
      "name": "Grand menu",
      "createdAt": "2026-11-22T01:40:43.786Z",
      "updatedAt": "2026-11-22T01:40:43.786Z"
    },
    {
      "id": 11,
      "name": "Veg cocktail",
      "createdAt": "2026-11-22T06:48:15.898Z",
      "updatedAt": "2026-11-22T06:59:13.539Z"
    },
    {
      "id": 12,
      "name": "Non veg cocktail",
      "createdAt": "2026-11-22T07:09:10.380Z",
      "updatedAt": "2026-11-22T07:09:10.380Z"
    }
  ],
  "menuCategories": [
    {
      "menuId": 10,
      "categoryId": 23,
      "sortOrder": 0,
      "selectedDishIds": [
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170
      ]
    },
    {
      "menuId": 10,
      "categoryId": 37,
      "sortOrder": 1,
      "selectedDishIds": [
        320,
        321,
        322,
        323,
        324,
        325,
        326,
        327,
        328,
        329,
        330,
        331,
        332,
        333,
        334,
        335,
        336,
        337,
        338,
        339,
        340,
        341,
        342,
        343,
        344,
        345,
        346,
        347,
        348,
        349
      ]
    },
    {
      "menuId": 10,
      "categoryId": 36,
      "sortOrder": 2,
      "selectedDishIds": [
        298,
        300,
        302,
        304,
        306,
        308,
        310,
        312,
        314,
        299,
        301,
        303,
        305,
        307,
        309,
        311,
        313,
        315,
        316,
        317,
        318,
        319
      ]
    },
    {
      "menuId": 10,
      "categoryId": 18,
      "sortOrder": 3,
      "selectedDishIds": [
        146,
        149,
        229,
        230,
        231,
        232,
        233,
        234
      ]
    },
    {
      "menuId": 10,
      "categoryId": 29,
      "sortOrder": 4,
      "selectedDishIds": [
        235,
        236,
        237,
        238,
        239,
        240
      ]
    },
    {
      "menuId": 10,
      "categoryId": 30,
      "sortOrder": 5,
      "selectedDishIds": [
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251
      ]
    },
    {
      "menuId": 10,
      "categoryId": 31,
      "sortOrder": 6,
      "selectedDishIds": [
        257,
        252,
        253,
        254,
        255,
        256,
        258
      ]
    },
    {
      "menuId": 10,
      "categoryId": 7,
      "sortOrder": 7,
      "selectedDishIds": [
        65,
        67,
        268,
        269,
        270,
        271,
        272,
        273,
        274,
        275
      ]
    },
    {
      "menuId": 10,
      "categoryId": 35,
      "sortOrder": 8,
      "selectedDishIds": [
        285,
        286,
        287,
        288,
        289,
        291,
        293,
        295,
        297,
        290,
        292,
        294,
        296
      ]
    },
    {
      "menuId": 10,
      "categoryId": 34,
      "sortOrder": 9,
      "selectedDishIds": [
        276,
        277,
        278,
        279,
        280,
        281,
        282,
        283,
        284
      ]
    },
    {
      "menuId": 10,
      "categoryId": 9,
      "sortOrder": 10,
      "selectedDishIds": [
        88,
        89,
        91,
        92,
        93,
        94,
        95,
        96,
        189,
        190,
        191,
        90,
        192,
        193
      ]
    },
    {
      "menuId": 10,
      "categoryId": 25,
      "sortOrder": 11,
      "selectedDishIds": [
        182,
        184,
        185,
        186,
        187,
        183,
        354
      ]
    },
    {
      "menuId": 10,
      "categoryId": 15,
      "sortOrder": 12,
      "selectedDishIds": [
        130,
        131,
        132,
        133,
        134,
        135,
        215,
        216,
        217,
        218,
        219,
        220
      ]
    },
    {
      "menuId": 10,
      "categoryId": 10,
      "sortOrder": 13,
      "selectedDishIds": [
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        174,
        175,
        176,
        177,
        178,
        179,
        180,
        181
      ]
    },
    {
      "menuId": 10,
      "categoryId": 43,
      "sortOrder": 14,
      "selectedDishIds": []
    },
    {
      "menuId": 10,
      "categoryId": 14,
      "sortOrder": 15,
      "selectedDishIds": [
        122,
        123,
        124,
        125,
        126,
        127,
        128,
        129,
        221,
        222,
        223,
        224,
        225,
        226,
        227,
        228
      ]
    },
    {
      "menuId": 10,
      "categoryId": 24,
      "sortOrder": 16,
      "selectedDishIds": [
        172,
        173
      ]
    },
    {
      "menuId": 10,
      "categoryId": 28,
      "sortOrder": 17,
      "selectedDishIds": [
        211,
        212,
        213,
        214
      ]
    },
    {
      "menuId": 10,
      "categoryId": 26,
      "sortOrder": 18,
      "selectedDishIds": [
        188
      ]
    },
    {
      "menuId": 11,
      "categoryId": 23,
      "sortOrder": 0,
      "selectedDishIds": [
        433,
        434
      ]
    },
    {
      "menuId": 11,
      "categoryId": 1,
      "sortOrder": 1,
      "selectedDishIds": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "menuId": 11,
      "categoryId": 44,
      "sortOrder": 2,
      "selectedDishIds": [
        388,
        392,
        394,
        398,
        389,
        393,
        395,
        390,
        396,
        391,
        397
      ]
    },
    {
      "menuId": 11,
      "categoryId": 45,
      "sortOrder": 3,
      "selectedDishIds": [
        399,
        401,
        403,
        405,
        407,
        409,
        411,
        413,
        400,
        402,
        404,
        406,
        408,
        410,
        412,
        414
      ]
    },
    {
      "menuId": 11,
      "categoryId": 46,
      "sortOrder": 4,
      "selectedDishIds": [
        415,
        419,
        416,
        420,
        417,
        421,
        418
      ]
    },
    {
      "menuId": 11,
      "categoryId": 47,
      "sortOrder": 5,
      "selectedDishIds": [
        422,
        426,
        430,
        431,
        423,
        427,
        424,
        428,
        425,
        429,
        432
      ]
    },
    {
      "menuId": 11,
      "categoryId": 9,
      "sortOrder": 6,
      "selectedDishIds": [
        88,
        89,
        91,
        92,
        93,
        94,
        95,
        96
      ]
    },
    {
      "menuId": 11,
      "categoryId": 10,
      "sortOrder": 7,
      "selectedDishIds": [
        97,
        98,
        99,
        100,
        102,
        103
      ]
    },
    {
      "menuId": 11,
      "categoryId": 31,
      "sortOrder": 8,
      "selectedDishIds": [
        257,
        252,
        253,
        254,
        255,
        256,
        258
      ]
    },
    {
      "menuId": 11,
      "categoryId": 12,
      "sortOrder": 9,
      "selectedDishIds": [
        111,
        112,
        113,
        114,
        115
      ]
    },
    {
      "menuId": 11,
      "categoryId": 25,
      "sortOrder": 10,
      "selectedDishIds": [
        184,
        185,
        187,
        183,
        354
      ]
    },
    {
      "menuId": 11,
      "categoryId": 14,
      "sortOrder": 11,
      "selectedDishIds": [
        122,
        123,
        124,
        125,
        126,
        128
      ]
    },
    {
      "menuId": 11,
      "categoryId": 15,
      "sortOrder": 12,
      "selectedDishIds": [
        130,
        131,
        132,
        133,
        134
      ]
    },
    {
      "menuId": 11,
      "categoryId": 36,
      "sortOrder": 13,
      "selectedDishIds": [
        298,
        300,
        302,
        304,
        306,
        308,
        310,
        312,
        314,
        299,
        301,
        303,
        305,
        307,
        309,
        311,
        313,
        315,
        316,
        317,
        318,
        319
      ]
    },
    {
      "menuId": 11,
      "categoryId": 18,
      "sortOrder": 14,
      "selectedDishIds": [
        146
      ]
    },
    {
      "menuId": 11,
      "categoryId": 29,
      "sortOrder": 15,
      "selectedDishIds": [
        235,
        236
      ]
    },
    {
      "menuId": 11,
      "categoryId": 30,
      "sortOrder": 16,
      "selectedDishIds": [
        241
      ]
    },
    {
      "menuId": 12,
      "categoryId": 23,
      "sortOrder": 0,
      "selectedDishIds": [
        433,
        434
      ]
    },
    {
      "menuId": 12,
      "categoryId": 1,
      "sortOrder": 1,
      "selectedDishIds": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ]
    },
    {
      "menuId": 12,
      "categoryId": 44,
      "sortOrder": 2,
      "selectedDishIds": [
        388,
        392,
        394,
        398,
        389,
        393,
        395,
        390,
        396,
        391,
        397
      ]
    },
    {
      "menuId": 12,
      "categoryId": 45,
      "sortOrder": 3,
      "selectedDishIds": [
        399,
        401,
        403,
        405,
        407,
        409,
        411,
        413,
        400,
        402,
        404,
        406,
        408,
        410,
        412,
        414
      ]
    },
    {
      "menuId": 12,
      "categoryId": 46,
      "sortOrder": 4,
      "selectedDishIds": [
        415,
        419,
        416,
        420,
        417,
        421,
        418
      ]
    },
    {
      "menuId": 12,
      "categoryId": 5,
      "sortOrder": 5,
      "selectedDishIds": [
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54
      ]
    },
    {
      "menuId": 12,
      "categoryId": 6,
      "sortOrder": 6,
      "selectedDishIds": [
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63
      ]
    },
    {
      "menuId": 12,
      "categoryId": 47,
      "sortOrder": 7,
      "selectedDishIds": [
        422,
        426,
        430,
        431,
        423,
        427,
        424,
        428,
        425,
        429,
        432
      ]
    },
    {
      "menuId": 12,
      "categoryId": 8,
      "sortOrder": 8,
      "selectedDishIds": [
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        82,
        83,
        84,
        85,
        86,
        87
      ]
    },
    {
      "menuId": 12,
      "categoryId": 9,
      "sortOrder": 9,
      "selectedDishIds": [
        88,
        89,
        91,
        92,
        93,
        94,
        95,
        96,
        189,
        190,
        191,
        90,
        192,
        193
      ]
    },
    {
      "menuId": 12,
      "categoryId": 10,
      "sortOrder": 10,
      "selectedDishIds": [
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        174,
        175,
        176,
        177,
        178,
        179,
        180,
        181
      ]
    },
    {
      "menuId": 12,
      "categoryId": 31,
      "sortOrder": 11,
      "selectedDishIds": [
        257,
        252,
        253,
        254,
        255,
        256,
        258
      ]
    },
    {
      "menuId": 12,
      "categoryId": 12,
      "sortOrder": 12,
      "selectedDishIds": [
        111,
        112,
        113,
        114,
        115
      ]
    },
    {
      "menuId": 12,
      "categoryId": 25,
      "sortOrder": 13,
      "selectedDishIds": [
        182,
        184,
        185,
        186,
        187,
        183,
        354
      ]
    },
    {
      "menuId": 12,
      "categoryId": 14,
      "sortOrder": 14,
      "selectedDishIds": [
        122,
        123,
        124,
        125,
        126,
        127,
        128,
        129
      ]
    },
    {
      "menuId": 12,
      "categoryId": 15,
      "sortOrder": 15,
      "selectedDishIds": [
        130,
        131,
        132,
        133,
        134,
        135
      ]
    },
    {
      "menuId": 12,
      "categoryId": 36,
      "sortOrder": 16,
      "selectedDishIds": [
        298,
        300,
        302,
        304,
        306,
        308,
        310,
        312,
        314,
        299,
        301,
        303,
        305,
        307,
        309,
        311,
        313,
        315,
        316,
        317,
        318,
        319
      ]
    },
    {
      "menuId": 12,
      "categoryId": 18,
      "sortOrder": 17,
      "selectedDishIds": [
        146
      ]
    },
    {
      "menuId": 12,
      "categoryId": 29,
      "sortOrder": 18,
      "selectedDishIds": [
        235,
        236
      ]
    },
    {
      "menuId": 12,
      "categoryId": 30,
      "sortOrder": 19,
      "selectedDishIds": [
        241
      ]
    },
    {
      "menuId": 12,
      "categoryId": 28,
      "sortOrder": 20,
      "selectedDishIds": [
        211
      ]
    }
  ]
};

async function migrate() {
  console.log("Connecting to target database...");
  console.log(`Target: ${targetUrl.replace(/:[^:@]+@/, ":****@")}`);

  try {
    await sql.begin(async (tx) => {
      console.log("Cleaning existing client menu records in target database...");
      await tx`DELETE FROM menu_categories`;
      await tx`DELETE FROM menus`;
      await tx`DELETE FROM dishes`;
      await tx`DELETE FROM dish_categories`;

      console.log(`Inserting ${clientMenuData.categories.length} dish categories...`);
      for (const cat of clientMenuData.categories) {
        await tx`
          INSERT INTO dish_categories (id, name, selection_rule, sort_order)
          VALUES (${cat.id}, ${cat.name}, ${cat.selectionRule}, ${cat.sortOrder ?? 0})
        `;
      }

      console.log(`Inserting ${clientMenuData.dishes.length} dishes...`);
      for (const dish of clientMenuData.dishes) {
        await tx`
          INSERT INTO dishes (id, category_id, name, sort_order)
          VALUES (${dish.id}, ${dish.categoryId}, ${dish.name}, ${dish.sortOrder ?? 0})
        `;
      }

      console.log(`Inserting ${clientMenuData.menus.length} client menus...`);
      for (const menu of clientMenuData.menus) {
        const createdAt = menu.createdAt ? new Date(menu.createdAt) : new Date();
        const updatedAt = menu.updatedAt ? new Date(menu.updatedAt) : new Date();
        await tx`
          INSERT INTO menus (id, name, created_at, updated_at)
          VALUES (${menu.id}, ${menu.name}, ${createdAt}, ${updatedAt})
        `;
      }

      console.log(`Inserting ${clientMenuData.menuCategories.length} menu-category mappings...`);
      for (const mc of clientMenuData.menuCategories) {
        await tx`
          INSERT INTO menu_categories (menu_id, category_id, sort_order, selected_dish_ids)
          VALUES (${mc.menuId}, ${mc.categoryId}, ${mc.sortOrder ?? 0}, ${mc.selectedDishIds || null})
        `;
      }

      console.log("Updating PostgreSQL sequences to match highest IDs...");
      await tx`SELECT setval('dish_categories_id_seq', COALESCE((SELECT MAX(id) FROM dish_categories), 1))`;
      await tx`SELECT setval('dishes_id_seq', COALESCE((SELECT MAX(id) FROM dishes), 1))`;
      await tx`SELECT setval('menus_id_seq', COALESCE((SELECT MAX(id) FROM menus), 1))`;
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✓ Client menu migration completed successfully!");
    console.log(`  • Categories : ${clientMenuData.categories.length}`);
    console.log(`  • Dishes     : ${clientMenuData.dishes.length}`);
    console.log(`  • Menus      : ${clientMenuData.menus.length}`);
    console.log(`  • Mappings   : ${clientMenuData.menuCategories.length}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } finally {
    await sql.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
