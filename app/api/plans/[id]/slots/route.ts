import { getSlotsByPlan, addSlot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return Response.json(getSlotsByPlan(Number(id)));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { day, recipe_id, servings_multiplier, person_ids } = await req.json();

  if (!day || !recipe_id) {
    return Response.json({ error: "day and recipe_id required" }, { status: 400 });
  }

  const slot = addSlot(
    Number(id),
    Number(day),
    String(recipe_id),
    Number(servings_multiplier ?? 1),
    Array.isArray(person_ids) ? person_ids : []
  );

  return Response.json(slot, { status: 201 });
}
