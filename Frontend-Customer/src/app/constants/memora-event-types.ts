/** Slugs match `/pricing/:category/:country`; labels match organizer EventType strings. */
export const MEMORA_EVENT_TYPES: readonly { slug: string; label: string }[] = [
  { slug: 'birthday', label: 'Birthday' },
  { slug: 'puberty-ceremony', label: 'Puberty Ceremony' },
  { slug: 'wedding', label: 'Wedding' },
  { slug: 'anniversary', label: 'Anniversary' },
  { slug: 'obituary', label: 'Obituary' },
  { slug: 'remembrance', label: 'Remembrance' },
  { slug: 'other', label: 'Other' }
];

const KNOWN_SLUGS = new Set(MEMORA_EVENT_TYPES.map((x) => x.slug));

/** Human-readable title for pricing panel from API category slug. */
export function labelForPricingSlug(slug: string): string {
  const s = slug.trim().toLowerCase();
  const hit = MEMORA_EVENT_TYPES.find((x) => x.slug === s);
  if (hit) return hit.label;
  return slug.length ? slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase() : 'Event';
}

/**
 * Maps route param to pricing API slug (aligned with backend).
 * Legacy `/pricing/thankyou/...` is treated as `other`.
 */
export function normalizePricingSlugFromRoute(raw: string | null): string {
  let s = (raw?.trim() || 'obituary').toLowerCase().replace(/_/g, '-');
  if (s === 'thankyou') s = 'other';
  if (s === 'puberty' || s === 'pubertyceremony') s = 'puberty-ceremony';
  if (!KNOWN_SLUGS.has(s)) s = 'obituary';
  return s;
}
