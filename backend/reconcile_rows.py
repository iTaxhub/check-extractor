"""
Pair each cheque the statement lists with the cheque image on the same job.

    statement row   {page, row_index, check_number, date, amount}
    cheque image    {check_id, check_number, amount, date}   (from the bank's
                    printed caption, or OCR fields when there is no caption)

Result: matches, plus the two lists that matter to a bookkeeper:
  unmatched_rows    the statement lists a cheque we have no image for
  unmatched_images  we hold an image the statement does not list

Passes, strictest first. Each takes the best candidate and uses it once.
  1. number + amount equal                    (exact; the usual case)
  2. amount equal, dates within 7 days, and the numbers do not contradict
     (either side may be blank: BofA prints none for its first cheques and
     Bank of the West prints #0000). Ties break on the closer date, then on
     statement order, which is also the order the images were printed in.
Score is the frontend's weights (frontend/lib/matching-algorithm.ts: amount 40,
number 30, date 15; payee 15 is absent here) rescaled to 0..100.
"""
from datetime import date as _date


def _to_date(value):
    """ISO yyyy-mm-dd or mm/dd/yy(yy) -> date, else None."""
    if not value:
        return None
    s = str(value).strip()
    try:
        if "-" in s[:5] or (len(s) >= 10 and s[4] == "-"):
            y, m, d = (int(x) for x in s[:10].split("-"))
        else:
            m, d, y = (int(x) for x in s.split("/"))
            y = 2000 + y if y < 100 else y
        return _date(y, m, d)
    except (ValueError, TypeError):
        return None


def _num(value):
    s = str(value).strip().rstrip("*") if value not in (None, "") else ""
    if not s or set(s) == {"0"}:
        return None
    return s.lstrip("0") or None


def _amount(value):
    if value in (None, ""):
        return None
    try:
        return round(abs(float(str(value).replace("$", "").replace(",", ""))), 2)
    except ValueError:
        return None


def _days(a, b):
    return abs((a - b).days) if a and b else None


def score(row, image):
    """0..100 from amount (40), number (30) and date (15) of 85 possible."""
    pts = 0
    if row["amount"] is not None and image["amount"] is not None:
        diff = abs(row["amount"] - image["amount"])
        pts += 40 if diff <= 0.005 else 38 if diff <= 0.01 else 25 if diff <= 1 else 0
    if row["number"] and image["number"] and row["number"] == image["number"]:
        pts += 30
    d = _days(row["date"], image["date"])
    if d is not None:
        pts += 15 if d == 0 else 12 if d <= 1 else 8 if d <= 3 else 4 if d <= 7 else 0
    elif row["date"] is None or image["date"] is None:
        pts += 15   # an absent date is not evidence against: judge on what is there
    return min(100, round(pts * 100 / 85))


def image_from_check(check):
    """Descriptor for a job check: the printed caption wins; OCR fields fill gaps."""
    cap = check.get("caption") or {}
    ext = check.get("extraction") or {}

    def field(name):
        f = ext.get(name)
        return f.get("value") if isinstance(f, dict) else None

    return {
        "check_id": check["check_id"],
        "number": _num(cap.get("check_number") or field("checkNumber")),
        "amount": _amount(cap.get("amount") if cap.get("amount") is not None else field("amount")),
        "date": _to_date(cap.get("date") or field("checkDate")),
    }


def reconcile(rows, images):
    """rows: statement rows (dicts as stored). images: image_from_check() dicts."""
    srows = [{
        "key": (r["page"], r["row_index"]),
        "number": _num(r.get("check_number")),
        "amount": _amount(r.get("amount")),
        "date": _to_date(r.get("date")),
        "order": i,
        "row": r,
    } for i, r in enumerate(rows)]
    imgs = [{**im, "order": i} for i, im in enumerate(images)]

    used_img, matches = set(), {}

    def take(r, im, how):
        used_img.add(im["check_id"])
        matches[r["key"]] = {"check_id": im["check_id"], "score": score(r, im), "how": how}

    # 1. number + amount
    by_number = {}
    for im in imgs:
        if im["number"]:
            by_number.setdefault(im["number"], []).append(im)
    for r in srows:
        if not r["number"]:
            continue
        cands = [im for im in by_number.get(r["number"], [])
                 if im["check_id"] not in used_img and im["amount"] == r["amount"]]
        if cands:
            take(r, min(cands, key=lambda im: (_days(r["date"], im["date"]) or 0, im["order"])), "number+amount")

    # 2. amount + date, numbers not in conflict
    for r in srows:
        if r["key"] in matches:
            continue
        cands = []
        for im in imgs:
            if im["check_id"] in used_img or im["amount"] != r["amount"]:
                continue
            if r["number"] and im["number"] and r["number"] != im["number"]:
                continue
            d = _days(r["date"], im["date"])
            if d is not None and d > 7:
                continue
            cands.append((d if d is not None else 99, abs(im["order"] - r["order"]), im))
        if cands:
            take(r, min(cands, key=lambda c: (c[0], c[1]))[2], "amount+date")

    unmatched_rows = [r["row"] for r in srows if r["key"] not in matches]
    unmatched_images = [im for im in imgs if im["check_id"] not in used_img]
    return {
        "matches": [{"page": k[0], "row_index": k[1], **v} for k, v in matches.items()],
        "unmatched_rows": unmatched_rows,
        "unmatched_images": [{k: v for k, v in im.items() if k != "order"} for im in unmatched_images],
    }


def summary(result, n_rows, n_images):
    return {
        "rows": n_rows,
        "images": n_images,
        "matched": len(result["matches"]),
        "rows_without_image": len(result["unmatched_rows"]),
        "images_without_row": len(result["unmatched_images"]),
    }
