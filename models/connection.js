var path = require("path");
var Sequelize = require("sequelize");
var config = require("../config");
var sequelize = new Sequelize(
  config.dbdatabase,
  config.dbusername,
  config.dbpassword,
  config
);
module.exports = sequelize;