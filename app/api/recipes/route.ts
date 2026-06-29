import { NextRequest } from "next/server";
import { getRecipes, getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const maxKcal = searchParams.get("maxKcal")
    ? Number(searchParams.get("maxKcal"))
    : undefined;

  const recipes = getRecipes({ search, category, maxKcal });
  const categories = getCategories();

  return Response.json({ recipes, categories });
}
