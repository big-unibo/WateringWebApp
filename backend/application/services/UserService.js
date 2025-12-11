import { User, UserData } from "../dtos/userDto.js";
import { UserPermit, UserPermits } from "../dtos/userPermitsDto.js";


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

    async createUsers(request) {
        try {
            const results = await Promise.all(
                request.users.map(user =>
                    this.userRepository.createUser(
                        user.email,
                        user.password,
                        user.name,
                        user.role 
                    ).catch(error => {
                        console.error(`Error creating user ${user.name}: ${error.message}`);
                        throw error; 
                    })
                )
            );

            return results; 
        } catch (error) {
            console.error(`Error creating user ${error.message}`);
            throw error;
        }
    }

    async findUserPermits(userId){
        try{
            const user = (await this.findUser(userId));
            if(!user){
                throw new Error("User does not exist");
            }

            const results = await this.userRepository.findUserPermits(user.id);

            if (results) {
                return await this.computeUserPermits(user, results)
            } else {
                throw new Error("Invalid result")
            }
        }catch(error){
            console.error(`Errore while searching for user permits: `,error);
            throw error;
        }
    }

    async computeUserPermits(user, results) {
        try {
            const map = new Map();

            results.forEach(p => {
                const key = `${p.permit}||${p.table}`;
                if (!map.has(key)) {
                    map.set(key, {
                        permit: p.permit,
                        table: p.table,
                        idKeys: p.idKey !== null ? new Set([p.idKey]) : new Set()
                    });
                } else {
                    if (p.id_key !== null) {
                        map.get(key).idKeys.add(p.idKey); 
                    }
                }
            });

            const permits = Array.from(map.values()).map(p => new UserPermit(
                p.permit,
                p.table,
                Array.from(p.idKeys)
            ));

            return new UserPermits(user.id, user.role, permits)
        } catch (error) {
            console.error('Error computing user permits:', error);
            throw error;
        }
    }

    async getUserData(userId){
        const rawUserData = await this.findUser(userId);
        if(rawUserData){
            return new UserData(
                rawUserData.email,
                rawUserData.name,
                rawUserData.role
            )
        }else{
            return null
        }
    }
}

export default UserService