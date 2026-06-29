import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const DATA_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(__dirname, "../recipes.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    source_book TEXT,
    source_file TEXT,
    source_page INTEGER,
    servings_total INTEGER NOT NULL DEFAULT 1,
    servings_note TEXT,
    instructions TEXT NOT NULL DEFAULT '[]',
    tips TEXT NOT NULL DEFAULT '[]',
    macros_total TEXT,
    macros_per_serving TEXT,
    macros_with_additions TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount REAL,
    unit TEXT,
    group_name TEXT NOT NULL DEFAULT 'main',
    notes TEXT,
    grocery_category TEXT NOT NULL DEFAULT 'other'
  );

  CREATE INDEX IF NOT EXISTS idx_ingredients_recipe ON ingredients(recipe_id);
  CREATE TABLE IF NOT EXISTS people (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, daily_calorie_target INTEGER NOT NULL, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS meal_plans (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, start_date TEXT, days INTEGER NOT NULL DEFAULT 3, created_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE IF NOT EXISTS meal_slots (id INTEGER PRIMARY KEY AUTOINCREMENT, plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE, day INTEGER NOT NULL, recipe_id TEXT NOT NULL REFERENCES recipes(id), servings_multiplier REAL NOT NULL DEFAULT 1.0, person_ids TEXT NOT NULL DEFAULT '[]');
  CREATE INDEX IF NOT EXISTS idx_slots_plan ON meal_slots(plan_id);
`);

const insertRecipe = db.prepare(`
  INSERT OR IGNORE INTO recipes (id, name, category, source_book, source_file, source_page,
    servings_total, servings_note, instructions, tips, macros_total, macros_per_serving, macros_with_additions)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertIngredient = db.prepare(`
  INSERT INTO ingredients (recipe_id, name, amount, unit, group_name, notes, grocery_category)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const files = fs
  .readdirSync(DATA_DIR)
  .filter((f) => f.endsWith(".json") && f.startsWith("recipes_"));

let totalRecipes = 0;

const seedAll = db.transaction(() => {
  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const raw = fs.readFileSync(filePath, "utf-8");

    let recipes: Record<string, unknown>[];
    try {
      recipes = JSON.parse(raw);
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e);
      continue;
    }

    if (!Array.isArray(recipes)) {
      console.warn(`${file} does not contain an array, skipping`);
      continue;
    }

    for (const recipe of recipes) {
      const id =
        (recipe.id as string) ??
        crypto
          .createHash("sha1")
          .update(`${recipe.name}__${recipe.source_file}`)
          .digest("hex")
          .slice(0, 16);

      const recipeResult = insertRecipe.run(
        id,
        recipe.name ?? "Unnamed",
        recipe.category ?? "",
        recipe.source_book ?? null,
        recipe.source_file ?? null,
        recipe.source_page ?? null,
        recipe.servings_total ?? 1,
        recipe.servings_note ?? null,
        JSON.stringify(recipe.instructions ?? []),
        JSON.stringify(recipe.tips ?? []),
        recipe.macros_total ? JSON.stringify(recipe.macros_total) : null,
        recipe.macros_per_serving ? JSON.stringify(recipe.macros_per_serving) : null,
        recipe.macros_with_additions ? JSON.stringify(recipe.macros_with_additions) : null
      );

      if (recipeResult.changes > 0) {
        const allIngredients = [
          ...((recipe.ingredients as unknown[]) ?? []),
          ...((recipe.additions as unknown[]) ?? []),
        ] as Record<string, unknown>[];

        for (const ing of allIngredients) {
          insertIngredient.run(
            id,
            ing.name ?? "Unknown",
            ing.amount ?? null,
            ing.unit ?? null,
            ing.group ?? ing.group_name ?? "main",
            ing.notes ?? null,
            ing.grocery_category ?? "other"
          );
        }
      }

      totalRecipes++;
    }

    console.log(`✓ ${file}: ${recipes.length} recipes`);
  }
});

seedAll();
console.log(`\nSeeded ${totalRecipes} recipes total into ${DB_PATH}`);
