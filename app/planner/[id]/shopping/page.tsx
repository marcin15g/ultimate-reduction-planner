"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { ShoppingItem, GroceryCategory } from "@/lib/types";
import { GROCERY_LABELS, GROCERY_ORDER } from "@/lib/types";

function formatAmount(amount: number | null, unit: string | null): string {
  if (amount === null) return "";
  const rounded = Number.isInteger(amount) ? amount : Math.round(amount * 10) / 10;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

const CATEGORY_ICONS: Record<GroceryCategory, string> = {
  meat_fish: "🥩",
  dairy_eggs: "🥛",
  produce: "🥦",
  grains_bread: "🌾",
  pantry: "🫙",
  fats: "🫒",
  condiments: "🧴",
  other: "📦",
};

export default function ShoppingListPage() {
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const [grouped, setGrouped] = useState<Record<GroceryCategory, ShoppingItem[]> | null>(null);
  const [planName, setPlanName] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      fetch(`/api/plans/${planId}/shopping`).then((r) => r.json()),
      fetch(`/api/plans/${planId}`).then((r) => r.json()),
    ]).then(([list, plan]) => {
      setGrouped(list);
      setPlanName(plan.name ?? "");
    });
  }, [planId]);

  function toggleCheck(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function copyToClipboard() {
    if (!grouped) return;
    const lines: string[] = [`Lista zakupów — ${planName}`, ""];
    for (const cat of GROCERY_ORDER) {
      const items = grouped[cat];
      if (!items?.length) continue;
      lines.push(`${GROCERY_LABELS[cat].toUpperCase()}`);
      for (const item of items) {
        const amt = formatAmount(item.amount, item.unit);
        lines.push(`• ${item.name}${amt ? ` — ${amt}` : ""}`);
      }
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n"));
  }

  const totalItems = grouped
    ? GROCERY_ORDER.reduce((n, cat) => n + (grouped[cat]?.length ?? 0), 0)
    : 0;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 no-print">
        <div>
          <Link href={`/planner/${planId}`} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            ← Wróć do planu
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">Lista zakupów</h1>
          {planName && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{planName}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Kopiuj tekst
          </button>
          <button
            onClick={() => window.print()}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Drukuj
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only mb-6">
        <h1 className="text-xl font-semibold">Lista zakupów — {planName}</h1>
      </div>

      {!grouped ? (
        <div className="text-sm text-gray-400 text-center py-12">Generuję listę…</div>
      ) : totalItems === 0 ? (
        <div className="text-sm text-gray-400 text-center py-12">
          Brak produktów — najpierw dodaj przepisy do planu.
        </div>
      ) : (
        <div className="space-y-4">
          {GROCERY_ORDER.map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    {GROCERY_LABELS[cat]}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">{items.length}</span>
                </div>
                <ul className="divide-y divide-gray-50 dark:divide-gray-700">
                  {items.map((item, i) => {
                    const key = `${cat}_${i}`;
                    const isChecked = checked.has(key);
                    return (
                      <li
                        key={key}
                        onClick={() => toggleCheck(key)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors no-print ${isChecked ? "opacity-40" : ""}`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600"}`}>
                          {isChecked && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className={`flex-1 text-sm text-gray-900 dark:text-gray-100 ${isChecked ? "line-through" : ""}`}>
                          {item.name}
                        </span>
                        {(item.amount !== null || item.unit) && (
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">
                            {formatAmount(item.amount, item.unit)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {/* Print version */}
                <ul className="print-only divide-y divide-gray-100">
                  {items.map((item, i) => (
                    <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                      <span>□ {item.name}</span>
                      {item.amount !== null && (
                        <span className="font-medium text-gray-600">{formatAmount(item.amount, item.unit)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {totalItems > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center no-print">
          {totalItems} pozycji · kliknij aby odhaczyć
        </p>
      )}
    </div>
  );
}
