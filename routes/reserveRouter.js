const {Router} = require('express');
const router = Router();
const asyncHandler = require('../middlewares/async-handler');
const reserveService = require('../services/reserveService');
const reqUserCheck = require('../middlewares/reqUserCheck');
const { User } = require('../models');

// 여행 리스트 페이지 정보 read (mymode === true : 나의여행, false : 예약자관리)
router.post('/getreserve/page', reqUserCheck, asyncHandler(async (req,res) => { 
    const {mymode} = req.body;
    // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
    if(mymode && !req.user){
        return res.status(400).json({code: 400, message: "로그인하지 않은 사용자입니다."});
    }
    const user = mymode ? await User.findOne({email: req.user.email}) : "";
    const host_email = mymode ? "" : req.user.email;
    const result = await reserveService.getReservePage({mymode, user, host_email});
    return res.status(200).json(result);
}));

// 여행 리스트 read (mymode === true : 나의여행, false : 예약자관리)
router.post('/getreserve/page/read', reqUserCheck, asyncHandler(async (req,res) => {
    const {nowpage, mymode} = req.body;
    // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
    if(mymode && !req.user){
        return res.status(400).json({code: 400, message: "로그인하지 않은 사용자입니다."});
    }
    const user = mymode ? await User.findOne({email: req.user.email}) : "";
    const host_email = mymode ? "" : req.user.email;
    const result = await reserveService.getReservePageRead({nowpage, mymode, user, host_email});
    return res.status(200).json(result);
}));

// 여행(or 예약) 상세보기 정보
router.get('/get/detail/:nanoid', reqUserCheck, asyncHandler(async (req,res) => {
    const {nanoid} = req.params;
    const result = await reserveService.getReserveDetail({nanoid});
    return res.status(200).json(result);
}));

// 여행 작성
router.post('/write', reqUserCheck, asyncHandler(async (req, res) => {
    const bodyData = req.body; // post 의 nanoid 가 필수적으로 필요함 !!!
    // nanoid 는 bodyData 에 post_nanoid 이름으로 들어올 것
    // title 도 post 에서 title 그대로 가져올 것
    // + startSearch state 에서 각 인원수(adult, child, baby 이름으로 가져올 것)
    //                      , 시작 끝 날짜 start_date / end_date 이름으로 가져올 것
    //                      , 총 금액(amount) 도 front 에서 계산 ! 해서 amount 이름으로 가져올 것
    bodyData.email = req.user.email;
    const result = await reserveService.writeReserve(bodyData);
    return res.status(200).json(result);
}));

// 여행 삭제(취소)
router.delete('/delete', reqUserCheck, asyncHandler(async (req, res) => {
    const {nanoid} = req.body;
    const email = req.user.email;
    const result = await reserveService.deleteReserve({nanoid, email});
    return res.status(200).json(result);
}));

module.exports = router;