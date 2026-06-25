"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("back_up_job", {
            _id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },

            databaseConfigId: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "database_config",
                    key: "_id",
                },
                onDelete: "CASCADE",
            },

            cronExpression: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            retentionDays: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },

            isActive: {
                type: Sequelize.BOOLEAN,
                defaultValue: true,
            },

            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },

            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.fn("NOW"),
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("back_up_job");
    },
};
