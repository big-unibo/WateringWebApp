import { generatePassword, hashPassword, newPasswordTemplate } from "../commons/authUtils.js";
import { TABLES } from "../commons/constants.js";
import { sendEmail } from "../commons/gmail.service.js";
import { UserRole, UserPermits } from "../dtos/userPermitsDto.js";
import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter()

class UserService {

    constructor(userRepository, userActionService) {
        this.userRepository = userRepository;
        this.userActionService = userActionService;
    }

    async findUser(userId) {
        const user = await this.userRepository.findUser(userId);
        if(user){
            return dtoConverter.convertUserData(user)
        }
    }

    async findUserByEmail(email, raw) {
        const user = await this.userRepository.findUserByEmail(email);
        if (!raw) {
            if (user) {
                return dtoConverter.convertUserData(user)
            }
        } else {
            return user
        }
    }

    async createUser(userId, newUser) {
        try {
            const newUserId = await this.userRepository.createUser(
                newUser.email,
                newUser.password,
                newUser.name
            );

            if (newUserId) {
                await this.userActionService.logCreation(
                    userId,
                    TABLES.USER,
                    newUserId,
                    null
                );
            } else {
                throw Error('User creation error')
            }

            if(!newUser.password){
                this.resetPassword(newUser.email)
            }

            return newUserId;
        } catch (error) {
            console.error(`Error creating users: ${error.message}`);
            throw error;
        }
    }

    async changePassword(userId, currentPassword, newPassword){
        const user = await this.userRepository.findUser(userId)
        if ( user.password === currentPassword){
            await this.userRepository.updatePassword(userId, newPassword)
            return true
        } else {
            return false
        }
    }

    async resetPassword(email){
        const user = await this.findUserByEmail(email, true)
        if(!user){
            throw Error('User not found')
        }
        const newPassword = generatePassword(16)
        await this.userRepository.updatePassword(user.id, hashPassword(newPassword))
        await sendEmail({
            to: user.email,
            subject: "SMARTER password reset",
            html: newPasswordTemplate(user.email, user.name, newPassword),
        });
        return newPassword
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

    async disableUser(userId, targetUserId, validTo) {
        try {
            await this.userRepository.disableUser(targetUserId, validTo)
            await this.userActionService.logDisabling(userId, TABLES.USER, targetUserId)
        } catch (error) {
            console.error(`Error disabling user: ${error.message}`);
            throw error;
        }
    }
}

export default UserService