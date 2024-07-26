const Code = require('./data/code');

module.exports = (code) => {
    let text = "";
    if(code === Code.PASSWORD){
        const possible = Code.PASSWORD_POSSIBLE;
        for(let i = 0; i < 12; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
    }
    else if(code === Code.VERIFYCODE){
        const possible = Code.VERIFYCODE_POSSIBLE;
        for(let i = 0; i < 6; i++ ) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
    } else {
        console.log("사용자 에러 - 지정된 코드가 입력되지 않았습니다.");
    }
    return text;
}