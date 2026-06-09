import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'
dotenv.config();

const config = {
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT
};

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    port: config.port,
    define: {
        freezeTableName: true
    },
});

export default sequelize