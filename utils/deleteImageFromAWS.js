const { S3 } = require('@aws-sdk/client-s3');
// AWS S3 클라이언트 설정 (v3)
const s3 = new S3({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
// (!!!) forEach, find, filter, map 등 배열 함수는
// 비동기 작업을 기다리지 않아 Promise.all 을 같이 사용해야 한다.
const deleteImageFromAWS = async (deleteFiles) => {
    const deleteProcess = deleteFiles.map((v) => {
        const deleteKey = v.slice(v.lastIndexOf('uploads/'));
        const params = {
            Bucket: 'gwsimagebucket2', 
            Key: deleteKey       
        };
        // 파일 삭제 요청
        return s3.deleteObject(params);
    })
    const processing = await Promise.all(deleteProcess);
    return processing;
};

module.exports = deleteImageFromAWS;