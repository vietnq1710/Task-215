const useSSL = process.env.SQL_USE_SSL === "1";
const rejectUnauthorized =
    (process.env.SQL_SSL_REJECT_UNAUTHORIZED || "0") === "1";
const sslOptions = useSSL
    ? {
          ssl: {
              require: true,
              rejectUnauthorized,
          },
      }
    : {};

module.exports = {
    development: {
        username: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB,
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT,
        dialect: process.env.SQL_TYPE,
        schema: process.env.SQL_SCHEMA,
        seederStorage: "sequelize",
        dialectOptions: {
            bigNumberStrings: true,
            ...sslOptions,
        },
    },
    test: {
        username: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB,
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT,
        dialect: process.env.SQL_TYPE,
        schema: process.env.SQL_SCHEMA,
        seederStorage: "sequelize",
        dialectOptions: {
            bigNumberStrings: true,
            ...sslOptions,
        },
    },
    production: {
        username: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB,
        host: process.env.SQL_HOST,
        port: process.env.SQL_PORT,
        dialect: process.env.SQL_TYPE,
        schema: process.env.SQL_SCHEMA,
        seederStorage: "sequelize",
        dialectOptions: {
            bigNumberStrings: true,
            ...sslOptions,
        },
    },
};
