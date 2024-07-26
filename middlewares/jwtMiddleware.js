const passport = require('passport');

// 모든 요청 페이지에서 jwt 토큰의 유무 및 인증은 동작하여야 함
module.exports = (req, res, next) => {
    // 클라이언트로부터 토큰을 받아오지 않았을 경우 인증하지 않고 다음 라우터로 넘어감
    if(!req.cookies.token){
        next();
        return;
    }
    // 토큰이 있을 경우 'jwt' 인증 절차를 jwt strategy 에 따라 진행하고 정상 진행되었을 경우 다음 라우터로 넘어감
    // loginStrategy 에 따라 req.user 값 확인 가능
    return passport.authenticate('jwt', {session: false})(req,res,next);
}