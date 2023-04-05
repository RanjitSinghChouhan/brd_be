module.exports = function (sequelize, Sequelize) {
    var EchoEcoMultiply = sequelize.define("ref_EchoEcoMultiply", {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
  
      ecoTypeId: {
        type: Sequelize.INTEGER,
      },

      amountMultiply: {
        type: Sequelize.DECIMAL,
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
  
    return EchoEcoMultiply;
  };
  