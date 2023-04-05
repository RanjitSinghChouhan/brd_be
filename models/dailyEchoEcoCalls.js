module.exports = function (sequelize, Sequelize) {
  var DailyEchoEcoCalls = sequelize.define("dailyEchoEcoCalls", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    companyId: {
      type: Sequelize.UUID,
      notEmpty: true,
    },
    
    apiId: {
      type: Sequelize.UUID,
      notEmpty: true,
    },

    isValid: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
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

  return DailyEchoEcoCalls;
};
