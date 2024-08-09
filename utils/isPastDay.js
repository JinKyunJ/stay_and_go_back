const isPastDay = (endDateStr) => {
    const nowDate = new Date();
    const endDate = new Date(endDateStr);

    return nowDate > endDate;
};

module.exports = isPastDay;