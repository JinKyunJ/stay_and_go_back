const parseCustomDate = (dateString) => {
    // 날짜와 시간 부분을 추출
    const [datePart, timePart] = dateString.split(' 오후 ').length === 2
        ? dateString.split(' 오후 ')
        : dateString.split(' 오전 ');

    // 날짜 부분을 처리
    const [day, month, year] = datePart.split('.').map(part => part.trim());
    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // 시간 부분을 처리
    const time = timePart.replace(/ /g, ':'); // 공백을 콜론으로 변환
    const dateTimeString = `${formattedDate}T${time}`;

    return new Date(dateTimeString);
};

module.exports = parseCustomDate;