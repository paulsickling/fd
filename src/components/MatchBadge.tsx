import type { MatchResult } from '@/domain/matching';

/**
 * The match score, always shown with its reason (SPEC.md CAP-6).
 *
 * A bare number would be worse than nothing here — the point of a transparent heuristic is
 * that it can answer "why?", so the reason is part of the component rather than a tooltip
 * someone might not open.
 */
export function MatchBadge({ match, className }: { match: MatchResult; className?: string }) {
  const tone =
    match.score >= 75 ? 'text-ocean-700' : match.score >= 50 ? 'text-ink-900' : 'text-ink-700';

  return (
    <p className={['text-sm', className].filter(Boolean).join(' ')}>
      <span className={`font-normal ${tone}`}>{match.score}% match</span>
      {match.headline ? <span className="text-ink-700"> · {match.headline}</span> : null}
    </p>
  );
}
