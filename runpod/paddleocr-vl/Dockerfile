FROM paddlepaddle/paddle:3.2.0-gpu-cuda12.6-cudnn9.5
# OpenCV (pulled in by paddlex) needs libGL and glib at import time; the base image ships neither.
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir "paddleocr[doc-parser]" runpod
COPY handler.py /handler.py
CMD ["python", "-u", "/handler.py"]
