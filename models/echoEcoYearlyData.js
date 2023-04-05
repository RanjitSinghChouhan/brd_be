module.exports = function (sequelize, Sequelize) {
  var EchoEcoYearlyData = sequelize.define("echoEcoYearlyData", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    apiId: {
      type: Sequelize.UUID,
    },

    status: {
      type: Sequelize.INTEGER,
    },

    rate: {
      type: Sequelize.INTEGER,
    },
    
    companyId: {
      type: Sequelize.UUID,
    },

    totalYearlyApiCall: {
      type: Sequelize.INTEGER,
      default: 0,
    },

    location: {
      type: Sequelize.INTEGER,
    },

    yearlyId: {
      type: Sequelize.STRING,
      notEmpty: true,
    },

    yearlyPlanted:{
      type:Sequelize.INTEGER,
      defaultValue: 0,
    },

    yearlyPlantAlive:{
      type:Sequelize.INTEGER,
      defaultValue: 0,
    },

    isRequested: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },

    createdAt: {
      type: Sequelize.DATE,
      notEmpty: true,
    },

    updatedAt: {
      type: Sequelize.DATE,
      notEmpty: true,
    },
  });

  return EchoEcoYearlyData;
};
