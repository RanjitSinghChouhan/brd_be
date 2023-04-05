module.exports = function (sequelize, Sequelize) {
  var SuperAdmin = sequelize.define("superAdmin", {
    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    adminName: {
      type: Sequelize.STRING,
      notEmpty: true,
    },

    notificationDate: {
      type: Sequelize.DATE,
      notEmpty: true,
  },
  
    adminPassword: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    adminEmail: {
      type: Sequelize.STRING,
      validate: {
        isEmail: true,
      },
    },

    loginTryCount: {
      type: Sequelize.INTEGER,
      defaultValue: 3,
    },

    status: {
      type: Sequelize.INTEGER,
      default: 1,
    },
    isValid: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    isAdmin: {
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

  return SuperAdmin;
};
