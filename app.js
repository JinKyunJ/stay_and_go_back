const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// login strategy
const local = require("./strategy/loginStrategy");
const jwtlocal = require("./strategy/jwtStrategy");
const jwtMiddleware = require("./middlewares/jwtMiddleware");

// server router
const userRouter = require("./routes/userRouter");
const loginRouter = require("./routes/loginRouter");
const postRouter = require("./routes/postsRouter");
const reserveRouter = require("./routes/reserveRouter");

// multer 설정 가져오기
const upload = require("./utils/multerConfig");

const app = express();

// dotenv
dotenv.config();

// CORS 설정
const corsOptions = {
  origin: [
    "https://stay-and-go-front.vercel.app", // Vercel에서 배포된 프론트엔드 URL
    "http://localhost:3001",
  ], // 로컬 개발용
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // 허용할 HTTP 메서드
  credentials: true, // 쿠키 허용 설정
  optionsSuccessStatus: 204, // 일부 브라우저에서 CORS 요청이 실패하는 것을 방지
};
app.use(cors(corsOptions));

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

// passport initialize
app.use(passport.initialize());
passport.use(local);
passport.use(jwtlocal);
app.use(jwtMiddleware);

// mongoose connect
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DBNAME,
  })
  .then((res) => console.log(`mongoDB ${process.env.MONGO_DBNAME} collection connected`))
  .catch((err) => console.log(err));
mongoose.connection.on("err", (err) => {
  console.log("mongoDB err");
});

// user, login, post router
app.use("/users", userRouter);
app.use("/login", loginRouter);
app.use("/post", postRouter);
app.use("/reserve", reserveRouter);

// 모든 경로에 대해 index.html 반환
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 예외 error 핸들러
app.use((err, req, res, next) => {
  if (err.code === 401) {
    console.log(err.code + " Unauthorized error 발생 : " + err.message);
    return res.status(401).json(err);
  } else if (err.code === 404) {
    console.log(err.code + " Not Found error 발생 : " + err.message);
    return res.status(404).json(err);
  } else {
    console.log("400 Bad Request error 발생 : " + err.message);
    return res.status(400).json(err);
  }
});

// 서버 시작
app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} server port connected`);
});
