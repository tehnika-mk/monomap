import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        background: #0b0b0d;
        font-family: 'Inter', system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #f2f2f4;
      }
      .mark {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 26px;
      }
      .name {
        font-size: 60px;
        font-weight: 600;
        letter-spacing: -0.02em;
      }
      .tag {
        font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
        font-size: 22px;
        color: #9a9aa3;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="mark">
      <svg width="66" height="66" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="8" fill="#6f9bff" />
        <circle cx="16" cy="16" r="4.5" fill="#0b0b0d" />
      </svg>
      <span class="name">MonoMap</span>
    </div>
    <div class="tag">One tool. Two workspaces. Zero bloat.</div>
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
const buffer = await page.screenshot({ path: 'static/og-image.png', type: 'png' });
await browser.close();
writeFileSync('static/og-image.png', buffer);
console.log('Wrote static/og-image.png');
