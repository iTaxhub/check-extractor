"""
Self-check for pdf_pages + rect-based detection, against the four real files.

    python -I backend/check_pdf_detection.py [docs/testfiles]

Pure PDF reading (no OpenCV, no render), so it runs anywhere PyMuPDF does.
Fails loudly if embedded-cheque detection drifts on any of the three bank
layouts. The Chase cover page states "Checks displayed: N", which is the
ground truth the contour detector used to miss (45 found for 49).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import pdf_pages  # noqa: E402

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parents[1] / "docs" / "testfiles")


def counts(name):
    pages = pdf_pages.read(str(root / name))
    return pages, [len(pdf_pages.bind_captions(p)) for p in pages]


# Chase: one small front+back pair per cheque, caption above each pair.
for name, expected in (("Apr Check Images.pdf", [0, 16, 16, 16, 1]), ("Feb Check Images.pdf", [0, 16, 16, 16, 3])):
    pages, per_page = counts(name)
    assert per_page == expected, (name, per_page)
    # The count is a separate text object on the cover; find it by position.
    label = next(w for w in pages[0]["words"] if w[4] == "displayed:")
    stated = int(next(w[4] for w in pages[0]["words"]
                      if w[0] > label[2] and abs(w[1] - label[1]) < 8 and w[4].isdigit()))
    assert sum(per_page) == stated, (name, sum(per_page), stated)
    for p in pages[1:]:
        for _, cap in pdf_pages.bind_captions(p):
            assert cap["check_number"] and cap["amount"] and cap["date"], (name, p["index"] + 1, cap)

# Bank of America: 10 per image page, caption above; the first cheques carry
# no number on the statement either, so only amount is guaranteed.
pages, per_page = counts("3117 June.pdf")
assert per_page[:10] == [0] * 10, per_page[:10]          # statement pages, incl. the two adverts
assert per_page[10:43] == [10] * 33 and per_page[43] == 9, per_page[10:]
assert sum(per_page) == 339, sum(per_page)                 # equals the "Checks" table rows
assert all(cap["amount"] for p in pages[10:] for _, cap in pdf_pages.bind_captions(p))

# Bank of the West: 12 per image page, one caption block below each row.
pages, per_page = counts("9440 June.pdf")
assert per_page[:10] == [0] * 10 and per_page[29] == 0, per_page
assert per_page[10:29] == [12] * 18 + [11], per_page[10:29]
first = pdf_pages.bind_captions(pages[10])[0][1]
assert first == {"check_number": None, "amount": 756.35, "date": "06/11/2026"}, first  # "#0000" → None

# parse_caption edge cases
assert pdf_pages.parse_caption("Check number: 16958   !  Amount:  $988.02") == {"check_number": "16958", "amount": 988.02, "date": None}
assert pdf_pages.parse_caption("Account number: 4880 8532 3117 Amount: $840.00")["check_number"] is None
assert pdf_pages.parse_caption("Post date: 04/30/2026 Amount: $ 4500.00 Account: 710182002 Check Number: 5291") == {"check_number": "5291", "amount": 4500.0, "date": "04/30/2026"}

print("check_pdf_detection OK: Chase 49/51, BofA 339, BotW 227 captioned cheques")
