module.exports = function (sequelize, Sequelize) {
  var SiteAdmin = sequelize.define("siteAdmin", {
    uuid: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    siteName: {
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

    isValid: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    isAdmin: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    },

    loginTryCount: {
      type: Sequelize.INTEGER,
      defaultValue: 3,
    },

    totalArea: {
      type: Sequelize.INTEGER,
      default: 0,
    },
    usedArea: {
      type: Sequelize.INTEGER,
      default: 0,
    },
    location: {
      type: Sequelize.STRING,
      notEmpty: true,
    },
    locationLink: {
      type: Sequelize.STRING,
      default: "",
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

  return SiteAdmin;
};
