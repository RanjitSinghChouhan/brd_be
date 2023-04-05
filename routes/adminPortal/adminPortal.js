var express = require("express");
var router = express.Router();
var adminPortalController = require("../../controllers/adminPortalController");
var { jwtBearerAuth, jwtBearerAuthToken } = require("../../middlewares/jwtBearerAuth");

router.post("/getAdminReports", adminPortalController.getAdminReports); // not required
router.get("/getAdminDetails", jwtBearerAuth, adminPortalController.getAdminDetails);
router.get('/getCompanies', jwtBearerAuth, adminPortalController.getCompanies)
router.get('/getCompanyDetail', adminPortalController.getCompanyDetail)
router.post("/getEchoEcosByCompanyId", jwtBearerAuth, adminPortalController.getEchoEcosByCompanyId);
router.post("/updatePlantation", jwtBearerAuth, adminPortalController.updatePlantation);
router.get("/getRequestedReports", adminPortalController.getRequestedReports);
router.post("/updateRequestedReports", jwtBearerAuth, adminPortalController.updateRequestedReports);

router.post("/login", adminPortalController.loginUser);
router.post("/registerCompany", adminPortalController.registerCompany);

router.post("/addSite", jwtBearerAuth, adminPortalController.addSite);
router.get("/getSites", adminPortalController.getSites);
router.post("/updateSite", jwtBearerAuth, adminPortalController.updateSite);
router.get("/isSiteExist", adminPortalController.isSiteExist);
router.get("/isEmailExist", adminPortalController.isEmailExist);
router.post("/sendOtp", adminPortalController.sendOtp);
router.post(
    "/forgotPassword/verifyEmail",
    adminPortalController.forgotPasswordVerifyEmailOtp
  );

  router.post("/forgotPassword/resetPassword", adminPortalController.resetPassword);

router.post("/addAnnouncement", jwtBearerAuth, adminPortalController.addAnnouncement);
router.get("/getAnnouncements", adminPortalController.getAnnouncements);
router.post("/updateAnnouncement", jwtBearerAuth, adminPortalController.updateAnnouncement);
router.post('/createSupportComplaint',jwtBearerAuth, adminPortalController.createSupportComplaint)
router.get('/getSupportComplaint',jwtBearerAuth, adminPortalController.getSupportComplaint)
router.post('/updateSupportComplaint',jwtBearerAuth, adminPortalController.updateSupportComplaint)

router.get("/getUsedArea", adminPortalController.getUsedArea);



module.exports = router;