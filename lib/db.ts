import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "recipes.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
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

    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      daily_calorie_target INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT,
      days INTEGER NOT NULL DEFAULT 3,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meal_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      recipe_id TEXT NOT NULL REFERENCES recipes(id),
      servings_multiplier REAL NOT NULL DEFAULT 1.0,
      person_ids TEXT NOT NULL DEFAULT '[]'
    );

    CREATE INDEX IF NOT EXISTS idx_slots_plan ON meal_slots(plan_id);
  `);
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createDb();
  }
  return global.__db;
}
