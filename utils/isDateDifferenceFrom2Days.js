const isDateDifferenceFrom2Days = (startDateStr) => {
    const nowDate = new Date();
    const startDate = new Date(startDateStr);
    // 두 날 사이 차이를 밀리초로 계산
    const timeDiff = startDate - nowDate;
    // 일(day)로 변환
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    // 날 차이가 2일 보다 작거나 같고 0일보다 크거나 같은지 비교 true or false
    return daysDiff <= 2 && daysDiff >= 0;
};

module.exports = isDateDifferenceFrom2Days;