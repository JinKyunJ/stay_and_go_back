const {Schema} = require('mongoose');

const reserveSchema = new Schema({
    // post_nanoid + author = primary key
    // 예약한 숙박 포스트 nanoid
    post_nanoid: {
        type: String,
        required: true,
        index: true
    },
    // 예약자 정보
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // 숙박 시작 일자
    start_date: {
        type: String,
        required: true,
        index: true
    },
    // 숙박 끝 일자
    end_date: {
        type: String,
        required: true,
        index: true
    },
    // 예약한 성인 인원 수
    adult: {
        type: Number,
        required: true
    },
    // 예약한 어린이 인원 수
    child: {
        type: Number
    },
    // 예약한 유아 인원 수
    baby: {
        type: Number
    },
    // 총 금액
    amount: {
        type: Number,
        required: true
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