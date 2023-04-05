module.exports = function(sequelize, Sequelize) {
    var IndustrySector = sequelize.define('ref_IndustrySector', {
        id: {
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
        },
        sectorOfIndustry: {
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
    return IndustrySector;
}