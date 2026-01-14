import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DockerImageName } from 'testcontainers';
import knex from 'knex';
import { readFile } from 'node:fs/promises';
import request from 'supertest'; // Missing import added here

export const setupDb = async () => {
    // 1. Start PostgreSQL Container
    const container = await new PostgreSqlContainer("postgis/postgis:17-3.5")
        .withDatabase('watering_test_db')
        .withUsername('postgres')
        .withPassword('test_password')
        .start();

    // 2. Set ENV variables
    process.env.DB_HOST = container.getHost();
    process.env.DB_PORT = container.getPort();
    process.env.DB_NAME = container.getDatabase();
    process.env.DB_USER = container.getUsername();
    process.env.DB_PASSWORD = container.getPassword();

    const dbConfig = {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        }
    console.log('Test DB Config:', dbConfig);
    // 3. Initialize Knex
    const db = knex({
        client: 'pg',
        connection: dbConfig
    });

    // 4. Run Schema/Migrations
    const sql = await readFile('./tests/db/test_db_schema.sql', 'utf8');
    await db.raw(sql);

    // Return both so the test can use db and stop container
    return { db, container };
};

export const loginUser = async (app, email, password) => {
    const loginRes = await request(app)
        .post('/users/login')
        .send({
            email: email,
            password: password
        }).expect(200)
    
    if (!loginRes.body.token) {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    
    return loginRes.body.token;
};

export const table = (db, tableName, schema = 'public') => {
  return db.withSchema(schema).from(tableName);
}