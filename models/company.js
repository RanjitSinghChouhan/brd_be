module.exports = function (sequelize, Sequelize) {
  var Company = sequelize.define("company", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true,
    },

    companyName: {
      type: Sequelize.STRING,
    },

    companyRank:{
      type: Sequelize.INTEGER,
    },

    aboutCompany: {
      type: Sequelize.TEXT,
    },

    companyWebsite: {
      type: Sequelize.STRING,
    },

    companyYearOfEstablishment: {
      type: Sequelize.STRING,
    },

    companyEmployeeScale: {
      type: Sequelize.STRING,
    },

    companyAddress: {
      type: Sequelize.STRING,
    },

    companyCountry: {
      type: Sequelize.STRING,
    },

    companyPhone: {
      type: Sequelize.BIGINT,
    },

    industrySector: {
      type: Sequelize.INTEGER,
    },
   
    companyIcon: {
      type: Sequelize.STRING,
    },

    isActive: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
    },
    treeApisCallCount: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },

    treeFiftyCallDate: {
      type: Sequelize.DATE,
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

  // Company.hook('beforeCreate', (company, options) => {
  //   company.companyName = company.companyName.charAt(0).toUpperCase() + company.companyName.slice(1);
  // });

  // sequelize.sync({ force: true })

  return Company;
};
