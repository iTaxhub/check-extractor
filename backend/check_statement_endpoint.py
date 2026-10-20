"""
Self-check for GET /api/jobs/{id}/statement-rows through FastAPI's test client.

    python backend/check_statement_endpoint.py [docs/testfiles]

A Bank of America job held in memory with no database and auth off, one cheque
image removed and one stray image added. The endpoint must report exactly that:
one statement row with no image, one image the statement does not list, and
must keep the rows out of the plain job payload.
"""
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
for key in ("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_KEY", "REQUIRE_AUTH"):
    os.environ.pop(key, None)            # in-memory path only: never touch a real database
sys.path.insert(0, str(HERE))
os.chdir(HERE)

import pdf_pages  # noqa: E402
import statement_rows as sr  # noqa: E402
import api_server  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

root = Path(sys.argv[1] if len(sys.argv) > 1 else HERE.parent / "docs" / "testfiles")
pages = pdf_pages.read(str(root / "3117 June.pdf"))
rows = sr.extract_rows(pages)
checks = []
for p in pages:
    for _, cap in pdf_pages.bind_captions(p):
        checks.append({"check_id": f"check_{len(checks) + 1:04d}", "page": p["index"] + 1, "caption": cap})
dropped = checks.pop(100)               # an image we never received
checks.append({"check_id": "check_9999", "page": 99,
               "caption": {"check_number": "99999", "amount": 12.34, "date": None}})   # not on the statement

api_server.jobs["t1"] = {"job_id": "t1", "tenant_id": None, "status": "analyzed", "checks": checks, "_statement_rows": rows}
client = TestClient(api_server.app)
resp = client.get("/api/jobs/t1/statement-rows")
body = resp.json()
assert resp.status_code == 200
assert body["summary"] == {"rows": 339, "images": 339, "matched": 338,
                           "rows_without_image": 1, "images_without_row": 1}, body["summary"]
assert body["unmatched_rows"][0]["amount"] == dropped["caption"]["amount"]
assert body["unmatched_images"][0]["check_id"] == "check_9999"
assert all("matched_check_id" in r for r in body["rows"])
payload = api_server.get_job("t1")
assert "statement_rows" not in payload and "_statement_rows" not in payload   # not in every job poll
assert client.get("/api/jobs/nope/statement-rows").status_code == 404
print("check_statement_endpoint OK: 339 rows, 1 without an image, 1 image not on the statement")
