var express = require("express");
var router = express.Router();
var leaderBoardController = require("../../controllers/leaderBoardController");
var {jwtBearerAuth }= require("../../middlewares/jwtBearerAuth");

router.get("/company/:name/echoEcoCall/view/:id", leaderBoardController.echoEcoCallView);
router.get("/company/:name/echoEcoCall/:id", leaderBoardController.echoEcoCall); ///only active echoechocall not deactive
router.post("/getAllCompaniesByrdsPoints",leaderBoardController.getAllCompaniesByrdsPoints);///adding rank your company leader bords
router.get("/company/:companyName/totalEchoPlanted", leaderBoardController.totalEchoPlanted);
router.post("/getCompanyDetailsByCompanyId", leaderBoardController.getCompanyDetailsByCompanyId);
router.post("/company/:companyName/getDetailsByCompanyName", leaderBoardController.getDetailsByCompanyName);
router.get("/getTotalTreeAlgaeAllCompanies", leaderBoardController.getTotalTreeAlgaeAllCompanies);

router.get('/getNotificationFlag',jwtBearerAuth, leaderBoardController.getNotificationFlag);
router.get("/getNotifications",jwtBearerAuth, leaderBoardController.getNotifications);

module.exports = router;
