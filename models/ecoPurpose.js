module.exports = function (sequelize, Sequelize) {
  var EcoPurpose = sequelize.define("ref_EcoPurpose", {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },

    ecoPurpose: {
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

  return EcoPurpose;
};
