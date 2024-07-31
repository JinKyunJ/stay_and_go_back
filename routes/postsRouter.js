const {Router} = require('express');
const router = Router();
const asyncHandler = require('../middlewares/async-handler');
const postService = require('../services/postService');
// multer 이미지 업로드 설정 가져오기
const upload = require('../utils/multerConfig');
const reqUserCheck = require('../middlewares/reqUserCheck');

// 숙소 리스트 페이지 정보 read (완료)
router.post('/getposts/page', asyncHandler(async (req,res) => { 
    const {search, category, mymode} = req.body;
    // 사용자가 mymode(등록숙소에서 내 숙소만 요청하는지) 체크
    if(mymode && !req.user){
        return res.status(400).json({code: 400, message: "로그인하지 않은 사용자입니다."});
    }
    const email = req.user ? req.user.email : "";
    const result = await postService.getPostsPage({search, category, mymode, email});
    return res.status(200).json(result);
}));

// 숙소 리스트 read (완료)
router.post('/getposts/page/read', asyncHandler(async (req,res) => {
    const {nowpage, search, category, mymode} = req.body;
    // 사용자가 mymode(등록숙소에서 내 숙소만 요청하는지) 체크
    if(mymode && !req.user){
        return res.status(400).json({code: 400, message: "로그인하지 않은 사용자입니다."});
    }
    const email = req.user ? req.user.email : "";
    const result = await postService.getPosts({nowpage, search, category, mymode, email});
    return res.status(200).json(result);
}));

// 특정 숙소 세부 내용 보기 (완료) (params 처리)
router.get('/read/:nanoid', asyncHandler(async (req, res) => {
    const {nanoid} = req.params;
    const result = await postService.getPost({nanoid});
    return res.status(200).json(result);
}));

// 숙소 작성 (완료) (formData header 셋팅 체크(front))
router.post('/write', upload.array('images'), asyncHandler(async (req, res) => {
    const bodyData = req.body;
    bodyData.email = req.user.email;
    // 요청 파일 없음 에러(임의의 코드 : 410)
    if(!req.files || req.files.length === 0){
        return res.status(400).json({code: 400, message: "요청에 이미지 파일이 없습니다."});
    }
    const result = await postService.writePost(bodyData, req.files);
    return res.status(200).json(result);
}));

// 숙소 수정 (완료) (formData header 셋팅 체크(front)) (버킷 이미지 삭제 -> 새 이미지 등록 -> url 반환(util 폴더 참고))
// mode 값이 추가로 담겨져야 함!!!(1: 메인 이미지, 2: 서브, 3: 둘 다 교체, 0. 교체 안함)
router.put('/put', upload.array('images'), asyncHandler(async (req, res) => {
    // 숙소 정보에 추가로 로그인된 사용자 email 이 있어야 함 *front 에서도 체크해야 함
    const bodyData = req.body;
    bodyData.email = req.user.email;

    const result = await postService.putPost(bodyData, req.files ? req.files : []);
    return res.status(200).json(result);
}));

// 숙소 삭제 (완료) 
// del? => reserve 는 삭제하지 않는다., 삭제 할 수도 없음 
// => (지난 여행으로 남아야 하고, 애초에 reserve 에 추가될 때에는 
//     외래 키가 들어가지 않고 실제 값들이 들어갈 것임 !!)
// => 버킷에서 실제 이미지도 지우지 않는다. (마찬가지로 지난 여행에서 확인해야함.)
router.delete('/delete', asyncHandler(async (req, res) => {
    const {nanoid} = req.body;
    const email = req.user.email;
    const result = await postService.delPost({email, nanoid});
    return res.status(200).json(result);
}));

module.exports = router;