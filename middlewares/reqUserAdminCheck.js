module.exports = (req, res, next) => {
    if(!req.user){
        const error = new Error();
        Object.assign(error, {code: 401, message: "로그인하지 않은 사용자입니다. (server check)"})
        throw error;
    } else if(req.user && !req.user.is_admin){
        const error = new Error();
        Object.assign(error, {code: 402, message: "관리자가 아닙니다. (server check)"})
        throw error;
    }
    next();
}