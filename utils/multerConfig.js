const multer = require('multer');

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = upload;