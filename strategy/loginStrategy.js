const LocalStrategy = require('passport-local').Strategy;
const {User} = require('../models');
// sha256 단방향 해시 비밀번호 사용
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

// id 필드와 password 필드 정의
const config = {
    usernameField: 'email',
    passwordField: 'password'
};

// aes 128 복호화 함수
const decryptPassword = (encryptedPassword, key) => {
    const decrypting = CryptoJS.AES.decrypt(encryptedPassword, key);
    const decrypted = decrypting.toString(CryptoJS.enc.Utf8);
    return decrypted;
};

// 기본 로그인 동작 strategy 작성
const local = new LocalStrategy(config, async(email, password, done) => {
    try{
        // 기본 로그인 동작 strategy 로 들어오는 email 로 유저 조회
        const user = await User.findOne({email});
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 404, message: "회원을 찾을 수 없습니다."});
            throw error;
        }

        // password 를 백엔드에 보내 줄 때 aes-128 양방향 암호화 적용
        // 백엔드에서는 aes-128 을 복호화하고 sha-256 해시화하여 db sha-256 해시 값과 비교시킨다.
        const key = process.env.AES_KEY;
        const decryptedPassword = decryptPassword(password, key);

        // password 일치 여부 검사
        // sha256 단방향 해시 비밀번호 사용
        const hash = crypto.createHash('sha256').update(decryptedPassword).digest('hex');
        if(user.password !== hash){
            const error = new Error();
            Object.assign(error, {code: 404, message: "비밀번호가 일치하지 않습니다."});
            throw error;
        }
        console.log(user);

        // 정상 done 콜백 함수 호출
        done(null, {
            nanoid: user.nanoid,
            email: user.email,
            name: user.name,
            nickname: user.nickname,
            phone: user.phone,
            is_admin: user.is_admin,
            photo: user.photo ? user.photo : ""
        });
    } catch(err) {
        done(err, null);
    }
});

module.exports = local;