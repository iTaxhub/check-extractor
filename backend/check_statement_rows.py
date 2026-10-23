"""
Self-check for statement_rows against the real statements in docs/testfiles.

    python -I backend/check_statement_rows.py [docs/testfiles]

The ground truth is the statement's own printed totals, read straight from its
text, not a number copied into this file:
  Bank of America  "Total checks -$290,721.82" and "Total # of checks 339"
  Bank of the West the "Account Activity" CHECK # lines, an independent listing
                   of the same cheques as the "Checks Cleared" table.
"""
import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import pdf_pages  # noqa: E402
import statement_rows as sr  # noqa: E402

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parents[1] / "docs" / "testfiles")


def rows_of(name, **kw):
    pages = pdf_pages.read(str(root / name))
    return pages, sr.extract_rows(pages, **kw)


# ── Bank of America: count and sum must equal what the statement prints ─────
pages, rows = rows_of("3117 June.pdf")
text = "\n".join(p["text"] for p in pages)
printed_total = float(re.search(r"Total checks\s*\n-\$([\d,]+\.\d{2})", text).group(1).replace(",", ""))
printed_count = int(re.search(r"Total # of checks\s*\n(\d+)", text).group(1))
total = round(sum(r["amount"] for r in rows), 2)
assert len(rows) == printed_count, f"BofA rows {len(rows)} != statement's {printed_count}"
assert total == printed_total, f"BofA sum {total} != statement's {printed_total}"
assert {r["page"] for r in rows} == {5, 6, 7, 8, 9}, {r["page"] for r in rows}
assert all(r["source"] == "text" and r["date"].startswith("2026-06-") for r in rows)
unnumbered = [r for r in rows if r["check_number"] is None]
assert unnumbered and all(r["page"] == 5 for r in unnumbered), "only the first cheques lack a number"
assert all(r["check_number"] is None or r["check_number"].isdigit() for r in rows)  # '*' stripped
assert ("34465", 2000.0) in {(r["check_number"], r["amount"]) for r in rows}

# ── Bank of the West: Checks Cleared must agree with Account Activity ───────
pages, rows = rows_of("9440 June.pdf")
# The table starts at the foot of page 7; the Daily Balances table on page 10 must not leak in.
assert rows and {r["page"] for r in rows} == {7, 8, 9}, {r["page"] for r in rows}
# Independent count: the statement carries one cheque image per cheque listed.
n_images = sum(len(pdf_pages.bind_captions(p)) for p in pages)
assert len(rows) == n_images == 227, (len(rows), n_images)
activity = []
for p in pages:
    activity += sr.parse_page(p["words"], p["width"])[1]
# The bank prints no number for one cheque (#0000 on its image); it has no
# activity line to compare, so it is checked on its own.
assert [(r["amount"], r["date"]) for r in rows if r["check_number"] is None] == [(756.35, "2026-06-11")]
cleared = Counter((r["check_number"], r["amount"]) for r in rows if r["check_number"])
listed = Counter((a["check_number"], a["amount"]) for a in activity)
assert cleared and listed
missing = listed - cleared          # on the activity list but not in the cleared table
extra = cleared - listed
assert not extra, f"cleared rows with no activity line: {sorted(extra)[:5]}"
assert sum(missing.values()) <= 0.05 * sum(listed.values()), f"{sum(missing.values())} activity cheques not in Checks Cleared"

# ── Chase exports have no separate statement table ──────────────────────────
for name in ("Apr Check Images.pdf", "Feb Check Images.pdf"):
    assert rows_of(name)[1] == [], name

# ── Parsers on small inputs ──────────────────────────────────────────────────
assert sr.parse_ai_rows('[{"check_number":"1001","date":"2026-06-03","amount":-45.5,"payee":"ACME"}]') == [
    {"check_number": "1001", "date": "2026-06-03", "amount": 45.5, "payee": "ACME"}]
assert sr.parse_ai_rows("not json") == [] and sr.parse_ai_rows(None) == []
assert sr._iso("6/3/26") == "2026-06-03" and sr._amount("-$1,417.00") == 1417.0

# ── OCR path: a rendered page, as if scanned, must give nearly the same rows ─
try:
    import pymupdf
    from PIL import Image
    import pytesseract  # noqa: F401
    doc = pymupdf.open(str(root / "3117 June.pdf"))
    pix = doc[4].get_pixmap(dpi=300)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    page = pdf_pages.read(str(root / "3117 June.pdf"))[4]
    ocr_words = sr.words_from_image(img, page["width"], page["height"])
    if ocr_words:
        t_rows = {(r["check_number"], r["amount"]) for r in sr.parse_page(page["words"], page["width"])[0]}
        o_rows = {(r["check_number"], r["amount"]) for r in sr.parse_page(ocr_words, page["width"])[0]}
        hit = len(t_rows & o_rows) / len(t_rows)
        assert hit >= 0.9, f"OCR recovered only {hit:.0%} of page 5 rows"
        ocr_note = f", OCR recovers {hit:.0%} of page 5"
    else:
        ocr_note = ", OCR skipped (Tesseract not available)"
except ImportError:
    ocr_note = ", OCR skipped (pymupdf/PIL/pytesseract missing)"

# Single full-width table (Kyriq demo statement): one row per line, ends at the first non-row line.
def _words(lines):
    return [(x * 60, y * 20, x * 60 + 50, y * 20 + 10, t) for y, line in enumerate(lines) for x, t in enumerate(line.split())]
single, _ = sr.parse_page(_words([
    "Date paid Check # Payee Amount",
    "06/01/2026 700013 Patricia $108.87",
    "06/05/2026 700001 James $160.18",
    "Check images follow.",
    "06/09/2026 700099 Stray $1.00",
]), 612)
assert [(r["check_number"], r["amount"]) for r in single] == [("700013", 108.87), ("700001", 160.18)], single

print(f"check_statement_rows OK: BofA {printed_count} rows = -${printed_total:,.2f}{ocr_note}")
