// Generates PNG icons matching the Kyriq K logo
// Run: node chrome-extension/icons/gen.js

const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── PNG helpers ──────────────────────────────────────────────
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
function createChunk(type, data) {
  const typeB = Buffer.from(type);
  const lenB  = Buffer.alloc(4); lenB.writeUInt32BE(data.length, 0);
  const crcB  = Buffer.alloc(4); crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([lenB, typeB, data, crcB]);
}

// ── Pixel helpers ────────────────────────────────────────────
function lerpColor(c1, c2, t) {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}
function setPixel(raw, size, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const idx = y * (1 + size * 4) + 1 + x * 4;
  raw[idx]     = rgb[0];
  raw[idx + 1] = rgb[1];
  raw[idx + 2] = rgb[2];
  raw[idx + 3] = a;
}

// Anti-aliased thick line using Wu's algorithm variant
function drawLine(raw, size, x0, y0, x1, y1, colFn, thickness) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len; // normal
  const half = thickness / 2;
  for (let s = 0; s <= len; s++) {
    const t = s / len;
    const cx = x0 + dx * t;
    const cy = y0 + dy * t;
    for (let w = -half - 1; w <= half + 1; w++) {
      const px = Math.round(cx + nx * w);
      const py = Math.round(cy + ny * w);
      const dist = Math.abs(w);
      const alpha = dist <= half ? 255 : Math.max(0, Math.round(255 * (half + 1 - dist)));
      if (alpha > 0) setPixel(raw, size, px, py, colFn(t), alpha);
    }
  }
}

// ── K logo renderer ──────────────────────────────────────────
// Matches SVG: viewBox 0 0 100 100
//   Background: #1a1a2e rounded rect rx=22%
//   Stem: rect x=22 y=20 w=11 h=60 rx=5.5 — gradient #10b981→#6366f1 top→bottom
//   Upper arm: line (33,50)→(68,20) #10b981
//   Lower arm: line (33,50)→(68,80) #6366f1
function makePNG(size) {
  const raw = new Array(size * (1 + size * 4)).fill(0);
  // PNG filter bytes
  for (let y = 0; y < size; y++) raw[y * (1 + size * 4)] = 0;

  const s = size / 100; // scale factor

  const GREEN  = [16,  185, 129]; // #10b981
  const INDIGO = [99,  102, 241]; // #6366f1
  const BG     = [26,  26,  46];  // #1a1a2e

  // 1. Draw rounded-rect background
  const rx = 22 * s;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = true;
      if (x < rx && y < rx)                       inside = Math.hypot(x - rx, y - rx) <= rx;
      else if (x > size - rx && y < rx)           inside = Math.hypot(x - (size - rx), y - rx) <= rx;
      else if (x < rx && y > size - rx)           inside = Math.hypot(x - rx, y - (size - rx)) <= rx;
      else if (x > size - rx && y > size - rx)    inside = Math.hypot(x - (size - rx), y - (size - rx)) <= rx;
      if (inside) setPixel(raw, size, x, y, BG);
    }
  }

  // 2. Draw vertical stem (rect x=22 y=20 w=11 h=60)
  const stemX1 = 22 * s, stemX2 = 33 * s;
  const stemY1 = 20 * s, stemY2 = 80 * s;
  const stemRx  = 5.5 * s;
  for (let y = Math.floor(stemY1); y <= Math.ceil(stemY2); y++) {
    for (let x = Math.floor(stemX1); x <= Math.ceil(stemX2); x++) {
      const ly = y - stemY1, ry = stemY2 - y;
      const lx = x - stemX1, rx2 = stemX2 - x;
      let inStem = true;
      if (lx < stemRx && ly < stemRx) inStem = Math.hypot(lx - stemRx, ly - stemRx) <= stemRx;
      else if (rx2 < stemRx && ly < stemRx) inStem = Math.hypot(rx2 - stemRx, ly - stemRx) <= stemRx;
      else if (lx < stemRx && ry < stemRx) inStem = Math.hypot(lx - stemRx, ry - stemRx) <= stemRx;
      else if (rx2 < stemRx && ry < stemRx) inStem = Math.hypot(rx2 - stemRx, ry - stemRx) <= stemRx;
      if (inStem) {
        const t = (y - stemY1) / (stemY2 - stemY1);
        setPixel(raw, size, Math.round(x), Math.round(y), lerpColor(GREEN, INDIGO, t));
      }
    }
  }

  // 3. Draw upper arm: (33,50)→(68,20) — green
  const thick = Math.max(2, 11 * s);
  drawLine(raw, size, 33 * s, 50 * s, 68 * s, 20 * s, () => GREEN,  thick);

  // 4. Draw lower arm: (33,50)→(68,80) — indigo
  drawLine(raw, size, 33 * s, 50 * s, 68 * s, 80 * s, () => INDIGO, thick);

  // ── Build PNG ──
  const rawBuf    = Buffer.from(raw);
  const compressed = zlib.deflateSync(rawBuf);
  const sig        = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr       = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
  return Buffer.concat([sig, createChunk('IHDR', ihdr), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))]);
}

[16, 32, 48, 128].forEach(size => {
  const png = makePNG(size);
  const outPath = path.join(__dirname, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created icon${size}.png (${png.length} bytes)`);
});
