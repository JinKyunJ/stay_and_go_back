const {Schema} = require('mongoose');
// 중복 없는 문자열을 생성해주는 nanoid
const {nanoid} = require('nanoid');
// 추가 또는 수정될 때마다 날짜 데이터를 만들어주는 newDate()
const newDate = require('../../utils/newDate');

const userSchema = new Schema({
    // 유저 고유 번호(primary key)
    nanoid: {
        type: String,
        default: () => { return nanoid() },
        required: true,
        index: true
    },
    // 유저 이메일(로그인 ID, sub primary key)
    email: {
        type: String,
        required: true,
        index: true
    },
    // 유저 이름
    name: {
        type: String,
        required: true
    },
    // 유저 닉네임
    nickname: {
        type: String,
        required: true
    },
    // 유저 연락처
    phone: {
        type: String,
        required: true
    },
    // 유저 비밀번호(로그인 PW)
    password: {
        type: String,
        required: true
    },
    // 유저 생성일
    create_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 유저 업데이트일
    update_at: {
        type: String,
        default: () => { return newDate() }
    },
    // 관리자 여부(true 일 경우 관리자 페이지 접근 가능)
    is_admin:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true
})

module.exports = userSchema;