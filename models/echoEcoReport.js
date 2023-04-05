module.exports = function (sequelize, Sequelize) {
  var EchoEcoReport = sequelize.define("echoEcoReport", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    apiId: {
      type: Sequelize.UUID,
    },

    apiName: {
      type: Sequelize.STRING,
    },

    companyId: {
      type: Sequelize.UUID,
    },

    companyName: {
      type: Sequelize.STRING,
    },

    companyAdminEmail: {
      type: Sequelize.STRING,
      validate: {
        isEmail: true,
      },
    },

    totalYearlyApiCall: {
      type: Sequelize.INTEGER,
      default: 0,
    },

    yearlyId: {
      type: Sequelize.STRING,
      notEmpty: true,
    },

    createdYear: {
      type: Sequelize.STRING,
      notEmpty: true,
    },

    isActive: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    },

    isRequested: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },

    isSent: {
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

  return EchoEcoReport;
};
