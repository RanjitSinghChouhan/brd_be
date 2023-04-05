module.exports = function(sequelize, Sequelize) {

    var ref_Location = sequelize.define('ref_Location', {

        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },

        location: {
            type: Sequelize.STRING,
            notEmpty: true
        },
        
        isValid: {
            type: Sequelize.BOOLEAN,
            defaultValue:true
        },

        type: {
            type: Sequelize.INTEGER,
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

    return ref_Location;
}