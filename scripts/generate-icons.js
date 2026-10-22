import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a raw PNG buffer with RGBA pixels
function createPng(width, height, pixelFn) {
  // 1. PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // 2. IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // color type 6: RGBA
  ihdr.writeUInt8(0, 10); // compression method 0
  ihdr.writeUInt8(0, 11); // filter method 0
  ihdr.writeUInt8(0, 12); // interlace method 0

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // 3. Raw Scanlines (Filter byte 0 + RGBA per pixel)
  const rowBytes = width * 4;
  const scanlines = Buffer.alloc((1 + rowBytes) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + rowBytes);
    scanlines[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      scanlines[pixelOffset] = r;
      scanlines[pixelOffset + 1] = g;
      scanlines[pixelOffset + 2] = b;
      scanlines[pixelOffset + 3] = a;
    }
  }

  // 4. IDAT Chunk (zlib deflated scanlines)
  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressed);

  // 5. IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Pixel drawing function for OratoriaPro app icon
function renderOratoriaProIcon(x, y, w, h, isMaskable = false) {
  // Normalize coordinates (-1 to 1)
  const nx = (x / w) * 2 - 1;
  const ny = (y / h) * 2 - 1;

  // Background
  const distFromCenter = Math.sqrt(nx * nx + ny * ny);

  // Dark gradient background (#141419 to #070709)
  const bgGrad = (ny + 1) / 2;
  const rBg = Math.round(20 - 13 * bgGrad);
  const gBg = Math.round(20 - 13 * bgGrad);
  const bBg = Math.round(25 - 16 * bgGrad);

  // Squircle mask for standard icon; full bleed for maskable
  let insideCard = true;
  if (!isMaskable) {
    const p = 4;
    const corner = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);
    if (corner > 0.88) {
      insideCard = false;
    }
  }

  if (!insideCard) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Scale coordinates inside safe zone
  const scale = isMaskable ? 1.35 : 1.0;
  const sx = nx * scale;
  const sy = (ny - 0.05) * scale;
  const sDist = Math.sqrt(sx * sx + sy * sy);

  // Outer stopwatch ring: radius ~0.55, thickness ~0.07
  const ringRadius = 0.55;
  const ringDist = Math.abs(sDist - ringRadius);

  let r = rBg;
  let g = gBg;
  let b = bBg;

  // Outer border stroke on squircle
  if (!isMaskable) {
    const p = 4;
    const corner = Math.pow(Math.abs(nx), p) + Math.pow(Math.abs(ny), p);
    if (corner > 0.82 && corner <= 0.88) {
      return [38, 38, 43, 255];
    }
  }

  // Stopwatch dial ring (Blue glow gradient)
  if (ringDist < 0.045) {
    // Stopwatch progress arc (open at bottom-left)
    const angle = Math.atan2(sy, sx); // -PI to PI
    if (angle > -2.4 && angle < 1.8) {
      // Vivid glowing cyan/blue
      const t = (angle + 2.4) / 4.2;
      r = Math.round(59 + 37 * t);
      g = Math.round(130 + 35 * t);
      b = Math.round(246 + 4 * t);
      return [r, g, b, 255];
    } else {
      // Subtle track
      return [31, 36, 48, 255];
    }
  }

  // Stopwatch top button stem (nx: -0.06 to 0.06, ny: -0.68 to -0.56)
  if (Math.abs(sx) < 0.055 && sy < -0.55 && sy > -0.72) {
    return [59, 130, 246, 255];
  }
  // Stopwatch crown cap (nx: -0.12 to 0.12, ny: -0.75 to -0.71)
  if (Math.abs(sx) < 0.12 && sy <= -0.71 && sy > -0.76) {
    return [96, 165, 250, 255];
  }

  // Center Microphone Icon
  // Mic head: rounded rect (sx: -0.11 to 0.11, sy: -0.22 to 0.08)
  const inMicHead = Math.abs(sx) < 0.11 && sy >= -0.22 && sy <= 0.08;
  const inMicTopRound = Math.sqrt(sx * sx + (sy + 0.22) * (sy + 0.22)) < 0.11;
  const inMicBottomRound = Math.sqrt(sx * sx + (sy - 0.08) * (sy - 0.08)) < 0.11;

  if (inMicHead || inMicTopRound || inMicBottomRound) {
    // Metallic blue gradient
    const micT = (sy + 0.3) / 0.5;
    r = Math.round(96 - 37 * micT);
    g = Math.round(165 - 35 * micT);
    b = Math.round(250 - 4 * micT);
    return [r, g, b, 255];
  }

  // Mic U-shaped stand bracket (distance to arc)
  const standRadius = 0.18;
  const standDist = Math.abs(sDist - standRadius);
  if (standDist < 0.025 && sy > -0.05 && sy < 0.18) {
    return [96, 165, 250, 255];
  }

  // Mic stand vertical stem
  if (Math.abs(sx) < 0.022 && sy >= 0.18 && sy <= 0.28) {
    return [96, 165, 250, 255];
  }

  // Mic stand base
  if (Math.abs(sx) < 0.1 && sy > 0.28 && sy <= 0.32) {
    return [96, 165, 250, 255];
  }

  // Dial tick marks
  if (Math.abs(sx) < 0.015 && sy > -0.48 && sy < -0.42) return [96, 165, 250, 255];
  if (Math.abs(sy) < 0.015 && sx > 0.42 && sx < 0.48) return [96, 165, 250, 255];
  if (Math.abs(sx) < 0.015 && sy > 0.42 && sy < 0.48) return [71, 85, 105, 255];
  if (Math.abs(sy) < 0.015 && sx > -0.48 && sx < -0.42) return [71, 85, 105, 255];

  // Subtle glow around center
  if (sDist < 0.45) {
    const glow = Math.max(0, 1 - sDist / 0.45) * 0.18;
    r = Math.min(255, Math.round(r + 37 * glow));
    g = Math.min(255, Math.round(g + 99 * glow));
    b = Math.min(255, Math.round(b + 235 * glow));
  }

  return [r, g, b, 255];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate pwa-192x192.png
console.log('Generating pwa-192x192.png...');
const png192 = createPng(192, 192, (x, y, w, h) => renderOratoriaProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

// Generate pwa-512x512.png
console.log('Generating pwa-512x512.png...');
const png512 = createPng(512, 512, (x, y, w, h) => renderOratoriaProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

// Generate pwa-maskable-512x512.png
console.log('Generating pwa-maskable-512x512.png...');
const pngMaskable = createPng(512, 512, (x, y, w, h) => renderOratoriaProIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pngMaskable);

// Generate apple-touch-icon.png (180x180)
console.log('Generating apple-touch-icon.png...');
const pngApple = createPng(180, 180, (x, y, w, h) => renderOratoriaProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

// Generate favicon.ico (32x32 PNG inside standard ico header or standard 32x32)
console.log('Generating favicon.ico...');
const png32 = createPng(32, 32, (x, y, w, h) => renderOratoriaProIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), png32);

console.log('All PWA icons generated successfully!');
