"""
Read what a PDF already knows about itself, before any pixel work.

Bank statements and bank "check search" exports are born-digital: every cheque
is an embedded raster image placed at a known rectangle, and the bank prints a
caption next to it (check number, amount, post date). The contour detector was
re-discovering those rectangles from rendered pixels and getting it wrong on
Chase pages (table cells, header strips, missed pages). This module reads the
rectangles and captions straight from the PDF so detection is exact and the
caption fields arrive with confidence 1.0.

Verified layouts (docs/testfiles):
  Chase   4 columns x 8 rows of ~120x55pt slots, front/back pairs, caption
          block ABOVE each pair: "Post date / Amount / $ 600.00" over the front
          and "Account / Check Number: 5320" over the back.
  BofA    2 columns x 5 rows, caption line ABOVE each image: "Amount: $..." or
          "Check number: N ! Amount: $...".
  BotW    2 columns x 6 rows, one caption block BELOW each row holding both
          columns: "#15017 #15019 $756.35 $798.37 06/11/2026 06/04/2026".

Scanned PDFs have no embedded cheque rects and no text; callers fall back to
the contour detector for those pages. Caption-less rects (adverts, logos) are
ignored for the same reason: a page only counts as "embedded cheques" when at
least one rect gets a caption with an amount, date or number, or, with no
captions at all, when the page's own text says it holds checks/cheques.
"""
import re

import pymupdf

MIN_IMAGE_PX = 300      # embedded image at least this wide, in its own pixels
MIN_RECT_PT = 90        # placed at least this wide on the page, in points
ASPECT = (1.5, 4.5)     # cheques are landscape; excludes logos and banners
ABOVE_PT, BELOW_PT = 45, 20   # how far a caption may sit from its image

DATE_RE = re.compile(r"\b(\d{1,2}/\d{1,2}/\d{2,4})\b")
AMOUNT_RE = re.compile(r"\$\s?(-?[\d,]+\.\d{2})")
CHEQUE_PAGE_RE = re.compile(r"\bche(?:ck|que)s?\b", re.I)
NUMBER_RE = re.compile(r"(?:check\s*(?:number|no\.?|nbr|#)\s*:?\s*#?|#)\s*(\d{3,7})", re.I)


def read(pdf_path):
    """One dict per page: text words with positions, candidate image rects."""
    pages = []
    with pymupdf.open(pdf_path) as doc:
        for idx, page in enumerate(doc):
            words = [(w[0], w[1], w[2], w[3], w[4]) for w in page.get_text("words")]
            rects = []
            for im in page.get_images(full=True):
                if im[2] < MIN_IMAGE_PX:
                    continue
                for r in page.get_image_rects(im[0]):
                    if r.width >= MIN_RECT_PT and ASPECT[0] <= r.width / max(r.height, 1) <= ASPECT[1]:
                        rects.append((r.x0, r.y0, r.x1, r.y1))
            pages.append({
                "index": idx,
                "width": page.rect.width,
                "height": page.rect.height,
                "has_text": any(w[4].strip() for w in words),
                "text": page.get_text(),
                "words": words,
                "image_rects": rects,
            })
    return pages


def parse_caption(text):
    """{'check_number','amount','date'} from caption text; None values when absent."""
    num = NUMBER_RE.search(text)
    amt = AMOUNT_RE.search(text)
    date = DATE_RE.search(text)
    number = num.group(1) if num else None
    if number and set(number) == {"0"}:   # Bank of the West prints #0000 for unknown
        number = None
    return {
        "check_number": number,
        "amount": float(amt.group(1).replace(",", "")) if amt else None,
        "date": date.group(1) if date else None,
    }


def _group_rows(rects, tol=5):
    rows = []
    for r in sorted(rects, key=lambda r: (r[1], r[0])):
        if rows and abs(rows[-1][0][1] - r[1]) <= tol:
            rows[-1].append(r)
        else:
            rows.append([r])
    return [sorted(row) for row in rows]


def bind_captions(page):
    """Return [(rect, caption)] for the page's cheque images, backs folded away.

    Captions sit above the images (Chase, BofA) or below them (BotW), and BofA
    prints them exactly midway between rows, so "nearest edge" is ambiguous.
    The page is bound twice, above-only and below-only, and the mode that
    captions more rects wins. Within a row a word goes to the right-most rect
    that starts at or before it. A rect whose caption carries no amount is a
    back (Chase prints the check number over the back slot): its caption is
    folded into the rect on its left and the rect is dropped. Rects that end up
    with an empty caption are dropped too. Empty list = no embedded cheques here.
    """
    rows = _group_rows(page["image_rects"])
    if not rows:
        return []
    above, below = _bind(page, rows, "above"), _bind(page, rows, "below")
    return above if len(above) >= len(below) else below


def _bind(page, rows, mode):
    def inside(w, r):
        return r[0] <= (w[0] + w[2]) / 2 <= r[2] and r[1] <= (w[1] + w[3]) / 2 <= r[3]

    texts = [["" for _ in row] for row in rows]
    for w in page["words"]:
        if any(inside(w, r) for row in rows for r in row):
            continue
        cy = (w[1] + w[3]) / 2
        best, best_d = None, None
        for ri, row in enumerate(rows):
            top, bottom = min(r[1] for r in row), max(r[3] for r in row)
            if mode == "above" and cy < top and top - cy <= ABOVE_PT:
                d = top - cy
            elif mode == "below" and cy > bottom and cy - bottom <= BELOW_PT:
                d = cy - bottom
            else:
                continue
            if best_d is None or d < best_d:
                best, best_d = ri, d
        if best is None:
            continue
        row = rows[best]
        ci = max((i for i, r in enumerate(row) if r[0] <= w[0] + 3), default=0)
        texts[best][ci] += w[4] + " "

    out = []
    for row, row_text in zip(rows, texts):
        caps = [parse_caption(t) for t in row_text]
        keep = []
        for rect, cap in zip(row, caps):
            if cap["amount"] is None and keep and any(cap.values()):
                prev = keep[-1][1]
                for k, v in cap.items():
                    prev[k] = prev[k] if prev[k] is not None else v
                continue
            if any(cap.values()):
                keep.append((rect, cap))
        out.extend(keep)
    return out


def _uniform_cheques(rects):
    """Two or more same-size, cheque-shaped images: a sheet of scanned cheques
    even when the page text never says "check" (e.g. "SYNTHETIC TEST DATA")."""
    ws = [r[2] - r[0] for r in rects]
    hs = [r[3] - r[1] for r in rects]
    same = max(ws) <= 1.1 * min(ws) and max(hs) <= 1.1 * min(hs)
    return same and all(2.0 <= w / max(h, 1) <= 3.2 for w, h in zip(ws, hs))


def cheque_boxes(page, px_width, px_height):
    """Pixel boxes + captions for a rendered page of px_width x px_height.

    Returns ([], []) when the page has no captioned embedded cheques, so the
    caller can run the contour detector instead.
    """
    bound = bind_captions(page)
    rects = page["image_rects"]
    if not bound and len(rects) >= 2 and (CHEQUE_PAGE_RE.search(page["text"]) or _uniform_cheques(rects)):
        # Caption-less layout (the cheque image carries every field, e.g. the
        # Kyriq demo statement): the rects are still exact; OCR reads the fields.
        # ponytail: a lone image is a bank banner (BofA/BotW page 1), so a page
        # with a single caption-less cheque is missed; tighten if one shows up.
        bound = [(r, None) for r in sorted(page["image_rects"], key=lambda r: (r[1], r[0]))]
    if not bound:
        return [], []
    sx, sy = px_width / page["width"], px_height / page["height"]
    boxes = [(int(x0 * sx), int(y0 * sy), int(x1 * sx), int(y1 * sy)) for (x0, y0, x1, y1), _ in bound]
    return boxes, [cap for _, cap in bound]


if __name__ == "__main__":
    import sys
    for path in sys.argv[1:]:
        print(path)
        for p in read(path):
            b = bind_captions(p)
            if b or p["image_rects"]:
                print(f"  p{p['index'] + 1}: rects={len(p['image_rects'])} cheques={len(b)}",
                      [c for _, c in b[:2]])
