import { useState } from 'react';
import { MONTH_LABELS } from '@/domain/seasonality';
import type { BoardType, SkillLevel, SurferProfile } from '@/domain/types';
import { useSurferProfile } from './surferProfileContext';
import { defaultProfile } from './surferProfileStore';

const ABILITIES: readonly { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
];

const BOARDS: readonly { value: BoardType; label: string }[] = [
  { value: 'shortboard', label: 'Shortboard' },
  { value: 'longboard', label: 'Longboard' },
  { value: 'fish', label: 'Fish' },
  { value: 'gun', label: 'Gun' },
  { value: 'sup', label: 'SUP' },
];

/**
 * The surfer profile control (SPEC.md CAP-6).
 *
 * Opt-in by design: it is a disclosure the viewer opens, never a gate in front of the
 * site. With no profile set every screen works exactly as before; with one set, the same
 * static dataset re-ranks and explains itself.
 */
export function SurferProfilePanel() {
  const { profile, setProfile, clearProfile } = useSurferProfile();
  const [open, setOpen] = useState(false);
  const draft: SurferProfile = profile ?? defaultProfile;

  const update = (patch: Partial<SurferProfile>) => {
    setProfile({ ...draft, ...patch });
  };

  const toggleBoard = (board: BoardType) => {
    const has = draft.boards.includes(board);
    update({
      boards: has ? draft.boards.filter((b) => b !== board) : [...draft.boards, board],
    });
  };

  const toggleMonth = (month: number) => {
    const months = draft.travelMonths ?? [];
    const next = months.includes(month)
      ? months.filter((m) => m !== month)
      : [...months, month].sort((a, b) => a - b);
    update(next.length > 0 ? { travelMonths: next } : { travelMonths: [] });
  };

  return (
    <section aria-labelledby="profile-heading" className="border-b border-sand-200 bg-sand-100">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <h2 id="profile-heading" className="text-sm text-ink-700">
          {profile ? (
            <>
              Ranking for{' '}
              <strong className="font-normal text-ink-900">
                {ABILITIES.find((a) => a.value === profile.ability)?.label.toLowerCase()} surfer
              </strong>
              {profile.travelMonths?.length
                ? `, travelling ${profile.travelMonths.map((m) => MONTH_LABELS[m - 1]).join(', ')}`
                : ''}
            </>
          ) : (
            'Tell us how you surf and we will rank everything for you.'
          )}
        </h2>

        <div className="flex items-center gap-4">
          {profile ? (
            <button
              type="button"
              onClick={clearProfile}
              className="text-xs text-ink-700 underline underline-offset-2 hover:text-ink-900"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="text-xs uppercase tracking-[0.14em] text-ocean-700 hover:text-ink-900"
          >
            {open ? 'Done' : profile ? 'Edit your surfing' : 'Set your surfing'}
          </button>
        </div>
      </div>

      {open ? (
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <div className="grid gap-8 border-t border-sand-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <fieldset>
              <legend className="text-[11px] uppercase tracking-[0.14em] text-ink-700">
                Ability
              </legend>
              <div className="mt-3 space-y-2">
                {ABILITIES.map((ability) => (
                  <label key={ability.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="ability"
                      value={ability.value}
                      checked={draft.ability === ability.value}
                      onChange={() => update({ ability: ability.value })}
                      className="accent-ocean-700"
                    />
                    {ability.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[11px] uppercase tracking-[0.14em] text-ink-700">
                What you ride
              </legend>
              <div className="mt-3 space-y-2">
                {BOARDS.map((board) => (
                  <label key={board.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={draft.boards.includes(board.value)}
                      onChange={() => toggleBoard(board.value)}
                      className="accent-ocean-700"
                    />
                    {board.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="crowd-tolerance"
                className="text-[11px] uppercase tracking-[0.14em] text-ink-700"
              >
                Crowd tolerance
              </label>
              <input
                id="crowd-tolerance"
                type="range"
                min={1}
                max={5}
                step={1}
                value={draft.crowdTolerance}
                onChange={(event) =>
                  update({
                    crowdTolerance: Number(event.target.value) as SurferProfile['crowdTolerance'],
                  })
                }
                className="mt-4 w-full accent-ocean-700"
              />
              <p className="mt-1 text-xs text-ink-700">
                {draft.crowdTolerance <= 2
                  ? 'You want it empty'
                  : draft.crowdTolerance >= 4
                    ? 'You can handle a pack'
                    : 'A few out is fine'}
              </p>

              <label
                htmlFor="preferred-direction"
                className="mt-6 block text-[11px] uppercase tracking-[0.14em] text-ink-700"
              >
                Preferred direction
              </label>
              <select
                id="preferred-direction"
                value={draft.preferredDirection}
                onChange={(event) =>
                  update({
                    preferredDirection: event.target
                      .value as SurferProfile['preferredDirection'],
                  })
                }
                className="mt-2 w-full border-b border-sand-200 bg-transparent py-2 text-sm text-ink-900 focus:border-ocean-500 focus:outline-none"
              >
                <option value="no-preference">No preference</option>
                <option value="left">Lefts</option>
                <option value="right">Rights</option>
              </select>
            </div>

            <fieldset>
              <legend className="text-[11px] uppercase tracking-[0.14em] text-ink-700">
                When you could travel
              </legend>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {MONTH_LABELS.map((label, index) => {
                  const month = index + 1;
                  const selected = draft.travelMonths?.includes(month) ?? false;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleMonth(month)}
                      className={[
                        'rounded-sm border px-2 py-1 text-xs transition-colors',
                        selected
                          ? 'border-ocean-700 bg-ocean-700 text-sand-50'
                          : 'border-sand-200 text-ink-700 hover:border-ocean-500',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-700">
                This is the signal that separates Bali from Ko Samui.
              </p>
            </fieldset>
          </div>
        </div>
      ) : null}
    </section>
  );
}
