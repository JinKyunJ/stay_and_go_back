const newDate = require('../utils/newDate');
const {User, Post, Reserve} = require('../models');

class ReserveService {
    // - 메인 페이지 검색 시 사용
    // 메인 위치(시 구역), 최대 허용 인원을 먼저 post 에서 조회하고 결과 데이터를 바탕으로 예약 가능 날짜 조회
    // => 따라서 postsService 에서 요청하는 reserveService 임.
    async availableDateCheck({posts, startDate, endDate}){
        const query = {
            // and 연산
            // db 의 start_date 가 endDate 보다 작거나 같고,
            // db 의 end_date 가 startDate 보다 크거나 같다.
            $and: [
              { // 문자열로 저장된 날짜를 Date 로 변환
                $expr: {
                    // ddb 의 start_date 가 endDate 보다 작거나 같고,
                  $lte: [
                    { $dateFromString: { dateString: "$start_date" } },
                    new Date(endDate)
                  ]
                }
              },
              { // 문자열로 저장된 날짜를 Date 로 변환
                $expr: {
                    // db 의 end_date 가 startDate 보다 크거나 같다.
                  $gte: [
                    { $dateFromString: { dateString: "$end_date" } },
                    new Date(startDate)
                  ]
                }
              }
            ]
        };
        const reserves = await Reserve.find(query);
        const reserveNanoids = reserves.map(v => v.post_nanoid);
        // 예약 날짜가 잡힌 숙소는 필터링으로 제외함.
        const filteredPosts = posts.filter(v => !reserveNanoids.includes(v.nanoid));
        
        return {result: filteredPosts, code: 200, message: `예약 가능한 숙소 조회 완료`};
    }
}

const reserveService = new ReserveService();
module.exports = reserveService;