require('dotenv').config()

var config = {};
config.dbusername = process.env.DB_USERNAME;
config.dbpassword = process.env.DB_PASSWORD;
config.host = process.env.DB_HOST;
config.enviornment = process.env.NODE_ENV;
config.dbdatabase = process.env.DB_DATABASE;
config.dialect = "postgres";
config.logging = false
config.define = {};
config.define.charset = "utf8";
config.define.collate = "utf8_general_ci";
config.port = 25060 //5432
config.dialectOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
};

// config.connectionString= process.env.DATABASE_URL || 'postgresql://postgres:<your admin password>@localhost:5432/<your db name>',
// config.ssl=process.env.DATABASE_URL ? true : false

config.operatorsAliases = false;
/**
* Session Configuration
*/
config.session = {};
config.session.secret =
  process.env.SESSION_SECRET || "9cb7ef704513b9e8dc76113b096375b62409d699";
config.session.name = process.env.SESSION_NAME || "_s";
config.session.resave = false;
config.session.saveUninitialized = true;
config.email = {};
config.email.service = process.env.EMAIL_SERVICE_USER;
config.email.servicePass = process.env.EMAIL_SERVICE_USER_PASS;
module.exports = config;
