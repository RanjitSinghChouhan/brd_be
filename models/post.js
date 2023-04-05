module.exports = function (sequelize, Sequelize) {
    var Post = sequelize.define("post", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true,
      },
  
      companyId: {
        type: Sequelize.UUID,
        notEmpty: true,
      },

      createdBy: {
        type: Sequelize.UUID,
      },
  
      postText: {
        type: Sequelize.STRING,
      },
  
      postImg: {
        type: Sequelize.STRING,
      },

      deletedAt: {
        type: Sequelize.DATE,
        notEmpty: false,
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
  
    return Post;
  };
  