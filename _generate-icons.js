const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SIZES = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-monochrome.png', size: 512 },
];

function svgContent(size, monochrome) {
  const pad = size * 0.12;
  const r = size * 0.22;
  const cx = size / 2;
  const cy = size / 2;
  const s = size - pad * 2;

  if (monochrome) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${r}" fill="#fff"/>
      <text x="${cx}" y="${cy + s * 0.15}" text-anchor="middle" dominant-baseline="central"
        font-family="'Syne',system-ui,sans-serif" font-weight="800" font-size="${s * 0.6}"
        fill="#050912">K</text>
    </svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7B68EE"/>
        <stop offset="100%" stop-color="#00E5FF"/>
      </linearGradient>
      <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
        <stop offset="50%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.08)"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="${size * 0.03}" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#shine)"/>
    <text x="${cx}" y="${cy + s * 0.15}" text-anchor="middle" dominant-baseline="central"
      font-family="'Syne',system-ui,sans-serif" font-weight="800" font-size="${s * 0.6}"
      fill="#fff" filter="url(#glow)">K</text>
  </svg>`;
}

async function generate() {
  const outDir = path.join(__dirname, 'assets', 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const { name, size } of SIZES) {
    const mono = name.includes('monochrome');
    const html = `<!DOCTYPE html><html><body style="margin:0;display:flex;background:transparent">
      ${svgContent(size, mono)}
    </body></html>`;

    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(html, { waitUntil: 'networkidle' });

    const filePath = path.join(outDir, name);
    await page.screenshot({ path: filePath, fullPage: true, omitBackground: true });
    await page.close();

    const stat = fs.statSync(filePath);
    console.log(`✓ ${name} (${size}x${size}) — ${(stat.size / 1024).toFixed(1)} KB`);
  }

  await browser.close();
  console.log('\nIcone generate in assets/icons/');
}

generate().catch(e => { console.error(e); process.exit(1); });
