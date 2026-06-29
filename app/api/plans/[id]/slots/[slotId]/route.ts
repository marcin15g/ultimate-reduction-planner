import { updateSlot, deleteSlot } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const { servings_multiplier, person_ids } = await req.json();
  const slot = updateSlot(
    Number(slotId),
    Number(servings_multiplier ?? 1),
    Array.isArray(person_ids) ? person_ids : []
  );
  if (!slot) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(slot);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const ok = deleteSlot(Number(slotId));
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
