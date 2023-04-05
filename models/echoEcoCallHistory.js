module.exports = function (sequelize, Sequelize) {
  var EchoEcoCallHistory = sequelize.define("echoEcoCallHistory", {
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

    numberOfTrees: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    numberOfDays: {
      type: Sequelize.INTEGER,
    },

    ecoType: {
      type: Sequelize.INTEGER,
    },

    ecoPurpose: {
      type: Sequelize.STRING,
    },

    areaSqFt: {
      type: Sequelize.INTEGER,
    },

    isValid: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },

    isActive: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
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

  return EchoEcoCallHistory;
};
