"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("backup_history", {
            _id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },

            BackupJobId: {
                type: Sequelize.STRING,
                allowNull: false,
                references: {
                    model: "back_up_job",
                    key: "_id",
                },
                onDelete: "CASCADE",
            },

            fileName: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            filePath: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            status: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            startTime: {
                type: Sequelize.DATE,
                allowNull: false,
            },

            endTime: {
                type: Sequelize.DATE,
                allowNull: false,
            },

            log: {
                type: Sequelize.JSONB,
                allowNull: true,
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
        await queryInterface.dropTable("backup_history");
    },
};
