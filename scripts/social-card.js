// Renders the site hero to assets/social-card.png (1200x630 @2x) for og:image.
// Run from the app repo, which has Electron installed:
//   cd ../app && npx electron ../website/scripts/social-card.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const W = 1200;
const H = 630;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: W,
    height: H,
    frame: false,
    webPreferences: { offscreen: true, zoomFactor: 1 },
  });
  win.webContents.setFrameRate(1);
  await win.loadFile(path.join(__dirname, '..', 'index.html'));
  await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
  win.webContents.setZoomFactor(1);
  await new Promise((r) => setTimeout(r, 1200));
  const img = await win.webContents.capturePage({ x: 0, y: 0, width: W, height: H });
  const out = path.join(__dirname, '..', 'assets', 'social-card.png');
  fs.writeFileSync(out, img.toPNG());
  console.log('wrote', out, img.getSize());
  app.quit();
});
