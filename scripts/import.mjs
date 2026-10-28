import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const spy = await fetch("https://steamspy.com/api.php?request=tag&tag=Horror").then((r) => r.json());
const candidates = Object.values(spy)
  .sort((a, b) => b.positive + b.negative - (a.positive + a.negative))
  .slice(0, 400);
console.log("candidates", candidates.length);

let kept = 0;
for (const g of candidates) {
  if (kept >= 150) break;
  try {
    const sd = await fetch(`https://steamspy.com/api.php?request=appdetails&appid=${g.appid}`).then((r) => r.json());
    const topTags = Object.entries(sd.tags ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 8).map((t) => t[0]);
    if (!topTags.slice(0, 5).some((t) => t.includes("Horror"))) {
      console.log("not horror, skip", g.name);
      await sleep(1100);
      continue;
    }
    await sleep(1100);

    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${g.appid}&cc=us&l=english`
    ).then((r) => r.json());
    const d = res[g.appid]?.data;
    if (!d) { console.log("skip", g.name); await sleep(1500); continue; }

    const reqText = (d.pc_requirements?.minimum ?? "").replace(/<[^>]+>/g, " ");
    const storage = reqText.match(/(?:Storage|Hard Drive|Disk Space)\s*:?\s*([\d.,]+\s*(?:GB|MB))/i)?.[1] ?? null;
    const date = new Date(d.release_date?.date);

    const { error } = await sb.from("games").upsert({
      id: g.appid,
      name: d.name,
      slug: slugify(d.name),
      image: d.header_image,
      released: isNaN(date) ? null : date.toISOString().slice(0, 10),
      playtime: Math.round((g.average_forever || 0) / 60),
      platforms: ["PC"],
      tags: topTags,
      screenshots: d.screenshots?.slice(0, 6).map((s) => s.path_full) ?? [],
      storage_req: storage,
      description: d.short_description,
      similar: [],
    });
    if (error) console.log(d.name, error.message);
    else { kept++; console.log(`ok ${kept}: ${d.name}`); }
  } catch (e) {
    console.log("fail", g.name, e.message);
  }
  await sleep(1500);
}
console.log("done, saved", kept);