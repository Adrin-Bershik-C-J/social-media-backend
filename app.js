const express = require("express");
const cors = require("cors");
// const passport = require("passport");
// const cookieSession = require("cookie-session");
require("dotenv").config();

const app = express();

const allowedOrigins = ["http://localhost:5000", "https://adrinet.vercel.app"];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
// app.use(passport.initialize());
// app.use(passport.session());

// app.use(cookieSession({name:"session",keys:[]}))

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/comments", require("./routes/commentRoutes"));

app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
