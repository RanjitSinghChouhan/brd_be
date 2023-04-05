module.exports = function(sequelize, Sequelize) {

    var AdminRole = sequelize.define('ref_AdminRole', {

        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        role: {
            type: Sequelize.STRING,
            notEmpty: true
        },
        
        isValid: {
            type: Sequelize.BOOLEAN,
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

    return AdminRole;
}