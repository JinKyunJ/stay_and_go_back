const CryptoJS = require('crypto-js');

// aes 128 복호화 함수
const decryptPassword = (encryptedPassword, key) => {
    const decrypting = CryptoJS.AES.decrypt(encryptedPassword, key);
    const decrypted = decrypting.toString(CryptoJS.enc.Utf8);
    return decrypted;
};

module.exports = decryptPassword;