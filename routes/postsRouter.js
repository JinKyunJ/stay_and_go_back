const {Router} = require('express');
const router = Router();
const asyncHandler = require('../middlewares/async-handler');
const postService = require('../services/postService');
// multer 이미지 업로드 설정 가져오기
const upload = require('../utils/multerConfig');

// 전체 숙소 중 1 페이지 또는 특정 페이지의 숙소 리스트 가져오기
router.get('/getallposts/:nowpage', asyncHandler(async (req,res) => { 
    const {nowpage, category} = req.params;
    const result = await postService.getAllposts({nowpage});
    return res.status(200).json(result);
}));

// 전체 숙소 중 카테고리가 적용된 1 페이지 또는 특정 페이지의 숙소 리스트 가져오기
router.get('/getallposts/:nowpage/:category', asyncHandler(async (req,res) => { 
    const {nowpage, category} = req.params;
    const result = await postService.getAllpostsCategory({nowpage, category});
    return res.status(200).json(result);
}));

// 내가 등록한 숙소 중 1 페이지 또는 특정 페이지의 숙소 리스트 가져오기
router.post('/getmyposts', asyncHandler(async (req,res) => { 
    const {email, nowpage} = req.body;
    const result = await postService.getMyposts({email, nowpage});
    return res.status(200).json(result);
}));

// 숙소 내용 요청 라우터
router.get('/read/:nanoid', asyncHandler(async (req, res) => {
    const {nanoid} = req.params;
    const result = await postService.getPost({nanoid});
    return res.status(200).json(result);
}));


// 숙소 작성
router.post('/write', upload.array('images'), asyncHandler(async (req, res) => {
    // 숙소 정보에 추가로 로그인된 사용자 email 이 있어야 함 *front 에서도 체크해야 함
    const bodyData = req.body;
    // 요청 파일 없음 에러(임의의 코드 : 410)
    if(!req.files || req.files.length === 0){
        return res.status(400).json({code: 400, message: "요청에 이미지 파일이 없습니다."});
    }
    const result = await postService.writePost(bodyData, req.files);
    return res.status(200).json(result);
}));

// 숙소 수정
router.post('/put', asyncHandler(async (req, res) => {
    // 숙소 정보에 추가로 로그인된 사용자 email 이 있어야 함 *front 에서도 체크해야 함
    const bodyData = req.body;
    const result = await postService.putPost(bodyData);
    return res.status(200).json(result);
}));

// 숙소 삭제
router.delete('/del', asyncHandler(async (req, res) => {
    const {email, nanoid} = req.body;
    const result = await postService.delPost({email, nanoid});
    return res.status(200).json(result);
}));

module.exports = router;