import { useDestinations, useProperties } from '@/data/queries';

/**
 * Photography credits.
 *
 * The licence on the seeded imagery requires attribution, and a grid of cards is the wrong
 * place to satisfy it — a credit under every thumbnail would wreck the layout and still be
 * missed. Detail pages credit their own images inline; this page is the complete list, so
 * every photographer is named somewhere a reader can actually find them.
 */
export function CreditsPage() {
  const destinations = useDestinations();
  const properties = useProperties();

  const images = [
    ...(destinations.data ?? []).map((destination) => ({
      ...destination.heroImage,
      context: destination.name,
    })),
    ...(properties.data ?? []).flatMap((property) =>
      property.images.map((image) => ({ ...image, context: property.title })),
    ),
  ];

  // One entry per photographer, listing what they shot.
  const byPhotographer = new Map<string, { creditUrl: string; contexts: Set<string> }>();
  for (const image of images) {
    const existing = byPhotographer.get(image.credit);
    if (existing) {
      existing.contexts.add(image.context);
    } else {
      byPhotographer.set(image.credit, {
        creditUrl: image.creditUrl,
        contexts: new Set([image.context]),
      });
    }
  }

  const photographers = [...byPhotographer.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-light tracking-tight text-ink-900">Photography</h1>
      <p className="mt-4 leading-relaxed text-ink-700">
        Every photograph on this site was made by someone else and used under licence. This
        page names all of them.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-700">
        The listings themselves are illustrative: prices, locations and ownership structures
        are modelled on genuine market research, but the properties are not real listings and
        the photography does not depict them.
      </p>

      {photographers.length > 0 ? (
        <ul className="mt-10 divide-y divide-sand-200 border-y border-sand-200">
          {photographers.map(([credit, entry]) => (
            <li key={credit} className="py-4">
              <a
                href={entry.creditUrl}
                className="text-ink-900 underline underline-offset-2 hover:text-ocean-700"
              >
                {credit}
              </a>
              <p className="mt-1 text-sm text-ink-700">
                {[...entry.contexts].slice(0, 3).join(', ')}
                {entry.contexts.size > 3 ? ` and ${entry.contexts.size - 3} more` : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-sm text-ink-700">Loading credits…</p>
      )}
    </main>
  );
}
