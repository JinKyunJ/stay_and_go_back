const dotenv = require('dotenv');
dotenv.config();
const jwtStrategy = require('passport-jwt').Strategy;
// 클라이언트로부터 온 토큰 추출
const cookieExtractor = (req) => {
    const {token} = req.cookies;
    return token;
};

// 클라이언트 토큰과 고유 시그니처 값이 포함된 opts 객체 작성
const opts = {
    secretOrKey: process.env.COOKIE_SECRET,
    jwtFromRequest: cookieExtractor
};

// jwt 로그인 strategy 로 opts 파라미터를 넣어 동작 후 정상 토큰일 때 다음 콜백함수 실행
const jwtlocal = new jwtStrategy(opts, (user, done) => {
    // 클라이언트가 정상 토큰을 가지고 있을 때
    done(null, user);
});

module.exports = jwtlocal;