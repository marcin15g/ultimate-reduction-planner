# Ultimate Reduction Planner

A meal planner for a calorie deficit ("reduction" diet), built for a household
where several people eat the same meals but have different calorie targets.

Pick recipes for each day, decide who eats each meal and how many portions to
cook, and the app shows each person's daily calories against their target, then
generates one combined shopping list, scaled to the portions you planned.

## Features

- **Recipe library**: search and filter by category or max calories, with ingredients,
  instructions, tips and macros (kcal, protein, fat, carbs) per serving
- **People**: each household member has their own daily calorie target
- **Meal plans**: multi-day plans; each meal slot has a recipe, a portion count
  and the people sharing it
- **Calorie tracking**: per-person, per-day totals with a progress bar against
  the target; shared meals are split evenly between the people eating them
- **Shopping list**: ingredients from every meal in the plan, scaled from
  each recipe's base servings, merged and grouped by store section
- Light/dark theme

The interface is in Polish.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) with React 19 and TypeScript
- Route handlers as a small REST API (`app/api/...`)
- SQLite via [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)
- Tailwind CSS 4, [lucide-react](https://lucide.dev) icons

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run seed   # load recipes into recipes.db (see below)
npm run dev    # http://localhost:3000
```

### Recipe data

Recipes aren't included in the repository. `npm run seed` reads every
`recipes_*.json` file from a `data/` folder next to this repository
(`../data` relative to the project root) and loads it into `recipes.db`.

Each file holds an array of recipes:

```json
[
  {
    "name": "Chicken with rice",
    "category": "lunch",
    "servings_total": 2,
    "ingredients": [
      { "name": "chicken breast", "amount": 300, "unit": "g", "grocery_category": "meat_fish" }
    ],
    "instructions": ["..."],
    "macros_per_serving": { "kcal": 520, "protein_g": 45, "fat_g": 12, "carbs_g": 55 }
  }
]
```

`grocery_category` is one of `meat_fish`, `dairy_eggs`, `produce`,
`grains_bread`, `pantry`, `fats`, `condiments` or `other`.

## API

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/recipes` | List recipes (`search`, `category`, `maxKcal` filters) |
| `GET` | `/api/recipes/:id` | Recipe with ingredients |
| `GET` `POST` | `/api/people` | List / add people |
| `PUT` `DELETE` | `/api/people/:id` | Update / remove a person |
| `GET` `POST` | `/api/plans` | List / create meal plans |
| `GET` `DELETE` | `/api/plans/:id` | Plan details / delete |
| `GET` `POST` | `/api/plans/:id/slots` | List meals / add a meal to a day |
| `PUT` `DELETE` | `/api/plans/:id/slots/:slotId` | Change portions or people / remove |
| `GET` | `/api/plans/:id/shopping` | Generated shopping list |

## Project structure

```
app/          pages (recipes, planner, people) and API route handlers
lib/db.ts     SQLite connection and schema
lib/queries.ts data access, shopping-list and calorie calculations
lib/types.ts  shared types
scripts/      seed script
```
