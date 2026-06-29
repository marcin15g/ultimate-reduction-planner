"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { Recipe } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  sniadania: "Śniadania",
  drugie_sniadania: "Drugie śniadania",
  dodatki_slodkie: "Dodatki słodkie",
  dodatki_wytrawne: "Dodatki wytrawne",
  surowki: "Surówki",
  napoje: "Napoje",
  obiady: "Obiady",
  fast_food: "Fast Food",
  ciasta: "Ciasta",
  desery: "Desery",
  koktajle: "Koktajle",
  slodycze: "Słodycze",
  dania_szybkie: "Dania szybkie",
  przekaski: "Przekąski",
};

function label(cat: string) {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ");
}

function MacroChip({ value, unit, color }: { value: number; unit: string; color: string }) {
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${color}`}>
      {Math.round(value)}{unit}
    </span>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCat) params.set("category", selectedCat);
    const res = await fetch(`/api/recipes?${params}`);
    const data = await res.json();
    setRecipes(data.recipes ?? []);
    setCategories(data.categories ?? []);
    setLoading(false);
  }, [search, selectedCat]);

  useEffect(() => {
    const t = setTimeout(fetchRecipes, 200);
    return () => clearTimeout(t);
  }, [fetchRecipes]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex-1">Przepisy</h1>
        <div className="flex gap-2">
          <input
            type="search"
            placeholder="Szukaj przepisów…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map((c) => (
              <option key={c} value={c}>{label(c)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Ładowanie…</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          Nie znaleziono przepisów.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => {
            const macros = r.macros_per_serving ?? r.macros_total;
            return (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-green-400 dark:hover:border-green-500 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                    {r.name}
                  </h2>
                  {r.category && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                      {label(r.category)}
                    </span>
                  )}
                </div>
                {r.source_book && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{r.source_book}</p>
                )}
                {macros && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                      {Math.round(macros.kcal)} kcal
                    </span>
                    <MacroChip value={macros.protein_g} unit="g B" color="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30" />
                    <MacroChip value={macros.fat_g} unit="g T" color="text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30" />
                    <MacroChip value={macros.carbs_g} unit="g W" color="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30" />
                  </div>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {r.servings_note ?? `na ${r.servings_total} porcje`}
                </p>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-center">
        {recipes.length} przepisów
      </p>
    </div>
  );
}
