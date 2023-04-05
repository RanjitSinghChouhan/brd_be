module.exports = function (sequelize, Sequelize) {
    var StatusTable = sequelize.define("ref_StatusTable", {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
  
      status: {
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
  
    return StatusTable;
  };
  