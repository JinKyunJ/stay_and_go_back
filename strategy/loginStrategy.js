const LocalStrategy = require('passport-local').Strategy;
const {User} = require('../models');
// sha256 단방향 해시 비밀번호 사용
const crypto = require('crypto');

// id 필드와 password 필드 정의
const config = {
    usernameField: 'email',
    passwordField: 'password'
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
        // password 일치 여부 검사
        // sha256 단방향 해시 비밀번호 사용
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        if(user.password !== hash){
            const error = new Error();
            Object.assign(error, {code: 404, message: "비밀번호가 일치하지 않습니다."});
            throw error;
        }

        // 정상 done 콜백 함수 호출
        done(null, {
            nanoid: user.nanoid,
            email: user.email,
            name: user.name,
            is_admin: user.is_admin,
        });
    } catch(err) {
        done(err, null);
    }
});

module.exports = local;