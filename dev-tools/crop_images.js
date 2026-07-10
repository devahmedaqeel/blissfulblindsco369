const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const galleryDir = path.join(__dirname, 'images', 'gallery');
const logoPath = path.join(__dirname, 'images', 'logo.png');

if (!fs.existsSync(logoPath)) {
  console.error('Logo file does not exist at: ' + logoPath);
  process.exit(1);
}

fs.readdir(galleryDir, async (err, files) => {
  if (err) {
    console.error('Error reading gallery directory:', err);
    return;
  }
  
  try {
    // Load the logo once and scale it
    const logo = await Jimp.read(logoPath);
    // Scale logo to width of 160px keeping aspect ratio
    logo.resize({ w: 160 }); // In Jimp v1, resize uses an options object: { w: 160, h: Jimp.AUTO } or just { w: 160 }
    
    for (const file of files) {
      if (file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const filePath = path.join(galleryDir, file);
        
        try {
          const image = await Jimp.read(filePath);
          const width = image.bitmap.width;
          const height = image.bitmap.height;
          
          // 1. Crop bottom 11.5% to remove the old "BlindsWorld" watermark
          const cropHeight = Math.floor(height * 0.12); 
          const newHeight = height - cropHeight;
          const croppedImage = image.crop({ x: 0, y: 0, w: width, h: newHeight }); // In Jimp v1, crop uses an options object: { x, y, w, h }
          
          // 2. Composite the new logo watermark onto the bottom center
          const watermarkX = Math.floor((width - logo.bitmap.width) / 2);
          const watermarkY = Math.floor(newHeight - logo.bitmap.height - 15); // 15px padding from bottom
          
          // Composite logo onto cropped image
          croppedImage.composite(logo, watermarkX, watermarkY);
          
          // Save the watermarked image
          await croppedImage.write(filePath); // In Jimp v1, write is direct to path
          console.log(`Successfully cropped and watermarked: ${file}`);
        } catch (err) {
          console.error(`Error processing ${file}:`, err);
        }
      }
    }
    console.log('All gallery images updated successfully!');
  } catch (err) {
    console.error('Failed to load/process logo:', err);
  }
});
