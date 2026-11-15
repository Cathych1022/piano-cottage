import { mkdir, readFile, writeFile, copyFile, readdir } from 'node:fs/promises';
import { resolve, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
// Explicit runtime files prevent packaging Git metadata, tests, tools or credentials.
const files = [
  'index.html', 'app.js', 'v7.js', 'i18n.js', 'cottage.js',
  'v7.css', 'cottage.css', 'mobile.css', 'storybook-details.css',
  'cottage-v15.css', 'dashboards-v18.css', 'manifest.webmanifest', 'icon.svg'
];
await mkdir(output, { recursive: true });
for (const file of files) await copyFile(resolve(root, file), resolve(output, file));
async function copyAssets(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const source = resolve(directory, item.name);
    if (item.isDirectory()) await copyAssets(source);
    else if (item.isFile() && /\.(png|webp|svg|woff2)$/.test(extname(source))) {
      const destination = resolve(output, relative(root, source));
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
    }
  }
}
await copyAssets(resolve(root, 'assets'));
const html = await readFile(resolve(output, 'index.html'), 'utf8');
if (!html.includes('<script src="i18n.js')) throw new Error('App script entry was not found');
await writeFile(resolve(output, 'index.html'), html.replace(
  '<script src="i18n.js', '<script src="native-bridge.js"></script>\n  <script src="i18n.js'
));
await build({
  entryPoints: [resolve(root, 'native/bridge.js')],
  outfile: resolve(output, 'native-bridge.js'),
  bundle: true, format: 'iife', target: 'safari15', minify: true
});
console.log('Packaged the approved web interface and iOS backup sharing in dist/.');
