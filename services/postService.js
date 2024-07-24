const {User, Post} = require('../models');
const newDate = require('../utils/newDate');
// 이미지 해상도 조절
const sharp = require('sharp');
// 이미지 확장자 검사에 쓰일 예정
const path = require('path');
const reserveService = require('./reserveService');

class PostService {
    getNextDate = () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date;
    }
    getDateFormat = (newDate) => {
        const startYear = newDate.getFullYear();
        const startMonth = String(newDate.getMonth() + 1).padStart(2, '0');
        const startDay = String(newDate.getDate()).padStart(2, '0');
        return `${startYear}-${startMonth}-${startDay}`;
    }

    // 페이지 정보 read (완료)
    async getPostsPage({search, category}){
        // 첫 페이지 진입이므로 1 고정
        const page = 1;
        const perPage = 2;
        
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
        const checkPosts = await Post.find(query);

        // 마지막 검색 날짜가 예약 테이블에 있는 기간과 겹칠 경우 해당 post 를 제외시킴
        // 기본 날짜 값은 "다음날"
        const resultPosts = await reserveService.availableDateCheck(
            {posts: checkPosts, startDate: search.startDate, endDate: search.endDate});

        const total = resultPosts.result.length;
        const totalPage = Math.ceil(total/perPage);

        const data = {
            page: page,
            perPage: perPage,
            total: total,
            totalPage: totalPage
        };

        return {result: data, code: 200, message: `페이지 정보 읽기 완료`};
    }
    

    // 숙소 리스트 read (완료)
    async getPosts({nowpage, search, category}){
        const page = Number(nowpage);
        const perPage = 2;

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
        const checkPosts = await Post.find(query).sort(({create_at: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');

        // 마지막 검색 날짜가 예약 테이블에 있는 기간과 겹칠 경우 해당 post 를 제외시킴
        // 기본 날짜 값은 "다음날"
        const resultPosts = await reserveService.availableDateCheck(
            {posts: checkPosts, startDate: search.startDate, endDate: search.endDate});
        
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
        
        return {result: formattedPosts, code: 200, message: `숙소 정보 읽기 완료`};
    }

    // 내 숙소 중 1 페이지 또는 특정 페이지의 숙소 리스트 + 페이지 가져오기
    async getMyposts({email, nowpage}){ 
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "호스트 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const page = Number(nowpage);
        const perPage = 10;

        // skip(n): 처음 n개의 요소를 건너뜀
        // limit(n): n개의 요소만 가져옴
        const posts = await Post.find({author: author}).sort(({createAt: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');

        // pupulate 를 추가하여 User 의 objectID 와 같은 데이터를 JOIN
        const total = await Post.countDocuments({author: author});
        const totalPage = Math.ceil(total/perPage);


        const data = {
            page: page,
            perPage: perPage,
            total: total,
            posts: posts,
            totalPage: totalPage
        };
        return data;
    }
    
    // 숙소 쓰기 (호스트 정보 빼고 완료)
    async writePost(bodyData, imageFiles){
        // 숙소 정보에 추가로 로그인된 유저 이메일 요구
        /*
        const author = await User.findOne({email: bodyData.email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }*/

        // 메인, 서브 이미지 추출
        const mainImage = imageFiles[0];
        const subImages = imageFiles;

        // 이미지 파일 확장자 검사
        // path.extname 과 includes를 사용하여 false 인 배열 요소들을 모음.
        const nonImageFiles = imageFiles.filter(v => {
            const ext = path.extname(v.originalname).toLowerCase();
            return !['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });
        if (nonImageFiles.length > 0) {
            const error = new Error();
            Object.assign(error, {code: 400, message: "이미지 확장자가 아닌 파일이 있습니다."});
            throw error;
        }

        // 이미지 처리: width: 1200 보다 클 때 리사이즈 및 압축
        const imageProcessing = async (imageBuffer) => {
            return sharp(imageBuffer).resize({width: 1200, withoutEnlargement: true})
                .jpeg({quality: 90})
                .toBuffer(); // 처리 후 버퍼 반환
        };

        // 메인, 서브 이미지 처리
        const mainImageBuf = await imageProcessing(mainImage.buffer);
        // 모든 서브 v 에서의 await 를 비동기 처리하여 정상적인 배열을 받아야하므로 Promise.all 적용
        const processedSubImages = await Promise.all(
            subImages.map(async (v) => {
                const processedBuf = await imageProcessing(v.buffer);
                return { data: processedBuf, contentType: v.mimetype };
            })
        );

        const data = await Post.create({
            // author: author,
            title: bodyData.title,
            max_adult: Number(bodyData.max_adult),
            max_child: Number(bodyData.max_child),
            max_baby: Number(bodyData.max_baby),
            main_location: bodyData.main_location,
            sub_location: bodyData.sub_location,
            contents: bodyData.contents,
            room_num: Number(bodyData.room_num),
            category: bodyData.category,
            host_intro: bodyData.host_intro,
            option: bodyData.option,
            price: Number(bodyData.price),
            main_image: {
                data: mainImageBuf,
                contentType: mainImage.mimetype
            },
            sub_images: processedSubImages
        });
        return {data: data, code: 200, message: `숙소 등록 완료`};
    };

    // 숙소 수정
    async putPost(bodyData){
        // 숙소 정보에 추가로 로그인된 유저 이메일 요구
        const author = await User.findOne({email: bodyData.email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const post = await Post.findOne({nanoid: bodyData.nanoid}).populate('author');
        if(!post) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "숙소 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        if(post.author.email !== email) { 
            const error = new Error();
            Object.assign(error, {code: 403, message: "숙소 호스트가 아닙니다. 다시 확인해주세요."});
            throw error;
        }
        const update_at = newDate();
        bodyData.update_at = update_at;
        const nanoid = bodyData.nanoid;
        Reflect.deleteProperty(bodyData, "email");
        Reflect.deleteProperty(bodyData, "nanoid");
        const data = await Post.updateOne({nanoid}, bodyData);
        return {data: data, code: 200, message: `숙소 수정 완료`};
    }

    // 숙소 삭제
    async delPost({email, nanoid}){
        const author = await User.findOne({email});
        if(!author) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "유저 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        const post = await Post.findOne({nanoid}).populate('author');
        if(!post) { 
            const error = new Error();
            Object.assign(error, {code: 400, message: "숙소 정보를 가져오지 못했습니다. 다시 확인해주세요."});
            throw error;
        }
        if(post.author.email !== email) { 
            const error = new Error();
            Object.assign(error, {code: 403, message: "숙소 작성자가 아닙니다. 다시 확인해주세요."});
            throw error;
        }
        const data = await Post.deleteOne({nanoid});
        return {data: data, code: 200, message: `숙소 삭제 완료`};
    }

    // 숙소 읽기
    async getPost({nanoid}){
        const post = await Post.findOne({nanoid}).populate('author');
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