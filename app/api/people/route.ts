import { getPeople, createPerson } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getPeople());
}

export async function POST(req: Request) {
  const { name, daily_calorie_target } = await req.json();
  if (!name || !daily_calorie_target) {
    return Response.json({ error: "name and daily_calorie_target required" }, { status: 400 });
  }
  const person = createPerson(String(name), Number(daily_calorie_target));
  return Response.json(person, { status: 201 });
}
