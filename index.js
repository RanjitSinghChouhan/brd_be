// let { spawn }=require('child_process');

// const lsProcess = spawn('apt-get install libgtk2.0-0 libsm6 -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2');
// lsProcess.stdout.on('data', data => {
//     console.log(`stdout:\n${data}`);
// })
// lsProcess.stderr.on("data", (data) => {
//     console.log(`stdout: ${data}`);
// });
// lsProcess.on('exit', code => {
//     console.log(`Process ended with ${code}`);
// })

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path");
const CORS = require("cors");
const morgan = require("morgan");
const fs = require("fs");
var models = require("./models");
var rfs = require("rotating-file-stream");
const moment = require("moment-timezone");
const responseTime = require("./middlewares/responseTime");
var port = process.env.PORT || 8000;
require("dotenv").config();

app.use(express.static(path.join(__dirname, "assets")));
app.use(express.static("public"));
app.use(responseTime);

var accessLogStream = rfs.createStream(
  `${moment(`${new Date().toISOString()}`).format("DD-MM-YYYY")}/access.log`,
  {
    interval: "1d", // rotate daily
    path: path.join(__dirname, "/assets/logs/"),
  }
);
// var accessLogStream = fs.createWriteStream(path.join(__dirname + `/assets/logs/`, 'access.log'), { flags: 'a' })

app.use(
  morgan(
    function (tokens, req, res) {
      let info = "INFO";
      let app = req.get("applicationType");
      let appType = "web-app-byrds";
      if (
        tokens.status(req, res) == 500 ||
        tokens.status(req, res) == 400 ||
        tokens.status(req, res) == 401 ||
        tokens.status(req, res) == 403 ||
        tokens.status(req, res) == 404
      ) {
        info = "ERROR";
      }

      let str = `{"byrds","IND","${
        req.socket.remoteAddress
      }","${appType}","${tokens.method(req, res)}","${tokens.url(
        req,
        res
      )}", ${tokens.status(req, res)},${tokens["response-time"](req, res)} ms}`;
      return [
        tokens.date(req, res),
        info,
        str,
        `payload : ${JSON.stringify(req.body)}`,
        `error : ${req.error}`,
        `success : ${req.success}`,
      ].join(" ");
    },
    { stream: accessLogStream }
  )
);

app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: false,
    parameterLimit: 50000,
  })
);
app.use(bodyParser.json({ limit: "50mb" }));
app.use(CORS());

var allRoutes = require("path").join(__dirname, "/routes/" + "admin");
fs.readdirSync(allRoutes).forEach(function (file) {
  var routeFiles = require(allRoutes + "/" + file);
  app.use("/" + "admin", routeFiles);
});
var allRoutes = require("path").join(__dirname, "/routes/" + "adminPortal");
fs.readdirSync(allRoutes).forEach(function (file) {
  var routeFiles = require(allRoutes + "/" + file);
  app.use("/" + "adminPortal", routeFiles);
});

var allRoutes = require("path").join(__dirname, "/routes/" + "leaderBoard");
fs.readdirSync(allRoutes).forEach(function (file) {
  var routeFiles = require(allRoutes + "/" + file);
  app.use("/", routeFiles);
});

app.get("/test", (req, res) => {
  return res.send("Hello");
});

models.sequelize
  .sync()
  .then(function () {
    console.log("Database looks fine");
  })
  .catch(function (err) {
    console.log(err);
    console.log("Something went wrong with the database");
  });

app.listen(port);

module.exports = app;
