import { getPlans, createPlan } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getPlans());
}

export async function POST(req: Request) {
  const { name, start_date, days } = await req.json();
  if (!name) {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  const plan = createPlan(String(name), start_date, days ? Number(days) : undefined);
  return Response.json(plan, { status: 201 });
}
