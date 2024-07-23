const {Schema} = require('mongoose');
const {nanoid} = require('nanoid');
// 중복 없는 문자열을 생성해주는 nanoid
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

const postSchema = new Schema({
    // 숙소 nanoid (primary key)
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        require: true,
        index: true
    },
    // 호스트 정보
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
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
        type: String
    },
    // 기타 옵션 선택
    option: {
        type: [String]
    },
    // 포스트 생성일
    create_at: {
        type: String,
        default: () => { return newDate() },
        require: true
    },
    // 포스트 수정일
    update_at: {
        type: String,
        default: () => { return newDate() },
        require: true
    }
},{
    timestamps: true
});

module.exports = postSchema;