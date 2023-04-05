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
const DailyEchoEcoCalls = models.dailyEchoEcoCalls;
const EchoEcoMonthlyData = models.echoEcoMonthlyData;
const EchoEcoYearlyData = models.echoEcoYearlyData;
const Location = models.ref_Location;
const SiteAdmin = models.siteAdmin;
const SuperAdmin = models.superAdmin;

var moment = require("moment-timezone");

const crypto = require("crypto");
var sequelize = require("../models/connection");
// var ResetPasswordKey=models.resetPasswordKey;
const Op = Sequelize.Op;
var passwordKey = process.env.PASSWORD_ENCRYPTION_KEY || "adsdfgfhhkjkdfgh";
var SimpleCrypto = require("simple-crypto-js").default;
const simpleCrypto = new SimpleCrypto(passwordKey);
module.exports = {
  echoEcoCall: async function (req, res) {
    ////apikey validation
    try {
      const monthlyId = crypto.randomBytes(12).toString("hex");
      const yearlyId = crypto.randomBytes(12).toString("hex");

      const apiId = req.params.id;
      const companyName = req.params.name;
      let echoEcoData = await OverallEchoEcos.findOne({
        raw: true,
        where: {
          id: apiId,
          isActive: 1,
        },
      });
      if (!echoEcoData) {
        req.error = errorCodes.ERR_DEACTIVE
        return res.json({
          status: false,
          message: errorCodes.ERR_DEACTIVE,
        });
      }

      let locationData = await Location.findAll({
        raw: true,
        where: {
          type: [echoEcoData.ecoType, 0],
        },
      });
      const randomLocation = Math.floor(Math.random() * locationData.length);
      let location = locationData[randomLocation];

      let dailyEchoEcoCalls = await DailyEchoEcoCalls.create({
        apiId: echoEcoData.id,
        companyId: echoEcoData.companyId,
      });
      let todayDate = new Date();
      let currentDateforDeadLine = new Date();
      const deadline = new Date(currentDateforDeadLine.setDate(currentDateforDeadLine.getDate() + 45));
      // let startDate=new Date()
      let yearAndMonth = moment(todayDate).format("YYYY-MM");

      let startDate = moment(todayDate).format("YYYY-MM-01");
      let startYearDate = moment(todayDate).format("YYYY-01-01");

      let checkMonthlyId = await EchoEcoMonthlyData.findOne({
        raw: true,
        where: {
          apiId: echoEcoData.id,
          companyId: echoEcoData.companyId,
          createdAt: {
            [Op.gte]: startDate,
            [Op.lte]: todayDate,
          },
        },
      });

      if (!checkMonthlyId) {
        let company = await Company.findOne({
          where: { id: echoEcoData.companyId },
        });
        let site = "";
        if (company) {
          let sites = await sequelize.query(
            `select "uuid", "siteName", "location" from "siteAdmins" where LOWER("location") LIKE '%${company?.companyCountry
              ?.toLowerCase()
              .trim()}%'`,
            {
              type: sequelize.QueryTypes.SELECT,
            }
          );
          if (sites.length) {
            site = sites[Math.floor(Math.random() * sites.length)]?.siteName;
          }
        }
        let createMonthlyId = await EchoEcoMonthlyData.create({
          apiId: echoEcoData.id,
          companyId: echoEcoData.companyId,
          monthlyId: monthlyId,
          deadline: deadline,
          location: location?.id,
          siteAssigned: site,
        });
      }

      let allMonthLocation = await EchoEcoMonthlyData.findAll({
        raw: true,
        attributes: ["location"],
        group: ["location"],
        where: {
          apiId: echoEcoData.id,
          companyId: echoEcoData.companyId,
          createdAt: {
            [Op.gte]: startYearDate,
            [Op.lte]: todayDate,
          },
        },
      });
      let locationNumber = allMonthLocation.length;

      if (!checkMonthlyId) {
        let createYearlyId = await EchoEcoYearlyData.update(
          {
            location: locationNumber,
          },
          {
            where: {
              apiId: echoEcoData.id,
              companyId: echoEcoData.companyId,
              createdAt: {
                [Op.gte]: startYearDate,
                [Op.lte]: todayDate,
              },
            },
          }
        );
      }

      let checkYearlyId = await EchoEcoYearlyData.findOne({
        raw: true,
        where: {
          apiId: echoEcoData.id,
          companyId: echoEcoData.companyId,
          createdAt: {
            [Op.gte]: startYearDate,
            [Op.lte]: todayDate,
          },
        },
      });

      try {
        await EchoEcoYearlyData.increment(
          { totalYearlyApiCall: +1 },
          { where: { yearlyId: checkYearlyId } }
        );
      } catch (error) {}

      if (!checkYearlyId) {
        let createYearlyId = await EchoEcoYearlyData.create({
          apiId: echoEcoData.id,
          companyId: echoEcoData.companyId,
          yearlyId: yearlyId,
          location: locationNumber,
        });
      }

      if (echoEcoData.lastDate >= todayDate) {
        await OverallEchoEcos.increment(
          { goalReached: +1 },
          { where: { id: echoEcoData.id } }
        );
      }

      try {
        await OverallEchoEcos.increment(
          { totalGoalReached: +1 },
          { where: { id: echoEcoData.id } }
        );
      } catch (error) {}

      let monthlyIncrement = await sequelize.query(
        `
          UPDATE "echoEcoMonthlyData"
          SET "totalMonthlyCall"="totalMonthlyCall"+ 1
          WHERE "apiId" = '${echoEcoData.id}'
          AND "companyId" = '${echoEcoData.companyId}'
         AND to_char("createdAt",'YYYY-MM') = '${yearAndMonth}'
          RETURNING *    
         `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (echoEcoData.ecoType == 1) {
        let companyData = await Company.findOne({
          raw: true,
          where: {
            id: echoEcoData.companyId,
          },
        });
        if (companyData.treeApisCallCount < 50) {
          let monthlyIncrement = await sequelize.query(
            `
            UPDATE "companies"
            SET "treeApisCallCount"="treeApisCallCount"+ 1
            WHERE 
            "id" = '${echoEcoData.companyId}'
            RETURNING *    
           `,
            {
              type: sequelize.QueryTypes.SELECT,
            }
          );

          if (companyData.treeApisCallCount == 49) {
            let fiftyTreeCallDate = await Company.update(
              {
                treeFiftyCallDate: new Date(),
              },
              {
                where: {
                  id: echoEcoData.companyId,
                },
              }
            );
          }
        }
      }

      req.success = successCodes.SUCC_CREATE
      return res.json({
        status: true,
        message: successCodes.SUCC_CREATE,
        dailyEchoEcoCalls,
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

  echoEcoCallView: async function (req, res) {
    ////api key view validation
    try {
      const apiId = req.params.id;
      let echoEcoTotalApiCall = await sequelize.query(
        `SELECT count("id")as "totalCall"
                FROM "dailyEchoEcoCalls" AS d
                WHERE "apiId" = '${apiId}';`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let echoEcoData = await OverallEchoEcos.findOne({
        attributes: ["companyId", "id", "ecoType", "isActive"],
        raw: true,
        where: {
          id: apiId,
        },
      });
      if (echoEcoData.ecoType == 1) {
        if (echoEcoData.isActive != 1) {
          req.error = errorCodes.ERR_DEACTIVE
          return res.json({
            status: false,
            message: errorCodes.ERR_DEACTIVE,
            total_trees: echoEcoTotalApiCall[0].totalCall,
          });
        }
        req.success = successCodes.SUCC_LOADED
        return res.json({
          status: true,
          message: successCodes.SUCC_LOADED,
          total_trees: echoEcoTotalApiCall[0].totalCall,
          companyId: echoEcoData.companyId,
          apiId: echoEcoData.id,
        });
      }
      if (echoEcoData.ecoType == 2) {
        if (echoEcoData.isActive != 1) {
          req.error = errorCodes.ERR_DEACTIVE
          return res.json({
            status: false,
            message: errorCodes.ERR_DEACTIVE,
            total_algaes: echoEcoTotalApiCall[0].totalCall,
          });
        }
        req.success = successCodes.SUCC_LOADED
        return res.json({
          status: true,
          message: successCodes.SUCC_LOADED,
          total_algaes: echoEcoTotalApiCall[0].totalCall,
          companyId: echoEcoData.companyId,
          apiId: echoEcoData.id,
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


  getAllCompaniesByrdsPoints: async function (req, res) {
    try {
      let type = req.body.type;
      let offset = req.body.offset;
      let getAllCompaniesNewByrdsPoints;

      if (type == 1) {
        getAllCompaniesNewByrdsPoints = await sequelize.query(
          `SELECT * from "companyRankStatus"
          OFFSET '${offset}' ROWS FETCH NEXT 15 ROWS ONLY`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
      } else if (type == 2) {
        getAllCompaniesNewByrdsPoints = await sequelize.query(
          `SELECT * from "companyRankStatus"
           where "industrySectorInt"='${req.body.industrySector}'
           OFFSET '${offset}' ROWS FETCH NEXT 15 ROWS ONLY
         `,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
      } else if(type == 3) {
        getAllCompaniesNewByrdsPoints = await sequelize.query(
          `SELECT * from "companyRankStatus"
         `,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
        const currentCompanyIndex = getAllCompaniesNewByrdsPoints.findIndex(
          (company) => company.companyName === req.body.companyName
        );
        let finalList = [];
        if (currentCompanyIndex <= 2) {
          finalList = getAllCompaniesNewByrdsPoints.slice(0, 5);
        } else if (currentCompanyIndex >= getAllCompaniesNewByrdsPoints.length - 3) {
          finalList = getAllCompaniesNewByrdsPoints.slice(-5);
        } else {
          finalList = getAllCompaniesNewByrdsPoints.slice(
            currentCompanyIndex - 2,
            currentCompanyIndex + 3
          );
        }
        getAllCompaniesNewByrdsPoints = finalList;
      }

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        getAllCompaniesNewByrdsPoints,
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

  totalEchoPlanted: async function (req, res) {
    try {
      let companyName = req.params.companyName;
      let company = await Company.findOne({
        attributes: ["id", "companyName"],
        raw: true,
        where: {
          companyName: companyName,
        },
      });
      if (!company) {
        req.error = errorCodes.ERR_INVALID_URL
        return res.json({
          status: false,
          message: errorCodes.ERR_INVALID_URL,
        });
      }
      let getTotalEchoPlanted = await sequelize.query(
        `SELECT 
    count("d"."id"),
   "c"."companyName",
  "r"."ecoType"
     FROM "overallEchoEcos" as o
  left outer join "dailyEchoEcoCalls" as "d" on "o"."id"="d"."apiId"
   left outer join "companies" as "c" on "o"."companyId"="c"."id"
    left outer join "ref_EcoTypes" as "r" on "o"."ecoType"="r"."id"
 where "o"."companyId"= '${company.id}'
       group by 
  "r"."ecoType",
      "c"."id";		`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        getTotalEchoPlanted,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getCompanyDetailsByCompanyId: async (req, res) => {
    try {
      let companyId = req.body.companyId;
      if (!companyId) {
        req.error = errorCodes.ERR_PAYLOAD_EMPTY;
        return res.json({
          status: false,
          message: errorCodes.ERR_PAYLOAD_EMPTY,
        });
      }
      let companyDetails = await Company.findOne({
        attributes: [
          "id",
          "companyName",
          "companyAddress",
          "companyIcon",
          "aboutCompany",
        ],
        raw: true,
        where: {
          id: companyId,
        },
      });

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        companyDetails,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getDetailsByCompanyName: async (req, res) => {
    try {
      let companyName = req.params.companyName;
      let details = await sequelize.query(
        `SELECT "c"."id","crp"."updatedByrdsPoints","crp"."companyRank", "crs"."companyRankStatus"
        FROM "companies" as "c"
        left outer join "companyRankAndPoints" as "crp" on "c"."id"="crp"."id"
        left outer join "companyRankStatus" as "crs" on "c"."id"="crs"."id"
        where "c"."companyName"='${companyName}'`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (!details) {
        req.error = errorCodes.ERR_INVALID_URL
        return res.json({
          status: false,
          message: errorCodes.ERR_INVALID_URL,
        });
      }

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        details,
        companyName,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getTotalTreeAlgaeAllCompanies: async (req, res) => {
    try {
      let totalTree = await sequelize.query(
        `select "totalTrees" from "totalTreesAlgaesAllCompanies"`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let totalAlgae = await sequelize.query(
        `select "totalAlgaes" from "totalTreesAlgaesAllCompanies"`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let totalCompanies = await sequelize.query(
        `select "totalCompanies" from "totalTreesAlgaesAllCompanies"`,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );

      req.success = successCodes.SUCC_LOADED
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        totalTree: totalTree[0].totalTrees || 0,
        totalAlgae: totalAlgae[0].totalAlgaes || 0,
        totalCompanies: totalCompanies[0].totalCompanies || 0,
      });
    } catch (error) {
      req.error = error;
      return res.json(500, {
        status: false,
        message: errorCodes.ERR_INTERNAL_SERVER_ERROR,
      });
    }
  },

  getNotificationFlag: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      let userStatus= 1;

      let limitingDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      limitingDate = JSON.stringify(limitingDate);
      let user = await Admin.findAll({
        where: {
          uuid: userId,
        },
      });

      if (!user[0]) {
        userStatus = 2;
        user = await SiteAdmin.findAll({
          where: {
            uuid: userId,
          },
        });
      }

      if (!user[0]) {
        userStatus = 3
        user = await SuperAdmin.findAll({
          where: {
            uuid: userId,
          },
        });
      }
      let notificationDate = user[0].notificationDate;
      notificationDate = JSON.stringify(notificationDate);
      let data
if(userStatus==1){
      data = await sequelize.query(
        `	
  select distinct (CASE WHEN "title" is null and "requesterId" is null and "companyId" is null THEN false  ELSE true END) as "status"
from "announcements" as "a"
left outer join "supportAndComplaints" as "s" on "s"."requesterId"='${userId}'
left outer join "transactionHistories" as "t" on "t"."companyId"='${user[0]?.companyId}'
where "a"."createdAt"> '${notificationDate}'
or "s"."createdAt"> '${notificationDate}'
or "t"."createdAt" > '${notificationDate}'
        ; `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
}else if(userStatus==2){
   data = await sequelize.query(
    `	
select distinct (CASE WHEN "title" is null and "requesterId" is null THEN false  ELSE true END) as "status"
from "announcements" as "a"
left outer join "supportAndComplaints" as "s" on "s"."requesterId"='${userId}'
where "a"."createdAt"> '${notificationDate}'
or "s"."createdAt"> '${notificationDate}'
    ; `,
    {
      type: sequelize.QueryTypes.SELECT,
    }
  );
}else{
    data = await sequelize.query(
    `	
    select distinct (CASE WHEN "title" is null and "requesterId" is null THEN false  ELSE true END) as "status"
    from "announcements" as "a","supportAndComplaints" as "s" , "transactionHistories" as "t"
    where "a"."createdAt"> '${notificationDate}'
    or "s"."createdAt">  '${notificationDate}'
    or "t"."createdAt" > '${notificationDate}'
    ; `,
    {
      type: sequelize.QueryTypes.SELECT,
    }
  );
}
let flag=false
if(data[0]){
  flag=true
}

      

      req.success = successCodes.SUCC_LOADED;
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        flag: flag,
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

  getNotifications: async function (req, res) {
    try {
      let userId = req.userInfo.userId;
      // let currentDate=new Date(Date.now());
      let limitingDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      limitingDate = JSON.stringify(limitingDate);
      let user = await Admin.findAll({
        where: {
          uuid: userId,
        },
      });

      if (!user[0]) {
        user = await SiteAdmin.findAll({
          where: {
            uuid: userId,
          },
        });
      }

      if (!user[0]) {
        user = await SuperAdmin.findAll({
          where: {
            uuid: userId,
          },
        });
      }
      let notificationDate = user[0].notificationDate;
      let announcement = await sequelize.query(
        `	SELECT "a"."id","a"."title","a"."description","a"."createdAt"
        FROM "announcements" AS "a"
        WHERE  
         "a"."createdAt" >  '${limitingDate}'; `,
        {
          type: sequelize.QueryTypes.SELECT,
        }
      );
      let payments = [];
      let support = [];
      if(user[0]?.isAdmin){
         payments = await sequelize.query(
          `	SELECT "t"."id","t"."amount","t"."paymentId","t"."createdAt"
          FROM "transactionHistories" AS "t"
          WHERE  
           "t"."createdAt" >  '${limitingDate}'`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
        support = await sequelize.query(
          `	SELECT "sac"."id","sac"."type","sac"."isOpen","sac"."createdAt"
          FROM "supportAndComplaints" AS "sac"
          WHERE  
           "sac"."createdAt" >  '${limitingDate}'`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
      }else{
        payments = await sequelize.query(
          `	SELECT "t"."id","t"."amount","t"."paymentId","t"."createdAt"
          FROM "transactionHistories" AS "t"
          left outer join "admins" as "a" on "a"."companyId" = "t"."companyId" 
          WHERE  
           "t"."createdAt" >  '${limitingDate}' and "a"."uuid" = '${userId}'`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
        support = await sequelize.query(
          `	SELECT "sac"."id","sac"."type","sac"."isOpen","sac"."createdAt"
          FROM "supportAndComplaints" AS "sac"
          WHERE  
           "sac"."createdAt" >  '${limitingDate}'and "sac"."requesterId" = '${userId}';`,
          {
            type: sequelize.QueryTypes.SELECT,
          }
        );
      }

      for (i of announcement) {
        if (notificationDate <= i.createdAt) {
          await Admin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
          await SiteAdmin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
          await SuperAdmin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
        }
      }
      for (i of payments) {
        if (notificationDate <= i.createdAt) {
          await Admin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
          await SiteAdmin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
          await SuperAdmin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
        }
      }
      for (i of support) {
        if (notificationDate <= i.createdAt) {
          await Admin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
          await SiteAdmin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
          await SuperAdmin.update(
            { notificationDate: new Date(Date.now()) },
            { where: { uuid: userId } }
          );
        }
      }

      let notification = [];
      notification = [...announcement, ...payments, ...support];
      notification = notification.sort((a, b) => b.createdAt - a.createdAt);

      req.success = successCodes.SUCC_LOADED;
      return res.json({
        status: true,
        message: successCodes.SUCC_LOADED,
        notifications: notification,
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
};
