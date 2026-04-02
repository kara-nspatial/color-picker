import './style.css';

// ─── DOM refs ────────────────────────────────────────────────────────────────
const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const resetBtn  = document.getElementById('reset-btn');
const result    = document.getElementById('result');
const preview   = document.getElementById('preview');
const swatches  = document.getElementById('swatches');
const copyCss   = document.getElementById('copy-css');
const canvas    = document.getElementById('canvas');
const ctx       = canvas.getContext('2d');

// ─── Color extraction ────────────────────────────────────────────────────────

const BUCKET_SIZE = 24;
function quantize(v) { return Math.floor(v / BUCKET_SIZE) * BUCKET_SIZE; }

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function extractPalette(imageData, maxColors = 5) {
  const { data, width, height } = imageData;
  const step = Math.max(1, Math.floor((width * height) / 10_000));
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] < 128) continue;
    const key = `${quantize(data[i])},${quantize(data[i+1])},${quantize(data[i+2])}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]);
  const palette = [];

  for (const [key, count] of sorted) {
    if (palette.length >= maxColors) break;
    const rgb = key.split(',').map(Number);
    if (!palette.some(({ rgb: c }) => colorDistance(c, rgb) < 80)) {
      palette.push({ rgb, count });
    }
  }

  const total = palette.reduce((s, p) => s + p.count, 0);
  return palette.map(({ rgb, count }) => ({
    hex: rgbToHex(...rgb),
    rgb,
    pct: Math.round((count / total) * 100),
  }));
}

// ─── Swatch rendering ────────────────────────────────────────────────────────

function contrastColor(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1d1d1f' : '#ffffff';
}

function renderSwatches(palette) {
  swatches.innerHTML = '';

  palette.forEach(({ hex, pct }, i) => {
    const fg = contrastColor(hex);
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.cssText = `--color:${hex};--fg:${fg};--i:${i}`;

    swatch.innerHTML = `
      <button class="swatch__color" type="button" aria-label="Copy color ${hex}">
        <span class="swatch__feedback">Copied!</span>
      </button>
      <div class="swatch__meta">
        <span class="swatch__hex">${hex}</span>
        <span class="swatch__pct">${pct}%</span>
      </div>
    `;

    swatch.querySelector('.swatch__color').addEventListener('click', async () => {
      await copyText(hex);
      swatch.classList.add('is-copied');
      setTimeout(() => swatch.classList.remove('is-copied'), 1400);
    });

    swatches.appendChild(swatch);
  });
}

// ─── CSS variables export ────────────────────────────────────────────────────

function buildCssVariables(palette) {
  const vars = palette.map(({ hex }, i) => `  --color-${i + 1}: ${hex};`).join('\n');
  return `:root {\n${vars}\n}`;
}

// ─── Clipboard ───────────────────────────────────────────────────────────────

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement('textarea'), {
      value: text,
      style: 'position:fixed;opacity:0',
    });
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

// ─── Copy CSS button ──────────────────────────────────────────────────────────

// Wrap the button's text node so we can swap it
const cssBtnLabel = document.createElement('span');
cssBtnLabel.className = 'btn-label';
cssBtnLabel.textContent = 'Copy as CSS Variables';
// Replace last text node with a span
const lastNode = [...copyCss.childNodes].findLast(n => n.nodeType === Node.TEXT_NODE);
if (lastNode) lastNode.replaceWith(cssBtnLabel);
else copyCss.append(cssBtnLabel);

let cssTimer;
copyCss.addEventListener('click', async () => {
  if (!currentPalette.length) return;
  await copyText(buildCssVariables(currentPalette));

  copyCss.classList.add('is-copied');
  cssBtnLabel.textContent = 'Copied to clipboard!';
  clearTimeout(cssTimer);
  cssTimer = setTimeout(() => {
    copyCss.classList.remove('is-copied');
    cssBtnLabel.textContent = 'Copy as CSS Variables';
  }, 2000);
});

// ─── Image processing ────────────────────────────────────────────────────────

let currentPalette = [];

function processImage(file) {
  if (!file?.type.startsWith('image/')) return;

  const url = URL.createObjectURL(file);
  const img = new Image();

  img.onload = () => {
    const MAX = 400;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    canvas.width  = Math.round(img.width  * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    currentPalette = extractPalette(ctx.getImageData(0, 0, canvas.width, canvas.height));

    preview.src = url;
    preview.onload = () => URL.revokeObjectURL(url);

    renderSwatches(currentPalette);

    result.hidden = false;
    dropZone.hidden = true;
  };

  img.src = url;
}

// ─── Reset ───────────────────────────────────────────────────────────────────

resetBtn.addEventListener('click', () => {
  result.hidden = true;
  dropZone.hidden = false;
  currentPalette = [];
  fileInput.value = '';
});

// ─── Drop zone events ────────────────────────────────────────────────────────

dropZone.addEventListener('click', (e) => {
  if (e.target !== browseBtn) fileInput.click();
});

browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

fileInput.addEventListener('change', () => {
  processImage(fileInput.files[0]);
  fileInput.value = '';
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('is-active');
});

dropZone.addEventListener('dragleave', (e) => {
  if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('is-active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('is-active');
  processImage(e.dataTransfer.files[0]);
});
