// 이미지 해상도 조절
const sharp = require('sharp');
// 이미지 확장자 검사에 쓰일 예정
const path = require('path');
const { S3 } = require('@aws-sdk/client-s3');
// AWS S3 클라이언트 설정 (v3)
const s3 = new S3({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const imageToAWS = async (imageFiles) => {
    // 이미지 처리 및 가공 (용량 줄이고 리사이징 등) 은 동일함(db, s3 업로드할 때)
    // 단 return 할 때만 주의(s3 에 맞는 프로퍼티 체크)
    const imageProcessing = async (imageBuffer) => {
        return sharp(imageBuffer).resize({width: 800, withoutEnlargement: true})
            .withMetadata(false)
            .webp({quality: 70})
            .toBuffer(); // 처리 후 버퍼 반환
    };
    
    // 파일들을 S3에 업로드
    const keyFiles = [];
    const s3Uploads = imageFiles.map(async (v) => {
        const processedBuf = await imageProcessing(v.buffer);
        const originalName = path.basename(v.originalname);
        const fileName = originalName.slice(0, originalName.lastIndexOf('.')).concat(".webp");
        
        const fileKey = `uploads/${Date.now()}_${fileName}`;
        keyFiles.push(fileKey);
        const params = {
            Bucket: 'gwsimagebucket2',
            Key: fileKey,
            Body: processedBuf,
            ContentType: 'image/webp',
            ACL: 'public-read'
        };

        return s3.putObject(params);
    });

    const uploadResults = await Promise.all(s3Uploads);

    // s3 추가 정보
    const imageUrl = uploadResults.map((v) => {
        return `https://${'gwsimagebucket2'}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    });
    const fixedImageUrl = keyFiles.map((v,i) => {
        return imageUrl[i].concat(v)
    })

    return fixedImageUrl;
};

module.exports = imageToAWS;