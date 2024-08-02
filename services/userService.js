const {User, Verify, Post, Reserve} = require('../models');
const code = require('../utils/data/code');
const generateRandomValue = require('../utils/generate-random-value');
const sendEmail = require('../utils/nodemailer');
const newDate = require('../utils/newDate');
// sha256 단방향 해시 비밀번호 사용
const crypto = require('crypto');

class UserService {
    /* create 완료 */
    async createUser(bodyData){
        const {email} = bodyData;
        
        // 이메일 인증이 정상적으로 되었는지(is_verified === true) 검사
        const verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
        if(!verify){
            const error = new Error();
            Object.assign(error, {code: 401, message: "이메일 인증을 먼저 진행해주세요."});
            throw error;
        }
        if(!verify.is_verified){
            const error = new Error();
            Object.assign(error, {code: 401, message: "이메일 인증이 되지 않았습니다. 메일에서 인증 코드를 확인해주세요."});
            throw error;
        }
            
        // 닉네임 중복 확인
        const {nickname} = bodyData;
        const nameUser = await User.findOne({nickname: nickname});
        if(nameUser){
            const error = new Error();
            Object.assign(error, {code: 400, message: "중복된 닉네임입니다. 닉네임을 변경해주세요."});
            throw error;
        };
        // 전화번호 중복 확인
        const {phone} = bodyData;
        const phoneUser = await User.findOne({phone});
        if(phoneUser){
            const error = new Error();
            Object.assign(error, {code: 400, message: "중복된 전화번호입니다. 전화번호를 변경해주세요."});
            throw error;
        };

        // 이메일 인증이 되었고 회원가입을 진행하므로 더 이상 쓸모가 없으므로 제거
        await Verify.deleteMany(verify);

        // sha256 단방향 해시 비밀번호 사용
        const hash = crypto.createHash('sha256').update(bodyData.password).digest('hex');
        const newUser = await User.create({
            email: bodyData.email,
            name: bodyData.name,
            nickname: bodyData.nickname,
            phone: bodyData.phone,
            password: hash,
            is_admin: false
        });
        return {code: 200, message: `${bodyData.email} 계정으로 회원가입이 성공하였습니다.`};
    }

    // user ID 찾기 (이름과 휴대전화) (완료)
    async findUserID(bodyData){
        const {name, phone} = bodyData;
        // name, phone 확인
        const user = await User.findOne({name, phone});
        if(!user){
            const error = new Error();
            Object.assign(error, {data: [], code: 404, message: "이름과 전화번호로 조회된 회원이 없습니다."})
            throw error;
        }
        console.log(user);
        return {data: user.email, code: 200, message: "유저 ID가 성공적으로 조회되었습니다. ID를 확인해주세요!"};
    };

    // 인증 요청 분리 *(비밀번호 찾기 - 이메일이 존재해야 다음 스텝으로 넘어가야 함) (완료)
    async pwfindVerify({email}){
        // 인증 코드 받는 이메일이 이미 존재하는지 검사
        // 이메일 인증이 정식으로 들어갈 때 createUser 에 있는 이메일 존재 검사는 필요없음.
        const user = await User.findOne({email});
        // 기존 회원가입 인증 요청 부분과의 차이점
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 400, message: "회원가입 되어 있지 않은 이메일입니다."});
            throw error;
        }

        // 기존 verify 데이터가 있을 시 새 secret 으로 변경
        const newSecret = generateRandomValue(code.PASSWORD);
        const verify = await Verify.findOne({data: email, code: code.PASSWORD});
        if(verify){
            await Verify.updateOne({data: email, code: code.PASSWORD, secret: newSecret});
        }
        else{
            // 기존 verify 가 없을 때 새 verify document 생성
            await Verify.create({data: email, code: code.PASSWORD, secret: newSecret});
        }

        // 이메일 전송
        const subject = "비밀번호 찾기 이메일 인증 코드를 확인해주세요.";
        const text = `이메일 인증 코드 : ${newSecret}`;
        const result = await sendEmail(email, subject, text);
        if(result === 1){
            return {code: 200, message: "인증 코드가 정상 발송되었습니다."};
        }
        else{
            const error = new Error();
            Object.assign(error, {code: 400, message: "메일 인증 코드가 발송되지 않았습니다."})
            throw error;
        }
    }

    // 회원 가입 메일 인증 코드 발급 (완료)
    async joinVerify({email}){
        // 인증 코드 받는 이메일이 이미 존재하는지 검사
        // 이메일 인증이 정식으로 들어갈 때 createUser 에 있는 이메일 존재 검사는 필요없음.
        const user = await User.findOne({email});
        if(user){
            const error = new Error();
            Object.assign(error, {code: 400, message: "이미 회원가입 되어 있는 이메일입니다."});
            throw error;
        }

        // 기존 verify 데이터가 있을 시 새 secret 으로 변경
        const newSecret = generateRandomValue(code.VERIFYCODE);
        const verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
        if(verify){
            await Verify.updateOne({data: email, code: code.VERIFYCODE, secret: newSecret});
        }
        else{
            // 기존 verify 가 없을 때 새 verify document 생성
            await Verify.create({data: email, code: code.VERIFYCODE, secret: newSecret});
        }

        // 이메일 전송
        const subject = "회원가입 이메일 인증 코드를 확인해주세요.";
        const text = `이메일 인증 코드 : ${newSecret}`;
        const result = await sendEmail(email, subject, text);
        if(result === 1){
            return {code:200, message: "인증 코드가 정상 발송되었습니다."};
        }
        else{
            const error = new Error();
            Object.assign(error, {code: 400, message: "메일 인증 코드가 발송되지 않았습니다."})
            throw error;
        }
    }

    // 인증 코드 확인 요청 (완료)
    async joinVerifyConfirm({email, secret}){
        // verify document find
        // 6 자리는 회원가입 인증 코드 요청 길이
        let verify;
        // 회원가입에서 인증 코드 요청했었는지, 비밀번호 찾기에서 인증 코드 요청했었는지 판단 변수
        let myCode;
        if(secret.length === 6){
            myCode = code.VERIFYCODE;
            verify = await Verify.findOne({data: email, code: code.VERIFYCODE});
            if(!verify){
                const error = new Error();
                Object.assign(error, {code: 400, message: "회원가입 인증 코드를 요청하지 않은 이메일 입니다."});
                throw error;
            }
        } // 8 자리는 비밀번호 찾기 인증 코드 요청 길이
        else if(secret.length === 8){
            myCode = code.PASSWORD;
            verify = await Verify.findOne({data: email, code: code.PASSWORD});
            if(!verify){
                const error = new Error();
                Object.assign(error, {code: 400, message: "비밀번호 찾기 인증 코드를 요청하지 않은 이메일 입니다."});
                throw error;
            }
        }

        
        // 인증 코드 비교 진행( 정상 인증 코드로 판단 시 is_verified 를 true 로 변경하여 회원가입 절차가 가능하도록 함)
        if(secret === verify.secret){
            // 회원 가입에서 요청했었을 때
            if(myCode === code.VERIFYCODE){
                await Verify.updateOne({data: email, code: code.VERIFYCODE},{
                    is_verified: true
                });
                // 회원 가입은 인증 요청 누르고 일단 체크만 하고, 회원 등록 버튼을 눌렀을 때 인증 데이터 삭제됨
            } // 비밀번호 찾기에서 요청했었을 때
            else if(myCode === code.PASSWORD){
                // 비밀번호 찾기는 비밀번호 찾기 요청 버튼을 눌렀을 때 인증 데이터 삭제하여야 함
                await Verify.deleteMany({data: email, code: code.PASSWORD});
            }
            return {code: 200, message: "이메일 인증 코드가 정상적으로 확인되었습니다."}
        } else {
            if(myCode === code.VERIFYCODE){
                await Verify.updateOne({data: email, code: code.VERIFYCODE},{
                    is_verified: false
                });
            } else if(myCode === code.PASSWORD){
                await Verify.updateOne({data: email, code: code.PASSWORD},{
                    is_verified: false
                });
            }
            const error = new Error();
            Object.assign(error, {code: 400, message: "이메일 인증 코드를 다시 확인해주세요."});
            throw error;
        }
    }

    // 전체 유저 조회(관리자)
    async findAllUser(){
        // 원하는 속성들만 찾기
        const users = await User.find({}, 'email name nickname phone photo nanoid is_admin create_at update_at');
        return users;
    }

    // findOne by email
    async findByEmail({email}) {
        const user = await User.findOne({email}, 'email name nickname phone photo nanoid is_admin create_at update_at');
        if(!user){
            const error = new Error();
            Object.assign(error, {data: [], code: 404, message: "이메일로 조회된 회원이 없습니다."})
            throw error;
        }
        return {data: user, code: 200, message: "사용자 조회 완료"};
    }

    // update by email (nickname, password, phone 수정 가능)
    async updateByEmail({email}, bodyData){
        // 닉네임 중복 체크 후 업데이트
        if(bodyData.nickname){
            const {nickname} = bodyData;
            const nameUser = await User.findOne({nickname: nickname});
            if(nameUser){
                const error = new Error();
                Object.assign(error, {code: 400, message: "중복된 닉네임입니다. 닉네임을 변경해주세요."});
                throw error;
            };
        }
        // 전화번호 중복 체크 후 업데이트
        if(bodyData.phone){
            const {phone} = bodyData;
            const phoneUser = await User.findOne({phone});
            if(phoneUser){
                const error = new Error();
                Object.assign(error, {code: 400, message: "중복된 전화번호입니다. 전화번호를 변경해주세요."});
                throw error;
            };
        }
        
        const user = await User.findOne({email});
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 404, message: "이메일로 조회된 회원이 없습니다."})
            throw error;
        } else {
            // sha256 단방향 해시 비밀번호 사용
            if(bodyData.password){
                // sha256 단방향 해시 비밀번호 사용
                const hash = crypto.createHash('sha256').update(bodyData.password).digest('hex');
                bodyData.password = hash
            }
            // update 날짜 부여
            bodyData.update_at = newDate();

            // 수정할 수 없는 정보들은 프로퍼티 제거
            Reflect.deleteProperty(bodyData, "email");
            Reflect.deleteProperty(bodyData, "nanoid");
            Reflect.deleteProperty(bodyData, "is_admin");
            Reflect.deleteProperty(bodyData, "name");

            await User.updateOne(user, bodyData);
            return {code: 200, message: `${email} 사용자 수정 동작 완료`};
        }
    }

    // delete by email
    // 회원 탈퇴 시 유저 -> 외래 키 -> post, reserve 제거
    async deleteByEmail({email}) {
        const user = await User.findOne({email});
        if(!user){
            const error = new Error();
            Object.assign(error, {code: 404, message: "이메일로 조회된 회원이 없습니다."})
            throw error;
        } else {
            await Post.deleteMany({author: user});
            await Reserve.deleteMany({author: user});
            await User.deleteOne(user);
            
            return {code: 200, message: `${email} 사용자 삭제 동작 완료`};
        }
    }
}

const userService = new UserService();
module.exports = userService;