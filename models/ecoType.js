module.exports = function (sequelize, Sequelize) {
  var EcoType = sequelize.define("ref_EcoType", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    ecoType: {
      type: Sequelize.STRING,
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

  return EcoType;
};
