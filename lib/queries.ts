import { getDb } from "./db";
import type {
  Recipe,
  Ingredient,
  Person,
  MealPlan,
  MealSlot,
  Macros,
  ShoppingItem,
  GroceryCategory,
  GROCERY_ORDER,
} from "./types";
import { GROCERY_ORDER as ORDER } from "./types";

function parseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function rowToRecipe(row: Record<string, unknown>): Recipe {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    source_book: row.source_book as string | null,
    source_file: row.source_file as string | null,
    source_page: row.source_page as number | null,
    servings_total: row.servings_total as number,
    servings_note: row.servings_note as string | null,
    instructions: parseJson<string[]>(row.instructions as string, []),
    tips: parseJson<string[]>(row.tips as string, []),
    macros_total: parseJson<Macros | null>(row.macros_total as string, null),
    macros_per_serving: parseJson<Macros | null>(
      row.macros_per_serving as string,
      null
    ),
    macros_with_additions: parseJson<Macros | null>(
      row.macros_with_additions as string,
      null
    ),
  };
}

// ── Recipes ──────────────────────────────────────────────────────────────────

export function getRecipes(opts?: {
  search?: string;
  category?: string;
  maxKcal?: number;
}): Recipe[] {
  const db = getDb();
  let sql = "SELECT * FROM recipes WHERE 1=1";
  const params: (string | number)[] = [];

  if (opts?.search) {
    sql += " AND (LOWER(name) LIKE LOWER(?) OR LOWER(source_book) LIKE LOWER(?))";
    params.push(`%${opts.search}%`, `%${opts.search}%`);
  }
  if (opts?.category) {
    sql += " AND category = ?";
    params.push(opts.category);
  }
  if (opts?.maxKcal) {
    sql +=
      " AND JSON_EXTRACT(macros_per_serving, '$.kcal') <= ? OR JSON_EXTRACT(macros_total, '$.kcal') <= ?";
    params.push(opts.maxKcal, opts.maxKcal);
  }

  sql += " ORDER BY name ASC";
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToRecipe);
}

export function getRecipeById(id: string): Recipe | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM recipes WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;

  const recipe = rowToRecipe(row);
  const ingredients = db
    .prepare("SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id ASC")
    .all(id) as Ingredient[];
  recipe.ingredients = ingredients;
  return recipe;
}

export function getCategories(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT DISTINCT category FROM recipes WHERE category != '' ORDER BY category ASC"
    )
    .all() as { category: string }[];
  return rows.map((r) => r.category);
}

// ── People ────────────────────────────────────────────────────────────────────

export function getPeople(): Person[] {
  const db = getDb();
  return db.prepare("SELECT * FROM people ORDER BY id ASC").all() as Person[];
}

export function createPerson(name: string, dailyCalorieTarget: number): Person {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO people (name, daily_calorie_target) VALUES (?, ?) RETURNING *"
    )
    .get(name, dailyCalorieTarget) as Person;
  return result;
}

export function updatePerson(
  id: number,
  name: string,
  dailyCalorieTarget: number
): Person | null {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE people SET name = ?, daily_calorie_target = ? WHERE id = ? RETURNING *"
    )
    .get(name, dailyCalorieTarget, id) as Person | undefined;
  return result ?? null;
}

export function deletePerson(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM people WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── Meal Plans ────────────────────────────────────────────────────────────────

export function getPlans(): MealPlan[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM meal_plans ORDER BY created_at DESC")
    .all() as MealPlan[];
}

export function getPlanById(id: number): MealPlan | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM meal_plans WHERE id = ?")
    .get(id) as MealPlan | undefined;
  return row ?? null;
}

export function createPlan(name: string, startDate?: string, days?: number): MealPlan {
  const db = getDb();
  const result = db
    .prepare(
      "INSERT INTO meal_plans (name, start_date, days) VALUES (?, ?, ?) RETURNING *"
    )
    .get(name, startDate ?? null, days ?? 3) as MealPlan;
  return result;
}

export function deletePlan(id: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM meal_plans WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── Meal Slots ────────────────────────────────────────────────────────────────

export function getSlotsByPlan(planId: number): MealSlot[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM meal_slots WHERE plan_id = ? ORDER BY day ASC, id ASC")
    .all(planId) as Array<Record<string, unknown>>;

  return rows.map((r) => ({
    id: r.id as number,
    plan_id: r.plan_id as number,
    day: r.day as number,
    recipe_id: r.recipe_id as string,
    servings_multiplier: r.servings_multiplier as number,
    person_ids: parseJson<number[]>(r.person_ids as string, []),
  }));
}

export function getSlotsWithRecipes(planId: number): MealSlot[] {
  const db = getDb();
  const slots = getSlotsByPlan(planId);

  return slots.map((slot) => {
    const recipe = getRecipeById(slot.recipe_id);
    return { ...slot, recipe: recipe ?? undefined };
  });
}

export function addSlot(
  planId: number,
  day: number,
  recipeId: string,
  servingsMultiplier: number,
  personIds: number[]
): MealSlot {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO meal_slots (plan_id, day, recipe_id, servings_multiplier, person_ids)
       VALUES (?, ?, ?, ?, ?) RETURNING *`
    )
    .get(planId, day, recipeId, servingsMultiplier, JSON.stringify(personIds)) as Record<string, unknown>;

  return {
    id: result.id as number,
    plan_id: result.plan_id as number,
    day: result.day as number,
    recipe_id: result.recipe_id as string,
    servings_multiplier: result.servings_multiplier as number,
    person_ids: parseJson<number[]>(result.person_ids as string, []),
  };
}

export function updateSlot(
  slotId: number,
  servingsMultiplier: number,
  personIds: number[]
): MealSlot | null {
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE meal_slots SET servings_multiplier = ?, person_ids = ?
       WHERE id = ? RETURNING *`
    )
    .get(servingsMultiplier, JSON.stringify(personIds), slotId) as Record<string, unknown> | undefined;

  if (!result) return null;
  return {
    id: result.id as number,
    plan_id: result.plan_id as number,
    day: result.day as number,
    recipe_id: result.recipe_id as string,
    servings_multiplier: result.servings_multiplier as number,
    person_ids: parseJson<number[]>(result.person_ids as string, []),
  };
}

export function deleteSlot(slotId: number): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM meal_slots WHERE id = ?").run(slotId);
  return result.changes > 0;
}

// ── Shopping List ─────────────────────────────────────────────────────────────

export function generateShoppingList(
  planId: number
): Record<GroceryCategory, ShoppingItem[]> {
  const slots = getSlotsWithRecipes(planId);

  const aggregated = new Map<string, ShoppingItem & { _totalAmount: number | null }>();

  for (const slot of slots) {
    if (!slot.recipe?.ingredients) continue;
    // servings_multiplier = total portions wanted; divide by recipe's servings_total
    // to get the batch scale factor (recipe ingredients are already for servings_total)
    const batchScale = slot.servings_multiplier / (slot.recipe.servings_total || 1);

    for (const ing of slot.recipe.ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit ?? ""}`;
      const existing = aggregated.get(key);
      const scaledAmount = ing.amount !== null ? ing.amount * batchScale : null;

      if (existing) {
        if (existing._totalAmount !== null && scaledAmount !== null) {
          existing._totalAmount += scaledAmount;
        } else {
          existing._totalAmount = null;
        }
      } else {
        aggregated.set(key, {
          name: ing.name,
          amount: scaledAmount,
          unit: ing.unit,
          grocery_category: ing.grocery_category,
          _totalAmount: scaledAmount,
        });
      }
    }
  }

  const grouped = Object.fromEntries(
    ORDER.map((cat) => [cat, [] as ShoppingItem[]])
  ) as Record<GroceryCategory, ShoppingItem[]>;

  for (const item of aggregated.values()) {
    grouped[item.grocery_category].push({
      name: item.name,
      amount: item._totalAmount,
      unit: item.unit,
      grocery_category: item.grocery_category,
    });
  }

  for (const cat of ORDER) {
    grouped[cat].sort((a, b) => a.name.localeCompare(b.name, "pl"));
  }

  return grouped;
}

// ── Calorie Totals ────────────────────────────────────────────────────────────

export function getCaloriesPerPersonPerDay(
  planId: number,
  people: Person[]
): Record<number, Record<number, number>> {
  const slots = getSlotsWithRecipes(planId);
  const totals: Record<number, Record<number, number>> = {};

  for (const person of people) {
    totals[person.id] = { 1: 0, 2: 0, 3: 0 };
  }

  for (const slot of slots) {
    const recipe = slot.recipe;
    if (!recipe) continue;
    const macros = recipe.macros_per_serving ?? recipe.macros_total;
    if (!macros) continue;

    const perPersonServings =
      slot.person_ids.length > 0
        ? slot.servings_multiplier / slot.person_ids.length
        : 0;

    for (const personId of slot.person_ids) {
      if (totals[personId]) {
        totals[personId][slot.day] =
          (totals[personId][slot.day] ?? 0) + macros.kcal * perPersonServings;
      }
    }
  }

  return totals;
}
