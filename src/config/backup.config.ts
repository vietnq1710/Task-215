export default () => ({
    backup: {
        rootPath: process.env.BACKUP_ROOT,

        postgresDumpPath: process.env.PG_DUMP_PATH,

        mongoDumpPath: process.env.MONGO_DUMP_PATH,
    },
});
