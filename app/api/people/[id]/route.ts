import { updatePerson, deletePerson } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, daily_calorie_target } = await req.json();
  const person = updatePerson(Number(id), String(name), Number(daily_calorie_target));
  if (!person) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(person);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deletePerson(Number(id));
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}
