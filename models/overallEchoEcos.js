module.exports = function (sequelize, Sequelize) {
  var OverallEchoEcos = sequelize.define("overallEchoEcos", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    companyId: {
      type: Sequelize.UUID,
      notEmpty: true,
    },

    apiName: {
      type: Sequelize.STRING,
      notEmpty: true,
    },

    goalAmount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    goalDays: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    // numberOfCalls: {
    //   type: Sequelize.INTEGER,
    //   defaultValue: 0,
    // },

    ecoType: {
      type: Sequelize.INTEGER,
    },

    ecoPurpose: {
      type: Sequelize.INTEGER,
    },

    apiKey: {
      type: Sequelize.STRING,
    },

    areaSqFt: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    isValid: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },

    isActive: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    },
    rate:{
      type:Sequelize.INTEGER,
    },
    goalReached:{
      type:Sequelize.INTEGER,
      defaultValue: 0,

    },

    totalGoalReached:{
      type:Sequelize.INTEGER,
      defaultValue: 0,

    },
    planted:{
      type:Sequelize.INTEGER,
      defaultValue: 0,
    },
    plantAlive:{
      type:Sequelize.INTEGER,
      defaultValue: 0,
    },
    lastDate: {
      type: Sequelize.DATE,
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

  return OverallEchoEcos;
};
