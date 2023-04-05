module.exports = function(sequelize, Sequelize) {

    var SharePost = sequelize.define('sharePost', {

        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true,
          },

        postId: {
            type: Sequelize.UUID,
            notEmpty: true
        },
       
        companyIdPostBelongTo: {
            type: Sequelize.UUID,
            notEmpty: true
        },

        companyIdPostShareBy: {
            type: Sequelize.UUID,
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

    return SharePost;
}