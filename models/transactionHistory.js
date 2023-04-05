module.exports = function (sequelize, Sequelize) {

    var TransactionHistory = sequelize.define('transactionHistory', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true,
          },
       
        orderId:
        {
            type: Sequelize.STRING
        },

        paymentId: {
            type: Sequelize.STRING,
        },
        companyId: {
            type: Sequelize.UUID,
        },
        apiId: {
            type: Sequelize.UUID,
        },
        monthlyId: {
            type: Sequelize.STRING,
        },
        // active: {
        //     type: Sequelize.BOOLEAN,
        //     defaultValue:false
        // },

        amount :
         {
            type: Sequelize.STRING,
          },

        //   planName : 
        //   {
        //     type :Sequelize.STRING
        //   },

        //   planDuration :
        //    {
        //     type :Sequelize.STRING
        //   },
          currency :
          {
           type : Sequelize.STRING
         },

         paymentMethod :
         {
          type : Sequelize.STRING
        },

          createdAt:
         {
            type: Sequelize.DATE,
            notEmpty: true
        },

        updatedAt: {
            type: Sequelize.DATE,
            notEmpty: true
        }

    })

    return TransactionHistory;
}