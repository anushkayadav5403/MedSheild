/**
 * Generates a static index.html for Firebase Hosting
 * by reading the built assets and building the correct HTML shell
 */
import { readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const assetsDir = 'dist/client/assets';
const files = readdirSync(assetsDir);

// Find the main JS bundle (starts with index- and ends with .js)
const mainJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
// Find the CSS bundle (starts with styles- or index- and ends with .css)
const cssFile = files.find(f => f.endsWith('.css'));

console.log('CSS:', cssFile || 'None found');
console.log('Main JS:', mainJs);

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0A1220" />
    <title>SENTINEL — National Pandemic Intelligence</title>
    <meta name="description" content="Real-time pandemic simulation, citizen health passports, hospital resource tracking, and offline crisis tools." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700;800&display=swap" rel="stylesheet" />
    ${cssFile ? `<link rel="stylesheet" href="/assets/${cssFile}" />` : ''}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/${mainJs}"></script>
  </body>
</html>`;

writeFileSync('dist/client/index.html', html);
console.log('✓ Generated dist/client/index.html');
