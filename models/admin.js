module.exports = function (sequelize, Sequelize) {
    var Admin = sequelize.define("admin", {
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true,
      },
  
      companyAdminName: {
        type: Sequelize.STRING,
        notEmpty: true,
      },

      notificationDate: {
        type: Sequelize.DATE,
        notEmpty: true,
    },

      companyAdminPassword: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      companyAdminPhone: {
        type: Sequelize.BIGINT,
      }, 

      companyAdminEmail : {
        type: Sequelize.STRING,
        validate: {
          isEmail: true,
        },
      },

      companyId: {
        type: Sequelize.UUID,
      },
      userRoleId: {
        type: Sequelize.INTEGER,
      },

      status: {
        type: Sequelize.INTEGER,
      },
      isValid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      authKey: {
        type: Sequelize.STRING,
      },

      loginTryCount : {
        type: Sequelize.INTEGER,
        defaultValue: 3,
      },

      profilePicture: {
        type: Sequelize.STRING,
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
  
    return Admin;
  };
  
  