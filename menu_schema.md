# Dhanlaxmi Catering Menu Schema

This schema defines the complete catering menu structure used by Dhanlaxmi. It is intended for AI-assisted menu selection and event planning.

---

# Event Information

| Field | Type | Description |
|------|------|-------------|
| venue | String | Event venue |
| date | Date | Event date |
| persons | Number | Total guest count |
| meal | Enum | Lunch / Dinner |
| notes | String | Additional instructions |

---

# Welcome Snacks

Select any number of dishes.

- Cocktail Samosa
- Dry Manchurian
- Paneer Angara
- Paneer Koliwada
- Cheese Tukdi
- Spinach Roll
- Paneer Kurkure
- Golden Mushroom
- Mushroom Multani
- Veg Crispy
- Stuffed Mushroom
- Paneer Popcorn
- Corn Roll
- Schezwan Mushroom
- Naram Dil Kabab
- Paneer Basil Sauce
- Paneer Black Bean Sauce
- Mushroom Pesto
- Malai Soya Chaap
- American Ball
- Paneer Devil Sauce
- Afghani Slice
- Paneer Rosemary
- Bullet Stick
- Cheese Ball
- Palak Toast
- Veg Lolly Pop

---

# QTY TAKER
#WRITE QTY BESIDE THESE

- Malai Paneer
- Sada Paneer
- Mushroom
- Extra Paneer

---

# Indian Rice Counter

Select any.

- Veg Pulao
- Peas Pulao
- Jeera Rice
- Tiranga Rice
- Steam Rice
- Lemon Rice

---

# Paneer Main Course

Select any.

- DLC Special Paneer Kaleji
- Paneer Balliram
- Paneer Mushroom Baby Corn
- Paneer Tikka Laheri Masala
- Paneer Hyderabadi
- Paneer Lababdar
- Shahi Paneer
- Hariyali Paneer

---

# Indian Main Course

Select any.

- Cheese Malai Kofta
- Navratan Korma
- Veg Kadai
- Bhee Palak
- Mix Veg Makhanwala
- Palak Kofta
- Methi Malai Mutter
- Veg Hariyali
- Mutter Mushroom Masala
- Methi Mushroom
- Veg Lapeta
- Deewani Handi
- Bhee 65
- Spinach Punch
- Delhi Ki Chole
- Keema Nawabi

---

# Tawa Bahar

Select any.

- Tawa Mushroom With Bun
- Tawa Bhaji
- Sarson Da Saag
- Makki Di Roti
- Hyderabadi Biryani
- Veg Keema Kaleji With Bun
- Tawa Nawabi Pav
- Chole Bhature
- Veg Tawa Chicken

---

# Dal / Kadhi

Select any.

- Yellow Dal Tadka
- Chana Masala
- Dal Maharani
- Dal Palak

---

# Raita Ka Chaska

Select any.

- Dahi Wada
- Dahi Boondi Raita
- Pineapple Raita
- Aloo Palak Raita
- Mix Veg Raita
- Mix Fruit Raita

---

# Roti Ki Tokri

Select any.

- Baby Naan On Tawa
- Koki
- Masala Koki
- Masala Puri
- Puri
- Reshmi Paratha
- Roomali Roti
- Sindhi Phulka
- Tandoor Bazaar
- Tawa Paratha

---

# Desserts

Select any.

- Gajar Halwa (Seasonal)
- Moong Dal Halwa
- Gulab Jamun
- Kesar Jalebi Rabri
- Malai Malpura Rabri
- Traffic Jam
- Pizzy Rab
- Coconut Halwa With Dry Fruit
- Pineapple Jalebi
- Sham Savera
- Akhrot Halwa

---

# Salad & Accompaniments

Select any.

- Green Salad
- Papad
- Pickle
- Chana
- Moong
- Chawli
- Makroli
- Sweet Corn

---

# Counter Requirements

These are **counts only**.

No dishes are associated with these fields.

| Field | Description |
|------|-------------|
| Tandoor | QTY
| Bhai | QTY
| Paneer | QTY
| Mushroom | QTY
| Hi-Tea | QTY
Example:

- Tandoor: 2
- Bhai: 4
- Paneer: 1
- Mushroom: 1
- Hi-Tea: 2

---

# Special Attractions

These are optional.

- VIP Salad
- Live Restaurant
- Kadai Milk

---

# AI Instructions

When generating or extracting menu selections:

1. Populate the event information.
2. Select only the dishes requested by the customer.
3. Do not invent dishes that are not present in this schema.
4. Preserve the section hierarchy.
5. Counter Requirements are **numeric counts only** and should never contain dish names.
6. Special Attractions are optional and should only be included if explicitly requested.
7. If a dish name is unclear, preserve the closest matching name from the original menu instead of replacing it with another dish.
8. Return structured output while maintaining the exact section names defined in this document.
