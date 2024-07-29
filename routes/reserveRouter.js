const {Router} = require('express');
const router = Router();
const asyncHandler = require('../middlewares/async-handler');

// 여행 item primary key : 여행 item {nanoid}
// 1. 추가 가이드라인 (!!!)
// 유저 이메일 + reserve 에 post 정보가 추가될 때에는 외래키로 넣지말고 실제 값을 넣어야 한다.
// post 가 제거되더라도 "지난 여행" 으로 볼 수 있어야 하니까.
// 2. 수정은 할 수 없지만 삭제(front 에서는 "취소" 로 표기)는 여행 시작일 -2일까지 가능하다. 
//   (삭제가 가능한 날은 여행 시작일 -2 일(ex. 24-07-07 시작일 일 때 24-07-05 날 까지 삭제가능)
//   (단, 여행 마지막 날 이후 front 기준 "지난 여행" 이 위치한 곳으로 아이템이 이동해야 한다.
// front : 나의 여행에서 item 상세 보기 시 : 모달로 예약했었던 내용 + (main + sub image) url
// 3. 읽기 가이드라인
// 모달 화면 체크하고 스키마 확인 및 수정하고, 진행하면 문제 없을 거 같음.

// P.S. 유저 삭제 시 유저 이메일 붙은 reserve Data & post Data 도 삭제해야한다.(예정 !)

module.exports = router;