const express = require('express');
const router = express.Router();
const multer = require('multer');
const basicFtp = require('basic-ftp');
const path = require('path');
require('dotenv').config();

// Configure multer for temporary storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
      return;
    }
    cb(null, true);
  }
});

// FTP client configuration
const ftpConfig = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASS,
  secure: true
};

// Helper function to upload file to FTP
async function uploadToFtp(localPath, remotePath) {
  const client = new basicFtp.Client();
  try {
    await client.access(ftpConfig);
    await client.uploadFrom(localPath, remotePath);
    return `${process.env.FTP_BASE_URL}/${remotePath}`;
  } catch (error) {
    console.error('FTP upload error:', error);
    throw new Error('Failed to upload file to FTP server');
  } finally {
    client.close();
  }
}

// Upload route
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = req.body.type; // 'product' or 'review'
    if (!type || !['product', 'review'].includes(type)) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }

    // Determine remote path based on type
    const timestamp = Date.now();
    const filename = `${type}-${timestamp}${path.extname(req.file.originalname)}`;
    const remotePath = `uploads/${type}s/${filename}`;

    // Upload to FTP
    const publicUrl = await uploadToFtp(req.file.path, remotePath);

    // Clean up temporary file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({ 
      success: true, 
      url: publicUrl 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

module.exports = router; 