/* ============================================================================
   IMAGERY
   Real photographs, bundled from src/assets/images. They are imported rather
   than referenced by path so Vite rewrites the URLs at build time — which is
   what makes the site work when GitHub Pages serves it from /<repo>/ instead
   of the root.
   ========================================================================= */

const files = import.meta.glob('../../assets/images/*.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  byName[path.split('/').pop()!.replace('.jpg', '')] = url;
}

/**
 * `img('alcazar')` → the bundled URL for that photograph.
 * The width and height arguments are ignored; they remain so the mock data
 * still reads as a request for a particular size.
 */
export const img = (name: string, _w?: number, _h?: number): string => {
  const url = byName[name];
  if (!url && import.meta.env.DEV) console.warn(`[imagery] no image called "${name}"`);
  return url ?? '';
};
