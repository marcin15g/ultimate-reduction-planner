"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { MealPlan, MealSlot, Person, Recipe } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface SlotWithRecipe extends MealSlot {
  recipe?: Recipe;
}

interface PickerState {
  day: number;
  search: string;
  results: Recipe[];
  loading: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function kcalForPerson(slots: SlotWithRecipe[], personId: number, day: number): number {
  return slots
    .filter((s) => s.day === day && s.person_ids.includes(personId))
    .reduce((sum, s) => {
      const m = s.recipe?.macros_per_serving ?? s.recipe?.macros_total;
      if (!m) return sum;
      const share = s.person_ids.length > 0 ? s.servings_multiplier / s.person_ids.length : 0;
      return sum + m.kcal * share;
    }, 0);
}

function CalorieBar({ eaten, target }: { eaten: number; target: number }) {
  const pct = Math.min((eaten / target) * 100, 100);
  const over = eaten > target;
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 dark:text-gray-400">{Math.round(eaten)} kcal</span>
        <span className={over ? "text-red-500 font-medium" : "text-gray-400 dark:text-gray-500"}>/ {target}</span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-400" : pct >= 90 ? "bg-green-500" : "bg-green-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Recipe Picker Modal ───────────────────────────────────────────────────────

function RecipePicker({
  state,
  people,
  onSearch,
  onAdd,
  onClose,
}: {
  state: PickerState;
  people: Person[];
  onSearch: (q: string) => void;
  onAdd: (recipe: Recipe, multiplier: number, personIds: number[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [multiplier, setMultiplier] = useState(people.length);
  const [personIds, setPersonIds] = useState<number[]>(people.map((p) => p.id));

  function togglePerson(id: number) {
    setPersonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Dodaj przepis — Dzień {state.day}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">×</button>
          </div>
          <input
            type="search"
            autoFocus
            placeholder="Szukaj przepisów…"
            value={state.search}
            onChange={(e) => onSearch(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {selected ? (
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
              <p className="font-medium text-sm text-green-900 dark:text-green-200">{selected.name}</p>
              {(selected.macros_per_serving ?? selected.macros_total) && (
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {Math.round((selected.macros_per_serving ?? selected.macros_total)!.kcal)} kcal / porcja · {selected.servings_note ?? `na ${selected.servings_total} porcje`}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">Kto je to danie?</label>
              <div className="flex gap-2 flex-wrap">
                {people.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => togglePerson(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      personIds.includes(p.id)
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-green-400"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-2">
                Łączna liczba porcji{" "}
                <span className="font-normal text-gray-400 dark:text-gray-500">(domyślnie 1 na osobę)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={multiplier}
                  onChange={(e) => setMultiplier(Number(e.target.value))}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100"
                />
                {(selected.macros_per_serving ?? selected.macros_total) && personIds.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    = {Math.round((selected.macros_per_serving ?? selected.macros_total)!.kcal * multiplier / personIds.length)} kcal / os.
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-lg py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                ← Wróć
              </button>
              <button
                onClick={() => { onAdd(selected, multiplier, personIds); }}
                disabled={personIds.length === 0}
                className="flex-1 bg-green-600 text-white text-sm rounded-lg py-2 font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
              >
                Dodaj do planu
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-2">
            {state.loading ? (
              <p className="text-xs text-gray-400 text-center py-8">Szukam…</p>
            ) : state.results.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Brak wyników</p>
            ) : (
              state.results.map((r) => {
                const m = r.macros_per_serving ?? r.macros_total;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors leading-tight">
                        {r.name}
                      </p>
                      {m && (
                        <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded shrink-0">
                          {Math.round(m.kcal)} kcal
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{r.source_book} · {r.servings_note}</p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PlannerDetailPage() {
  const params = useParams<{ id: string }>();
  const planId = Number(params.id);

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [slots, setSlots] = useState<SlotWithRecipe[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [picker, setPicker] = useState<PickerState | null>(null);

  async function loadAll() {
    const [planRes, slotsRes, peopleRes] = await Promise.all([
      fetch(`/api/plans/${planId}`),
      fetch(`/api/plans/${planId}/slots`),
      fetch("/api/people"),
    ]);
    const [planData, slotsData, peopleData] = await Promise.all([
      planRes.json(),
      slotsRes.json(),
      peopleRes.json(),
    ]);
    setPlan(planData);

    const enriched: SlotWithRecipe[] = await Promise.all(
      slotsData.map(async (s: MealSlot) => {
        const rRes = await fetch(`/api/recipes/${s.recipe_id}`);
        const recipe = rRes.ok ? await rRes.json() : undefined;
        return { ...s, recipe };
      })
    );
    setSlots(enriched);
    setPeople(peopleData);
  }

  useEffect(() => { loadAll(); }, [planId]);

  const openPicker = useCallback(
    async (day: number) => {
      setPicker({ day, search: "", results: [], loading: true });
      const res = await fetch("/api/recipes");
      const data = await res.json();
      setPicker((p) => p ? { ...p, results: data.recipes, loading: false } : null);
    },
    []
  );

  const searchRecipes = useCallback(async (q: string) => {
    setPicker((p) => p ? { ...p, search: q, loading: true } : null);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const res = await fetch(`/api/recipes?${params}`);
    const data = await res.json();
    setPicker((p) => p ? { ...p, results: data.recipes, loading: false } : null);
  }, []);

  async function addSlot(recipe: Recipe, multiplier: number, personIds: number[]) {
    if (!picker) return;
    await fetch(`/api/plans/${planId}/slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day: picker.day,
        recipe_id: recipe.id,
        servings_multiplier: multiplier,
        person_ids: personIds,
      }),
    });
    setPicker(null);
    loadAll();
  }

  async function removeSlot(slotId: number) {
    await fetch(`/api/plans/${planId}/slots/${slotId}`, { method: "DELETE" });
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  const DAYS = plan ? Array.from({ length: plan.days }, (_, i) => i + 1) : [1, 2, 3];

  function dayLabel(day: number) {
    if (plan?.start_date) {
      const d = new Date(plan.start_date);
      d.setDate(d.getDate() + day - 1);
      return `Dzień ${day} · ${d.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}`;
    }
    return `Dzień ${day}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/planner" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">← Plany</Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{plan?.name ?? "Ładowanie…"}</h1>
        </div>
        <Link
          href={`/planner/${planId}/shopping`}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Lista zakupów →
        </Link>
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.day === day);
          return (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
              <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{dayLabel(day)}</h2>

              {daySlots.map((slot) => {
                const m = slot.recipe?.macros_per_serving ?? slot.recipe?.macros_total;
                const perPerson = m && slot.person_ids.length > 0
                  ? Math.round(m.kcal * slot.servings_multiplier / slot.person_ids.length)
                  : null;

                return (
                  <div key={slot.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 group relative">
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="absolute top-2 right-2 text-gray-300 dark:text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                      title="Usuń"
                    >
                      ×
                    </button>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 pr-5 leading-tight">
                      {slot.recipe?.name ?? slot.recipe_id}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {perPerson !== null && (
                        <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded">
                          {perPerson} kcal/os.
                        </span>
                      )}
                      <span className="text-xs text-gray-400 dark:text-gray-500">{slot.servings_multiplier} porcji</span>
                      <div className="flex gap-1">
                        {people
                          .filter((p) => slot.person_ids.includes(p.id))
                          .map((p) => (
                            <span key={p.id} className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                              {p.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => openPicker(day)}
                className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-2 text-sm text-gray-400 dark:text-gray-500 hover:border-green-400 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400 transition-colors"
              >
                + Dodaj przepis
              </button>

              {people.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                  {people.map((p) => (
                    <div key={p.id}>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{p.name}</p>
                      <CalorieBar
                        eaten={kcalForPerson(slots, p.id, day)}
                        target={p.daily_calorie_target}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {picker && (
        <RecipePicker
          state={picker}
          people={people}
          onSearch={searchRecipes}
          onAdd={addSlot}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
