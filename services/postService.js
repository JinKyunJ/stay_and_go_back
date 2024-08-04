const {User, Post, Reserve} = require('../models');
const newDate = require('../utils/newDate');
const reserveService = require('./reserveService');
const imageToAWS = require('../utils/imageToAWS');
const deleteImageFromAWS = require('../utils/deleteImageFromAWS');
const parseCustomDate = require('../utils/parseToDate');

class PostService {
    // 페이지 정보 read (mymode && 등록숙소 페이지에서 내가 등록한 숙소만 보기)
    async getPostsPage({search, category, mymode, email}){
        // 첫 페이지 진입이므로 1 고정
        const page = 1;
        const perPage = 6;

        const query = {
            $and: [
                // 메인 도시 검색 (search.city가 "전체" 일 경우는 도시 검색 필터를 생략함)
                ...(search.city !== "전체" ? [{ main_location: search.city }] : []),
        
                // 허용 인원 검색 2. (기본 값 0, 0, 0)
                { max_adult: { $gte: search.adult } },
                { max_child: { $gte: search.child } },
                { max_baby: { $gte: search.baby } },
        
                // 카테고리 검색 (카테고리 인자 값이 db 카테고리 배열의 원소와 하나라도 일치해야 함)
                // (category 값이 "전체" 일 경우는 카테고리 검색 필터를 생략함)
                ...(category !== "전체" ? [{ category: { $elemMatch: { $eq: category } } }] : [])
            ]
        }
        
        // 먼저 검색 도시(시 권역 행정구역), 허용 인원 검색 결과 데이터를 구함
        let checkPosts;
        if(!mymode){
            // MongoDB의 Aggregation Framework 를 사용하여 "여러 단계의 쿼리와 필터링을 연속" 으로 수행 가능
            checkPosts = await Post.aggregate([
                // 조건에 맞는 게시물 조회
                { $match: query },
                
                // Reserve 컬렉션과 조인
                {
                    $lookup: {
                        from: 'reserves',        // Reserve 컬렉션의 실제 이름(몽고 compass 확인 시 실제 컬렉션 이름은 소문자 복수형으로 쓰인다)
                        localField: 'nanoid',    // Post의 nanoid 필드
                        foreignField: 'post_nanoid', // Reserve의 post_nanoid 필드
                        as: 'reservations'       // 결과 필드 이름을 reservations 로 지어 join 했다.
                    }
                },
                // 날짜 범위에 맞는 예약 데이터 필터링
                {
                    $addFields: {
                        reservations: {
                            $filter: {
                                input: '$reservations',
                                as: 'reservation',
                                cond: {
                                    // reserve 의 start_date 가 search 의 endDate 보다 작고,
                                    // reserve 의 end_date 가 search 의 startDate 보다 크다. => 의 예약 데이터를 필터링 해야한다.
                                    // 체크인 오후 3시 이후 고정, 체크아웃 오전 11시까지 고정이므로(start_date === search.endDate 일 수 도 있고
                                    //    end_date === search.startDate 일 수도 있다.)
                                    $and: [
                                        { $lt: [ { $dateFromString: { dateString: '$$reservation.start_date' } }, new Date(search.endDate) ] },
                                        { $gt: [ { $dateFromString: { dateString: '$$reservation.end_date' } }, new Date(search.startDate) ] }
                                    ]
                                }
                            }
                        }
                    }
                },
                // 예약이 없는 게시물만 필터링
                {
                    $match: {
                        reservations: { $eq: [] }
                    }
                }
            ]);
            //checkPosts = await Post.find(query);
        } else {
            const user = await User.findOne({email});
            checkPosts = await Post.find({author: user});
        }


        // 마지막 검색 날짜가 예약 테이블에 있는 기간과 겹칠 경우 해당 post 를 제외시킴
        // 기본 날짜 값은 "다음날"
        let resultPosts;
        if(!mymode){ 
            resultPosts = checkPosts;
            // reserveService.availableDateCheck 서비스 함수를 두 번 사용할 경우 제외되는 post 가 있을
            // 때, perPage 에 못채우는 현상이 발생하여 상단의 aggregation 을 사용하여
            // "author 정보를 포함하여 Post와 Reserve 컬렉션을 조인하고, 예약 날짜 범위에 따라 필터링하는 방식" 을 사용함

            //resultPosts = await reserveService.availableDateCheck(
            //{posts: checkPosts, startDate: search.startDate, endDate: search.endDate});
        } else {
            resultPosts = checkPosts;
        }

        const total = !mymode ? resultPosts.length : resultPosts.length;
        const totalPage = Math.ceil(total/perPage);

        const data = {
            page: page,
            perPage: perPage,
            total: total,
            totalPage: totalPage
        };

        return {result: data, code: 200, message: `페이지 정보 읽기 완료`};
    }
    

    // 숙소 리스트 read
    async getPosts({nowpage, search, category, mymode, email}){
        const page = Number(nowpage);
        const perPage = 6;

        const query = {
            $and: [
                // 메인 도시 검색 (search.city가 "전체" 일 경우는 도시 검색 필터를 생략함)
                ...(search.city !== "전체" ? [{ main_location: search.city }] : []),
        
                // 허용 인원 검색 2. (기본 값 0, 0, 0)
                { max_adult: { $gte: search.adult } },
                { max_child: { $gte: search.child } },
                { max_baby: { $gte: search.baby } },
        
                // 카테고리 검색 (카테고리 인자 값이 db 카테고리 배열의 원소와 하나라도 일치해야 함)
                // (category 값이 "전체" 일 경우는 카테고리 검색 필터를 생략함)
                ...(category !== "전체" ? [{ category: { $elemMatch: { $eq: category } } }] : [])
            ]
        }
        
        // 먼저 검색 도시(시 권역 행정구역), 허용 인원 검색 결과 데이터를 구하고 최신 생성일 기준으로 정렬함
        let checkPosts;
        if(!mymode){
            checkPosts = await Post.aggregate([
                // 조건에 맞는 게시물 조회
                { $match: query },

                // Reserve 컬렉션과 조인
                {
                    $lookup: {
                        from: 'reserves',        // Reserve 컬렉션의 실제 이름(몽고 compass 확인 시 실제 컬렉션 이름은 소문자 복수형으로 쓰인다)
                        localField: 'nanoid',    // Post의 nanoid 필드
                        foreignField: 'post_nanoid', // Reserve의 post_nanoid 필드
                        as: 'reservations'       // 결과 필드 이름을 reservations 로 지어 join 했다.
                    }
                },
                // 날짜 범위에 맞는 예약 데이터 필터링
                {
                    $addFields: {
                        reservations: {
                            $filter: {
                                input: '$reservations',
                                as: 'reservation',
                                cond: {
                                    // reserve 의 start_date 가 search 의 endDate 보다 작고,
                                    // reserve 의 end_date 가 search 의 startDate 보다 크다. => 의 예약 데이터를 필터링 해야한다.
                                    // 체크인 오후 3시 이후 고정, 체크아웃 오전 11시까지 고정이므로(start_date === search.endDate 일 수 도 있고
                                    //    end_date === search.startDate 일 수도 있다.)
                                    $and: [
                                        { $lt: [ { $dateFromString: { dateString: '$$reservation.start_date' } }, new Date(search.endDate) ] },
                                        { $gt: [ { $dateFromString: { dateString: '$$reservation.end_date' } }, new Date(search.startDate) ] }
                                    ]
                                }
                            }
                        }
                    }
                },
                // 예약이 없는 게시물만 필터링
                {
                    $match: {
                        reservations: { $eq: [] }
                    }
                },
                // 페이지네이션 처리
                { $sort: { createdAt: -1 } },
                { $skip: perPage * (page - 1) },
                { $limit: perPage },
                // Author 정보 조인
                {
                    $lookup: {
                        from: 'users',        // User 컬렉션의 이름
                        localField: 'author', // Post의 author 필드
                        foreignField: '_id',  // User의 _id 필드 (관계형 db 에서의 외래키 역할)
                        as: 'authorInfo'      // 결과 필드 이름을 authorInfo 로 지은 후 join
                    }
                },
                // Author 정보 필터링 (email, name, nickname, phone, photo만 포함)
                {
                    $addFields: {
                        authorInfo: {
                            $map: {
                                input: '$authorInfo',
                                as: 'author', // 최종적으로 author 정보를 내보낼 때는 author 로 내보낸다.
                                in: {
                                    email: '$$author.email',
                                    name: '$$author.name',
                                    nickname: '$$author.nickname',
                                    phone: '$$author.phone',
                                    photo: '$$author.photo'
                                }
                            }
                        }
                    }
                },
                // Author 배열이 비어 있지 않으면, 첫 번째 요소를 선택
                {
                    $addFields: {
                        authorInfo: { $arrayElemAt: ['$authorInfo', 0] }
                    }
                }
            ]);
        } else {
            // 등록 숙소(자신의 숙소는 최대 4개까지만 등록가능하므로 굳이 페이지네이션이 필요없음
            const user = await User.findOne({email});
            checkPosts = await Post.find({author: user}).sort({createdAt: -1}).populate({
                path: 'author',
                select: "email name nickname phone photo"
            });
        }
         
        // 마지막 검색 날짜가 예약 테이블에 있는 기간과 겹칠 경우 해당 post 를 제외시킴
        // 기본 날짜 값은 "다음날"
        let resultPosts;
        if(!mymode){ resultPosts = checkPosts;
            // reserveService.availableDateCheck 서비스 함수를 두 번 사용할 경우 제외되는 post 가 있을
            // 때, perPage 에 못채우는 현상이 발생하여 상단의 aggregation 을 사용하여
            // "author 정보를 포함하여 Post와 Reserve 컬렉션을 조인하고, 예약 날짜 범위에 따라 필터링하는 방식" 을 사용함

            //resultPosts = await reserveService.availableDateCheck(
             //   {posts: checkPosts, startDate: search.startDate, endDate: search.endDate});
        } else {
            resultPosts = checkPosts;
        }

        // 기존 db 저장 방식일 때
        /*
        // images base64 인코딩 후 저장
        const formattedPosts = resultPosts.result.map(v => ({
            ...v.toObject(),
            main_image: {
                data: v.main_image.data.toString('base64'),
                contentType: v.main_image.contentType
            },
            sub_images: v.sub_images ? v.sub_images.map(i => ({
                data: i.data.toString('base64'),
                contentType: i.contentType
            })) : []
        }));
        */
        // 일반 db 일 경우 result 에 formattedPosts 넣기
        return {result: !mymode ? resultPosts : resultPosts, code: 200, message: `숙소 정보 읽기 완료`};
    }
    
    // 숙소 쓰기
    async writePost(bodyData, imageFiles){
        // 피드백 반영
        // 이미 로그인된 사용자가 해당 서비스 함수로 진입할텐데 굳이 다시 확인 불필요함
    
        // 기존 db 저장 방식
        /*
        // 메인, 서브 이미지 추출
        const mainImage = imageFiles[0];
        const subImages = imageFiles;

        // 이미지 파일 확장자 검사
        // path.extname 과 includes를 사용하여 false 인 배열 요소들을 모음.
        const nonImageFiles = imageFiles.filter(v => {
            const ext = path.extname(v.originalname).toLowerCase();
            return !['.jpg', '.jpeg', '.png'].includes(ext);
        });
        if (nonImageFiles.length > 0) {
            const error = new Error();
            Object.assign(error, {code: 400, message: "이미지 확장자가 아닌 파일이 있습니다."});
            throw error;
        }

        // 이미지 처리: width: 800 보다 클 때 리사이즈 및 압축
        const imageProcessing = async (imageBuffer) => {
            return sharp(imageBuffer).resize({width: 800, withoutEnlargement: true})
                .withMetadata(false)
                .webp({quality: 70})
                .toBuffer(); // 처리 후 버퍼 반환
        };

        // 메인, 서브 이미지 처리
        const mainImageBuf = await imageProcessing(mainImage.buffer);
        // 모든 서브 v 에서의 await 를 비동기 처리하여 정상적인 배열을 받아야하므로 Promise.all 적용
        const processedSubImages = await Promise.all(
            subImages.map(async (v) => {
                const processedBuf = await imageProcessing(v.buffer);
                return { data: processedBuf, contentType: 'image/webp' };
            })
        );
        */
        const author = await User.findOne({email: bodyData.email}, "email name nickname phone photo");
        const myPosts = await Post.find({author: author});
        if(myPosts && myPosts.length >= 4){
            const error = new Error();
            Object.assign(error, {code: 400, message: "한 계정당 4개의 숙소까지만 등록할 수 있습니다."});
            throw error;
        }

        // aws 버킷에 옮기기 전 이미지 가공 + 버킷 옮기기 + url 반환 작업(util 로 옮김)
        const fixedImageUrl = [];
        const main_image_arr = [imageFiles[0]];
        // `imageToAWS`가 배열을 반환하므로 배열을 전개해 추가한다.
        const mainImageUrl = await imageToAWS(main_image_arr);
        fixedImageUrl.push(...mainImageUrl); 

        let sub_images_arr = [];
        if (imageFiles.length > 1) {
            sub_images_arr = imageFiles.slice(1);
            const subImageUrls = await imageToAWS(sub_images_arr);
            fixedImageUrl.push(...subImageUrls); 
        }
        
        bodyData.imageUrl = fixedImageUrl;
        console.log(bodyData.imageUrl);
        // s3 이미지 url
        // main_image <-> sub_images 분리시킴
        const main_image = bodyData.imageUrl[0];
        let sub_images;
        if(bodyData.imageUrl.length > 1){
            sub_images = bodyData.imageUrl.slice(1);
        } else {
            sub_images = [];
        }

        const data = await Post.create({
            author: author,
            title: bodyData.title,
            max_adult: Number(bodyData.max_adult),
            max_child: Number(bodyData.max_child),
            max_baby: Number(bodyData.max_baby),
            main_location: bodyData.main_location,
            sub_location: bodyData.sub_location,
            contents: bodyData.contents,
            room_num: Number(bodyData.room_num),
            category: bodyData.category.length > 0 ? bodyData.category : "전체",
            host_intro: bodyData.host_intro,
            price: Number(bodyData.price),
            main_image: main_image,
            sub_images: sub_images
            // 기존 db 저장 방식
            /*
            main_image: {
                data: mainImageBuf,
                contentType: 'image/webp'
            },
            sub_images: processedSubImages
            */
        });
        return {data: data, code: 200, message: `숙소 등록 완료`};
    };

    // 숙소 수정 (숙소의 bodyData.nanoid 로 숙소 찾음)
    // mode 값이 추가로 담겨져야 함!!!(1: 메인 이미지, 2: 서브, 3: 둘 다 교체, 0. 교체 안함)
    async putPost(bodyData, imageFiles){
        // 피드백 반영
        // 이미 로그인된 사용자가 해당 서비스 함수로 진입할텐데 굳이 다시 확인 불필요함
        const nanoid = bodyData.nanoid;
        const post = await Post.findOne({nanoid}).populate('author').populate({
            path: 'author',
            select: "email name nickname phone photo"
        });
        if(!post) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "숙소 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        if(post.author.email !== bodyData.email) { 
            const error = new Error();
            Object.assign(error, {code: 403, message: "숙소 호스트가 아닙니다. 다시 확인해주세요."});
            throw error;
        }

        // 수정할 이미지가 있을 때 (if)
        if(imageFiles.length > 0){
            // 1. 기존 post 이미지 url 을 s3 버킷에서 삭제
            // main_image 수정: 1, sub_images 수정: 2, 둘 다 수정: 3
            let deleteFiles = [];
            if(bodyData.mode === "1"){
                if(imageFiles.length > 1){
                    const error = new Error();
                    Object.assign(error, {code: 400, message: "메인 이미지는 2장 이상이 될 수 없습니다."});
                    throw error;
                }
                deleteFiles.push(post.main_image);
            } else if (bodyData.mode === "2"){             
                deleteFiles = post.sub_images;
            } else if(bodyData.mode === "3"){
                // sub_images 배열의 모든 값과 메인 이미지 를 push 한다.
                deleteFiles.push(...post.sub_images, post.main_image);
            }
            await deleteImageFromAWS(deleteFiles);
            // 2. 새로운 이미지를 sharp 처리
            // 3. 새로운 이미지를 버킷에 넣고 url 반환
            // 4. url 을 가공해서 bodyData.main_image, bodyData.sub_images 에 삽입
            // aws 버킷에 옮기기 전 이미지 가공 + 버킷 옮기기 + url 반환 작업(util 로 옮김)
            const fixedImageUrl = [];
            const main_image_arr = [imageFiles[0]];
            // `imageToAWS`가 배열을 반환하므로 배열을 전개해 추가한다.
            const mainImageUrl = await imageToAWS(main_image_arr);
            fixedImageUrl.push(...mainImageUrl); 

            let sub_images_arr = [];
            if (imageFiles.length > 1) {
                sub_images_arr = imageFiles.slice(1);
                const subImageUrls = await imageToAWS(sub_images_arr);
                fixedImageUrl.push(...subImageUrls); 
            }
            // s3 이미지 url
            // main_image 수정: 1, sub_images 수정: 2, 둘 다 수정: 3
            if(bodyData.mode === "1"){
                bodyData.main_image = fixedImageUrl[0];
            } else if(bodyData.mode === "2"){
                bodyData.sub_images = fixedImageUrl;
            } else if(bodyData.mode === "3"){
                bodyData.main_image = fixedImageUrl[0];
                bodyData.sub_images = fixedImageUrl.slice(1);
            }
        } 

        const update_at = newDate();
        bodyData.update_at = update_at;

        Reflect.deleteProperty(bodyData, "email");
        Reflect.deleteProperty(bodyData, "author");
        Reflect.deleteProperty(bodyData, "nanoid");
        // main_image 수정: 1, sub_images 수정: 2, 둘 다 수정: 3
        Reflect.deleteProperty(bodyData, "mode");

        await Post.updateOne({nanoid}, bodyData);
        return {code: 200, message: `숙소 수정 완료`};
    }

    // 숙소 삭제 (숙소의 bodyData.nanoid 로 숙소 찾음)
    async delPost({nanoid}){
        // 피드백 반영
        // 이미 로그인된 사용자가 해당 서비스 함수로 진입할텐데 굳이 다시 확인 불필요함
        const post = await Post.findOne({nanoid}).populate('author');
        if(!post) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "숙소 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }

        // 지우는 숙소가 다가오는 여행 중 아직 시작 안한 reserve 가 있을 경우에는 해당 reserve 도 제거
        // 사진 제거 작업 필요
        const query = {
            // db 의 start_date 가 현재 시간 보다 크다
            $and: [
              { // 문자열로 저장된 날짜를 Date 로 변환
                $expr: {
                  $gt: [
                    { $dateFromString: { dateString: "$start_date" } },
                    new Date()
                  ]
                }
              },
              {
                post_nanoid: nanoid
              }
            ]
        };
        const delReserve = await Reserve.find(query);
        if(delReserve && delReserve.length > 0){
            // 사진 삭제 로직 제거(지난 여행에서 확인 필요함)
            await Reserve.deleteMany(query);
        }

        await Post.deleteOne({nanoid});
        return {code: 200, message: `숙소 삭제 완료`};
    }

    // 숙소 읽기 (숙소의 bodyData.nanoid 로 숙소 찾음)
    async getPost({nanoid}){
        // 피드백 반영
        // 이미 로그인된 사용자가 해당 서비스 함수로 진입할텐데 굳이 다시 확인 불필요함
        const post = await Post.findOne({nanoid}).populate({
            path: 'author',
            select: "email name nickname phone photo"
        });
        if(!post){
            const error = new Error();
            Object.assign(error, {code: 400, message: "숙소 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        return {data: post, code: 200, message: '숙소 읽기 완료'};
    }
}

const postService = new PostService();
module.exports = postService;