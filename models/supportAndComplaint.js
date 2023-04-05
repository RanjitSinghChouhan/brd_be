module.exports = function (sequelize, Sequelize) {
    var SupportAndComplaint = sequelize.define("supportAndComplaint", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true,
      },

      requesterId: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true,
      },

      requesterRole: {
        type: Sequelize.STRING,
      },

      type: {
        type: Sequelize.STRING,
      },

      description: {
        type: Sequelize.STRING,
      },
  
      isOpen: {
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
  
    return SupportAndComplaint;
  };