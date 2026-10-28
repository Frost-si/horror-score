import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ScoreBadge from "@/components/ScoreBadge";
import RatingBox from "@/components/Rating";   // <- new import

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: game } = await supabase.from("games").select("*").eq("id", id).single();
  if (!game) notFound();

  const { data: score } = await supabase.from("game_scores").select("*").eq("game_id", id).maybeSingle();

  const simTags = (game.tags ?? []).filter((t: string) => !t.includes("Horror")).slice(0, 3);
  const { data: similar } = await supabase
    .from("games").select("id,name,image")
    .overlaps("tags", simTags).neq("id", game.id).limit(6);

  // ---- PASTE THE NEW REVIEWS QUERY HERE ----
  const { data: reviews } = await supabase
    .from("ratings")
    .select("score,scare_tags,review,created_at")
    .eq("game_id", id)
    .not("review", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  // ------------------------------------------
  // Top Steam reviews for this game (Steam's public API, no key needed).
  // Our games table uses Steam's app id as its id, so `id` works directly.
  // The result is cached for 24h so we don't hit Steam on every page view.
  const steam = await fetch(
    `https://store.steampowered.com/appreviews/${id}?json=1&filter=all&language=english&num_per_page=5&purchase_type=all`,
    { next: { revalidate: 86400 } }
  ).then((r) => r.json()).catch(() => null);
  const steamReviews = steam?.reviews ?? [];
  const summary = steam?.query_summary;
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/" className="text-sm text-neutral-400 hover:text-white">← All games</Link>

      <img src={game.image} alt={game.name} className="mt-3 w-full rounded" />

      <div className="mt-4 flex items-center gap-4">
        <ScoreBadge score={score?.horror_score} size={72} />
        <div>
          <h1 className="text-2xl font-bold">{game.name}</h1>
          <div className="text-neutral-400">{score?.votes ?? 0} player ratings</div>
        </div>
      </div>

      {/* Quick facts */}
      <div className="mt-4 flex flex-wrap gap-6 text-sm text-neutral-300">
        <div>Avg playtime: <b>{game.playtime ? `${game.playtime}h` : "n/a"}</b></div>
        <div>Storage: <b>{game.storage_req ?? "n/a"}</b></div>
        <div>Released: <b>{game.released ?? "n/a"}</b></div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {game.tags?.map((t: string) => (
          <span key={t} className="rounded bg-neutral-800 px-2 py-1 text-xs">{t}</span>
        ))}
      </div>

      <p className="mt-4 text-neutral-300">{game.description}</p>

      <h2 className="mt-8 mb-2 text-xl font-semibold">Screenshots</h2>
      <div className="grid grid-cols-2 gap-2">
        {game.screenshots?.map((s: string) => (
          <img key={s} src={s} alt="screenshot" className="rounded" />
        ))}
      </div>
      <h2 className="mt-8 mb-1 text-xl font-semibold">Steam reviews</h2>
      {summary && (
        <p className="mb-2 text-sm text-neutral-400">
          {summary.review_score_desc} · {summary.total_positive?.toLocaleString()} positive,{" "}
          {summary.total_negative?.toLocaleString()} negative
        </p>
      )}
      <div className="space-y-3">
        {steamReviews.map((r: any) => (
          <div key={r.recommendationid} className="rounded bg-neutral-900 p-3">
            <div className="mb-1 text-xs text-neutral-400">
              {r.voted_up ? "👍 Recommended" : "👎 Not recommended"} ·{" "}
              {Math.round((r.author?.playtime_forever ?? 0) / 60)}h played · {r.votes_up} found helpful
            </div>
            <p className="text-sm">{r.review.slice(0, 400)}{r.review.length > 400 ? "…" : ""}</p>
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-neutral-500">Reviews from Steam.</p>
      {/* RATING FORM + REVIEWS GO HERE (next step) */}
  <RatingBox gameId={game.id} />

      <h2 className="mt-8 mb-2 text-xl font-semibold">Player reviews</h2>
      {reviews?.length === 0 && <p className="text-neutral-400">No reviews yet. Be the first.</p>}
      <div className="space-y-3">
        {reviews?.map((r, i) => (
          <div key={i} className="rounded bg-neutral-900 p-3">
            <div className="mb-1 flex items-center gap-2">
              <ScoreBadge score={r.score} size={28} />
              <span className="text-xs text-neutral-400">{r.scare_tags?.join(" · ")}</span>
            </div>
            <p className="text-sm">{r.review}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 mb-2 text-xl font-semibold">Similar games</h2>
      <div className="grid grid-cols-3 gap-3">
        {similar?.map((g) => (
          <Link key={g.id} href={`/game/${g.id}`} className="rounded bg-neutral-900 p-2 text-sm hover:ring-1 hover:ring-red-600">
            <img src={g.image} alt={g.name} className="mb-1 h-20 w-full rounded object-cover" />
            <div className="truncate">{g.name}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}