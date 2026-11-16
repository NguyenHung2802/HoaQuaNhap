const multer = require('multer');
const cloudinary = require('../config/cloudinary');

/**
 * Using Memory Storage to handle files before uploading to Cloudinary
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit 5MB mỗi file
    fieldSize: 5 * 1024 * 1024 // Trường text (vd. content bài viết) tối đa 5MB, phòng bài cũ còn ảnh base64 nhúng sẵn
  }
});

/**
 * Helper to upload buffer to Cloudinary
 * @param {Buffer} buffer 
 * @param {string} folder 
 * @returns {Promise}
 */
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    // Stream thẳng buffer lên Cloudinary (không chuyển base64 -> tiết kiệm RAM trên VPS 1GB)
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('--- Cloudinary Upload Error: ', error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
