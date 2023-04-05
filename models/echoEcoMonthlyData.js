module.exports = function (sequelize, Sequelize) {
    var EchoEcoMonthlyData = sequelize.define("echoEcoMonthlyData", {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true,
        },      

      apiId:{
        type:Sequelize.UUID,
      },

     companyId:{
        type:Sequelize.UUID,
      },


      location:{
        type:Sequelize.INTEGER,
      },

      status:{
        type:Sequelize.INTEGER,
      },

      rate:{
        type:Sequelize.INTEGER,
      },

      monthlyId: {
        type: Sequelize.STRING,
        notEmpty: true,
      },

      totalMonthlyCall: {
        type: Sequelize.INTEGER,
        defaultValue:0
      },

      monthlyPlanted:{
        type:Sequelize.INTEGER,
        defaultValue: 0,
      },

      monthlyPlantAlive:{
        type:Sequelize.INTEGER,
        defaultValue: 0,
      },

      isPaid: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      siteAssigned: {
        type: Sequelize.STRING,
      },

      deadline: {
        type: Sequelize.DATE,
        notEmpty: true,
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
  
    return EchoEcoMonthlyData;
  };
  