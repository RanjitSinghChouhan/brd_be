const models = require("../models");
const bCrypt = require("bcrypt-nodejs");
const successCodes = require("../successCodes");
const errorCodes = require("../errorCodes");
const Admin = models.superAdmin;
const SiteAdmin = models.siteAdmin;
const Announcement = models.announcement;
const EchoEcoReport = models.echoEcoReport;
const EmailOtp = models.emailOtp;
const ResetPasswordKey = models.resetPasswordKey;
const SupportAndComplaint = models.supportAndComplaint;
const crypto = require("crypto");

var sequelize = require("../models/connection");
var { sendVerificationEmail } = require("../services/email/mailHelper");
const { getAccessToken } = require("../services/jwt");
const Sequelize = require("sequelize");
const moment = require("moment-timezone");

const Op = Sequelize.Op;
var passwordKey = process.env.PASSWORD_ENCRYPTION_KEY || "zxcvbnmasdfghjkl";

var {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordOtp,
  passwordResetSuccessfullyEmail,
  sendResetPasswordOtpForDeActivation,
  sendOtpForSubAdminRegister,
  sendEchoEcoReportEmail,
  // forgotPasswordSendLink,
} = require("../services/email/mailHelper");

var SimpleCrypto = require("simple-crypto-js").default;
const simpleCrypto = new SimpleCrypto(passwordKey);

var generateHash = function (password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
};

function genPassword() {
  var chars =
    "0123456789abcdefghijklmnopqrstuvwxyz-@#$&ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var passwordLength = 12;
  var password = "";
  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
}

module.exports = {
  registerCompany: async function (req, res) {
    try {
      let todayDate = new Date();
      todayDate = JSON.stringify(todayDate);

      let admin = await Admin.findOne({
        where: { adminEmail: req.body.AdminEmail },
      });

      if (admin) {
        if (admin && admin.isActive == 0) {
          req.error = errorCodes.ERR_EMAIL_REGISTERED_BLOCKED;
          return res.json({
            status: false,
            message: errorCodes.ERR_EMAIL_REGISTERED_BLOCKED,
            adminStatus: successCodes.BLOCKED,
          });
        }
        if (admin && admin.status == 1) {
          req.error = errorCodes.ERR_EMAIL_REGISTERED_VERIFIED;
          return res.json({
            status: false,
            message: errorCodes.ERR_EMAIL_REGISTERED_VERIFIED,
            adminStatus: successCodes.VERIFIED,
          });
        }

        req.error = errorCodes.ERR_EMAIL_REGISTERED_UNVERIFIED;
        return res.json({
          status: false,
          message: errorCodes.ERR_EMAIL_REGISTERED_UNVERIFIED,
          adminStatus: successCodes.UNVERIFIED,
        });
      }
      // let encryptedPass = simpleCrypto.encrypt(req.body.AdminPassword);

      let decryptedPass = simpleCrypto.decrypt(req.body.AdminPassword);
      // let decryptedPass = simpleCrypto.decrypt(encryptedPass);
      ///

      ///
      let password = decryptedPass;
      let data = {
        status: 1,
        adminName: req.body.AdminName,
        adminEmail: req.body.AdminEmail,
        notificationDate: new Date(),
        adminPassword: password,
      };
      let newadmin = await Admin.create(data);

      req.success = successCodes.SUCC_CREATE;
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        adminStatus: successCodes.SUCC_SEND_MAIL,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  loginUser: async function (req, res) {
    try {
      let user = await Admin.findOne({
        where: { adminEmail: req.body.adminEmail },
        distinct: true,
        raw: true,
      });

      if (!user) {
        user = await SiteAdmin.findOne({
          where: { adminEmail: req.body.adminEmail },
          distinct: true,
          raw: true,
        });

        if (!user) {
          req.error = errorCodes.ERR_INCORRECT_CREDENTIALS;
          return res.json({
            status: false,
            message: errorCodes.ERR_INCORRECT_CREDENTIALS,
          });
        }
      }
      if (user.isActive == 0) {
        req.error = errorCodes.ERR_EMAIL_REGISTERED_BLOCKED;
        return res.json({
          status: false,
          message: errorCodes.ERR_EMAIL_REGISTERED_BLOCKED,
          isActive: successCodes.BLOCKED,
        });
      }
      if (user.loginTryCount <= 0) {
        req.error = errorCodes.ERR_NO_OF_TRIES_EXCEEDED;
        return res.json({
          status: false,
          message: errorCodes.ERR_NO_OF_TRIES_EXCEEDED,
          userStatus: successCodes.RESETPASSWORD,
        });
      }
      let decryptedPass = simpleCrypto.decrypt(req.body.adminPassword);
      if (user.adminPassword !== decryptedPass) {
        let count = user.loginTryCount - 1;
        if (user.isAdmin) {
          await Admin.update(
            { loginTryCount: count },
            { where: { adminEmail: req.body.adminEmail } }
          );
        } else {
          await SiteAdmin.update(
            { loginTryCount: count },
            { where: { adminEmail: req.body.adminEmail } }
          );
        }
        req.error = errorCodes.ERR_INCORRECT_CREDENTIALS;
        return res.json({
          status: false,
          message: errorCodes.ERR_INCORRECT_CREDENTIALS,
          userStatus: successCodes.WRONGPASSWORD,
          numberOfTriesLeft: count,
        });
      }

      let uuid = user.uuid;
      let accessToken = await getAccessToken({
        userId: uuid,
      });

      req.success = successCodes.SUCC_LOGIN;
      return res.json({
        status: true,
        message: successCodes.SUCC_LOGIN,
        accessToken,
        // role: role.role,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.json(404, {
        status: false,
        message: errorCodes.ERR_USER_NOT_FOUND,
      });
    }
  },

  sendOtp: async function (req, res) {
    try {
      let adminEmail = req.body.adminEmail;
      let user = await Admin.findOne({ where: { adminEmail } });
      if (!user) {
        req.error = errorCodes.ERR_EMAIL_NOT_EXISTING;
        return res.json({
          status: false,
          message: errorCodes.ERR_EMAIL_NOT_EXISTING,
        });
      }
      let emailOtp = await EmailOtp.findAll({
        where: { email: adminEmail },
        distinct: true,
        raw: true,
      });
      if (emailOtp.length > 5) {
        await EmailOtp.destroy({
          where: { email: adminEmail },
        });
      }
      console.log(emailOtp.length);
      let otp = Math.floor(100000 + Math.random() * 900000);

      await EmailOtp.create({ email: adminEmail, otp: otp });
      //email service logic to be written here
      sendResetPasswordOtp(req.body.adminEmail, user.adminName, otp);
      req.success = successCodes.SUCC_SENT_OTP;
      return res.json({
        status: true,
        message: successCodes.SUCC_SENT_OTP,
      });
    } catch (error) {
      console.log("error", error);
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  forgotPasswordVerifyEmailOtp: async function (req, res) {
    try {
      let adminEmail = req.body.adminEmail;
      let otp = req.body.otp;

      let verify = await EmailOtp.findAll({ where: { otp: otp } });
      if (verify[0]) {
        let user = await Admin.findOne({
          where: { adminEmail },
          distinct: true,
          raw: true,
        });
        if (!user) {
          req.error = errorCodes.ERR_USER_NOT_REGISTERED;
          return res.json({
            status: false,
            message: errorCodes.ERR_USER_NOT_REGISTERED,
          });
        }
        let currentDate = Date.now();
        let createdAt = Date.parse(verify.createdAt);
        if (currentDate - createdAt > 60 * 60 * 1000) {
          await EmailOtp.update(
            { isValid: false },
            { where: { id: verify.id } }
          );
          req.error = errorCodes.ERR_OTP_EXPIRED;
          return res.json({
            status: false,
            message: errorCodes.ERR_OTP_EXPIRED,
          });
        }
        // let key=nanoid(25);
        let key = crypto.randomBytes(25).toString("hex");
        await ResetPasswordKey.create({ adminId: user.uuid, authKey: key });
        req.success = successCodes.SUCC_OTP_VERIFIED;
        return res.json({
          status: true,
          message: successCodes.SUCC_OTP_VERIFIED,
          userStatus: successCodes.VERIFIED,
          authkey: key,
        });
      }
      req.error = errorCodes.ERR_INCCORRECT_OTP;
      return res.json({
        status: false,
        message: errorCodes.ERR_INCCORRECT_OTP,
      });
    } catch (error) {
      console.log("error", error);
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  resetPassword: async function (req, res) {
    try {
      let authKey = req.body.authKey;
      let decryptedPass = simpleCrypto.decrypt(req.body.password);
      let password = decryptedPass;
      // let password=req.body.password
      let adminEmail = req.body.adminEmail;
      let user = await Admin.findOne({
        where: { adminEmail: adminEmail },
        distinct: true,
        raw: true,
      });
      if (user) {
        let resetPasswordKey = await ResetPasswordKey.findOne({
          where: { adminId: user.uuid, authKey: authKey, isValid: "true" },
          distinct: true,
          raw: true,
        });
        if (resetPasswordKey) {
          // let newPassword = generateHash(password);
          await Admin.update(
            { adminPassword: password, loginTryCount: 3 },
            { where: { uuid: user.uuid } }
          );
          await ResetPasswordKey.update(
            { isValid: false },
            { where: { id: resetPasswordKey.id } }
          );
          let sendEmail = passwordResetSuccessfullyEmail(
            req.body.companyAdminEmail,
            user.companyAdminName
          );

          req.success = successCodes.SUCC_CHANGE_PASSWORD;
          return res.json({
            status: true,
            message: successCodes.SUCC_CHANGE_PASSWORD,
            userStatus: successCodes.SUCC_STATUS_PASSWORD_CHANGED,
          });
        }
        req.error = errorCodes.authKey;
        return res.json({
          status: false,
          message: errorCodes.authKey,
        });
      }
      req.error = errorCodes.ERR_USER_NOT_FOUND;
      return res.json({
        status: false,
        message: errorCodes.ERR_USER_NOT_FOUND,
      });
    } catch (error) {
      console.log("error", error);
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getAdminDetails: async function (req, res) {
    let start = performance.now();
    try {
      let userId = req.userInfo.userId;
      let user = await sequelize.query(
        `SELECT 
        "admin"."uuid", 
        "admin"."adminName", 
        "admin"."adminEmail", 
        "admin"."status", 
        "admin"."isValid", 
        "admin"."isAdmin", 
        "admin"."isActive"
        
      FROM 
        "superAdmins" AS "admin" 
      WHERE 
        "admin"."uuid" = '${userId}'`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (!user.length) {
        user = await sequelize.query(
          `SELECT "admin".* FROM "siteAdmins" AS "admin" 
          WHERE "admin"."uuid" = '${userId}'`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
        if (!user.length) {
          throw Error("Unauthorized");
        }
      }
      console.log(
        "super admin details api " + (performance.now() - start) + " ms"
      );

      req.success = successCodes.SUCC_LOADED;
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: user,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      console.log(performance.now() - start);
      return res.json(400, {
        status: false,
        message: error.message,
      });
    }
  },

  getAdminReports: async (req, res) => {
    try {
      let reports = await sequelize.query(`select * from "echoEcoReports"`, {
        type: sequelize.QueryTypes.SELECT,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        reports,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getCompanies: async (req, res) => {
    try {
      let userId = req.userInfo.userId;
      const admin = await SiteAdmin.findOne({ where: { uuid: userId } });

      if (!admin) {
        throw Error(errorCodes.ERR_SITEADMIN_NOT_FOUND);
      }
      // {Where LOWER(c."companyCountry") LIKE '%${admin?.location
      //   ?.toLowerCase()
      //   .trim()}%' }

      let companies = await sequelize.query(
        `select c."id", c."companyName", c."aboutCompany", c."companyIcon", c."createdAt", c."updatedAt",
        (select sum(oc."planted") from "overallEchoEcos" as oc left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=oc."id" where oc."companyId" = c."id" and oc."ecoType" = 1 and ecm."siteAssigned" = '${admin.siteName}' ) as "totalPlanted",
        (select sum(oc."planted") from "overallEchoEcos" as oc left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=oc."id" where oc."companyId" = c."id" and oc."ecoType" = 2 and ecm."siteAssigned" = '${admin.siteName}') as "totalAlgae",

        (select count(d."id") from "overallEchoEcos" as b left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=b."id" left join "dailyEchoEcoCalls" as "d" on b."id"="d"."apiId" where ecm."siteAssigned" = '${admin.siteName}' and b."isActive" = 1 and b."ecoType" = 1 and  b."companyId" = c."id" ) as "totalRequestedPlant",
        (select count(d."id") from "overallEchoEcos" as b left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=b."id" left join "dailyEchoEcoCalls" as "d" on b."id"="d"."apiId" where ecm."siteAssigned" = '${admin.siteName}' and b."isActive" = 1 and b."ecoType" = 2 and  b."companyId" = c."id" ) as "totalRequestedAlgae"
        
        from "companies" as c left join "overallEchoEcos" as oc on c."id" = oc."companyId"
        left join "echoEcoMonthlyData" as ecm on ecm."apiId" = oc."id"
         Where position(LOWER(c."companyCountry") in lower('${admin?.location}')) > 0
         group by c."id" having count(ecm."siteAssigned") > 0
         `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        data: companies,
        message: successCodes.SUCC_LOADED,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(500).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getCompanyDetail: async (req, res) => {
    try {
      let companyInfo = await sequelize.query(
        `select id, "companyName" from companies where "companyName" = '${req.query.companyName}'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      let company = await sequelize.query(
        `select c."id", c."companyName", c."aboutCompany", c."companyIcon", oc."plantAlive",
       (select sum(oc."planted") from "overallEchoEcos" as oc left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=oc."id"  where ecm."siteAssigned" = '${req.query.siteName}' and oc."isActive" = 1 and oc."ecoType" = 1 ) as "totalPlanted",
       (select sum(oc."planted") from "overallEchoEcos" as oc left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=oc."id"  where ecm."siteAssigned" = '${req.query.siteName}' and oc."isActive" = 1 and oc."ecoType" = 2) as "totalAlgae",
       (select count(d."id") from "dailyEchoEcoCalls" as "d" left join "overallEchoEcos" as oc on oc."id"="d"."apiId" left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=oc."id" where ecm."siteAssigned" = '${req.query.siteName}' and oc."isActive" = 1 and oc."ecoType" = 1 and  oc."companyId" = '${companyInfo[0]?.id}' ) as "totalRequestedPlant",
       (select count(d."id") from "dailyEchoEcoCalls" as "d" left join "overallEchoEcos" as oc on oc."id"="d"."apiId" left outer join "echoEcoMonthlyData" as ecm on ecm."apiId"=oc."id" where ecm."siteAssigned" = '${req.query.siteName}' and oc."isActive" = 1 and oc."ecoType" = 2 and  oc."companyId" = '${companyInfo[0]?.id}' ) as "totalRequestedAlgae"
        from "companies" as c 
        left join "overallEchoEcos" as oc on oc."companyId" = c.id 
        
        where oc."isActive" = 1 and c."companyName" = '${req.query.companyName}' group by c."id", oc."plantAlive"`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        data: company[0],
        message: successCodes.SUCC_LOADED,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(500).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getEchoEcosByCompanyId: async function (req, res) {
    try {
      let todayDate = new Date();
      todayDate = JSON.stringify(todayDate);
      let userId = req.userInfo.userId;
      const admin = await SiteAdmin.findOne({ where: { uuid: userId } });
      const offset = req.body.offset;

      if (!admin) {
        throw Error(errorCodes.ERR_SITEADMIN_NOT_FOUND);
      }
      let echoEcos = await sequelize.query(
        `SELECT "p"."id", "p"."companyId", "p". "apiName", "p"."isValid", "p"."isActive", "p"."apiKey",
         "p"."createdAt", "p"."updatedAt", "ecm"."monthlyPlanted", "ecm"."monthlyPlantAlive",
         ecm."siteAssigned", "ret"."ecoType", "rep"."ecoPurpose", "ecm"."monthlyId",
         ecm."totalMonthlyCall" as "totalPlantRequested",
        DATE_PART('month', "ecm"."createdAt") as "month"
      FROM 
      "overallEchoEcos" as "p" 
       left outer join "ref_EcoTypes" as "ret" on "p"."ecoType"="ret"."id"
       left outer join "ref_EcoPurposes" as "rep" on "p"."ecoPurpose"="rep"."id"
       left outer join "echoEcoMonthlyData" AS ecm on "p"."id" = ecm."apiId" 
      WHERE 
        "ecm"."companyId" = '${
          req.body.companyId
        }' and "p"."isActive" = 1 and LOWER(ecm."siteAssigned") = '${admin?.siteName?.toLowerCase()}'
        OFFSET '${offset}' ROWS FETCH NEXT 10 ROWS ONLY
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: echoEcos,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  updatePlantation: async function (req, res) {
    try {
      let todayDate = new Date();
      todayDate = JSON.stringify(todayDate);
      let echoEco = await sequelize.query(
        `Update 
        "overallEchoEcos" set "planted" = '${req.body.planted}', "plantAlive" = '${req.body.plantAlive}'
      WHERE 
        "companyId" = '${req.body.companyId}' and
        "apiKey" = '${req.body.apiKey}' and
        "id" = '${req.body.docId}'
        returning "companyId"
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      await sequelize.query(
        `Update 
        "echoEcoMonthlyData" set "monthlyPlanted" = '${req.body.planted}', "monthlyPlantAlive" = '${req.body.plantAlive}'
      WHERE 
        "companyId" = '${req.body.companyId}' and
        "monthlyId" = '${req.body.monthlyId}' and
        "apiId" = '${req.body.docId}'
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: echoEco[0].companyId,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  addSite: async function (req, res) {
    // await sequelize.query('drop table "siteAdmins"')
    let { email, siteName, totalArea, location, locationLink } = req.body;
    try {
      if (!email || !siteName || !totalArea || !location || !locationLink) {
        throw Error(errorCodes.ERR_MISSING_PARAMS);
      }

      let password = genPassword();

      let site = await SiteAdmin.create({
        adminEmail: email,
        adminPassword: password,
        siteName: siteName,
        notificationDate: new Date(),
        totalArea: totalArea,
        location: location,
        locationLink: locationLink,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: site,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_WENT_WRONG,
      });
    }
  },

  getSites: async function (req, res) {
    console.log(req.query.offset);
    try {
      let sites = await SiteAdmin.findAll({
        order: [["siteName", "ASC"]],
        offset: req.query.offset,
        limit: 15,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: sites,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_WENT_WRONG,
      });
    }
  },

  updateSite: async function (req, res) {
    try {
      let body = {};
      if (req.body.newPassword) {
        let decPassword = simpleCrypto.decrypt(req.body.newPassword);
        body.adminPassword = decPassword;
        body.loginTryCount = 3;
      }
      if (req.body.usedArea) {
        body.usedArea = req.body.usedArea;
      }
      let site = await SiteAdmin.update(body, {
        where: { uuid: req.body.docId, adminEmail: req.body.adminEmail },
        returning: true,
      });

      if (site[0]) {
        req.success = successCodes.SUCC_LOADED;
        return res.status(200).json({
          status: true,
          message: successCodes.SUCC_LOADED,
          data: site[1][0],
        });
      } else {
        throw Error(errorCodes.ERR_UNABLE_TO_UPDATE_SITE_ADMIN);
      }
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getRequestedReports: async (req, res) => {
    try {
      let sql = `select * from "echoEcoReports" where "isSent" = false`;
      if (req.query.companyName) {
        sql += ` and "companyName" = '${req.query.companyName}'`;
        if (req.query.offset) {
          sql += `OFFSET '${req.query.offset}' ROWS FETCH NEXT 10 ROWS ONLY`
        }
      }
      let reports = await sequelize.query(sql, {
        type: sequelize.QueryTypes.SELECT,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        data: reports,
        message: successCodes.SUCC_LOADED,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(500).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  updateRequestedReports: async (req, res) => {
    try {
      let data = await EchoEcoReport.update(
        {
          isSent: true,
        },
        {
          where: { id: req.body.id },
          returning: true,
        }
      );
      if (data[0]) {
        req.success = successCodes.SUCC_LOADED;
        return res.status(200).json({
          status: true,
          message: successCodes.SUCC_LOADED,
          data: data[1][0],
        });
      } else {
        throw Error(errorCodes.ERR_UNABLE_TO_SEND_REPORT);
      }
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(500).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  addAnnouncement: async function (req, res) {
    // await sequelize.query('drop table "siteAdmins"')
    let { title, description } = req.body;
    try {
      if (!title || !description) {
        throw Error(errorCodes.ERR_MISSING_PARAMS);
      }

      let data = await Announcement.create({
        title: title,
        description: description,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: data,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_WENT_WRONG,
      });
    }
  },

  getAnnouncements: async function (req, res) {
    try {
      let condition = {};
      if (!req.query.admin) {
        condition.where = {
          createdAt: {
            [Op.gte]: moment().subtract(90, "days").toDate(),
          },
        };
      }
      let sites = await Announcement.findAll({
        ...condition,
        order: [["updatedAt", "DESC"]],
      });

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: sites,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_WENT_WRONG,
      });
    }
  },

  updateAnnouncement: async function (req, res) {
    try {
      let data = await Announcement.update(
        {
          title: req.body.title,
          description: req.body.description,
        },
        {
          where: { id: req.body.id },
          returning: true,
        }
      );
      if (data[0]) {
        req.success = successCodes.SUCC_LOADED;
        return res.status(200).json({
          status: true,
          message: successCodes.SUCC_LOADED,
          data: data[1][0],
        });
      } else {
        throw Error(errorCodes.ERR_ANNOUNCEMNT_UPDATE);
      }
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  isSiteExist: async function (req, res) {
    try {
      let site = await sequelize.query(
        `select "siteName" from "siteAdmins" where LOWER("siteName") LIKE '${req.query.search?.toLowerCase()}' `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (site?.length) {
        req.error = errorCodes.ERR_SITENAME_EXIST;
        return res.status(200).json({
          status: true,
          message: errorCodes.ERR_SITENAME_EXIST,
          data: site,
        });
      } else req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: false,
        message: successCodes.SUCC_LOADED,
        data: site,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: true,
        message: errorCodes.ERR_WENT_WRONG,
      });
    }
  },

  isEmailExist: async function (req, res) {
    try {
      let site = await sequelize.query(
        `select "adminEmail" from "siteAdmins" where LOWER("adminEmail") = '${req.query.search?.toLowerCase()}' `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (site.length) {
        req.error = errorCodes.ERR_EMAIL_EXIST;
        return res.status(200).json({
          status: true,
          message: errorCodes.ERR_EMAIL_EXIST,
          data: site,
        });
      } else req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: false,
        message: successCodes.SUCC_LOADED,
        data: site,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(400).json({
        status: true,
        message: errorCodes.ERR_WENT_WRONG,
      });
    }
  },

  getUsedArea: async function (req, res) {
    try {
      let area = await sequelize.query(`select "total" from "sumOfUsedArea"`, {
        type: sequelize.QueryTypes.SELECT,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.status(200).json({
        status: true,
        data: area[0]?.total,
        message: successCodes.SUCC_LOADED,
      });
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.status(500).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getSupportComplaint: async function (req, res) {
    try {
      let request = await sequelize.query(
        `select "sc".* from "supportAndComplaints" as sc
        order by "sc"."createdAt" desc`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_CREATE;
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        request,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  createSupportComplaint: async function (req, res) {
    try {
      let request = await SupportAndComplaint.create({
        requesterId: req.userInfo.userId,
        requesterRole: req.body.requesterRole,
        type: req.body.type,
        description: req.body.description,
      });

      req.success = successCodes.SUCC_CREATE;
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        request,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  updateSupportComplaint: async function (req, res) {
    try {
      let request = await SupportAndComplaint.update(
        {
          isOpen: false,
        },
        {
          where: { id: req.body.id },
          returning: true,
        }
      );
      if (request[0]) {
        req.success = successCodes.SUCC_LOADED;
        return res.status(200).json({
          status: true,
          message: successCodes.SUCC_LOADED,
          data: request[1][0],
        });
      } else {
        throw Error(errorCodes.ERR_UNABLE_TO_SEND_REPORT);
      }
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },
};
