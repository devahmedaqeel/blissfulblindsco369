const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const galleryDir = path.join(__dirname, 'images', 'gallery');

fs.readdir(galleryDir, async (err, files) => {
  if (err) {
    console.error('Error reading gallery directory:', err);
    return;
  }
  
  try {
    for (const file of files) {
      if (file.endsWith('.webp') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const filePath = path.join(galleryDir, file);
        
        try {
          // Read the file into memory buffer to prevent file locks on Windows
          const fileBuffer = fs.readFileSync(filePath);
          
          const metadata = await sharp(fileBuffer).metadata();
          const width = metadata.width;
          const height = metadata.height;
          
          // Crop bottom 18% to guarantee the old logo and watermark are 100% removed
          const cropHeight = Math.floor(height * 0.18); 
          const newHeight = height - cropHeight;
          
          // Save the cropped image directly without overlaying any new watermark
          await sharp(fileBuffer)
            .extract({ left: 0, top: 0, width: width, height: newHeight })
            .toFile(filePath); 
          
          console.log(`Successfully cropped and removed watermark from: ${file}`);
        } catch (err) {
          console.error(`Error processing ${file}:`, err);
        }
      }
    }
    console.log('All gallery images cleaned and updated successfully!');
  } catch (err) {
    console.error('Failed to process gallery:', err);
  }
});
