import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ScoreBadge from "@/components/ScoreBadge";

// searchParams holds the ?q=... part of the URL, used for search.
export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;

  // 1. Get games from the database (filtered by name if the user searched).
  let query = supabase.from("games").select("id,name,image,playtime");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data: games } = await query.limit(120);

  // 2. Get all scores (from the game_scores view) and index them by game id.
  const { data: scores } = await supabase.from("game_scores").select("*");
  const scoreMap = new Map((scores ?? []).map((s) => [s.game_id, s]));

  // 3. Sort: rated games first, highest horror score on top.
  const sorted = [...(games ?? [])].sort(
    (a, b) => (scoreMap.get(b.id)?.horror_score ?? -1) - (scoreMap.get(a.id)?.horror_score ?? -1)
  );

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Horror<span className="text-red-600">Score</span></h1>
      <p className="mb-4 text-neutral-400">How scary is it, really? Rated by players.</p>

      {/* Plain HTML form: submitting reloads the page with ?q=yourtext */}
      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search horror games..."
          className="w-full rounded bg-neutral-900 p-3 outline-none ring-1 ring-neutral-700 focus:ring-red-600"
        />
      </form>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {sorted.map((g) => (
          <Link key={g.id} href={`/game/${g.id}`} className="overflow-hidden rounded bg-neutral-900 hover:ring-1 hover:ring-red-600">
            <img src={g.image} alt={g.name} className="h-28 w-full object-cover" />
            <div className="flex items-center gap-3 p-3">
              <ScoreBadge score={scoreMap.get(g.id)?.horror_score} size={40} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{g.name}</div>
                <div className="text-xs text-neutral-400">
                  {scoreMap.get(g.id)?.votes ?? 0} votes
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}