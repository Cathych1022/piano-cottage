const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('installed app uses bundled pages and requests no background audio capability',()=>{
 const config=JSON.parse(read('capacitor.config.json'));
 assert.equal(config.webDir,'dist');assert.equal(config.server?.url,undefined);
 const info=read('ios/App/App/Info.plist');
 assert.match(info,/NSMicrophoneUsageDescription/);
 assert.doesNotMatch(info,/UIBackgroundModes/);
 assert.match(read('ios/App/App.xcodeproj/project.pbxproj'),/PrivacyInfo.xcprivacy in Resources/);
});

test('native bundle includes every local HTML and CSS resource',()=>{
 const html=read('dist/index.html');
 assert.ok(html.indexOf('native-bridge.js')<html.indexOf('app.js'));
 assert.doesNotMatch(html,/localhost:8000|avatar-layout-preview/);
 const resources=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]);
 for(const file of fs.readdirSync(path.join(root,'dist')).filter(f=>f.endsWith('.css'))){
  for(const m of read('dist/'+file).matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))resources.push(m[1]);
 }
 for(const resource of resources){
  if(/^(data:|https?:)/.test(resource))continue;
  assert.ok(fs.existsSync(path.join(root,'dist',resource.split('?')[0])),resource+' missing from app bundle');
 }
 for(const unwanted of ['.git','node_modules','tests','sw.js'])assert.equal(fs.existsSync(path.join(root,'dist',unwanted)),false);
});

test('iOS packaging preserves the approved layout byte for byte',()=>{
 for(const f of ['cottage.js','mobile.css','dashboards-v18.css','cottage-v15.css','storybook-details.css']){
  assert.equal(read('dist/'+f),read(f),f+' changed during native packaging');
 }
});
