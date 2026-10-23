"""
Self-check for reconcile_rows: statement rows against the cheque images of the
same PDF, for the two real statements in docs/testfiles, plus small synthetic
cases for the unmatched lists.

    python -I backend/check_reconcile_rows.py [docs/testfiles]
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import pdf_pages  # noqa: E402
import reconcile_rows as rr  # noqa: E402
import statement_rows as sr  # noqa: E402

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parents[1] / "docs" / "testfiles")


def run(name):
    pages = pdf_pages.read(str(root / name))
    rows = sr.extract_rows(pages)
    images = []
    for p in pages:
        for _, cap in pdf_pages.bind_captions(p):
            images.append(rr.image_from_check({"check_id": f"c{len(images):04d}", "caption": cap}))
    return rows, images, rr.reconcile(rows, images)


# Both statements: every listed cheque has its image and every image is listed.
for name, expected in (("3117 June.pdf", 339), ("9440 June.pdf", 227)):
    rows, images, res = run(name)
    s = rr.summary(res, len(rows), len(images))
    assert s["rows"] == s["images"] == s["matched"] == expected, (name, s)
    assert not res["unmatched_rows"] and not res["unmatched_images"], (name, s)
    ids = [m["check_id"] for m in res["matches"]]
    assert len(set(ids)) == len(ids), "an image was used twice"

# Bank of the West's unnumbered cheque (#0000) must pair on amount and date.
rows, images, res = run("9440 June.pdf")
unnumbered = next(r for r in rows if r["check_number"] is None)
m = next(m for m in res["matches"] if (m["page"], m["row_index"]) == (unnumbered["page"], unnumbered["row_index"]))
# No number to compare, so it can earn at most amount (40) + date (15) of 85 = 65.
assert m["how"] == "amount+date" and m["score"] == 65, m

# Bank of America: numbered cheques pair exactly; the first, unnumbered ones by amount.
rows, images, res = run("3117 June.pdf")
how = {m["how"] for m in res["matches"]}
assert how == {"number+amount", "amount+date"}, how
assert sum(1 for m in res["matches"] if m["how"] == "amount+date") <= 20

# Synthetic: a missing image and a stray image surface in the right lists.
rows = [
    {"page": 1, "row_index": 0, "check_number": "1001", "date": "2026-06-01", "amount": 100.0},
    {"page": 1, "row_index": 1, "check_number": "1002", "date": "2026-06-02", "amount": 200.0},
    {"page": 1, "row_index": 2, "check_number": None, "date": "2026-06-03", "amount": 300.0},
]
images = [
    {"check_id": "a", "number": "1001", "amount": 100.0, "date": rr._to_date("06/01/2026")},
    {"check_id": "z", "number": "9999", "amount": 555.0, "date": None},          # not on the statement
    {"check_id": "c", "number": None, "amount": 300.0, "date": rr._to_date("06/04/2026")},
]
res = rr.reconcile(rows, images)
assert [r["check_number"] for r in res["unmatched_rows"]] == ["1002"]            # no image for 1002
assert [i["check_id"] for i in res["unmatched_images"]] == ["z"]
assert {m["check_id"]: m["how"] for m in res["matches"]} == {"a": "number+amount", "c": "amount+date"}

# Same number, different amount: not a match (a re-used number on another cheque).
res = rr.reconcile([rows[0]], [{"check_id": "x", "number": "1001", "amount": 101.0, "date": None}])
assert res["matches"] == [] and len(res["unmatched_rows"]) == 1 and len(res["unmatched_images"]) == 1

# Two identical unnumbered cheques pair one-to-one, in order, and are not reused.
twin = [{"page": 1, "row_index": i, "check_number": None, "date": "2026-06-01", "amount": 840.0} for i in range(2)]
twin_imgs = [{"check_id": f"t{i}", "number": None, "amount": 840.0, "date": None} for i in range(2)]
res = rr.reconcile(twin, twin_imgs)
assert sorted(m["check_id"] for m in res["matches"]) == ["t0", "t1"]

# Captions with a cheque number the OCR fields lack, and vice versa.
img = rr.image_from_check({"check_id": "q", "caption": {"amount": 12.5}, "extraction": {
    "checkNumber": {"value": "4004"}, "checkDate": {"value": "06/05/2026"}}})
assert (img["number"], img["amount"], img["date"].isoformat()) == ("4004", 12.5, "2026-06-05")

print("check_reconcile_rows OK: BofA 339/339 and BotW 227/227 paired, unmatched lists correct")
