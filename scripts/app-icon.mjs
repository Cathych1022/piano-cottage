import sharp from 'sharp';
// Rasterize the existing vector app icon; iOS supplies the outer icon mask.
await sharp('icon.svg', { density: 144 })
  .resize(1024, 1024).flatten({ background: '#f8e8c7' })
  .png().toFile('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
console.log('Generated the iOS icon from the existing Piano Cottage SVG.');
