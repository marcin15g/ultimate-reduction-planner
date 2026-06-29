import { getRecipeById } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Macros } from "@/lib/types";

export const dynamic = "force-dynamic";

function MacroTable({ label, m }: { label: string; m: Macros }) {
  return (
    <tr>
      <td className="py-1.5 pr-4 text-sm text-gray-500 dark:text-gray-400">{label}</td>
      <td className="py-1.5 pr-4 text-sm font-medium text-orange-600 dark:text-orange-400">{Math.round(m.kcal)} kcal</td>
      <td className="py-1.5 pr-4 text-sm text-blue-700 dark:text-blue-400">{Math.round(m.protein_g)}g B</td>
      <td className="py-1.5 pr-4 text-sm text-yellow-700 dark:text-yellow-400">{Math.round(m.fat_g)}g T</td>
      <td className="py-1.5 text-sm text-green-700 dark:text-green-400">{Math.round(m.carbs_g)}g W</td>
    </tr>
  );
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) notFound();

  const mainIngredients = recipe.ingredients?.filter((i) => i.group_name === "main") ?? [];
  const additions = recipe.ingredients?.filter((i) => i.group_name === "additions") ?? [];

  return (
    <div className="max-w-2xl">
      <Link href="/recipes" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-flex items-center gap-1">
        ← Przepisy
      </Link>

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-2 mb-1">{recipe.name}</h1>

      <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-6">
        {recipe.source_book && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{recipe.source_book}</span>}
        {recipe.source_page && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">p. {recipe.source_page}</span>}
        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{recipe.servings_note ?? `na ${recipe.servings_total} porcje`}</span>
      </div>

      {(recipe.macros_total || recipe.macros_per_serving) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Wartość odżywcza</h2>
          <table>
            <tbody>
              {recipe.macros_total && (
                <MacroTable
                  label={recipe.servings_total > 1 ? "Łącznie" : "Na porcję"}
                  m={recipe.macros_total}
                />
              )}
              {recipe.macros_per_serving && recipe.servings_total > 1 && (
                <MacroTable label="Na porcję" m={recipe.macros_per_serving} />
              )}
              {recipe.macros_with_additions && (
                <MacroTable label="Z dodatkami" m={recipe.macros_with_additions} />
              )}
            </tbody>
          </table>
        </div>
      )}

      {mainIngredients.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Składniki
            {recipe.servings_note && <span className="ml-2 font-normal normal-case">{recipe.servings_note}</span>}
          </h2>
          <ul className="space-y-2">
            {mainIngredients.map((ing) => (
              <li key={ing.id} className="flex items-start gap-3 text-sm">
                <span className="w-20 shrink-0 text-right font-medium text-gray-700 dark:text-gray-300">
                  {ing.amount != null ? ing.amount : ""}
                  {ing.unit ? ` ${ing.unit}` : ""}
                </span>
                <span className="text-gray-900 dark:text-gray-100">{ing.name}</span>
                {ing.notes && <span className="text-gray-400 dark:text-gray-500 text-xs">{ing.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {additions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Dodatki</h2>
          <ul className="space-y-2">
            {additions.map((ing) => (
              <li key={ing.id} className="flex items-start gap-3 text-sm">
                <span className="w-20 shrink-0 text-right font-medium text-gray-700 dark:text-gray-300">
                  {ing.amount != null ? ing.amount : ""}
                  {ing.unit ? ` ${ing.unit}` : ""}
                </span>
                <span className="text-gray-900 dark:text-gray-100">{ing.name}</span>
                {ing.notes && <span className="text-gray-400 dark:text-gray-500 text-xs">{ing.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.instructions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Przygotowanie</h2>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {recipe.tips.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <h2 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3">Wskazówki</h2>
          <ul className="space-y-2">
            {recipe.tips.map((tip, i) => (
              <li key={i} className="text-sm text-amber-900 dark:text-amber-200 flex gap-2">
                <span className="text-amber-500 dark:text-amber-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
