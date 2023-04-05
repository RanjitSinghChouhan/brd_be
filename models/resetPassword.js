module.exports = function(sequelize, Sequelize) {

    var ResetPasswordKey = sequelize.define('resetPasswordKey', {

        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true,
          },
          
        adminId: {
            type: Sequelize.STRING,
            notEmpty: true
        },

        authKey: {
            type: Sequelize.STRING,
            notEmpty: true
        },
        
        isValid: {
            type: Sequelize.STRING,
            defaultValue:true

        },
        createdAt: {
            type: Sequelize.DATE,
            notEmpty: true
        },
        updatedAt: {
            type: Sequelize.DATE,
            notEmpty: true
        }

    })

    return ResetPasswordKey;
}