/**
 * Self-check for the app shells and navigation chrome (parcel B).
 *
 *   cd frontend && npx tsx scripts/check-shell-tokens.ts
 *
 * No test framework on purpose. The failure mode being guarded against is a
 * regression nobody notices in review: someone paints a shell surface with a
 * literal hex again (which makes the glass opaque, so it reads as grey and the
 * ambient mesh behind it disappears), or re-pins a sidebar to an arbitrary
 * pixel width so the aside and the main margin drift apart by a few pixels.
 *
 * Three hexes and two widths were removed to get here; this is what stops them
 * coming back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every surface parcel B owns. */
const OWNED = [
  'app/layout.tsx',
  'app/not-found.tsx',
  'app/qb-oauth-complete/page.tsx',
  'app/(app)/layout.tsx',
  'app/(admin)/layout.tsx',
  'app/(auth)/layout.tsx',
  'components/CompanySwitcher.tsx',
  'components/ShellTopBar.tsx',
  'components/AccountSwitcher.tsx',
  'components/UserProfile.tsx',
  'components/SuperAdminLink.tsx',
  'components/LogoutButton.tsx',
];

/** Both shells, which must agree on one width token. */
/**
 * Shells that pin a sidebar width and offset the main column by the same
 * amount. These two numbers drifting apart is the regression being guarded.
 *
 * `app/(admin)/layout.tsx` is deliberately NOT here any more. The admin console
 * was ported to admin-kit and is now a flex row with a COLLAPSIBLE nav, so
 * there is no fixed offset to keep in step — the layout guarantees it
 * structurally, and demanding `md:ml-60` of it asserted an architecture that no
 * longer exists. Its nav width is checked below instead.
 */
const SHELLS = ['app/(app)/layout.tsx'];

/** The admin nav still has to use the shared token rather than a pixel value. */
const ADMIN_NAV = 'components/admin-kit/components/SideNav.tsx';

const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');

/* --- No hardcoded colour anywhere in parcel B ---------------------------- */
// Deliberately matches `#abc`, `#aabbcc` and `#aabbccdd` in any context —
// className, inline style or raw CSS. Colour belongs to the token file.
const HEX = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3}(?:[0-9a-fA-F]{2})?)?\b/g;

for (const rel of OWNED) {
  const found = read(rel).match(HEX);
  assert.equal(
    found,
    null,
    `${rel} has hardcoded colour(s) ${JSON.stringify(found)} — use a token from tailwind.config.js`
  );
}
console.log(`  ok  ${OWNED.length} parcel-B files carry no hardcoded hex`);

/* --- One sidebar width, expressed as a spacing token -------------------- */
// The two shells used to be 220px and 240px. They are now one token, and the
// aside width must equal the main offset or content sits under the chrome.
const ARBITRARY_WIDTH = /\b(?:w|min-w|max-w|ml|mr|left|right|inset|basis)-\[[^\]]*(?:px|rem|em|%)\]/g;

for (const rel of SHELLS) {
  const src = read(rel);
  const bad = src.match(ARBITRARY_WIDTH);
  assert.equal(
    bad,
    null,
    `${rel} re-introduced a fixed layout width ${JSON.stringify(bad)} — use the spacing scale`
  );
  assert.match(src, /\bw-60\b/, `${rel} lost the shared shell width token (w-60)`);
  assert.match(src, /\bmd:ml-60\b/, `${rel} main offset no longer matches the shell width`);
}

// The admin nav sets its own width (it collapses), so it is checked for the
// token rather than for an offset it does not have.
{
  const nav = read(ADMIN_NAV);
  assert.equal(
    nav.match(ARBITRARY_WIDTH),
    null,
    `${ADMIN_NAV} pinned the nav to a pixel width — use the spacing scale`
  );
  assert.match(nav, /\bw-60\b/, `${ADMIN_NAV} lost the shared shell width token (w-60)`);
}

console.log('  ok  app shell width and offset agree; admin nav uses the same token');

/* --- The shells stay transparent over the ambient mesh ------------------- */
// Glass over a flat page reads as a rendering bug, so a shell must not paint
// an opaque background of its own.
for (const rel of SHELLS) {
  const src = read(rel);
  assert.match(src, /\bglass-shell\b/, `${rel} is no longer the dark glass shell`);
  assert.doesNotMatch(
    src,
    /className="min-h-screen[^"]*\bbg-/,
    `${rel} paints its own page background — it must be transparent over the mesh`
  );
}
console.log('  ok  both shells are glass-shell and transparent over the mesh');

/* --- One scrollbar per page --------------------------------------------- */
// The shell must not wrap already-scrolling content in a second scroll box.
for (const rel of SHELLS) {
  assert.doesNotMatch(
    read(rel),
    /<main[^>]*\boverflow-(?:auto|y-auto|scroll)\b/,
    `${rel} <main> became a scroll container — that is the second scrollbar`
  );
}
console.log('  ok  neither shell wraps content in a second scroll container');

/* --- Overlays must escape the glass chrome ------------------------------ */
// `backdrop-filter` makes an element the containing block for every
// position:fixed descendant (so do transform, filter, perspective and contain).
// The app chrome carries backdrop-filter, so an overlay rendered from a
// component inside it stops resolving `fixed` against the viewport.
//
// Not theoretical. The Disconnect confirmation is rendered by CompanySwitcher,
// which lives inside ShellTopBar (.glass-chrome). Its `bottom-0` meant "the
// bottom of the 57px header", so the sheet grew UPWARD off the top of the
// screen and a destructive action had a confirmation nobody could read.
// Measured on the real component: an un-portalled fixed element in that header
// bottoms out at 56px; portalled, at 940px — the viewport edge.
{
  const dialog = read('components/ui/dialog.tsx');

  assert.match(
    dialog,
    /createPortal\(/,
    'components/ui/dialog.tsx no longer portals to <body> — a glass ancestor ' +
      '(backdrop-filter) will re-anchor position:fixed and push the panel off screen'
  );
  // Both overlays are position:fixed, so both need it — Sheet is the one that broke.
  assert.equal(
    (dialog.match(/createPortal\(/g) ?? []).length,
    2,
    'both Dialog and Sheet must portal; one of them lost its createPortal'
  );
  assert.match(
    dialog,
    /document\.body/,
    'components/ui/dialog.tsx portals somewhere other than document.body'
  );

  // The other half of "a dialog you can always reach": the centred container
  // overflows a too-tall panel equally above and below, and body scroll is
  // locked, so the top half is unrecoverable without a height bound.
  assert.match(
    dialog,
    /max-h-\[90vh\][^']*flex-col/,
    'the Dialog panel lost its max-h/flex-col — tall content will overflow above the viewport'
  );
  assert.match(
    dialog,
    /min-h-0 flex-1 overflow-y-auto/,
    'the Dialog body is no longer the scrolling region — the panel will grow past max-h instead'
  );
}
console.log('  ok  overlays portal to <body> and bound their own height');

console.log('\nall shell checks passed');
