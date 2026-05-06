import { Op } from "sequelize"
class UserRepository {

    constructor(models, sequelize) {
        this.User = models.User;
        this.Permit = models.Permit;
        this.sequelize = sequelize;
    }
    
    async findUser(userId) {
        return await this.User.findOne({ where: { id: userId } });
    }

    async findUserByEmail(email) {
        return await this.User.findOne({ where: { email: email } });
    }

    async findUserPermits(userId) {
        try {
            const user = await this.User.findByPk(userId, {
                include: {
                    model: this.Permit,
                    as: 'permits',       
                    attributes: ['table', 'role', 'idKey'] 
                }
            });

            if (!user) {
                throw new Error(`User with ID ${userId} not found`);
            }

            return user.permits.map(p => p.dataValues); 
        } catch (error) {
            console.error('Error searching for permits: ', error);
        }
    }

    async createUser(email, password, name) {
        try {
            const userCreated = await this.User.create({
                email,      
                password,  
                name,
                createdAt: Math.floor(Date.now()/1000)
            });

            return userCreated.id;
        } catch (error) {
            throw new Error(`Error saving new user caused by: ${error.message}`);
        }
    }

    async updatePassword(userId, password) {
        try {
            await this.User.update({ password }, {
                where: {
                    id: userId
                }
            });
        } catch (error) {
            throw new Error(`Error saving new user caused by: ${error.message}`);
        }
    }

    async createPermit(userId, table, permit_type, id_key) {
        try {
            const user = await this.User.findByPk(userId);
                if (!user) {
                    throw new Error(`User with ID ${userId} does not exist.`);
                }
                const permit = await this.Permit.create({
                user_id: userId,
                table: table,
                permit: permit_type,
                id_key: id_key
            });

            return permit;
        } catch (error) {
            throw new Error(`Error creating new permit caused by: ${error.message}`);
        }
    }

    async disableUser(userId, timestamp) {
        try {
            await this.User.update(
                {
                    disabledAt: timestamp
                },
                {
                    where: {
                        id: userId,
                        disabledAt: {
                            [Op.is]: null
                        },
                        createdAt: {
                            [Op.lt]: timestamp
                        }
                    }
                }
            )
        } catch (error) {
            throw new Error(`Error disabling user: ${error.message}`);
        }
    }

}

export default UserRepository;