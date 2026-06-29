export type GroceryCategory =
  | "dairy_eggs"
  | "meat_fish"
  | "produce"
  | "grains_bread"
  | "pantry"
  | "fats"
  | "condiments"
  | "other";

export const GROCERY_LABELS: Record<GroceryCategory, string> = {
  dairy_eggs: "Nabiał i jaja",
  meat_fish: "Mięso i ryby",
  produce: "Warzywa i owoce",
  grains_bread: "Zboża i pieczywo",
  pantry: "Spiżarnia",
  fats: "Tłuszcze i oleje",
  condiments: "Sosy i przyprawy",
  other: "Pozostałe",
};

export const GROCERY_ORDER: GroceryCategory[] = [
  "meat_fish",
  "dairy_eggs",
  "produce",
  "grains_bread",
  "pantry",
  "fats",
  "condiments",
  "other",
];

export interface Macros {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export interface Ingredient {
  id: number;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  group_name: "main" | "additions";
  notes: string | null;
  grocery_category: GroceryCategory;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  source_book: string | null;
  source_file: string | null;
  source_page: number | null;
  servings_total: number;
  servings_note: string | null;
  instructions: string[];
  tips: string[];
  macros_total: Macros | null;
  macros_per_serving: Macros | null;
  macros_with_additions: Macros | null;
  ingredients?: Ingredient[];
}

export interface Person {
  id: number;
  name: string;
  daily_calorie_target: number;
}

export interface MealPlan {
  id: number;
  name: string;
  start_date: string | null;
  days: number;
  created_at: string;
}

export interface MealSlot {
  id: number;
  plan_id: number;
  day: number;
  recipe_id: string;
  servings_multiplier: number;
  person_ids: number[];
  recipe?: Recipe;
}

export interface ShoppingItem {
  name: string;
  amount: number | null;
  unit: string | null;
  grocery_category: GroceryCategory;
}
