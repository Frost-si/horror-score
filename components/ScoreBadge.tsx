// The colored square showing the horror score, Metacritic style.
export default function ScoreBadge({ score, size = 48 }: { score?: number | null; size?: number }) {
  const color =
    score == null ? "#52525b" :   // no votes yet: grey
    score > 75 ? "#c0392b" :      // terrifying: red
    score > 50 ? "#e67e22" :      // scary: orange
    score > 25 ? "#f1c40f" :      // mild: yellow
    "#7f8c8d";                    // not scary: grey
  return (
    <div
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
      className="flex shrink-0 items-center justify-center rounded font-bold text-white"
    >
      {score ?? "tbd"}
    </div>
  );
}