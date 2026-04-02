const multer = require('multer');
const cloudinary = require('../config/cloudinary');

/**
 * Using Memory Storage to handle files before uploading to Cloudinary
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Limit 5MB
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
    // Chuyển buffer sang base64 Data URI để đảm bảo tính ổn định tối đa
    const fileBase64 = buffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${fileBase64}`;

    cloudinary.uploader.upload(
      dataUri,
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
  });
};

module.exports = {
  upload,
  uploadToCloudinary
};
