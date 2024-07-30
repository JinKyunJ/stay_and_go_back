const {User, Post, Reserve} = require('../models');
const isDateDifferenceFrom2Days = require('../utils/isDateDifferenceFrom2Days');
const isPastDay = require('../utils/isPastDay');

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
        
        return {result: filteredPosts, code: 200, message: `여행(예약) 가능한 숙소 조회 완료`};
    }

    // 지난 여행 리스트 페이지 정보 read (mymode === true : 나의여행, false : 예약자관리)
    async getReservePastPage({mymode, user, host_email}){
      // 첫 페이지 진입이므로 1 고정
      const page = 1;
      const perPage = 5;

      const query = {
        // db 의 end_date 가 현재 시간 보다 작거나 같다
        $and: [
          { // 문자열로 저장된 날짜를 Date 로 변환
            $expr: {
              $lte: [
                { $dateFromString: { dateString: "$end_date" } },
                new Date()
              ]
            }
          }
        ]
      };
      
      // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
      let checkReserves;
      if(mymode){ // 나의 여행
        checkReserves = await Reserve.find({author: user, ...query});
      } else { // 예약자 관리
        checkReserves = await Reserve.find({host_email, ...query});
      }

      // pastResult
      const pastResult = {
        page: page,
        perPage: perPage,
        total: checkReserves.length,
        totalPage: Math.ceil(checkReserves.length/perPage)
      };

      return {result: pastResult, code: 200, message: `reserve 페이지 정보 읽기 완료`};
    }

    // 다가오는 여행 리스트 페이지 정보 read (mymode === true : 나의여행, false : 예약자관리)
    async getReserveUpcomingPage({mymode, user, host_email}){
      // 첫 페이지 진입이므로 1 고정
      const page = 1;
      const perPage = 5;

      const query = {
        // db 의 end_date 가 현재 시간 보다 크다
        $and: [
          { // 문자열로 저장된 날짜를 Date 로 변환
            $expr: {
              $gt: [
                { $dateFromString: { dateString: "$end_date" } },
                new Date()
              ]
            }
          }
        ]
      };
      
      // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
      let checkReserves;
      if(mymode){ // 나의 여행
        checkReserves = await Reserve.find({author: user, ...query});
      } else { // 예약자 관리
        checkReserves = await Reserve.find({host_email, ...query});
      }

      // ingResult
      const ingResult = {
          page: page,
          perPage: perPage,
          total: checkReserves.length,
          totalPage: Math.ceil(checkReserves.length/perPage)
      };

      return {result: ingResult, code: 200, message: `reserve 페이지 정보 읽기 완료`};
    }

    // 지난 여행 리스트 read (mymode === true : 나의여행, false : 예약자관리)
    async getReservePastPageRead({nowpage, mymode, user, host_email}){
      const page = Number(nowpage);
      const perPage = 5;

      const query = {
        // db 의 end_date 가 현재 시간 보다 작거나 같다
        $and: [
          { // 문자열로 저장된 날짜를 Date 로 변환
            $expr: {
              $lte: [
                { $dateFromString: { dateString: "$end_date" } },
                new Date()
              ]
            }
          }
        ]
      };
      
      // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
      let checkReserves;
      // 나의 여행
      if(mymode){
        checkReserves = await Reserve.find({author: user, ...query}).sort({createdAt: -1}).skip(perPage * (page - 1))
          .limit(perPage).populate({
              path: 'author',
              select: "email name nickname phone photo"
          });
      } else { // 예약자 관리
        checkReserves = await Reserve.find({host_email, ...query}).sort({createdAt: -1}).skip(perPage * (page - 1))
          .limit(perPage).populate({
              path: 'author',
              select: "email name nickname phone photo"
          });
      }

      return {result: checkReserves, code: 200, message: `여행(예약) 리스트 정보 읽기 완료`};
    }

    // 다가오는 여행 리스트 read (mymode === true : 나의여행, false : 예약자관리)
    async getReserveUpcomingPageRead({nowpage, mymode, user, host_email}){
      const page = Number(nowpage);
      const perPage = 5;

      const query = {
        // db 의 end_date 가 현재 시간 보다 크다
        $and: [
          { // 문자열로 저장된 날짜를 Date 로 변환
            $expr: {
              $gt: [
                { $dateFromString: { dateString: "$end_date" } },
                new Date()
              ]
            }
          }
        ]
      };
      
      // 사용자가 mymode 를 체크하여 검색할 쿼리(author OR host_email) 을 정함
      let checkReserves;
      // 나의 여행
      if(mymode){
        checkReserves = await Reserve.find({author: user, ...query}).sort({createdAt: -1}).skip(perPage * (page - 1))
          .limit(perPage).populate({
              path: 'author',
              select: "email name nickname phone photo"
          });
      } else { // 예약자 관리
        checkReserves = await Reserve.find({host_email, ...query}).sort({createdAt: -1}).skip(perPage * (page - 1))
          .limit(perPage).populate({
              path: 'author',
              select: "email name nickname phone photo"
          });
      }

      return {result: checkReserves, code: 200, message: `여행(예약) 리스트 정보 읽기 완료`};
    }

    // 여행(or 예약) 상세 보기 정보
    async getReserveDetail({nanoid}){
      const reserve = await Reserve.findOne({nanoid}).populate({
          path: 'author',
          select: "email name nickname phone photo"
      });
      if(!reserve){
          const error = new Error();
          Object.assign(error, {code: 400, message: "여행(예약) 정보를 가져오지 못했습니다. 다시 확인해주세요."});
          throw error;
      }
      return {data: reserve, code: 200, message: '여행(예약) 상세 정보 읽기 완료'};
  }

    // 예약(여행) 추가 writeReserve
    async writeReserve(bodyData){
      // nanoid 는 bodyData 에 post_nanoid 이름으로 들어올 것
      // title 도 post 에서 title 그대로 가져올 것
      // + startSearch state 에서 각 인원수(adult, child, baby 이름으로 가져올 것) 
      //                      , 시작 끝 날짜 start_date / end_date 이름으로 가져올 것
      //                      , 총 금액(amount) 도 front 에서 계산 ! 해서 amount 이름으로 가져올 것
      const author = await User.findOne({email: bodyData.email}, "email name nickname phone photo");
      const post = await Post.findOne({nanoid: bodyData.post_nanoid}).populate('author');
        const data = await Reserve.create({
            author: author,
            title: post.title,
            host_email: post.author.email,
            host_nickname: post.author.nickname,
            host_phone: post.author.phone,
            main_image: post.main_image,
            sub_images: post.sub_images,
            main_location: post.main_location,
            sub_location: post.sub_location,
            amount: Number(bodyData.amount),
            start_date: bodyData.start_date,
            end_date: bodyData.end_date,
            adult: Number(bodyData.adult),
            child: Number(bodyData.child),
            baby: Number(bodyData.baby),
        });
        return {data: data, code: 200, message: `여행(예약) 등록 완료`};
    }

    // 예약(여행) 삭제(취소 -2일 전까지만 ex. 시작일 07-05 라면 07-03 까지 가능
    async deleteReserve({nanoid, email}){
        const reserve = await Reserve.findOne({nanoid}).populate('author');
        if(!reserve) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "여행(예약) 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        if(reserve.author.email !== email || reserve.host_email !== email) { 
            const error = new Error();
            Object.assign(error, {code: 403, message: "여행(예약) 작성자 또는 호스트가 아닙니다. 다시 확인해주세요."});
            throw error;
        }
        if(!isDateDifferenceFrom2Days(reserve.start_date)) {
          const error = new Error();
          Object.assign(error, {code: 403, message: "여행(예약) 취소는 여행 시작일 2일 전까지만 가능합니다."});
          throw error;
        }
        await Reserve.deleteOne({nanoid});
        return {code: 200, message: `여행(예약) 삭제 완료`};
    }
}

const reserveService = new ReserveService();
module.exports = reserveService;