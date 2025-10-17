import { UserPermitDto, UserPermitsDto } from "../dtos/userPermitsDto.js";


class UserService {

    constructor(userRepository) {
        this.userRepository = userRepository;
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

    // async createUserGrants(role, affiliation, request) {
    //     if(role !=='admin'){
    //         if(role === 'partner'){
    //             const affiliationFields = await this.userRepository.findFieldsByAffiliation(affiliation)
    //             request.grants.map(grant => {
    //                 const key = `${grant.refStructureName} - ${grant.companyName} - ${grant.fieldName} - ${grant.sectorName} - ${grant.thesisName}`;
    //                 if (affiliation !== grant.source || !affiliationFields.has(key))
    //                     throw Error(`Affiliation ${affiliation} has no permission to create grants for field ${key}`)
    //             })
    //         } else {
    //             throw Error("Error user is not authorized to grant users!!!")
    //         }
    //     }

    //     for(const grant of request.grants) {
    //         const userToGrant = await this.findUserByEmail(grant.username)
    //         if(userToGrant.affiliation !== affiliation){
    //             if (role !== 'admin'){
    //                 throw new Error(`Affiliation mismatch between user ${userToGrant.affiliation} and requestor ${affiliation}`)
    //             } else if (userToGrant.affiliation !== grant.source) {
    //                 throw new Error(`Affiliation mismatch between user ${userToGrant.affiliation} and field source ${grant.source}`)
    //             }
    //         }
    //         for(const permit of grant.permits)
    //             await this.userRepository.createFieldPermit(userToGrant.userid, grant.source, grant.refStructureName, grant.companyName, grant.fieldName, grant.sectorName, grant.thesisName, permit)
    //     }
    // }

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
                        map.get(key).id_keys.add(p.idKey); 
                    }
                }
            });

            //Decidi dove mettere sta logica se qua o nel Dto
            const permits = Array.from(map.values()).map(p => new UserPermitDto(
                p.permit,
                p.table,
                Array.from(p.idKeys)
            ));

            return new UserPermitsDto(user.id, user.role,permits)
        } catch (error) {
            console.error('Error computing user permits:', error);
            throw error;
        }
    }

    // async findUserPermissions(userid, timeFilterFrom, timeFilterTo) {
    //     try {

    //         const user = (await this.findUser(userid)).dataValues
    //         let results
    //         if (timeFilterFrom && timeFilterTo) {
    //             if (user.role === "admin") {
    //                 results = await this.userRepository.findAdminPermissionsInPeriod(timeFilterFrom, timeFilterTo)
    //             } else {
    //                 results = await this.userRepository.findUserPermissionsInPeriod(userid, timeFilterFrom, timeFilterTo)
    //             }
    //         } else {
    //             if (user.role === "admin") {
    //                 results = await this.userRepository.findAdminPermissions()
    //             } else {
    //                 results = await this.userRepository.findUserPermissions(userid)
    //             }
    //         }

    //         if (results) {
    //             return await this.computeUserPermissions(user, results)
    //         } else {
    //             throw new Error("Invalid result")
    //         }
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }

    // async computeUserPermissions(user, results) {
    //     try {
    //         const fields = new Map();

    //         for (const field of results) {
    //             const fieldDetails = await this.fieldRepository.getFieldDetails(
    //                 field.refStructureName,
    //                 field.companyName,
    //                 field.fieldName,
    //                 field.sectorName,
    //                 field.thesisName
    //             );

    //             if (fieldDetails) {
    //                 const keyString = JSON.stringify(fieldDetails.dataValues);

    //                 if (!fields.has(keyString)) {
    //                     fields.set(keyString, new Set());
    //                 }

    //                 if (field.permit) {
    //                     fields.get(keyString).add(field.permit);
    //                 } else if (user.role === "admin") {
    //                     fields.get(keyString).add("*")
    //                 }
    //             }
    //         }

    //         const userFieldsPermissions = Array.from(fields, ([keyString, permissions]) => {
    //             const key = JSON.parse(keyString);
    //             return new UserFieldPermission(
    //                 key.source,
    //                 key.refStructureName,
    //                 key.companyName,
    //                 key.fieldName,
    //                 key.sectorName,
    //                 key.thesisName,
    //                 key.colture,
    //                 key.coltureType,
    //               [...permissions] // Spread operator to convert Set to Array
    //             );
    //         });
    //         return new UserFieldPermissions(user.email, user.affiliation, user.role, userFieldsPermissions)
    //     } catch (error) {
    //         console.error(error)
    //     }
    // }

}

export default UserService