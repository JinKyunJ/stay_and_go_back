const {User, Post, Like} = require('../models');
const newDate = require('../utils/newDate');
// 이미지 해상도 조절
const sharp = require('sharp');
// 이미지 확장자 검사에 쓰일 예정
const path = require('path');

class PostService {
    // 전체 숙소 중 1 페이지 또는 특정 페이지의 숙소 리스트 + 페이지 가져오기 (완료)
    async getAllposts({nowpage}){
        const page = Number(nowpage);
        const perPage = 2;

        const posts = await Post.find().sort(({create_at: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');
        
        const total = await Post.countDocuments();
        const totalPage = Math.ceil(total/perPage);
    
        // images base64 인코딩 후 저장
        const formattedPosts = posts.map(v => ({
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

        const data = {
            page: page,
            perPage: perPage,
            total: total,
            posts: formattedPosts,
            totalPage: totalPage
        };

        return data;
    }

    // 전체 숙소 중 카테고리가 적용된 1 페이지 또는 특정 페이지의 숙소 리스트 + 페이지 가져오기
    async getAllpostsCategory({nowpage, category}){
        const page = Number(nowpage);
        const perPage = 10;
        // category 가 없을 때와 아닐 때 구분하여 처리
        let posts = [];

        console.log("Asdf")

        if(category.length > 0){
            // ing
        } else {
            posts = await Post.find().sort(({create_at: -1})).skip(perPage * (page - 1))
            .limit(perPage).populate('author');
        }
        
        const total = await Post.countDocuments();
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