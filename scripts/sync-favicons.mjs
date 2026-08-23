import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const masterFavicons = [
  {
    source: path.join(repoRoot, "website", "favicon-light.png"),
    target: "favicon.png",
  },
  {
    source: path.join(repoRoot, "website", "favicon-dark.png"),
    target: "favicon-dark.png",
  },
];
const appNames = [
  "admin-shell",
  "agent-shell",
  "auth-trem",
  "booking-engine",
  "app-shell",
  "trevio-remote",
  "trevista-remote",
];

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = Buffer.from(type);
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  name.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return chunk;
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodePng(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("The master favicon is not a valid PNG.");
  }

  let offset = 8;
  let width;
  let height;
  let colorType;
  const compressedChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];

      if (bitDepth !== 8 || ![2, 6].includes(colorType) || interlace !== 0) {
        throw new Error("Expected a non-interlaced 8-bit RGB or RGBA PNG.");
      }
    } else if (type === "IDAT") {
      compressedChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const filtered = inflateSync(Buffer.concat(compressedChunks));
  const pixels = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (stride + 1);
    const outputOffset = y * stride;
    const filter = filtered[rowOffset];

    for (let x = 0; x < stride; x += 1) {
      const raw = filtered[rowOffset + x + 1];
      const left = x >= channels ? pixels[outputOffset + x - channels] : 0;
      const above = y > 0 ? pixels[outputOffset + x - stride] : 0;
      const upperLeft =
        y > 0 && x >= channels ? pixels[outputOffset + x - stride - channels] : 0;
      let value;

      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + above;
      else if (filter === 3) value = raw + Math.floor((left + above) / 2);
      else if (filter === 4) value = raw + paethPredictor(left, above, upperLeft);
      else throw new Error(`Unsupported PNG filter: ${filter}`);

      pixels[outputOffset + x] = value & 0xff;
    }
  }

  return { width, height, channels, pixels };
}

function roundedCornerAlpha(x, y, width, height, radius) {
  const centerX = x < radius ? radius : x >= width - radius ? width - radius : x;
  const centerY = y < radius ? radius : y >= height - radius ? height - radius : y;
  const distance = Math.hypot(x - centerX, y - centerY);
  return Math.max(0, Math.min(1, radius + 0.5 - distance));
}

function encodeRoundedPng(source) {
  const { width, height, channels, pixels } = decodePng(source);
  const radius = Math.round(Math.min(width, height) * 0.22);
  const scanlines = Buffer.alloc(height * (1 + width * 4));

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = (y * width + x) * channels;
      const outputOffset = rowOffset + 1 + x * 4;
      const originalAlpha = channels === 4 ? pixels[sourceOffset + 3] : 255;
      const cornerAlpha = roundedCornerAlpha(x + 0.5, y + 0.5, width, height, radius);

      scanlines[outputOffset] = pixels[sourceOffset];
      scanlines[outputOffset + 1] = pixels[sourceOffset + 1];
      scanlines[outputOffset + 2] = pixels[sourceOffset + 2];
      scanlines[outputOffset + 3] = Math.round(originalAlpha * cornerAlpha);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeDarkPng(source) {
  const { width, height, channels, pixels } = decodePng(source);
  const navy = [2, 9, 31];
  const light = [250, 251, 253];
  const scanlines = Buffer.alloc(height * (1 + width * 4));

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (1 + width * 4);
    scanlines[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      const sourceOffset = (y * width + x) * channels;
      const outputOffset = rowOffset + 1 + x * 4;
      const red = pixels[sourceOffset];
      const blue = pixels[sourceOffset + 2];
      const markStrength = Math.max(0, Math.min(1, (blue - red - 2) / 48));

      for (let channel = 0; channel < 3; channel += 1) {
        scanlines[outputOffset + channel] = Math.round(
          navy[channel] + (light[channel] - navy[channel]) * markStrength,
        );
      }
      scanlines[outputOffset + 3] = channels === 4 ? pixels[sourceOffset + 3] : 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

if (process.argv.includes("--round-master")) {
  const { source } = masterFavicons[0];
  const temporaryMaster = `${source}.tmp`;
  await writeFile(temporaryMaster, encodeRoundedPng(await readFile(source)));
  await rename(temporaryMaster, source);
}

const lightSource = await readFile(masterFavicons[0].source);
const darkTemporary = `${masterFavicons[1].source}.${process.pid}.tmp`;
await writeFile(darkTemporary, encodeDarkPng(lightSource));
await rename(darkTemporary, masterFavicons[1].source);

const requestedApp = process.argv.find(
  (argument) => appNames.includes(argument),
);
const appsToSync = requestedApp ? [requestedApp] : appNames;

for (const app of appsToSync) {
  const publicDirectory = path.join(repoRoot, "apps", app, "public");
  await mkdir(publicDirectory, { recursive: true });
  for (const favicon of masterFavicons) {
    await copyFile(favicon.source, path.join(publicDirectory, favicon.target));
  }
}

console.log(
  `Synced ${masterFavicons.length} theme favicons to ${appsToSync.length} app${appsToSync.length === 1 ? "" : "s"}.`,
);
