"""
Build the Open Graph share card.

    python frontend/scripts/build-og-card.py

WHY THIS IS NOT ONE OF THE LANDING PNGs: social scrapers fetch the og:image URL
directly and never pass through Next's image optimiser, so whatever the metadata
names is downloaded at full size. Pointing og:image at the 4K landing art meant
handing scrapers a 5.79MB PNG - over X's 5MB cap, and far past the few hundred
KB WhatsApp will wait for, so the preview silently did not render at all.

1200x630 is the size every platform expects. JPEG because the art is
photographic and compresses an order of magnitude better than PNG there.
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, '..', 'public', 'landing')
SRC = os.path.join(PUB, 'match-review-dashboard-4k-v1.png')
OUT = os.path.join(PUB, 'og-card-1200x630.jpg')
TW, TH = 1200, 630

im = Image.open(SRC).convert('RGB')
# Cover-crop from the centre: the source is 16:9 and OG is ~1.91:1, so a plain
# resize would squash it.
scale = max(TW / im.width, TH / im.height)
im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
left, top = (im.width - TW) // 2, (im.height - TH) // 2
im = im.crop((left, top, left + TW, top + TH))
im.save(OUT, 'JPEG', quality=86, optimize=True, progressive=True)

kb = os.path.getsize(OUT) / 1024
assert im.size == (TW, TH), f'wrong canvas: {im.size}'
assert kb < 1024, f'{kb:.0f} KB is too heavy for a share card'
print(f'  ok  og-card-1200x630.jpg  {im.size[0]}x{im.size[1]}  {kb:.0f} KB')
