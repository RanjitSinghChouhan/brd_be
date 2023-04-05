const models = require("../models");
const bCrypt = require("bcrypt-nodejs");
const Sequelize = require("sequelize");
const successCodes = require("../successCodes");
const errorCodes = require("../errorCodes");
const Admin = models.admin;
const EmailOtp = models.emailOtp;
const Company = models.company;
const IndustrySector = models.ref_IndustrySector;
const EcoPurpose = models.ref_EcoPurpose;
const OverallEchoEcos = models.overallEchoEcos;
const EcoType = models.ref_EcoType;
const fs = require("fs");
// var pdf = require("pdf-creator-node");
// var pdf = require("html-pdf");
// var html_to_pdf = require("html-pdf-node");

const DailyEchoEcoCalls = models.dailyEchoEcoCalls;
const SharePost = models.sharePost;

const EchoEcoMonthlyData = models.echoEcoMonthlyData;
const EchoEcoYearlyData = models.echoEcoYearlyData;
const ResetPasswordKey = models.resetPasswordKey;
const Post = models.post;
const EchoEcoReport = models.echoEcoReport;
const TransactionHistory = models.transactionHistory;
const EchoEcoMultiply = models.ref_EchoEcoMultiply;
const SupportAndComplaint = models.supportAndComplaint

const moment = require("moment-timezone");

const crypto = require("crypto");
const uniquId = require("uniqid");
const Razorpay = require("razorpay");
var instance = new Razorpay({
  key_id: process.env.razorPay_key_id,
  key_secret: process.env.razorpay_key_secret,
});

var sequelize = require("../models/connection");
// var ResetPasswordKey=models.resetPasswordKey;
const Op = Sequelize.Op;
var passwordKey = process.env.PASSWORD_ENCRYPTION_KEY || "zxcvbnmasdfghjkl";
var {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordOtp,
  passwordResetSuccessfullyEmail,
  sendResetPasswordOtpForDeActivation,
  sendOtpForSubAdminRegister,
  sendPdfTransactionToUser,
  sendEchoEcoReportEmail,
  // forgotPasswordSendLink,
} = require("../services/email/mailHelper");
var SimpleCrypto = require("simple-crypto-js").default;
const simpleCrypto = new SimpleCrypto(passwordKey);
const Axios = require("axios");
// const {nanoid } = require("nanoid"); // crypto.randomBytes(40).toString("hex");
const { getAccessToken } = require("../services/jwt");
// const { JSON } = require("sequelize");
// const { SUCC_UPDATE } = require("../successCodes");

var generateHash = function (password) {
  return bCrypt.hashSync(password, bCrypt.genSaltSync(8), null);
};

module.exports = {
  createViews: async function (data) {
    try {
      var suggestion = await sequelize.query(data);
    } catch (error) {
      console.log("error", error.message);
    }
  },
  registerCompany: async function (req, res) {
    try {
      let todayDate = new Date();
      todayDate = JSON.stringify(todayDate);
      let admin = await Admin.findOne({
        where: { companyAdminEmail: req.body.companyAdminEmail },
      });
      let company = await Company.findOne({
        where: { companyName: req.body.companyName },
      });
      if (company) {
        req.error = errorCodes.ERR_COMPANY_ALREADY_EXIST
        return res.json({
          status: false,
          message: errorCodes.ERR_COMPANY_ALREADY_EXIST,
        });
      }
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
      // let encryptedPass = simpleCrypto.encrypt(req.body.companyAdminPassword);

      let decryptedPass = simpleCrypto.decrypt(req.body.companyAdminPassword);
      // let decryptedPass = simpleCrypto.decrypt(encryptedPass);
      ///
      let getAllCompaniesRank = await sequelize.query(
        `SELECT "p"."id",
  "ris"."sectorOfIndustry" as "industrySector",
  "companyCountry","companyName", 
  coalesce(sum("updatedByrdsPoints"),0)as "byrdsPoints",
 ROW_NUMBER () OVER ( 
     ORDER BY sum("updatedByrdsPoints") desc NULLS LAST
   ) "companyRank" 
  FROM "getAllByrdsPoints" as "p"
  left outer join "ref_IndustrySectors" as "ris" on "p"."industrySector"="ris"."id"
  where "p"."createdAt"<= '${todayDate}'  or "p"."createdAt" is null
  group by "p"."id",
  "companyName",
  "ris"."sectorOfIndustry",
  "companyCountry",
"p"."companyCreatedAt" 
 ORDER BY "companyRank" desc ,"byrdsPoints", 
"p"."companyCreatedAt"   asc 
limit 1`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let rank = 1;
      if (getAllCompaniesRank[0]) {
        rank = getAllCompaniesRank[0]?.companyRank;
        rank = parseInt(rank) + 1;
      }
      let name = req.body.companyAddress.split(",");
      let companyCountry = name[name?.length - 1];
      ///
      let password = generateHash(decryptedPass);
      let companyDetails = await Company.create({
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        companyWebsite: req.body.companyWebsite,
        industrySector: req.body.industrySector,
        companyRank: rank,
        companyCountry: companyCountry,
      });
      let data = {
        userRoleId: 1,
        status: 2,
        companyId: companyDetails.id,
        companyAdminName: req.body.companyAdminName,
        companyAdminEmail: req.body.companyAdminEmail,
        notificationDate: new Date(),
        companyAdminPassword: password,
      };
      let newadmin = await Admin.create(data);
      let otp = Math.floor(100000 + Math.random() * 900000);
      let emailOtp = await EmailOtp.create({
        email: data.companyAdminEmail,
        otp: otp,
      });
      let sendEmail = sendVerificationEmail(
        req.body.companyAdminEmail,
        req.body.companyAdminName,
        otp
      );
      req.success=successCodes.SUCC_CREATE
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        adminStatus: successCodes.SUCC_SEND_MAIL,
      });
    } catch (error) {
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
        where: { companyAdminEmail: req.body.companyAdminEmail },
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
      if (user.status == 2) {
        req.error = errorCodes.ERR_EMAIL_REGISTERED_UNVERIFIED;
        return res.json({
          status: false,
          message: errorCodes.ERR_EMAIL_REGISTERED_UNVERIFIED,
          userStatus: successCodes.UNVERIFIED,
        });
      }

      if (user.subscription == 2) {
        req.error = errorCodes.ERR_SUBSCRIPTION_EXPIRED;
        return res.json({
          status: false,
          message: errorCodes.ERR_SUBSCRIPTION_EXPIRED,
        });
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
      // let encryptedPass = simpleCrypto.encrypt(req.body.companyAdminPassword);

      let decryptedPass = simpleCrypto.decrypt(req.body.companyAdminPassword);
      let comparePass = bCrypt.compareSync(
        decryptedPass,
        user.companyAdminPassword
      );
      // let comparePass=true ///comment krna h
      if (comparePass == false) {
        let count = user.loginTryCount - 1;
        await Admin.update(
          { loginTryCount: count },
          { where: { companyAdminEmail: req.body.companyAdminEmail } }
        );
        req.error = errorCodes.ERR_INCORRECT_CREDENTIALS;
        return res.json({
          status: false,
          message: errorCodes.ERR_INCORRECT_CREDENTIALS,
          userStatus: successCodes.WRONGPASSWORD,
          numberOfTriesLeft: count,
        });
      }
      await Admin.update(
        { loginTryCount: 3 },
        { where: { companyAdminEmail: req.body.companyAdminEmail } }
      );
      let uuid = user.uuid;
      let accessToken = await getAccessToken({
        userId: uuid,
        // userRoleId: userRoleId,
      });
      req.success = successCodes.SUCC_LOGIN
      return res.json({
        status: true,
        message: successCodes.SUCC_LOGIN,
        accessToken,
        // role: role.role,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  userChangePassword: async function (req, res) {
    try {
      let userId = req.userInfo.userId;

      let decryptedOldPass = simpleCrypto.decrypt(req.body.oldPassword);
      let decryptedNewPass = simpleCrypto.decrypt(req.body.newPassword);

      // let password=decryptedPass;
      let user = await Admin.findOne({ where: { uuid: userId }, raw: true });
      if (user) {
        let comparePass = bCrypt.compareSync(
          decryptedOldPass,
          user.companyAdminPassword
        );

        if (comparePass) {
          let newPassword = generateHash(decryptedNewPass);
          await Admin.update(
            { companyAdminPassword: newPassword },
            { where: { uuid: user.uuid } }
          );
          req.success = successCodes.SUCC_CHANGE_PASSWORD;
          return res.json({
            status: true,
            message: successCodes.SUCC_CHANGE_PASSWORD,
            userStatus: successCodes.SUCC_STATUS_PASSWORD_CHANGED,
          });
        }
        req.error = errorCodes.ERR_OLD_PASSWORD_NOT_MATCH;
        return res.json({
          status: false,
          message: errorCodes.ERR_OLD_PASSWORD_NOT_MATCH,
        });
      }
      req.error = errorCodes.ERR_ID_IS_INCORRECTED;
      return res.json({
        status: false,
        message: errorCodes.ERR_ID_IS_INCORRECTED,
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

  editCompanyProfle: async function (req, res) {
    try {
      const {
        companyEmployeeScale,
        companyYearOfEstablishment,
        companyPhone,
        companyIcon,
        companyAddress,
        companyAdminName,
        aboutCompany,
      } = req.body;
      let userId = req.userInfo.userId;
      let user = await Admin.findOne({ where: { uuid: userId } });
      let companyCountry = "";
      if (companyAddress) {
        let name = companyAddress.split(",");
        let len = name.length;
        companyCountry = name[len - 1];
        await Admin.update(
          {
            companyAdminName: companyAdminName,
          },
          { where: { companyId: user.companyId } }
        );
      }
      await Company.update(
        {
          companyPhone: companyPhone,
          companyAddress: companyAddress,
          companyYearOfEstablishment: companyYearOfEstablishment,
          companyEmployeeScale: companyEmployeeScale,
          aboutCompany: aboutCompany,
          companyCountry: companyCountry.trim(),
          companyIcon: companyIcon,
        },
        { where: { id: user.companyId } }
      );
      req.success = successCodes.SUCC_UPDATE
      return res.json({
        status: true,
        message: successCodes.SUCC_UPDATE,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getAdminDetails: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      let user = await sequelize.query(
        `SELECT "a"."*" as "uuid",* FROM "getAdminDetailsData" AS "a" 
         WHERE 
        "a"."*" = '${userId}'`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: user,
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

  getIndustrySector: async function (req, res) {
    try {
      let industrySector = await IndustrySector.findAll({
        raw: true,
        distinct: true,
      });
      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        industrySector,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getEchoEcosByCompanyId: async function (req, res) {
    try {
      const companyId = req.body.companyId;
      const offset = req.body.offset;
      if (!companyId) {
        req.error = errorCodes.ERR_PAYLOAD_EMPTY;
        return res.json({
          status: false,
          message: errorCodes.ERR_PAYLOAD_EMPTY,
        });
      }
      let echoEcos = await sequelize.query(
        `SELECT 
        "p"."id", 
         "p"."companyId", 
        "p". "apiName", 
         "p"."goalAmount",
         "p"."goalReached",
         "p"."goalDays",
         sum("eem"."monthlyPlanted") as "totalPlanted",
		     sum("eem"."monthlyPlantAlive") as "totalPlantAlive",
         "p"."ecoPurpose", 
         "p"."apiKey", 
        "p". "areaSqFt", 
         "p"."isValid", 
         "p"."isActive", 
         "p"."createdAt", 
         "p"."updatedAt",	
         "ret"."ecoType",
        "p"."totalGoalReached" as "apiCall"
      FROM 
        "overallEchoEcos" AS "p"
        left outer join "ref_EcoTypes" as "ret" on "p"."ecoType"="ret"."id"
        left outer join "echoEcoMonthlyData" as "eem" on "p"."id"="eem"."apiId"
      
      WHERE 
        "p"."companyId" = '${companyId}'
        group by "p"."id","ret"."ecoType"
        order by "createdAt" desc
	    	OFFSET '${offset}' ROWS FETCH NEXT 10 ROWS ONLY
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let upComingGoal = await sequelize.query(
        `SELECT "o"."id", "companyId", "apiName",
          "goalAmount", "goalDays", "ecoType",
          "ecoPurpose", "apiKey", "areaSqFt", "isValid", 
          "o"."isActive", "rate", "goalReached", "lastDate",
		   (CASE WHEN date("lastDate")- CURRENT_DATE  > 0 THEN date("lastDate")- CURRENT_DATE  ELSE null END)
    as "days"
          FROM "companies" AS "c"
		  left outer join "overallEchoEcos" as o on "c"."id"="o"."companyId"
          WHERE "c"."id" = '${companyId}'
		  order by days asc
		  limit 1;`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        echoEcos,
        upComingGoal,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  createEchoEcos: async function (req, res) {
    try {
      let lastDate = new Date(
        Date.now() + req.body.goalDays * 24 * 60 * 60 * 1000
      );
      const apiKey = crypto.randomBytes(40).toString("hex");
      let echoEcoData = await OverallEchoEcos.create({
        companyId: req.body.companyId,
        apiName: req.body.apiName,
        goalAmount: req.body.goalAmount,
        goalDays: req.body.goalDays,
        ecoType: req.body.ecoType,
        ecoPurpose: req.body.ecoPurpose,
        lastDate: lastDate,
        apiKey: apiKey,
      });
      req.success = successCodes.SUCC_CREATE
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        echoEcoData,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getEcoPurpose: async function (req, res) {
    try {
      let ecoPurpose = await EcoPurpose.findAll({
        raw: true,
      });
      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        ecoPurpose,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getEcoType: async function (req, res) {
    try {
      let ecoType = await EcoType.findAll({
        raw: true,
      });
      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        ecoType,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },


  getDailyEchoEcoCallApiKeyAndUrl: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      let id = req.body.id;
      let companyId = req.body.companyId;
      if (!companyId || !id) {
        req.error = errorCodes.ERR_PAYLOAD_EMPTY;
        return res.json({
          status: false,
          message: errorCodes.ERR_PAYLOAD_EMPTY,
        });
      }

      let company = await sequelize.query(
        `select "o"."id","o"."apiKey","c"."companyName" from "overallEchoEcos" as "o"
      left outer join "companies" as "c" on "o"."companyId"="c"."id"
      where "o"."id"='${id}'
      and "o"."companyId"='${companyId}'`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (!company[0]) {
        req.error = errorCodes.ERR_ID_IS_INCORRECTED;
        return res.json({
          status: false,
          message: errorCodes.ERR_ID_IS_INCORRECTED,
        });
      }
      req.success = successCodes.SUCC_SENT
      return res.json({
        status: true,
        message: successCodes.SUCC_SENT,
        apiKey: company[0].apiKey,
        url: `https://byrds-backend.azurewebsites.net/company/${company[0].companyName}/echoEcoCall/${company[0].id}`,
        viewUrl: `https://byrds-backend.azurewebsites.net/company/${company[0].companyName}/echoEcoCall/view/${company[0].id}`,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getDailyEchoEcoDetails: async function (req, res) {
    try {
      let todayDate = new Date();
      let type = req.body.type;
      let startYearDate = moment(todayDate).format("YYYY-01-01");
      let currentYear = moment(todayDate).format("YYYY");

      let apiId = req.body.apiId;
      let oneDayAgoDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      todayDate = JSON.stringify(oneDayAgoDate);
      let echoEcoAllDetails;
      if (type == 1) {
        echoEcoAllDetails = await sequelize.query(
          `SELECT *
        FROM (
           SELECT month::date
           FROM   generate_series(timestamp '${startYearDate}'
                                , timestamp '${todayDate}'
                                , interval  '1 month') month
           ) d
        LEFT   JOIN (
           SELECT date_trunc('month', "deec"."createdAt")::date AS month
                ,count(*) AS "monthlyApiCallCount","deec"."apiId","monthlyId","emd"."createdAt","emd"."siteAssigned","l"."location","status","rate",
                "emd"."monthlyPlanted", "emd"."monthlyPlantAlive"
           FROM  "dailyEchoEcoCalls" as "deec"
 		   left outer join "echoEcoMonthlyData" as "emd" on "deec"."apiId"="emd"."apiId"
			and date_part('month',"emd"."createdAt") =date_part('month',"deec"."createdAt")
      left outer join "ref_Locations" as "l" on "emd"."location"="l"."id"

           WHERE  "deec"."createdAt" >= date '${startYearDate}'
           AND    "deec"."createdAt" <= date '${todayDate}'
         and "deec"."apiId" ='${apiId}'
           GROUP  BY 1,"deec"."apiId",
		"emd"."id",
    "l"."id"
            ) t USING (month)
        ORDER  BY month;`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
      }
      /////////
      if (type == 2) {
        echoEcoAllDetails = await sequelize.query(
          `
          SELECT "ey".*, sum("totalMonthlyCall") AS "quantity",
          sum("emd"."status")::float,
          (select count(distinct("echoEcoMonthlyData"."siteAssigned"))from "echoEcoMonthlyData" where "echoEcoMonthlyData"."apiId" ='${apiId}'
          and to_char( "echoEcoMonthlyData"."createdAt",'YYYY')=to_char( "ey"."createdAt",'YYYY') )as "locationCount",
          sum("emd"."monthlyPlanted") as "yearlyPlanted", sum("emd"."monthlyPlantAlive") as "yearlyPlantAlive"
            FROM  "echoEcoYearlyData" as "ey"
          left outer join "echoEcoMonthlyData" as "emd" on "ey"."apiId"="emd"."apiId"
          and to_char( "emd"."createdAt",'YYYY')= to_char( "ey"."createdAt",'YYYY')
          
            WHERE
          to_char( "ey"."createdAt",'YYYY') <= '${currentYear}'
          and "ey"."apiId" ='${apiId}'
            GROUP  BY
          "ey"."id"`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
      }

      ////////
      let currentDate = new Date();
      let currentMonthDate = moment(currentDate).format("YYYY-MM-01");
      let nextDayAgoDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
      currentDate = JSON.stringify(nextDayAgoDate);

      let getCurrentMonthEchoEco = await sequelize.query(
        `SELECT *
          FROM  (
             SELECT month::date
             FROM   generate_series(timestamp '${currentMonthDate}'
                                  , timestamp '${todayDate}'
                                  , interval  '1 month') month
             ) d
          LEFT   JOIN (
             SELECT date_trunc('month', "deec"."createdAt")::date AS month
                  ,count(*) AS "monthlyApiCallCount","deec"."apiId","monthlyId","emd"."createdAt","emd"."siteAssigned","location","status","rate",
                  "emd"."monthlyPlanted", "emd"."monthlyPlantAlive"
             FROM  "dailyEchoEcoCalls" as "deec"
          left outer join "echoEcoMonthlyData" as "emd" on "deec"."apiId"="emd"."apiId"
        and date_part('month',"emd"."createdAt") =date_part('month',"deec"."createdAt")
             WHERE  "deec"."createdAt" >= date '${currentMonthDate}'
             AND    "deec"."createdAt" <= date '${todayDate}'
           and "deec"."apiId" ='${apiId}'
             GROUP  BY 1,"deec"."apiId",
      "emd"."id"
              ) t USING (month)
          ORDER  BY month;`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let date = new Date();
      let prevDayDate = moment(date).format("YYYY-MM-DD 00:00:00.000+00:00");

      let dailyEchoEcoCall = await sequelize.query(
        ` SELECT to_char("createdAt",'DD-MM-YYYY HH24:MI:SS')as "createdAt",
            (SELECT
                      count(*) AS "dailyApiCallCount"
                 FROM  "dailyEchoEcoCalls" as "dee"
            where
               "dee"."apiId" ='${apiId}'
          and "dee"."createdAt"<="deec"."createdAt" and "dee"."createdAt">= '${prevDayDate}')
          
                 FROM  "dailyEchoEcoCalls" as "deec"
            where
               "deec"."apiId" ='${apiId}'
          and  date ("deec"."createdAt")<= date ('${currentDate}')
          order by "createdAt" desc
           limit 2`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let today = new Date();
      today = JSON.stringify(today);

      let echoEcoData = await sequelize.query(
        `SELECT "id", "companyId", "apiName",
              "goalAmount", "goalDays", "ecoType",
              "ecoPurpose", "apiKey", "areaSqFt", "isValid", 
              "isActive", "rate", "goalReached", "lastDate", "createdAt", 
              "updatedAt",
              (CASE WHEN date("lastDate")-date '${today}' > 0 THEN date("lastDate")-date '${today}' ELSE null END)
              as "days"
              FROM "overallEchoEcos" AS "overallEchoEcos"
              WHERE "overallEchoEcos"."id" = '${apiId}';`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let echoEcoTotalApiCall = await sequelize.query(
        `SELECT count("id")as "totalCall"
                FROM "dailyEchoEcoCalls" AS d
                WHERE "apiId" = '${apiId}';`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        echoEcoAllDetails,
        getCurrentMonthEchoEco,
        dailyEchoEcoCall,
        echoEcoData,
        echoEcoTotalApiCall,
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

  editEchoEcoGoalById: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      let type = req.body.type;
      let lastDate = new Date(
        Date.now() + req.body.goalDays * 24 * 60 * 60 * 1000
      );
      if (type == 1) {
        await OverallEchoEcos.update(
          {
            goalAmount: req.body.goalAmount,
            goalDays: req.body.goalDays,
            goalReached: 0,
            lastDate: lastDate,
          },
          { where: { id: req.body.id } }
        );

        req.success = successCodes.SUCC_UPDATE
        return res.json({
          status: true,
          message: successCodes.SUCC_UPDATE,
        });
      }
      if (type == 2) {
        await OverallEchoEcos.update(
          {
            isActive: req.body.isActive,
          },
          { where: { id: req.body.id } }
        );

        req.success = successCodes.SUCC_UPDATE
        return res.json({
          status: true,
          message: successCodes.SUCC_UPDATE,
        });
      }
      if (type == 3) {
        await OverallEchoEcos.update(
          {
            goalAmount: req.body.goalAmount,
            goalDays: req.body.goalDays,
            // goalReached: 0,
            lastDate: lastDate,
          },
          { where: { id: req.body.id } }
        );

        req.success = successCodes.SUCC_UPDATE
        return res.json({
          status: true,
          message: successCodes.SUCC_UPDATE,
        });
      }
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getTotalEchoPlantedUrl: async function (req, res) {
    try {
      let company = await Company.findOne({
        attributes: ["companyName"],
        raw: true,
        where: {
          id: req.body.companyId,
        },
      });

      req.success = successCodes.SUCC_SENT
      return res.json({
        status: true,
        message: successCodes.SUCC_SENT,
        url: `https://byrds-backend.azurewebsites.net/company/${company.companyName}/totalEchoPlanted`,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getMonthlyTotalEchoPlanted: async function (req, res) {
    try {
      let companyId = req.body.companyId;
      let todayDate = new Date();
      let startYearDate = moment(todayDate).format("YYYY-01-01");
      let endYearDate = moment(todayDate).format("YYYY-12-DD");
      let type = req.body.type;

      let company = await Company.findOne({
        attributes: ["id", "companyName"],
        raw: true,
        where: {
          id: companyId,
        },
      });
      if (!company) {
        req.error = errorCodes.ERR_ID_IS_INCORRECTED
        return res.json({
          status: false,
          message: errorCodes.ERR_ID_IS_INCORRECTED,
        });
      }

      if (type == 2) {
        let getMonthlyTotalEchoPlanted = await sequelize.query(
          `SELECT *
  FROM  (
     SELECT month::date
     FROM   generate_series(timestamp '${startYearDate}'
                          , timestamp '${endYearDate}'
                          , interval  '1 month') month
     ) d
  LEFT   JOIN (
SELECT date_trunc('month', "m"."createdAt")::date AS month,
   TO_CHAR("m"."createdAt", 'Mon') AS "monthName",
    sum("totalMonthlyCall") as "totalMonthlyCall",
  "r"."ecoType"
FROM "echoEcoMonthlyData" as "m"
FULL OUTER JOIN "overallEchoEcos" as "o" on "m"."apiId"="o"."id" 
left outer join "ref_EcoTypes" as "r" on "o"."ecoType"="r"."id" 
  where  "o"."ecoType"=2
  and "m"."companyId"='${companyId}'
  and "m"."createdAt">='${startYearDate}'
  and "m"."createdAt"<='${endYearDate}'
group by 1,
  "r"."ecoType",
  "monthName"
)t USING (month)
  ORDER  BY month;

  `,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );

        let monthlyTotalAlgaePlanted = [];
        var month = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        let totalAlgaeCount = 0;
        for (let name of month) {
          let count = 0;
          for (data of getMonthlyTotalEchoPlanted) {
            if (name == data.monthName) {
              count = 1;
              totalAlgaeCount += parseInt(data.totalMonthlyCall);
              data.totalMonthlyCall = parseInt(data.totalMonthlyCall);
              monthlyTotalAlgaePlanted.push(data);
              continue;
            }
          }
          if (count == 0) {
            monthlyTotalAlgaePlanted.push({
              monthName: name,
              totalMonthlyCall: 0,
              ecoType: "Algae",
            });
          }
        }
        req.success = successCodes.SUCC_LOADED
        return res.json({
          status: true,
          message: successCodes.SUCC_LOADED,
          monthlyTotalAlgaePlanted,
          totalAlgaeCount: totalAlgaeCount,
        });
      }

      //////
      else if (type == 1) {
        let monthlyTotalEchoPlanted = await sequelize.query(
          `SELECT *
        FROM  (
           SELECT month::date
           FROM   generate_series(timestamp '${startYearDate}'
                                , timestamp '${endYearDate}'
                                , interval  '1 month') month
           ) d
        LEFT   JOIN (
      SELECT date_trunc('month', "m"."createdAt")::date AS month,
         TO_CHAR("m"."createdAt", 'Mon') AS "monthName",
          sum("totalMonthlyCall") as "totalMonthlyCall",
        "r"."ecoType"
      FROM "echoEcoMonthlyData" as "m"
      FULL OUTER JOIN "overallEchoEcos" as "o" on "m"."apiId"="o"."id" 
      left outer join "ref_EcoTypes" as "r" on "o"."ecoType"="r"."id" 
        where  "o"."ecoType"=1
        and "m"."companyId"='${companyId}'
        and "m"."createdAt">='${startYearDate}'
        and "m"."createdAt"<='${endYearDate}'
      group by 1,
        "r"."ecoType",
        "monthName"
      )t USING (month)
        ORDER  BY month;`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );

        let deadlineBill = await sequelize.query(
          `SELECT DATE ("p"."deadline") - CURRENT_DATE as remainingDays, "p"."isPaid"
            FROM "echoEcoMonthlyData" AS "p"
           WHERE 
            "p"."companyId" = '${companyId}'
            and "p"."isPaid"=false
            group by "p"."id"`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
        NoOfReachingDeadline = deadlineBill.filter(
          (item) => Number(item.remainingdays) <= 7
        );

        let monthlyTotalTreePlanted = [];
        var month = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        let totalTreeCount = 0;
        for (let name of month) {
          let count = 0;
          for (data of monthlyTotalEchoPlanted) {
            if (name == data.monthName) {
              count = 1;
              totalTreeCount += parseInt(data.totalMonthlyCall);
              data.totalMonthlyCall = parseInt(data.totalMonthlyCall);
              monthlyTotalTreePlanted.push(data);
              continue;
            }
          }
          if (count == 0) {
            monthlyTotalTreePlanted.push({
              monthName: name,
              totalMonthlyCall: 0,
              ecoType: "Tree",
            });
          }
        }
        req.success = successCodes.SUCC_LOADED
        return res.json({
          status: true,
          message: successCodes.SUCC_LOADED,
          monthlyTotalTreePlanted,
          totalTreeCount: totalTreeCount,
          deadlineBills: NoOfReachingDeadline.length,
        });
      }

      ///
      else if (type == 3) {
        let monthlyTotalEchoPlanted = await sequelize.query(
          `SELECT *
        FROM  (
           SELECT month::date
           FROM   generate_series(timestamp '${startYearDate}'
                                , timestamp '${endYearDate}'
                                , interval  '1 month') month
           ) d
        LEFT   JOIN (
      SELECT date_trunc('month', "m"."createdAt")::date AS month,
         TO_CHAR("m"."createdAt", 'Mon') AS "monthName",
          sum("totalMonthlyCall") as "totalMonthlyCall"
      FROM "echoEcoMonthlyData" as "m"
      FULL OUTER JOIN "overallEchoEcos" as "o" on "m"."apiId"="o"."id" 
      left outer join "ref_EcoTypes" as "r" on "o"."ecoType"="r"."id" 
        where "m"."companyId"='${companyId}'
        and "m"."createdAt">='${startYearDate}'
        and "m"."createdAt"<='${endYearDate}'
      group by 1,
        "monthName"
      )t USING (month)
        ORDER  BY month;`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );

        let monthlyTotalTreePlanted = [];
        var month = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        let count = 0;
        monthlyTotalEchoPlanted.map(data => {
          if(month.includes(data.monthName)){
            data.totalMonthlyCall = parseInt(data.totalMonthlyCall);
            monthlyTotalTreePlanted.push(data);
            count++;
          }else {
            monthlyTotalTreePlanted.push({
              monthName: month[count],
              totalMonthlyCall: 0,
            })
            count++;
          }
        })
        // for (let name of month) {
        //   let count = 0;
        //   for (data of monthlyTotalEchoPlanted) {
        //     if (name == data.monthName) {
        //       count = 1;
        //       data.totalMonthlyCall = parseInt(data.totalMonthlyCall);
        //       monthlyTotalTreePlanted.push(data);
        //       continue;
        //     }
        //   }
        //   if (count == 0) {
        //     monthlyTotalTreePlanted.push({
        //       monthName: name,
        //       totalMonthlyCall: 0,
        //     });
        //   }
        // }
        req.success = successCodes.SUCC_LOADED
        return res.json({
          status: true,
          message: successCodes.SUCC_LOADED,
          monthlyTotalTreePlanted,
        });
      }
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getKeyMilestoneByCompanyId: async function (req, res) {
    try {
      let companyId = req.body.companyId;

      let companyCreatedAt = await sequelize.query(
        `SELECT to_char("c"."createdAt",'DD-MM-YYYY') as "companyCreatedAt"
        FROM  "companies" as "c"
           WHERE
         "c"."id" ='${companyId}'
         limit 1`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let echoEcoCreatedAt = await sequelize.query(
        `SELECT to_char("o"."createdAt",'DD-MM-YYYY') as "echoEcoCreatedAt"
          FROM  "overallEchoEcos" as "o"
             WHERE
           "o"."companyId" ='${companyId}'
            order by "o"."createdAt" asc
            limit 1`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let algaeCreatedAt = await sequelize.query(
        `
        select to_char("eyd"."createdAt",'DD-MM-YYYY') as "algaeCreatedAt"  
        FROM  "overallEchoEcos" as "o"
        left outer join "echoEcoYearlyData" as "eyd" on "o"."id"="eyd"."apiId"
        WHERE
      "o"."companyId" ='${companyId}'
      and "o"."ecoType"=2
       order by "o"."createdAt" asc
       limit 1`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let treeCreatedAt = await sequelize.query(
        `
        select to_char("eyd"."createdAt",'DD-MM-YYYY') as "treeCreatedAt"  
        FROM  "overallEchoEcos" as "o"
        left outer join "echoEcoYearlyData" as "eyd" on "o"."id"="eyd"."apiId"
        WHERE
      "o"."companyId" ='${companyId}'
      and "o"."ecoType"=1
       order by "o"."createdAt" asc
       limit 1`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let fiftyTreeCreatedAt = await sequelize.query(
        `
              select  to_char("c"."treeFiftyCallDate",'DD-MM-YYYY')as "fiftyTreeCreatedAt"
               from "companies" as "c"
             where "c"."id"='${companyId}'
             and "c"."treeApisCallCount"=50
              `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let keyMilestone = [
        {
          companyCreatedAt: "",
          echoEcoCreatedAt: "",
          treeCreatedAt: "",
          algaeCreatedAt: "",
          fiftyTreeCreatedAt: "",
        },
      ];

      if (companyCreatedAt[0]) {
        keyMilestone[0].companyCreatedAt =
          companyCreatedAt[0]?.companyCreatedAt;
      }

      if (echoEcoCreatedAt[0]) {
        keyMilestone[0].echoEcoCreatedAt =
          echoEcoCreatedAt[0]?.echoEcoCreatedAt;
      }

      if (treeCreatedAt[0]) {
        keyMilestone[0].treeCreatedAt = treeCreatedAt[0]?.treeCreatedAt;
      }

      if (algaeCreatedAt[0]) {
        keyMilestone[0].algaeCreatedAt = algaeCreatedAt[0]?.algaeCreatedAt;
      }
      if (fiftyTreeCreatedAt[0]) {
        keyMilestone[0].fiftyTreeCreatedAt =
          fiftyTreeCreatedAt[0]?.fiftyTreeCreatedAt;
      }

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        keyMilestone,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  latestOverallEchoEco: async function (req, res) {
    try {
      let companyId = req.body.companyId;
      let offset = req.body.offset;

      let companyOverallEcho = await sequelize.query(
        `select "o"."apiName", "o"."isActive", "o"."goalDays", "o"."goalAmount", "r"."ecoType",
        count("d"."id")as "apiCall", "d"."apiId",(select "de"."createdAt" as "date"
         from "dailyEchoEcoCalls" as de
        where "de"."apiId"="d"."apiId"
          order by "de"."createdAt" desc
          limit 1)as "lastDate",
          "o"."totalGoalReached"
          from "dailyEchoEcoCalls" as d
          left outer join "overallEchoEcos" as "o" on "d"."apiId"="o"."id"
          left outer join "ref_EcoTypes" as "r" on "o"."ecoType"="r"."id"
          where "d"."companyId"='${companyId}'
          group by "d"."companyId",
          "d"."apiId",
          "o"."id",
          "r"."id"
          order by "lastDate" desc
          OFFSET '${offset}' ROWS FETCH NEXT 10 ROWS ONLY`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let companyTotalApiCall = await sequelize.query(
        `
          select sum("totalGoalReached") as "quantity" from "overallEchoEcos" as "o"
          where "o"."companyId"='${companyId}';`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        companyOverallEcho,
        companyTotalApiCall,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getEchoEcoGoalStatus: async function (req, res) {
    try {
      let todayDate = new Date();
      todayDate = JSON.stringify(todayDate);

      let getGoalTreeStatus = await sequelize.query(
        `SELECT "o"."id", "companyId", "apiName",
        "goalAmount", "goalDays", "ecoType",
        "ecoPurpose", "apiKey", "areaSqFt", "isValid", 
        "o"."isActive", "rate", "goalReached", "lastDate",
     (CASE WHEN date("lastDate")-date '${todayDate}'  > 0 THEN date("lastDate")-date '${todayDate}'  ELSE null END)
  as "days"
        FROM "companies" AS "c"
    left outer join "overallEchoEcos" as o on "c"."id"="o"."companyId" and "o"."ecoType"=1
        WHERE "c"."id" = '${req.body.companyId}'
    order by days asc
    limit 1;`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      let getGoalAlgaeStatus = await sequelize.query(
        `SELECT "o"."id", "companyId", "apiName",
          "goalAmount", "goalDays", "ecoType",
          "ecoPurpose", "apiKey", "areaSqFt", "isValid", 
          "o"."isActive", "rate", "goalReached", "lastDate",
       (CASE WHEN date("lastDate")-date '${todayDate}'  > 0 THEN date("lastDate")-date '${todayDate}'  ELSE null END)
    as "days"
          FROM "companies" AS "c"
      left outer join "overallEchoEcos" as o on "c"."id"="o"."companyId" and "o"."ecoType"=2
          WHERE "c"."id" = '${req.body.companyId}'
      order by days asc
      limit 1;`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        getGoalTreeStatus,
        getGoalAlgaeStatus,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  verifyEmailOtp: async function (req, res) {
    try {
      let companyAdminEmail = req.body.companyAdminEmail;
      let otp = req.body.otp;
      let updateUserRole = req.body.updateUserRole;
      let subAdminRegisterOtp = req.body.subAdminRegisterOtp;
      let verify = await EmailOtp.findOne({
        where: { email: companyAdminEmail, otp: otp, isValid: "true" },
        distinct: true,
        raw: true,
      });
      if (verify) {
        let user = await Admin.findOne({
          where: { companyAdminEmail },
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
        if (subAdminRegisterOtp) {
          req.success = successCodes.SUCC_OTP_VERIFIED
          return res.json({
            status: true,
            message: successCodes.SUCC_OTP_VERIFIED,
          });
        }
        if (updateUserRole) {
          req.success = successCodes.SUCC_OTP_VERIFIED
          return res.json({
            status: true,
            message: successCodes.SUCC_OTP_VERIFIED,
          });
        }
        await Admin.update(
          { status: 1 },
          { where: { companyAdminEmail: companyAdminEmail } }
        );

        let sendEmail = sendWelcomeEmail(
          req.body.companyAdminEmail,
          user.companyAdminName
        );

        req.success = successCodes.SUCC_OTP_VERIFIED
        return res.json({
          status: true,
          message: successCodes.SUCC_OTP_VERIFIED,
          userStatus: successCodes.VERIFIED,
        });
      }
      req.error = errorCodes.ERR_INCORRECT_EXPIRED_OTP;
      return res.json({
        status: false,
        message: errorCodes.ERR_INCORRECT_EXPIRED_OTP,
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

  sendOtp: async function (req, res) {
    try {
      let companyAdminEmail = req.body.companyAdminEmail;
      let user = await Admin.findOne({ where: { companyAdminEmail } });
      if (!user) {
        req.error = errorCodes.ERR_EMAIL_NOT_EXISTING;
        return res.json({
          status: false,
          message: errorCodes.ERR_EMAIL_NOT_EXISTING,
        });
      }
      let emailOtp = await EmailOtp.findAll({
        where: { email: companyAdminEmail },
        distinct: true,
        raw: true,
      });
      if (emailOtp.length > 5) {
        await EmailOtp.destroy({
          where: { email: companyAdminEmail },
        });
      }
      console.log(emailOtp.length);
      let otp = Math.floor(100000 + Math.random() * 900000);

      await EmailOtp.create({ email: companyAdminEmail, otp: otp });
      //email service logic to be written here

      if (user.isActive == 2) {
        let sendEmail = sendResetPasswordOtpForDeActivation(
          req.body.companyAdminEmail,
          user.companyAdminName,
          otp
        );
      } else if (req.body.flag == 1) {
        let sendEmail = sendOtpForSubAdminRegister(
          req.body.companyAdminEmail,
          user.companyAdminName,
          otp
        );
      } else if (user.isActive == 0) {
        req.error = errorCodes.ERR_ACCOUNT_BLOCKED;
        return res.json({
          status: false,
          message: errorCodes.ERR_ACCOUNT_BLOCKED,
        });
      } else if (req.body.registerFlow == false) {
        let sendEmail = sendResetPasswordOtp(
          req.body.companyAdminEmail,
          user.companyAdminName,
          otp
        );
      } else {
        let sendEmail = sendVerificationEmail(
          req.body.companyAdminEmail,
          user.companyAdminName,
          otp
        );
      }
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
      let companyAdminEmail = req.body.companyAdminEmail;
      let otp = req.body.otp;

      let verify = await EmailOtp.findAll({ where: { otp: otp } });
      if (verify[0]) {
        let user = await Admin.findOne({
          where: { companyAdminEmail },
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
        req.success = successCodes.SUCC_OTP_VERIFIED
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
      let companyAdminEmail = req.body.companyAdminEmail;
      let user = await Admin.findOne({
        where: { companyAdminEmail: companyAdminEmail },
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
          let newPassword = generateHash(password);
          await Admin.update(
            { companyAdminPassword: newPassword, loginTryCount: 3 },
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

        req.success = successCodes.SUCC_CHANGE_PASSWORD
          return res.json({
            status: true,
            message: successCodes.SUCC_CHANGE_PASSWORD,
            userStatus: successCodes.SUCC_STATUS_PASSWORD_CHANGED,
          });
        }
        req.error = errorCodes.ERR_AUTH_KEY;
        return res.json({
          status: false,
          message: errorCodes.ERR_AUTH_KEY,
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

  createPost: async function (req, res) {
    let userId = req.userInfo.userId;
    try {
      const { companyId, postText, postImg } = req.body;
      if (!companyId || (!postText && !postImg)) {
        req.error = errorCodes.ERR_PAYLOAD_EMPTY
        return res.json({
          status: false,
          message: errorCodes.ERR_PAYLOAD_EMPTY,
        });
      }
      let post = await Post.create({
        createdBy: userId,
        companyId: req.body.companyId,
        postText: req.body.postText,
        postImg: req.body.postImg,
      });

      req.success = successCodes.SUCC_CREATE
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        post,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getPostsByCompanyId: async function (req, res) {
    try {
      let posts = await sequelize.query(
        `SELECT * from "posts" where "companyId" = '${req.body.companyId}'
        order by "createdAt" desc 
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        posts,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  deletePostByCompanyId: async function (req, res) {
    const currentDate = new Date();
    try {
      await Post.update(
        { deletedAt: currentDate },
        {
          where: {
            id: req.body.id,
            companyId: req.body.companyId,
          },
        }
      );

      req.success = successCodes.SUCC_DELETE
      return res.json({
        status: true,
        message: successCodes.SUCC_DELETE,
      });
    } catch (error) {
      req.error = error;
      return res.status(500).json({
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  editPostById: async function (req, res) {
    try {
      await Post.update(
        {
          postText: req.body.postText,
          postImg: req.body.postImg,
        },
        {
          where: {
            id: req.body.id,
            companyId: req.body.companyId,
          },
        }
      );

      req.success = successCodes.SUCC_UPDATE
      return res.json({
        status: true,
        message: successCodes.SUCC_UPDATE,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getTotalTreeAlgae: async (req, res) => {
    try {
      let totalTree = await sequelize.query(
        `select "ecoType", "companyId", sum("totalGoalReached") from "overallEchoEcos"
        where "companyId" = '${req.body.companyId}' and "ecoType" = '1'
        group by "ecoType", "companyId"`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let totalAlgae = await sequelize.query(
        `select "ecoType", "companyId", sum("totalGoalReached") from "overallEchoEcos"
        where "companyId" = '${req.body.companyId}' and "ecoType" = '2'
        group by "ecoType", "companyId"`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        totalTree: totalTree[0]?.sum || 0,
        totalAlgae: totalAlgae[0]?.sum || 0,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  createEchoEcoReport: async (req, res) => {
    try {
      const { companyId, apiId, yearlyId } = req.body;
      let echoEcoData = await sequelize.query(
        `select "c"."id" as "companyId",  c."companyName",a."companyAdminEmail",e."totalYearlyApiCall", TO_CHAR("o"."createdAt", 'YYYY') AS "createdYear", o."apiName" from "companies" as c
        left outer join "overallEchoEcos" as o on "c"."id"="o"."companyId" and "o"."id"= '${apiId}'
        left outer join "admins" as a on "c"."id"="a"."companyId"
		    left outer join "echoEcoYearlyData" as e on "c"."id"="e"."companyId" and "o"."id"="e"."apiId"
        where "c"."id" = '${companyId}'  and "e"."yearlyId" = '${yearlyId}' and "o"."id"= '${apiId}'
        `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      await EchoEcoReport.create({
        apiId: apiId,
        apiName: echoEcoData[0].apiName,
        companyId: echoEcoData[0].companyId,
        companyName: echoEcoData[0].companyName,
        companyAdminEmail: echoEcoData[0].companyAdminEmail,
        totalYearlyApiCall: echoEcoData[0].totalYearlyApiCall,
        yearlyId: yearlyId,
        createdYear: echoEcoData[0].createdYear,
      });
      await EchoEcoYearlyData.update(
        {
          isRequested: true,
        },
        {
          where: {
            yearlyId: yearlyId,
          },
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        emailSent: successCodes.SUCC_SEND_MAIL,
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
  getSitesByLocation: async function (req, res) {
    try {
      let sites = await sequelize.query(
        `select "uuid", "siteName", "location" from "siteAdmins" where LOWER("location") LIKE '%%'`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
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

  createOrder: async function (req, res) {
    try {
      let options = {};
      if (req.body.monthlyId) {
        options = {
          amount: req.body.amount * 100,
          currency: "USD",
          receipt: uniquId.time(),
          notes: {
            companyId: req.body.companyId,
            monthlyId: req.body.monthlyId,
            // "monthlyId":["deeer","dd"].join()
          }, // shortid.generate(), //any unique id
          // payment_capture : 1 //optional
        };
      } else {
        options = {
          amount: req.body.amount * 100,
          currency: "USD",
          receipt: uniquId.time(),
          notes: {
            companyId: req.body.companyId,
            monthlyIdArray: JSON.stringify(req.body?.monthlyIdArray),
            // "monthlyId":["deeer","dd"].join()
          }, // shortid.generate(), //any unique id
          // payment_capture : 1 //optional
        };
      }

      const response = await instance.orders.create(options);
      res.json({
        order_id: response.id,
        currency: response.currency,
        amount: response.amount / 100,
      });
    } catch (error) {
      console.log(error);
      req.error = error.message;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },



  paymentVerify: async function (req, res) {
    try {
      let body =
        req.body.response.razorpay_order_id +
        "|" +
        req.body.response.razorpay_payment_id;
      var expectedSignature = crypto
        .createHmac("sha256", process.env.razorpay_key_secret)
        .update(body.toString())
        .digest("hex");
      if (expectedSignature === req.body.response.razorpay_signature) {
        let monthlyIdArr = [];
        monthlyIdArr = req.body.monthlyIdArr;
        if (monthlyIdArr) {
          await EchoEcoMonthlyData.update(
            {
              isPaid: true,
            },
            {
              where: {
                monthlyId: monthlyIdArr,
              },
            }
          );
        } else if (req.body.monthlyId) {
          await EchoEcoMonthlyData.update(
            {
              isPaid: true,
            },
            {
              where: {
                monthlyId: req.body.monthlyId,
              },
            }
          );
        }
        res.send({ code: 200, message: successCodes.SUCC_SIGN_VALID });
      } else {
        res.send({ code: 500, message: errorCodes.ERR_SIGN_INVALID });
      }
    } catch (error) {
      console.log(error);
      req.error = error
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },
  pendingTransactions: async function (req, res) {
    try {
      let echoEco = await sequelize.query(
        ` 
         SELECT 
         "p"."monthlyId",
         "oee"."id" as "apiId",
         "p"."companyId",
         "oee"."apiName",
     ("p"."totalMonthlyCall" * "rem"."amountMultiply")
     as "amount",
         "p"."totalMonthlyCall",
         "ret"."ecoType",
         "p"."createdAt",
         "p"."deadline",
         "p"."isPaid"
        FROM 
          "echoEcoMonthlyData" AS "p"
          left outer join "overallEchoEcos" as "oee" on "p"."apiId" = "oee"."id"
          left outer join "ref_EcoTypes" as "ret" on "oee"."ecoType" = "ret"."id"
          left outer join "ref_EchoEcoMultiplies" as "rem" on "oee"."ecoType" = "rem"."ecoTypeId"
 
        WHERE 
          "p"."companyId" = '${req.body.companyId}'
          and "p"."isPaid"=false and "p"."createdAt" < DATE_TRUNC('month', CURRENT_DATE)
          group by "p"."id", "oee"."id", "ret"."ecoType","rem"."amountMultiply"
          OFFSET '${req.body.offset}' ROWS FETCH NEXT 15 ROWS ONLY
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: echoEco,
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

  completedTransactions: async function (req, res) {
    try {
      let echoEco = await sequelize.query(
        ` 
         SELECT 
         "p"."monthlyId",
     "th"."orderId",
     "th"."paymentId",
     "th"."amount",
     "th"."currency",
     "th"."paymentMethod",
         "oee"."id" as "apiId",
         "p"."companyId",
         "oee"."apiName",
         "p"."totalMonthlyCall",
         "ret"."ecoType",
         "p"."createdAt",
         "p"."isPaid",
         "p"."monthlyPlanted",
         "p"."monthlyPlantAlive"
        FROM 
          "echoEcoMonthlyData" AS "p"
          left outer join "overallEchoEcos" as "oee" on "p"."apiId" = "oee"."id"
          left outer join "ref_EcoTypes" as "ret" on "oee"."ecoType" = "ret"."id"
       left outer join "transactionHistories" as "th" on "p"."monthlyId" = "th"."monthlyId"
        WHERE 
          "p"."companyId" = '${req.body.companyId}'
          and "p"."isPaid"= true
          group by "p"."id", "oee"."id", "ret"."ecoType",
      "th"."orderId",
      "th"."paymentId",
     "th"."amount",
     "th"."currency",
     "th"."paymentMethod"
     OFFSET '${req.body.offset}' ROWS FETCH NEXT 15 ROWS ONLY`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.status(200).json({
        status: true,
        message: successCodes.SUCC_LOADED,
        data: echoEco,
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

  webhook: async function (req, res) {
    try {
      let data = req.body["payload"]["payment"]["entity"];
      const captured = data?.captured;
      if (captured) {
        if (data.notes.monthlyId) {
          await TransactionHistory.create({
            orderId: data.order_id,
            paymentId: data.id,
            companyId: data.notes.companyId,
            // apiId: req.body.apiId,
            monthlyId: data.notes.monthlyId,
            amount: data.amount / 100,
            currency: data.currency,
            paymentMethod: data.method,
          });
        } else {
          let arr = [];
          // let monthlyArr =[];
          let monthlyArr = data.notes.monthlyIdArray;

          monthlyArr = JSON.parse(monthlyArr);
          for (i of monthlyArr) {
            arr.push({
              orderId: data.order_id,
              paymentId: data.id,
              companyId: data.notes.companyId,
              // apiId: req.body.apiId,
              monthlyId: i.monthlyId,
              amount: i.amount,
              currency: data.currency,
              paymentMethod: data.method,
            });
          }
          let opts = {
            returning: true,
          };
          await TransactionHistory.bulkCreate(arr, opts);
        }
        return res.send(successCodes.SUCC_PAYMENT_CAPTURED);
      }
    } catch (error) {
      console.log(error);
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getUsersTransactions: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      // let userId = "6151b3a0-a839-11ed-97aa-45fb9dc108c1";
      let nameOfPerson = await Admin.findOne({
        where: { uuid: userId },
        raw: true,
      });
      let companyId = nameOfPerson.companyId;
      let email = nameOfPerson.companyAdminEmail;
      nameOfPerson = nameOfPerson.companyAdminName;

      let usersTransactions = await sequelize.query(
        ` 
         SELECT 
         "p"."monthlyId",
     "th"."orderId",
     "th"."paymentId",
     "th"."amount",
     "th"."currency",
     "th"."paymentMethod",
         "oee"."id" as "apiId",
         "p"."companyId",
         "oee"."apiName",
         "p"."totalMonthlyCall",
         "ret"."ecoType",
         "p"."createdAt",
         "p"."deadline",
         "p"."isPaid"
        FROM 
          "echoEcoMonthlyData" AS "p"
          left outer join "overallEchoEcos" as "oee" on "p"."apiId" = "oee"."id"
          left outer join "ref_EcoTypes" as "ret" on "oee"."ecoType" = "ret"."id"
       left outer join "transactionHistories" as "th" on "p"."monthlyId" = "th"."monthlyId"
        WHERE 
          "p"."companyId" = '${companyId}'
          and "p"."isPaid"= true
          group by "p"."id", "oee"."id", "ret"."ecoType",
      "th"."orderId",
      "th"."paymentId",
     "th"."amount",
     "th"."currency",
     "th"."paymentMethod";`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      var html = `
        <!doctype html>
          <html lang="en">
            <head>
            <!-- Required meta tags -->
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
            <!-- Bootstrap CSS -->
            <title>Transactions</title>
          <style>
            html{zoom:0.5}
            body {
              font-family:Serif;
            } 
            .pg-break{
                page-break-after: always;
            }
            .page-break{
              page-break-before: always;
            }

            .mr-ml {
              margin-right: 0px;
              margin-left: 0px;
            }
            .html-text-new {
              font-family: Serif !important;
              font-style: normal;
              font-size: 15px;
              color: #000000;
              margin-left: 0.1rem;
              margin-top: 0.5rem;
            }
            ._heading {
              font-family:Serif !important;
              font-style: normal;
              font-size: 25px;
              line-height: 28px;
              color: black;
              margin-left: 0.1rem;
            }
            .Article_Image {
              width: 300px;
              height: 300px;
              margin-top:10px;
              vertical-align: top;
              display: inline-block;
            }
            .auther-details{
              width: 300px;
              height: 300px;
              margin-top:20px;
              display: inline-block;
              margin-left: 20px;
            }
            .page-wrapper {
              margin-top: 0px;
            }
            .page-wrapper:not(:first-child) {
              margin-top : 50px !important;
            }
            table {
              font-family: Serif;
              border-collapse: collapse;
              width: 100%;
            }
            td, th {
              text-align: left;
              padding: 8px;
            }
            .page-header, .page-header-space {
              height: 100px;
            }
            .page-footer, .page-footer-space {
              height: 150px;
            }
            .page-footer {
              position: fixed;
              bottom: 0;
              width: 100%;
              background:white;/* for demo */
            }
            .page-header {
              position: fixed;
              top: 0mm;
              width: 100%;
            }
            .page {
              page-break-after: always;
            }
            @page {
              margin: 20mm
            }
              
            #pageFooter:after {
              counter-increment: page;
              content: counter(page);
            }
            @media print {
              thead {display: table-header-group;}
              tfoot {display: table-footer-group;}
              button {display: none;}
              body {margin: 0;}
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <td>
                <!--place holder for the fixed-position header-->
                  <div class="page-header-space"></div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="margin-top:35%;">
                    <center>
                    <h3>Downloaded by ${nameOfPerson}</h3>
                    </center>
                    <div></div>
                  </div>
                  <img alt="" src="https://sceem-user-l3s5f.ondigitalocean.app/uploads/1653632192257nebutech logo.png" style="width: 25%;float:right">
                  <div class="page-break"></div>
                </td>
              </tr>
            </tbody>
          </table>
          <table>
            <thead>
              <tr>
                <th>Sl No.</th>
                <th>Payment Id</th>
                <th>Payment Method</th>
                <th>Name</th>
                <th>(Planted or Spawned) / Total</th>
                <th>
                 Amount {$}
                </th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>`;
      usersTransactions.map(function (value, index) {
        var event = new Date(value.createdAt);
        let date = JSON.stringify(event);
        date = date.slice(1, 11);
        html += ` <tr>
        <td>${index + 1}</td>
        <td>${value.paymentId}</td>
        <td>${value.paymentMethod}</td>
        <td>${value.apiName}</td>
        <td>${value.planted} / ${value.totalPlantRequested}</td>
        <td>${value.amount}</td>
        <td>
          Echo Eco
          <span className="font-normal text-[11px] ml-[2px]">
            ${value.ecoType.toLowerCase()}
          </span>
        </td>
      </tr>`;
      });
      `</tbody>
      </table>`;
      html += `</body></html> `;

  const puppeteer = require('puppeteer');
(async () => {
const browserFetcher = puppeteer.createBrowserFetcher();
      let revisionInfo = await browserFetcher.download('1095492');
      
      const browser =await puppeteer.launch({
          executablePath: revisionInfo.executablePath,
          ignoreDefaultArgs: ['--disable-extensions'],
          headless: true,
          // headless: false,
          ignoreHTTPSErrors:true,
          args: ['--no-sandbox', "--disabled-setupid-sandbox"]
        });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.emulateMediaType('screen');

  const pdf = await page.pdf({
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A4',
  });
  await browser.close();
  await sendPdfTransactionToUser(email, pdf, nameOfPerson);
  req.success = successCodes.SUCC_PDF_SENT
  return res.send({
          status: true,
          message: successCodes.SUCC_PDF_SENT,
        });
})();
    } catch (error) {
      console.log("error", error);
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  sharePost: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      const sharePost = await SharePost.create({
        postId: req.body.postId,
        companyIdPostBelongTo: req.body.companyIdPostBelongTo,
        companyIdPostShareBy: req.body.companyIdPostShareBy,
      });

      req.success = successCodes.SUCC_LOADED;
      return res.send(200, {
        status: true,
        message: successCodes.SUCC_LOADED,
        sharePost,
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
  getPostById: async function (req, res) {
    try {
      const postId = req.body.postId;
      let sharePost = await sequelize.query(
        ` 
          select "p"."id","companyId","postText","postImg","c"."companyName","c"."companyIcon","rp"."updatedByrdsPoints"
          from "posts" as "p"
          left outer join "companies" as "c" on "p"."companyId"="c"."id"
          left outer join "companyRankAndPoints" as "rp" on "p"."companyId"="rp"."id"
          where "p"."id"='${postId}'`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED;
      return res.send(200, {
        status: true,
        message: successCodes.SUCC_LOADED,
        sharePost,
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

  createSupportComplaint: async function (req, res) {
    try {
      let request = await SupportAndComplaint.create({
        requesterId: req.userInfo.userId,
        requesterRole: req.body.requesterRole,
        type: req.body.type,
        description: req.body.description
      });

      req.success = successCodes.SUCC_CREATE
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
};
