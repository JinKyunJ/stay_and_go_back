module.exports = () => {
    const options = {
        timeZone: 'Asia/Seoul',
        hour12: true
    };
    return new Date().toLocaleString('ko-KR', options);
}