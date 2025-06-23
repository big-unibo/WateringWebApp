const {Sequelize, DataTypes} = require('sequelize');
const {PostgreSqlContainer} = require("@testcontainers/postgresql");

const initUser = require('../../persistency/model/User');
const initFieldsPermit = require('../../persistency/model/FieldsPermit');
const initTranscodingField = require('../../persistency/model/TranscodingField');

const UserRepository = require('../../persistency/repository/UserRepository');
describe("Integration tests", () => {

    let container;
    let sequelize;
    let userRepository;

    beforeEach(async () => {
        container = await new PostgreSqlContainer()
            .withName('watering_postgres_test')
            .withUsername('testUser')
            .withPassword('testPass')
            .withExposedPorts(5432)
            .withDatabase('testDb')
            .start();

        sequelize = new Sequelize(container.getDatabase(), container.getUsername(), container.getPassword(), {
            host: container.getHost(),
            port: container.getPort(),
            dialect: 'postgres'
        });

        try {
            await sequelize.authenticate();
            console.log('Connection has been established successfully.');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }

        const User = initUser(sequelize);
        const FieldsPermit = initFieldsPermit(sequelize);
        const TranscodingField = initTranscodingField(sequelize);

        await User.sync({ force: true });
        await FieldsPermit.sync({ force: true });
        await TranscodingField.sync({ force: true });

        const user1 = User.build({ userid: 'user1@example.com', auth_type: 'psw', affiliation:'abs@unibo.it', pwd: 'user1Pass', name:'User1', role:'user' });
        const user2 = User.build({ userid: 'user2@example.com', auth_type: 'token', affiliation:'ifarming@test.it', pwd: 'user2Pass', name:'User2', role:'user' });

        const fieldPermit1 = FieldsPermit.build({ permitid: 1, userid: 'user1@example.com', affiliation: 'abs@unibo.it', refStructureName: 'structure1', companyName: 'company1', fieldName: 'field1', sectorName: 'sector1', plantRow: 'thesis1', permit: 'permit1' })
        const fieldPermit2 = FieldsPermit.build({permitid:2, userid: 'user2@example.com', affiliation: 'ifarming@unibo.it',
            refStructureName: 'structure2', companyName: 'company2', fieldName: 'field2', sectorName: 'sector2', plantRow: 'thesis2', permit: 'permit2'
        })

        await user1.save()
        await user2.save()
        await fieldPermit1.save()
        await fieldPermit2.save()

        console.log('Database successfully populated.');

        userRepository = new UserRepository(User, FieldsPermit, TranscodingField, sequelize);
    }, 20000);

    afterEach(async () => {
       await sequelize.close();
       await container.stop();
    }, 10000);


    test('should fetch user 1 correctly', async () => {
        const user = await userRepository.findUser('user1@example.com');
        expect(user.dataValues.userid).toBe('user1@example.com');
        expect(user.dataValues.auth_type).toBe('psw');
        expect(user.dataValues.affiliation).toBe('abs@unibo.it');
        expect(user.dataValues.pwd).toBe('user1Pass');
        expect(user.dataValues.name).toBe('User1');
        expect(user.dataValues.role).toBe('user');
    }, 30000);

    test('should fetch user 2 permissions correctly', async () => {
        const user = await userRepository.findUserPermissions('user2@example.com');
        expect(user.dataValues.userid).toBe('user2@example.com');
        expect(user.dataValues.auth_type).toBe('token');
        expect(user.dataValues.affiliation).toBe('ifarming@test.it');
        expect(user.dataValues.pwd).toBe('user2Pass');
        expect(user.dataValues.name).toBe('User2');
        expect(user.dataValues.role).toBe('user');
        expect(user.dataValues.permit_fields.length).toBe(1)
        expect(user.dataValues.permit_fields[0].refStructureName).toBe('structure2')
        expect(user.dataValues.permit_fields[0].companyName).toBe('company2')
        expect(user.dataValues.permit_fields[0].fieldName).toBe('field2')
        expect(user.dataValues.permit_fields[0].sectorName).toBe('sector2')
        expect(user.dataValues.permit_fields[0].plantRow).toBe('thesis2')
        expect(user.dataValues.permit_fields[0].permit).toBe('permit2')
    }, 30000);

});