"""Optional RunPod serverless OCR client. Enabled with USE_RUNPOD_OCR=true; key from RUNPOD_API_KEY."""
import base64, os, time
import requests

ENDPOINTS = {
    "numarkdown": os.getenv("RUNPOD_NUMARKDOWN_ENDPOINT_ID"),
    "paddleocr_vl": os.getenv("RUNPOD_PADDLEOCR_ENDPOINT_ID"),
}
_API = "https://api.runpod.ai/v2"


def enabled(engine):
    return os.getenv("USE_RUNPOD_OCR", "").lower() == "true" and bool(os.getenv("RUNPOD_API_KEY")) and bool(ENDPOINTS.get(engine))


def run_ocr(engine, img_path, timeout=1200):
    """Return the worker's markdown. Raises on HTTP/worker error so callers fall back.

    Submit with /run and poll /status. /runsync gives up after about 90 s and
    answers IN_QUEUE while a cold serverless worker is still starting, which
    this used to treat as a failure (258 of 260 calls on the first real run).
    """
    with open(img_path, "rb") as f:
        payload = {"input": {"image_b64": base64.b64encode(f.read()).decode()}}
    headers = {"Authorization": f"Bearer {os.environ['RUNPOD_API_KEY']}"}
    r = requests.post(f"{_API}/{ENDPOINTS[engine]}/run", json=payload, timeout=60, headers=headers)
    r.raise_for_status()
    job_id = r.json()["id"]
    deadline = time.time() + timeout
    while True:
        s = requests.get(f"{_API}/{ENDPOINTS[engine]}/status/{job_id}", timeout=60, headers=headers)
        s.raise_for_status()
        body = s.json()
        status = body.get("status")
        if status == "COMPLETED":
            return body["output"]["markdown"]
        if status in ("FAILED", "CANCELLED", "TIMED_OUT"):
            raise RuntimeError(f"RunPod {engine} status {status}: {body.get('error')}")
        if time.time() > deadline:
            raise RuntimeError(f"RunPod {engine} still {status} after {timeout}s")
        time.sleep(3)
