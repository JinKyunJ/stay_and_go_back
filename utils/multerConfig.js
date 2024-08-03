const multer = require('multer');

// Multer 메모리 저장소 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

module.exports = upload;