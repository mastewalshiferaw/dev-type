import { Crown, Star, Trophy } from 'lucide-react';

/** Crown, trophy and star for the podium, a plain number below it. */
export default function RankMark({ rank }: { rank: number }) {
  return (
    <span className="flex w-5 shrink-0 items-center justify-center">
      <span className="sr-only">Rank {rank}</span>
      {rank === 1 && <Crown size={18} aria-hidden className="fill-accent/20 text-accent" />}
      {rank === 2 && <Trophy size={16} aria-hidden className="fill-ink-dim/20 text-ink-dim" />}
      {rank === 3 && <Star size={16} aria-hidden className="fill-accent/10 text-accent" />}
      {rank > 3 && (
        <span aria-hidden className="text-xs font-semibold text-muted tabular-nums">
          {rank}
        </span>
      )}
    </span>
  );
}
