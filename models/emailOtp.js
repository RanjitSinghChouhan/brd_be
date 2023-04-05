module.exports = function(sequelize, Sequelize) {

    var EmailOtp = sequelize.define('emailOtp', {

        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true
          },

        email: {
            type: Sequelize.STRING,
        },
        
        otp: {
            type: Sequelize.STRING
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

    return EmailOtp;
}