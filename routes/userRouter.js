const {Router} = require('express');
const asyncHandler = require('../middlewares/async-handler');
const userService = require('../services/userService');
// 현재 사용자가 로그인했는지 체크하는 미들웨어 적용
const reqUserCheck = require('../middlewares/reqUserCheck');
// 현재 사용자가 관리자인지 체크하는 미들웨어 추가
const reqUserAdminCheck = require('../middlewares/reqUserAdminCheck');
const emailCheck = require('../middlewares/emailCheck');
const passport = require('passport');
const jwtMiddleware = require('../middlewares/jwtMiddleware');

const router = Router();

/* create (완료) */ 
router.post('/', asyncHandler(async (req, res) => {
    const bodyData = req.body;
    const result = await userService.createUser(bodyData);
    return res.status(201).json(result);
}));

// 서버에 로그인한 정보 확인 시 전달 라우터 (완료)
router.get('/getuser', asyncHandler(async (req, res) => {
    if(!req.user){
        console.log("logout 상태 (server check)")
        return res.status(200).json({code: 411, message: "logout 상태 입니다.(server chk)"});
    }
    const data = {email: req.user.email, name: req.user.name};
    // 프론트 요청에 대해 최신 닉네임, 연락처, 프로필 포토 데이터를 넘겨주기(수정이 가능한 데이터 이므로)
    const result = await userService.findByEmail({email: data.email});
    data.nickname = result.data.nickname;
    data.phone = result.data.phone;
    data.is_admin = result.data.is_admin;
    data.photo = result.data.photo;
    return res.status(200).json({code: 200, data: data, message: "login 상태 입니다.(server chk)"});
}));

// JWT LOGOUT : 쿠키에 있는 토큰을 비우고, 만료 기간 0 으로 설정
// post 요청으로 url 직접 접근 차단 (완료)
router.post('/logout', asyncHandler(async (req, res) => {
    res.cookie('token', null, {
        secure: true,
        maxAge: 0,
        sameSite: 'None', // 쿠키를 크로스 도메인 요청에 포함시키기 위해 'None'으로 설정
        path: '/' // 쿠키의 경로 설정
    });
    return res.status(200).json({code: 200, message: "정상적으로 로그아웃되었습니다."});
}));



// 유저 아이디 조회 (완료)
router.post('/findid', asyncHandler(async (req, res) => {
    const bodyData = req.body;
    const result = await userService.findUserID(bodyData);
    return res.status(200).json(result);
}));

// 전체 유저 조회(중요 데이터 -> 관리자) (완료)
router.get('/alluserdata', reqUserAdminCheck, asyncHandler(async (req, res) => {
    const result = await userService.findAllUser();
    return res.status(200).json(result);
}));

// findOne by email (완료)
router.post('/email', reqUserCheck, asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.findByEmail({email});
    return res.status(200).json(result);
}));

// update by email (완료)
router.put('/', asyncHandler(async (req, res) => {
    const {email} = req.body;
    const bodyData = req.body;
    const result = await userService.updateByEmail({email}, bodyData);
    return res.status(200).json(result);
}));

// delete by email (완료)
// 유저 삭제 시 유저 이메일 붙은 reserve Data & post Data 도 삭제해야한다.(예정 !)
router.delete('/delete', reqUserCheck, asyncHandler(async (req,res) => {
    const {email} = req.body;
    if(!req.user.is_admin && email !== req.user.email){
        return res.status(403).json({code: 403, message: "타인의 정보는 삭제할 수 없습니다."});
    }
    const result = await userService.deleteByEmail({email});
    return res.status(200).json(result);
}));

// 회원가입 시 이메일 인증 코드 발급 진행 (완료)
// feedback 반영
router.post('/verify', emailCheck, asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.joinVerify({email});
    return res.status(201).json(result);
}));

// 회원가입 시 이메일 인증 확인 요청 진행 (완료)
// feedback 반영
router.post('/verify/confirm', emailCheck, asyncHandler(async (req, res) => {
    const {email, secret} = req.body;
    const result = await userService.joinVerifyConfirm({email, secret});
    return res.status(200).json(result);
}));

// 비밀번호 찾기 시 이메일 인증 요청 (완료)
// feedback 반영
router.post('/verify/findpw', emailCheck, asyncHandler(async (req, res) => {
    const {email} = req.body;
    const result = await userService.pwfindVerify({email});
    return res.status(200).json(result);
}))

module.exports = router;