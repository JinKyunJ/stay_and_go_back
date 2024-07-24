const {Schema} = require('mongoose');
const {nanoid} = require('nanoid');
const path = require('path');
// 중복 없는 문자열을 생성해주는 nanoid
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

const postSchema = new Schema({
    // 숙소 nanoid (primary key)
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        required: true,
        index: true
    },
    // 호스트 정보
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
        // 현재 user 없이 페이지네이션 및 검색 작업 진행 중 
        // required: true
    },
    // 숙소 메인 사진(multer, 등록 시 첫 번째 사진이 메인 사진)
    // 사진이 없을 시 라우터에서 에러처리 진행함
    main_image: {
        data: Buffer,
        contentType: String
    },
    // 숙소 메인 사진 포함 나머지 사진들(multer)
    sub_images: [{
        data: Buffer,
        contentType: String
    }],
    // 숙소 타이틀
    title: {
        type: String,
        required: true
    },
    // 최대 성인 가능 인원
    max_adult: {
        type: Number,
        required: true,
        index: true
    },
    // 최대 어린이 가능 인원
    max_child: {
        type: Number,
        required: true,
        index: true
    },
    // 최대 유아 가능 인원
    max_baby: {
        type: Number,
        required: true,
        index: true
    },
    // 인당(성인 기준) 1일 가격 (child : 성인 가격의 50%, baby : 성인 가격의 20%)
    price: {
        type: Number,
        required: true
    },
    // 주 위치(검색에 사용됨)
    main_location: {
        type: String,
        required: true,
        index: true
    },
    // 서브 상세 위치 내용
    sub_location: {
        type: String,
        required: true
    },
    // 숙소 상세 소개
    contents: {
        type: String,
        required: true,
    },
    // 방 갯수 
    room_num: {
        type: Number,
        required: true
    },
    // 카테고리(태그) 선택 가능
    category: {
        type: [String],
        index: true
    },
    // 호스트 소개 내용
    host_intro: {
        type: String,
        required: true
    },
    // 기타 옵션 선택
    option: {
        type: [String],
        required: true
    },
    // 포스트 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 포스트 수정일
    update_at: {
        type: String,
        default: () => { return newDate() }
    }
},{
    timestamps: true
});

module.exports = postSchema;