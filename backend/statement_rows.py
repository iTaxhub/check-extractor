"""
Every cheque a bank statement says went out: {check_number, date, amount, page}.

Why not a regex over the flattened text: both statements print their cheque
table as two side-by-side column groups, so get_text() interleaves the cells
and cheques with no printed number shift every later pairing. Rows are rebuilt
from words with positions instead: bucket words into visual lines by y, split
each line at the page midline, and read one date + amount (+ number) per cell.

Only text inside a cheque section counts, which keeps deposits, ACH debits and
the daily-balance table out:

  Bank of America   "Checks" / "Checks - continued" ... "Total checks"
                    cells: date, optional check number ("*" = gap in the
                    sequence), negative amount. The first cheques have no number.
  Bank of the West  "Checks Cleared" / "Checks Cleared (continued)"
                    cells: check number, date, amount.
                    Fallback when that section is absent: "Account Activity"
                    lines "CHECK # 15036 $879.63 $33,207.50" (debit, balance).

Text layer first (source "text"). A statement page with no text layer is read
by Tesseract on the rendered page (source "ocr"); a statement page that still
yields nothing is offered to an AI callback (source "ai"). Chase "Check
Search Results" exports are images plus captions and carry no separate
statement table, so they yield no rows here: their captions live on the cheque
images (pdf_pages.py).
"""
import json
import os
import re

DATE_RE = re.compile(r"^\d{1,2}/\d{1,2}/\d{2,4}$")
AMOUNT_RE = re.compile(r"^-?\$?[\d,]+\.\d{2}$")
NUMBER_RE = re.compile(r"^\d{3,7}\*?$")
ACTIVITY_RE = re.compile(r"CHECK\s*#\s*(\d{3,7})", re.I)

BOFA = re.compile(r"^Checks(\s*-\s*continued)?$", re.I)
BOTW_CLEARED = re.compile(r"^Checks Cleared(\s*\(continued\))?$", re.I)
BOTW_ACTIVITY = re.compile(r"^Account Activity(\s*\(continued\))?$", re.I)
# One full-width table headed e.g. "Date paid Check # Payee Amount" (Kyriq demo).
SINGLE = re.compile(r"^Date\b.*\bCheck\s*(?:#|No\b|Number\b).*\bAmount$", re.I)
STOP = re.compile(
    r"^(Total checks|Total # of checks|Daily ledger balances|Daily Balances|"
    r"Overdraft and Returned Item Fees|Service fees|"
    r"(Withdrawals|Deposits) and other (debits|credits))",
    re.I,
)


def _lines(words, tol=3):
    """Words (x0, y0, x1, y1, text) grouped into visual lines, left to right."""
    out, cur, cur_y = [], [], None
    for w in sorted(words, key=lambda w: (w[1], w[0])):
        if cur and w[1] - cur_y > tol:
            out.append(sorted(cur, key=lambda w: w[0]))
            cur = []
        if not cur:
            cur_y = w[1]
        cur.append(w)
    if cur:
        out.append(sorted(cur, key=lambda w: w[0]))
    return out


def _iso(d):
    m, day, y = (int(x) for x in d.split("/"))
    return f"{2000 + y if y < 100 else y:04d}-{m:02d}-{day:02d}"


def _amount(a):
    return round(abs(float(a.replace("$", "").replace(",", ""))), 2)


def _cell(tokens, require_negative):
    date = next((t for t in tokens if DATE_RE.match(t)), None)
    amount = next((t for t in tokens if AMOUNT_RE.match(t)), None)
    if not date or not amount:
        return None
    if require_negative and not amount.startswith("-"):
        return None
    number = next((t for t in tokens if NUMBER_RE.match(t) and not DATE_RE.match(t)), None)
    return {
        "check_number": number.rstrip("*") if number else None,
        "date": _iso(date),
        "amount": _amount(amount),
    }


def parse_page(words, page_width):
    """(table_rows, activity_rows) found on one page, in reading order."""
    mid = page_width / 2
    mode = None
    table, activity = [], []
    for line in _lines(words):
        text = " ".join(w[4] for w in line).strip()
        if BOFA.match(text):
            mode = "bofa"
        elif BOTW_CLEARED.match(text):
            mode = "cleared"
        elif BOTW_ACTIVITY.match(text):
            mode = "activity"
        elif mode is None and SINGLE.match(text):
            mode = "single"
        elif STOP.match(text):
            mode = None
        elif mode == "single":
            cell = _cell([w[4] for w in line], require_negative=False)
            if cell:
                table.append(cell)
            else:
                mode = None        # first non-row line ends the table
        elif mode in ("bofa", "cleared"):
            for half in ([w[4] for w in line if w[0] < mid], [w[4] for w in line if w[0] >= mid]):
                cell = _cell(half, require_negative=(mode == "bofa"))
                if cell:
                    table.append(cell)
        elif mode == "activity":
            m = ACTIVITY_RE.search(text)
            if m:
                tokens = [w[4] for w in line]
                date = next((t for t in tokens if DATE_RE.match(t)), None)
                amount = next((t for t in tokens if AMOUNT_RE.match(t)), None)
                if date and amount:
                    activity.append({"check_number": m.group(1), "date": _iso(date), "amount": _amount(amount)})
    return table, activity


def words_from_image(image, page_width, page_height):
    """Tesseract words for a rendered page, scaled to PDF points so the same
    row logic applies. Returns [] if Tesseract is unavailable."""
    try:
        import pytesseract
    except ImportError:
        return []
    win = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.name == "nt" and os.path.exists(win):
        pytesseract.pytesseract.tesseract_cmd = win
    try:
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
    except Exception:
        return []
    sx, sy = page_width / image.width, page_height / image.height
    words = []
    for i, text in enumerate(data["text"]):
        text = (text or "").strip()
        if text and float(data["conf"][i]) >= 0:
            x, y, w, h = (data[k][i] for k in ("left", "top", "width", "height"))
            words.append((x * sx, y * sy, (x + w) * sx, (y + h) * sy, text))
    return words


AI_PROMPT = (
    "This is one page of a bank statement. List every cheque (check) that was paid "
    "from the account on this page. Answer with ONLY a JSON array, no prose, of objects "
    '{"check_number": string or null, "date": "YYYY-MM-DD", "amount": number, "payee": string or null}. '
    "Amounts are positive. Return [] if the page lists no cheques."
)


def parse_ai_rows(answer):
    """Rows from the model's reply, or [] if it is not the JSON we asked for."""
    if not answer:
        return []
    text = answer.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[text.find("["):] if "[" in text else text
    try:
        data = json.loads(text)
    except ValueError:
        return []
    rows = []
    for r in data if isinstance(data, list) else []:
        try:
            amount = round(abs(float(r["amount"])), 2)
        except (KeyError, TypeError, ValueError):
            continue
        number = str(r.get("check_number") or "").strip() or None
        date = str(r.get("date") or "")[:10]
        rows.append({
            "check_number": number,
            "date": date if re.match(r"^\d{4}-\d{2}-\d{2}$", date) else None,
            "amount": amount,
            "payee": (str(r["payee"]).strip() or None) if r.get("payee") else None,
        })
    return rows


def extract_rows(pages, page_kinds=None, render=None, ai=None):
    """Statement rows for the whole document.

    pages       pdf_pages.read() output
    page_kinds  page_kinds.classify_pages() output; statement pages with no text
                layer are OCRed and, if still empty, sent to `ai`
    render      render(page_index) -> PIL image, for the OCR path
    ai          ai(page_index) -> model reply text, for the last-resort path
    """
    table, activity = [], []          # (page_no, row, source)
    for p in pages:
        idx = p["index"]
        kind = (page_kinds[idx] if page_kinds and idx < len(page_kinds) else None)
        words, source = p["words"], "text"
        if not p["has_text"] and render is not None and kind in ("statement", "both"):
            words, source = words_from_image(render(idx), p["width"], p["height"]), "ocr"
        t, a = parse_page(words, p["width"])
        if not t and not a and kind in ("statement", "both") and ai is not None:
            ai_rows = parse_ai_rows(ai(idx))
            t, source = ai_rows, "ai"
        table += [(idx + 1, r, source) for r in t]
        activity += [(idx + 1, r, source) for r in a]

    chosen = table if table else activity
    rows, per_page = [], {}
    for page_no, r, source in chosen:
        n = per_page.get(page_no, 0)
        per_page[page_no] = n + 1
        rows.append({
            "page": page_no,
            "row_index": n,
            "check_number": r["check_number"],
            "date": r["date"],
            "amount": r["amount"],
            "payee": r.get("payee"),
            "source": source,
        })
    return rows


if __name__ == "__main__":
    import sys
    import pdf_pages
    for path in sys.argv[1:]:
        rows = extract_rows(pdf_pages.read(path))
        print(path, len(rows), "rows, total", round(sum(r["amount"] for r in rows), 2))
