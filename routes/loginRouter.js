const {Router} = require('express');
const passport = require('passport');
const dotenv = require('dotenv');
dotenv.config();
// 이메일 형식 및 입력되었는지 체크
const loginCheck = require('../middlewares/loginCheck');
const jwt = require('jsonwebtoken');
const secret = process.env.COOKIE_SECRET;

// 처음 로그인 했을 때 클라이언트에 줄 토큰에다가 signature(secret) 으로 서명 후 전달함.
const setUserToken = (res, user) => {
    const token = jwt.sign(user, secret);
    res.cookie('token', token);
    return token;
};

const router = Router();

// login (완료)
// loginCheck : 이메일 또는 패스워드 입력 확인, 이메일 형식 체크
router.post('/', loginCheck, passport.authenticate('local', {session: false}), (req, res, next) => {
    // 로그인 성공 했을 때 클라이언트에 줄 토큰에다가 signature(secret) 으로 서명 후 전달함.
    console.log(req.user);
    const token = setUserToken(res, req.user);

    // 관리자 계정 로그인 시 알림 팝업 확인
    if(req.user && req.user.is_admin){
        return res.status(200).json({code: 202, message: "관리자 로그인에 성공하였습니다."});
    }
    // 일반 로그인 성공 알림
    return res.status(200).json({token: token, code: 200, message: "로그인에 성공하였습니다."});
});

module.exports = router;