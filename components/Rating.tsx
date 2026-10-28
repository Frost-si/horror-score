"use client"; // runs in the browser, because it needs login state and clicks

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TAGS = ["Jumpscares", "Gore", "Psychological", "Creepy atmosphere", "Tension", "Co-op friendly"];

export default function RatingBox({ gameId }: { gameId: number }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [score, setScore] = useState(50);
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState("");
  const [msg, setMsg] = useState("");

  // On load, check if someone is logged in, and keep watching for login/logout.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUserId(session?.user.id ?? null)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Try to log in; if the account doesn't exist, create it.
  async function auth() {
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const { error: e2 } = await supabase.auth.signUp({ email, password });
      if (e2) setMsg(e2.message);
    }
  }

  // Save the rating. One rating per user per game: a second submit updates the first.
  async function submit() {
    const { error } = await supabase.from("ratings").upsert(
      { game_id: gameId, user_id: userId, score, scare_tags: tags, review: review.trim() || null },
      { onConflict: "game_id,user_id" }
    );
    if (error) return setMsg(error.message);
    setMsg("Saved!");
    router.refresh(); // reload the server data so the new score shows
  }

  const toggle = (t: string) => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t]);

  // Not logged in: show login form.
  if (!userId)
    return (
      <div className="mt-8 rounded bg-neutral-900 p-4">
        <h2 className="mb-2 text-xl font-semibold">Log in to rate</h2>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
          className="mb-2 w-full rounded bg-neutral-800 p-2" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
          placeholder="Password (min 6 characters)" className="mb-2 w-full rounded bg-neutral-800 p-2" />
        <button onClick={auth} className="rounded bg-red-700 px-4 py-2 font-semibold hover:bg-red-600">
          Log in / Sign up
        </button>
        {msg && <p className="mt-2 text-sm text-red-400">{msg}</p>}
      </div>
    );

  // Logged in: show rating form.
  return (
    <div className="mt-8 rounded bg-neutral-900 p-4">
      <h2 className="mb-2 text-xl font-semibold">How scary is it? <span className="text-red-500">{score}</span>/100</h2>
      <input type="range" min={0} max={100} value={score}
        onChange={(e) => setScore(Number(e.target.value))} className="w-full accent-red-600" />
      <div className="my-3 flex flex-wrap gap-2">
        {TAGS.map((t) => (
          <button key={t} onClick={() => toggle(t)}
            className={`rounded px-2 py-1 text-xs ${tags.includes(t) ? "bg-red-700" : "bg-neutral-800"}`}>
            {t}
          </button>
        ))}
      </div>
      <textarea value={review} onChange={(e) => setReview(e.target.value)} maxLength={500}
        placeholder="Short review (optional)" className="mb-2 w-full rounded bg-neutral-800 p-2" />
      <div className="flex items-center gap-3">
        <button onClick={submit} className="rounded bg-red-700 px-4 py-2 font-semibold hover:bg-red-600">Submit rating</button>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-neutral-400">Log out</button>
        {msg && <span className="text-sm text-neutral-300">{msg}</span>}
      </div>
    </div>
  );
}