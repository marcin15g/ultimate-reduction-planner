"use client";

import { useEffect, useState } from "react";
import type { Person } from "@/lib/types";

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/people");
    setPeople(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(p: Person) {
    setEditId(p.id);
    setName(p.name);
    setKcal(String(p.daily_calorie_target));
  }

  function cancelEdit() {
    setEditId(null);
    setName("");
    setKcal("");
  }

  async function save() {
    if (!name.trim() || !kcal) return;
    if (editId !== null) {
      await fetch(`/api/people/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), daily_calorie_target: Number(kcal) }),
      });
    } else {
      await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), daily_calorie_target: Number(kcal) }),
      });
    }
    setName(""); setKcal(""); setEditId(null);
    load();
  }

  async function remove(id: number) {
    await fetch(`/api/people/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Osoby</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {editId !== null ? "Edytuj osobę" : "Dodaj osobę"}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Imię"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <input
            type="number"
            placeholder="Kcal / dzień"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            min={500}
            max={5000}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          />
          <button
            onClick={save}
            disabled={!name.trim() || !kcal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
          >
            {editId !== null ? "Zapisz" : "Dodaj"}
          </button>
          {editId !== null && (
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2">
              Anuluj
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Ładowanie…</div>
      ) : people.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-8">
          Brak osób — dodaj kogoś powyżej.
        </div>
      ) : (
        <div className="space-y-2">
          {people.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-400 font-semibold text-sm shrink-0">
                {p.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{p.daily_calorie_target.toLocaleString("pl-PL")} kcal / dzień</p>
              </div>
              <button
                onClick={() => startEdit(p)}
                className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Edytuj
              </button>
              <button
                onClick={() => remove(p.id)}
                className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Usuń
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
