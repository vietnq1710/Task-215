"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("database_config", {
            _id: {
                type: Sequelize.STRING,
                primaryKey: true,
                allowNull: false,
            },

            host: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            port: {
                type: Sequelize.INTEGER,
                allowNull: false,
            },

            username: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            password: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            databaseName: {
                type: Sequelize.STRING,
                allowNull: false,
            },

            databaseType: {
                type: Sequelize.STRING,
                allowNull: false,
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
        await queryInterface.dropTable("database_config");
    },
};
