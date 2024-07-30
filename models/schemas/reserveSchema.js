const {Schema} = require('mongoose');
const {nanoid} = require('nanoid');
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

const reserveSchema = new Schema({
    // primary key (삭제시 만)
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        required: true,
        index: true
    },
    // (search -> in ) 예약자 정보 (나의여행 탭에서의 KEY)
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // (post) 타이틀
    title: {
        type: String,
        required: true
    },
    // (post) 호스트 이메일 (호스트계정으로 예약자관리 페이지에서의 KEY)
    host_email: {
        type: String,
        required: true,
        index: true
    },
    // (post) 호스트 이름
    host_nickname: {
        type: String,
        required: true
    },
    // (post) 호스트 연락처
    host_phone: {
        type: String,
        required: true
    },
    // (post) 메인 이미지
    main_image: {
        type: String, // URL 저장
        required: true
    },
    // (post) 서브 이미지
    sub_images: [{
        type: String
    }],
    // (post) 주요 위치
    main_location: {
        type: String,
        required: true
    },
    // (post) 상세 주소
    sub_location: {
        type: String,
        required: true
    },
    // (search -> in 인원수 확인 후
    //            + post 의 가격(성인 : 그대로, 어린이 : 성인 50%, 아기: 성인 20% 계산) 총 금액
    amount: {
        type: Number,
        required: true
    },
    // (search -> in ) 숙박 시작 일자
    start_date: {
        type: String,
        required: true,
        index: true
    },
    // (search -> in ) 숙박 끝 일자
    end_date: {
        type: String,
        required: true,
        index: true
    },
    // (search -> in ) 예약한 성인 인원 수
    adult: {
        type: Number,
        required: true
    },
    // (search -> in ) 예약한 어린이 인원 수
    child: {
        type: Number
    },
    // (search -> in ) 예약한 유아 인원 수
    baby: {
        type: Number
    },
    // 예약 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 예약 업데이트일
    update_at: {
        type: String,
        default: () => { return newDate() }
    },
},{
    timestamps: true
});

module.exports = reserveSchema;