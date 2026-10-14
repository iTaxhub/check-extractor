"""
Build the Chrome Web Store promo tiles from the real brand art.

    python chrome-extension/store-assets/build_tiles.py

The store demands exact canvases and refuses anything else:
    small promo tile    440 x 280
    marquee promo tile 1400 x 560
Both must be JPEG or 24-BIT PNG with NO alpha channel. A transparent PNG is the
usual reason a tile upload is rejected, so these are composited onto an opaque
background and saved as RGB, never RGBA.

Pillow rather than a headless browser on purpose: the repo has no Playwright and
two static images are not worth a new dependency. The logo is the real
kyriq-logo-white.png, not a redraw.
"""
import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
LOGO = os.path.join(REPO, 'frontend', 'public', 'brand', 'kyriq-logo-white.png')

BRAND      = (99, 102, 241)    # #6366f1, the app's --brand
BRAND_DEEP = (67, 56, 202)     # #4338ca
INK        = (11, 16, 32)      # #0b1020, the shell ink

BOLD = 'C:/Windows/Fonts/segoeuib.ttf'
REG  = 'C:/Windows/Fonts/segoeui.ttf'


def gradient(w, h):
    """Radial brand wash from the top-left, matching the landing hero."""
    yy, xx = np.mgrid[0:h, 0:w]
    # Distance from a point just outside the top-left, normalised to the diagonal.
    d = np.sqrt(((xx - w * 0.12) / (w * 1.25)) ** 2 + ((yy - h * 0.0) / (h * 1.45)) ** 2)
    t = np.clip(d, 0, 1)[..., None]
    # Two-stop ramp: brand -> deep -> ink, so the corner does not go flat.
    a, b, c = (np.array(x, dtype=float) for x in (BRAND, BRAND_DEEP, INK))
    first  = a + (b - a) * np.clip(t / 0.48, 0, 1)
    second = b + (c - b) * np.clip((t - 0.48) / 0.52, 0, 1)
    img = np.where(t < 0.48, first, second)
    return Image.fromarray(img.astype(np.uint8), 'RGB')


def build(name, w, h, logo_w, title_px, sub_px, gap, title, sub):
    img = gradient(w, h)
    d = ImageDraw.Draw(img)

    logo = Image.open(LOGO).convert('RGBA')
    logo = logo.resize((logo_w, max(1, round(logo_w * logo.height / logo.width))), Image.LANCZOS)

    f_title = ImageFont.truetype(BOLD, title_px)
    f_sub = ImageFont.truetype(REG, sub_px)

    def line_h(f, s):
        bb = d.textbbox((0, 0), s, font=f)
        return bb[3] - bb[1]

    title_lines = title
    sub_lines = sub
    rule_h = 3
    block = (logo.height + gap + rule_h + gap
             + sum(line_h(f_title, t) + round(title_px * 0.30) for t in title_lines)
             + gap
             + sum(line_h(f_sub, s) + round(sub_px * 0.38) for s in sub_lines))
    y = (h - block) // 2

    img.paste(logo, ((w - logo.width) // 2, y), logo)
    y += logo.height + gap

    rw = round(w * 0.10)
    d.rounded_rectangle([(w - rw) // 2, y, (w + rw) // 2, y + rule_h], radius=2,
                        fill=(255, 255, 255, 140))
    y += rule_h + gap

    for t in title_lines:
        bb = d.textbbox((0, 0), t, font=f_title)
        d.text(((w - (bb[2] - bb[0])) // 2 - bb[0], y - bb[1]), t, font=f_title, fill=(255, 255, 255))
        y += (bb[3] - bb[1]) + round(title_px * 0.30)
    y += gap - round(title_px * 0.30)

    for s in sub_lines:
        bb = d.textbbox((0, 0), s, font=f_sub)
        d.text(((w - (bb[2] - bb[0])) // 2 - bb[0], y - bb[1]), s, font=f_sub, fill=(222, 226, 245))
        y += (bb[3] - bb[1]) + round(sub_px * 0.38)

    out = os.path.join(HERE, name)
    img.convert('RGB').save(out, 'PNG')          # RGB, so no alpha channel
    chk = Image.open(out)
    print(f'  {"ok " if chk.size == (w, h) and chk.mode == "RGB" else "BAD"}  {name}  '
          f'{chk.size[0]}x{chk.size[1]}  mode={chk.mode}')


build('small-promo-tile-440x280.png', 440, 280, 128, 19, 11, 10,
      ['Clear matched checks', 'without leaving QuickBooks'],
      ['Reconcile checks against QuickBooks Online.'])

build('marquee-promo-tile-1400x560.png', 1400, 560, 300, 50, 22, 24,
      ['Clear matched checks', 'without leaving QuickBooks'],
      ['Reconcile checks against QuickBooks Online, approve exact',
       'matches, and clear them in place.'])
