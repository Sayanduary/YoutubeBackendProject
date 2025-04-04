import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); 


import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath || !fs.existsSync(localFilePath)) {
      console.error('❌ File does not exist at path:', localFilePath);
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto'
    });

    console.log('✅ File uploaded to Cloudinary:', response.secure_url);
    
    // Remove local file after successful upload
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
  console.error("Cloudinary Upload Error:", error.message || error);
  if (fs.existsSync(localFilePath)) {
    fs.unlinkSync(localFilePath);
  }
  return null;
}

};

export { uploadOnCloudinary };
