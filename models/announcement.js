module.exports = function (sequelize, Sequelize) {
    var Announcement = sequelize.define("announcement", {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV1,
            primaryKey: true,
        },

        title: {
            type: Sequelize.STRING,
            notEmpty: true,
        },
        description: {
            type: Sequelize.STRING,
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

    return Announcement;
};

