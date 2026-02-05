import { USERS_LOG_TABLE } from "../commons/constants.js";
import { User } from "../dtos/userDto.js";
import { UserRole, UserPermits } from "../dtos/userPermitsDto.js";


class UserService {

    constructor(userRepository, userActionService) {
        this.userRepository = userRepository;
        this.userActionService = userActionService;
    }

    async findUser(userId) {
        return await this.userRepository.findUser(userId);
    }

    async findUserByEmail(email) {
        return await this.userRepository.findUserByEmail(email);
    }

    async createUsers(userId, request) {
        try {
            const results = await Promise.all(
                request.users.map(async (user) => {
                    const newUser = await this.userRepository.createUser(
                        user.email,
                        user.password,
                        user.name,
                        user.role
                    );

                    if (newUser && newUser.id) {
                        await this.userActionService.logCreation(
                            userId,
                            USERS_LOG_TABLE,
                            newUser.id,
                            null
                        );
                    }

                    return newUser;
                })
            );

            return results;
        } catch (error) {
            console.error(`Error creating users: ${error.message}`);
            throw error;
        }
    }

    async isAdmin(userId) {
        return (await this.userRepository.findUserPermits(userId)).map(({role}) => role).includes('administrator')
    }

    async findUserPermits(userId) {
        try {
            const user = (await this.findUser(userId));
            if (!user) {
                throw new Error("User does not exist");
            }

            const results = await this.userRepository.findUserPermits(user.id);

            if (results) {
                return await this.computeUserPermits(user, results)
            } else {
                throw new Error("Invalid result")
            }
        } catch (error) {
            console.error(`Errore while searching for user permits: `, error);
            throw error;
        }
    }

    async computeUserPermits(user, results) {
        try {
            const map = new Map();
            let isAdmin = false

            results.forEach(p => {
                if (p.role === 'administrator'){
                    isAdmin = true
                } else {
                    const key = `${p.role}||${p.table}`;
                    if (!map.has(key)) {
                        map.set(key, {
                            role: p.role,
                            table: p.table,
                            idKeys: p.idKey !== null ? new Set([p.idKey]) : new Set()
                        });
                    } else {
                        if (p.id_key !== null) {
                            map.get(key).idKeys.add(p.idKey);
                        }
                    }
                }
            });

            const roles = Array.from(map.values()).map(p => new UserRole(
                p.role,
                p.table,
                Array.from(p.idKeys)
            ));

            return new UserPermits(user.id, isAdmin, roles)
        } catch (error) {
            console.error('Error computing user permits:', error);
            throw error;
        }
    }

    async getUserData(userId) {
        const rawUserData = await this.findUser(userId);
        if (rawUserData) {
            return new User(
                rawUserData.email,
                rawUserData.name
            )
        }
    }
}

export default UserService