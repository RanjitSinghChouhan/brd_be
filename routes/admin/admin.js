var express = require("express");
var router = express.Router();
var adminController = require("../../controllers/adminController");
var {
  jwtBearerAuth,
  jwtBearerAuthToken,
} = require("../../middlewares/jwtBearerAuth");

let query = [
  `

CREATE OR REPLACE VIEW "getAllByrdsPoints"("id","companyName","companyCountry","industrySector","createdAt","updatedByrdsPoints","companyCreatedAt")as
  SELECT "c"."id", "companyName", 
 "companyCountry","industrySector",
  "dailyEcho"."createdAt",
   CASE
          WHEN "echo"."ecoType" = 1
          THEN count("dailyEcho"."id")*1 
 		 WHEN "echo"."ecoType" = 2
          THEN count("dailyEcho"."id")*2 
        END 
      AS  "updatedByrdsPoints",
	  "c"."createdAt"
  FROM "companies" AS "c"
  left outer join "overallEchoEcos" as "echo" on "c"."id"="echo"."companyId"
  left outer join "dailyEchoEcoCalls" as "dailyEcho" on "echo"."id"="dailyEcho"."apiId"
  group by "c"."id",
   "echo"."ecoType",
   "dailyEcho"."createdAt";
`,

  `
  CREATE OR REPLACE VIEW "companyRankAndPoints"("id","industrySector","companyName","companyCountry","updatedByrdsPoints", "companyRank", "industrySectorInt")as
  SELECT "p"."id",
      "ris"."sectorOfIndustry" as "industrySector",
      "companyName", 
  "companyCountry",
       coalesce(sum("updatedByrdsPoints"),0)as "byrdsPoints",
      Rank () OVER ( 
         ORDER BY sum("updatedByrdsPoints") desc NULLS LAST,"p"."companyCreatedAt" desc
       ) "companyRank" , 
       "p"."industrySector" as "industrySectorInt"
      FROM "getAllByrdsPoints" as p
      left outer join "ref_IndustrySectors" as "ris" on "p"."industrySector"="ris"."id"
      group by "p"."id",
      "companyName",
      "ris"."sectorOfIndustry",
      "companyCountry",
    "p"."companyCreatedAt",
    "p"."industrySector"
      ORDER BY "companyRank" asc;
`,
  `
CREATE OR REPLACE VIEW "ByrdsPointsForEchoEco"("id","apiId","companyName","companyCountry","industrySector","updatedByrdsPoints","ecoType")as
  SELECT "c"."id",
  "echo"."id" as "apiId",
  "companyName", 
 "companyCountry","industrySector",
   CASE
          WHEN "echo"."ecoType" = 1
          THEN count("dailyEcho"."id")*1 
 		 WHEN "echo"."ecoType" = 2
          THEN count("dailyEcho"."id")*2 
        END 
      AS  "updatedByrdsPoints",
	  "echo"."ecoType"
  FROM "companies" AS "c"
  left outer join "overallEchoEcos" as "echo" on "c"."id"="echo"."companyId"
  left outer join "dailyEchoEcoCalls" as "dailyEcho" on "echo"."id"="dailyEcho"."apiId"
  group by "c"."id",
   "echo"."ecoType",
   "echo"."id";`,

  `CREATE OR REPLACE VIEW "totalTreesAlgaesAllCompanies"("totalCompanies", "totalTrees", "totalAlgaes")as
    select count(*) as "totalCompanies",
    (select sum("totalGoalReached") from "overallEchoEcos" WHERE "ecoType" = '1' ) as "totalTrees",
    (select sum("totalGoalReached") from "overallEchoEcos" WHERE "ecoType" = '2' ) as "totalAlgaes" 
    from "companies"`,

    ` CREATE OR REPLACE VIEW "companyRankAndStatus"("id","companyName","updatedByrdsPoints", "companyRank")as
    SELECT "id",
            "companyName",
            coalesce(sum("updatedByrdsPoints"),0)as "byrdsPoints",
         Rank () OVER ( 
         ORDER BY sum("updatedByrdsPoints") desc NULLS LAST,"companyCreatedAt" desc
       ) "companyRank"
            FROM "getAllByrdsPoints"
            where "createdAt"<current_date - interval '1 days' or "createdAt" is null
            group by "id",
            "companyName",
             "industrySector",
            "companyCountry",
			"companyCreatedAt"`,

  `CREATE OR REPLACE VIEW "companyRankStatus"("id","companyName", "companyRankStatus","companyCountry", "industrySector",
  "updatedByrdsPoints","companyRank", "industrySectorInt")as
SELECT "crap"."id",
  "crap"."companyName", 
      (CASE 
        WHEN "cras"."companyRank" = "crap"."companyRank" THEN 3
        WHEN "cras"."companyRank" > "crap"."companyRank" THEN 1
       WHEN "cras"."companyRank" < "crap"."companyRank" THEN 2
      ELSE 3 END)
    as "companyRankStatus", "crap"."companyCountry", "crap"."industrySector",
  "crap"."updatedByrdsPoints","crap"."companyRank", "crap"."industrySectorInt"
           FROM "companyRankAndPoints" as "crap"
           left outer join "companyRankAndStatus" as "cras" on "crap"."id"="cras"."id"
           group by "crap"."id",
           "crap"."companyName", "cras"."companyRank", "crap"."companyRank",  "crap"."companyCountry", "crap"."industrySector",
  "crap"."updatedByrdsPoints", "crap"."companyRank", "crap"."industrySectorInt"
       order by "crap"."companyRank" asc`,

       `CREATE OR REPLACE VIEW "sumOfUsedArea"("total")as
       select SUM("usedArea") as "total" from "siteAdmins"`,

       `CREATE OR REPLACE VIEW "getAdminDetailsData"("*")as
       SELECT 
               "admin"."uuid", 
               "admin"."companyAdminName", 
               "admin"."companyAdminPhone", 
               "admin"."companyAdminEmail", 
               "admin"."companyId", 
               "admin"."userRoleId", 
               "admin"."profilePicture", 
               "company".*,
           "crp"."updatedByrdsPoints",
           "crp"."companyRank" as "updatedCompanyRank",
           "crs"."companyRankStatus"
             FROM 
               "admins" AS "admin" 
             LEFT OUTER JOIN "companies" AS "company" ON "admin"."companyId" = "company"."id" 
             LEFT OUTER JOIN "companyRankAndPoints" AS "crp" ON "admin"."companyId" = "crp"."id" 
             LEFT OUTER JOIN "companyRankStatus" AS "crs" ON "admin"."companyId" = "crs"."id" `,
];

for (i of query) {
  adminController.createViews(i);
}

router.post("/registerCompany", adminController.registerCompany);
router.post("/login", adminController.loginUser);
router.post(
  "/editCompanyProfile",
  jwtBearerAuth,
  adminController.editCompanyProfle
);

router.post(
  "/userChangePassword",
  jwtBearerAuth,
  adminController.userChangePassword
);

router.get(
  "/getAdminDetails",
  jwtBearerAuth,
  adminController.getAdminDetails
);
router.get("/getIndustrySector", adminController.getIndustrySector);
router.post("/createEchoEcos", jwtBearerAuth, adminController.createEchoEcos);
router.get("/getEcoPurpose", adminController.getEcoPurpose);

router.get("/getEcoType", adminController.getEcoType);
router.post(
  "/getEchoEcosByCompanyId",
  jwtBearerAuth,
  adminController.getEchoEcosByCompanyId
);
// router.get("/company/nebutech/echoEcoCall/:id", adminController.dailyEchoEcoCall); ///only active echoechocall not deactive
router.post(
  "/getDailyEchoEcoCallApiKeyAndUrl",
  jwtBearerAuth,
  adminController.getDailyEchoEcoCallApiKeyAndUrl
);
// router.get("/getAllCompaniesByrdsPoints",adminController.getAllCompaniesByrdsPoints);///adding rank your company leader bords
router.post(
  "/editEchoEcoGoalById",
  jwtBearerAuth,
  adminController.editEchoEcoGoalById
);

router.post(
  "/getDailyEchoEcoDetails",
  jwtBearerAuth,
  adminController.getDailyEchoEcoDetails
);

router.post(
  "/getTotalEchoPlantedUrl",
  jwtBearerAuth,
  adminController.getTotalEchoPlantedUrl
);
router.post(
  "/getMonthlyTotalEchoPlanted",
  jwtBearerAuth,
  adminController.getMonthlyTotalEchoPlanted
);

router.post(
  "/getKeyMilestoneByCompanyId",
  adminController.getKeyMilestoneByCompanyId
);
router.post(
  "/latestOverallEchoEco",
  jwtBearerAuth,
  adminController.latestOverallEchoEco
);

router.post(
  "/getEchoEcoGoalStatus",
  jwtBearerAuth,
  adminController.getEchoEcoGoalStatus
);

router.post("/verifyEmail", adminController.verifyEmailOtp);
router.post("/sendOtp", adminController.sendOtp);

router.post(
  "/forgotPassword/verifyEmail",
  adminController.forgotPasswordVerifyEmailOtp
);
router.post("/forgotPassword/resetPassword", adminController.resetPassword);
router.post("/createPost", jwtBearerAuth, adminController.createPost);
router.post(
  "/getPostsByCompanyId",
  adminController.getPostsByCompanyId
);
router.post(
  "/deletePostByCompanyId",
  jwtBearerAuth,
  adminController.deletePostByCompanyId
);
router.post("/editPostById", jwtBearerAuth, adminController.editPostById);
router.post(
  "/getTotalTreeAlgae",
  adminController.getTotalTreeAlgae
);

router.post(
  "/createEchoEcoReport",
  jwtBearerAuthToken,
  adminController.createEchoEcoReport
);


router.post('/createOrder',adminController.createOrder)
router.post('/paymentVerify',adminController.paymentVerify)


router.post(
  "/pendingTransactions",
  jwtBearerAuthToken,
  adminController.pendingTransactions
);

router.post(
  "/completedTransactions",
  jwtBearerAuthToken,
  adminController.completedTransactions
);

router.get('/getUsersTransactions',jwtBearerAuth, adminController.getUsersTransactions)


router.post('/webhook',adminController.webhook);
router.post('/sharePost',jwtBearerAuth,adminController.sharePost);
router.post('/getPostById',adminController.getPostById);
router.post('/createSupportComplaint',jwtBearerAuth, adminController.createSupportComplaint)


module.exports = router;
