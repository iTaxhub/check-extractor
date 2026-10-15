"""
Compress the landing artwork, and drop the superseded versions.

    python frontend/scripts/compress-landing-art.py          # report only
    python frontend/scripts/compress-landing-art.py --apply  # rewrite files

WHY: the art arrived as 3840px PNGs totalling ~86MB, a third of it superseded
iterations nothing references. Visitors were never hurt by this — every image
goes through next/image, and the live hero serves as 56KB WebP — but the repo
carries the full weight forever, every deploy ships it, and the OG card had to
be built separately precisely because scrapers fetch raw files.

WHAT IT DOES
  * Converts each referenced PNG to WebP, capped at MAX_W.
  * Caps at 2560px rather than 3840. next/image never upscales past the source,
    so the only loss is on a full-bleed 4K display, and these are out-of-focus
    backdrops. Product shots get a higher quality setting because they show UI
    detail where softness is visible.
  * Deletes versions nothing references.

It does NOT touch public/brand — those are the brand SVGs, already small, and
vector.
"""
import os
import sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, '..', 'public', 'landing')
LANDING_TSX = os.path.join(HERE, '..', 'components', 'landing', 'LandingPage.tsx')

MAX_W = 2560

# Higher quality where the image shows product UI and softness would read as a
# rendering fault; lower where it is a blurred backdrop behind text.
DETAIL = {
    'quickbooks-extension-4k-v1.png',
    'statement-to-quickbooks-kyriq-v6.png',
    'kyriq-iq-characters-user-v1.png',
    'match-review-dashboard-4k-v1.png',
}

# Superseded by a later version that the code actually uses. Verified against a
# repo-wide scan of every .tsx/.ts/.css/.py/.md before being listed here.
SUPERSEDED = [
    'kyriq-iq-characters-4k-v1.png',       # -> kyriq-iq-characters-user-v1
    'kyriq-iq-characters-4k-v2.png',       # -> kyriq-iq-characters-user-v1
    'statement-to-quickbooks-4k-v1.png',   # -> statement-to-quickbooks-kyriq-v6
    'statement-to-quickbooks-kyriq-v5.png',# -> v6
    'statement-to-quickbooks-user-v1.png', # -> statement-to-quickbooks-kyriq-v6
]

apply = '--apply' in sys.argv
mb = lambda n: f'{n / 1048576:.2f} MB'

before = sum(os.path.getsize(os.path.join(ART, f)) for f in os.listdir(ART)
             if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))

print(f'{"":42s} {"before":>9s}  {"after":>9s}')
saved_total = 0
renames = {}

for f in sorted(os.listdir(ART)):
    if not f.lower().endswith('.png'):
        continue
    src = os.path.join(ART, f)
    if f in SUPERSEDED:
        s = os.path.getsize(src)
        print(f'  {f:40s} {mb(s):>9s}  {"DELETE":>9s}')
        saved_total += s
        if apply:
            os.remove(src)
        continue

    im = Image.open(src)
    s_before = os.path.getsize(src)
    if im.width > MAX_W:
        im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
    out_name = os.path.splitext(f)[0] + '.webp'
    out = os.path.join(ART, out_name)
    q = 88 if f in DETAIL else 80
    im.convert('RGB').save(out, 'WEBP', quality=q, method=6)
    s_after = os.path.getsize(out)
    saved_total += s_before - s_after
    renames[f] = out_name
    print(f'  {f:40s} {mb(s_before):>9s}  {mb(s_after):>9s}   q={q} {im.width}px')
    if apply:
        os.remove(src)
    else:
        os.remove(out)   # report-only: leave the tree untouched

if apply and renames:
    src_tsx = open(LANDING_TSX, encoding='utf-8').read()
    for old, new in renames.items():
        src_tsx = src_tsx.replace(old, new)
    open(LANDING_TSX, 'w', encoding='utf-8', newline='\n').write(src_tsx)
    print(f'\n  rewrote {len(renames)} reference(s) in LandingPage.tsx')

    # The OG card is built from one of these; keep its source name in step.
    og = os.path.join(HERE, 'build-og-card.py')
    s_og = open(og, encoding='utf-8').read()
    for old, new in renames.items():
        s_og = s_og.replace(old, new)
    open(og, 'w', encoding='utf-8', newline='\n').write(s_og)
    print('  repointed build-og-card.py at the compressed source')

after = before - saved_total
print(f'\n  total {mb(before)} -> {mb(after)}   saved {mb(saved_total)} '
      f'({saved_total / before * 100:.0f}%)')
if not apply:
    print('\n  report only. re-run with --apply to write.')
