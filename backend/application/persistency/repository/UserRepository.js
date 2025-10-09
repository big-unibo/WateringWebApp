import { QueryTypes, Op } from "sequelize";

class UserRepository {

    constructor(models, sequelize) {
        this.User = models.User;
        this.Permit = models.Permit;
        this.TranscodingField = models.TranscodingField;
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
                    attributes: ['table', 'permit', 'idKey'] 
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

    // async findAdminPermissions() {
    //     try {
    //         this.TranscodingField.removeAttribute('id')
    //         const res = (await this.TranscodingField.findAll({
    //             attributes: ['source', 'refStructureName', 'companyName', 'fieldName', 'sectorName', 'thesisName'],
    //             group: ['source', 'refStructureName', 'companyName', 'fieldName', 'sectorName', 'thesisName']
    //         })).map(el => el.dataValues);


    //         return res
    //     } catch (error) {
    //         console.error('Error on find admin permissions:', error);
    //     }
    // }

    // async findUserPermissionsInPeriod(userid, timestamp_from, timestamp_to) {
    //     try {
    //         const query = `
    //             SELECT DISTINCT permit.userid, permit."source", permit."refStructureName", permit."companyName", permit."fieldName", permit."sectorName", permit."thesisName", permit.permit
    //                 FROM public.permit_fields AS permit
    //                 JOIN public.transcoding_field AS transcoding
    //                     ON permit."refStructureName" = transcoding."refStructureName"
    //                         AND permit."companyName" = transcoding."companyName"
    //                         AND permit."fieldName" = transcoding."fieldName"
    //                         AND permit."sectorName" = transcoding."sectorName"
    //                         AND permit."thesisName" = transcoding."thesisName"
    //                 WHERE (permit.userid = '${userid}') 
    //                     AND transcoding.valid_from < '${timestamp_to}' 
    //                     AND (transcoding.valid_to > '${timestamp_from}' OR transcoding.valid_to IS NULL)
    //                 ORDER BY permit."refStructureName", permit."companyName", permit."fieldName", permit."sectorName", permit."thesisName"`

    //         return await this.sequelize.query(query, {
    //             type: QueryTypes.SELECT,
    //             bind: {
    //                 userid,
    //                 timestamp_from,
    //                 timestamp_to
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error on find user permissions:', error);
    //     }
    // }

    // async findAdminPermissionsInPeriod(timestamp_from, timestamp_to) {
    //     try {
    //         this.TranscodingField.removeAttribute('id')
    //         const res = (await this.TranscodingField.findAll({
    //             attributes: ['source', 'refStructureName', 'companyName', 'fieldName', 'sectorName', 'thesisName'],
    //             group: ['source', 'refStructureName', 'companyName', 'fieldName', 'sectorName', 'thesisName'],
    //             where: {
    //                 valid_from: {
    //                     [Op.lt]: Number(timestamp_to)
    //                 },
    //                 valid_to: {
    //                     [Op.or]:{
    //                         [Op.gt]: Number(timestamp_from),
    //                         [Op.is]: null
    //                     }
    //                 }
    //             },
    //             order: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'thesisName']
    //         })).map(el => el.dataValues);
    //         return res
    //     } catch (error) {
    //         console.error('Error on find user permissions:', error);
    //     }
    // }


    async createUser(email, password, name, role) {
        try {
            const userCreated = await this.User.create({
                email,      
                password,  
                name,       
                role        
            });

            return userCreated;
        } catch (error) {
            throw new Error(`Error saving new user caused by: ${error.message}`);
        }
    }

    async createPermit(userId, table, permit_type, id_key = null) {
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

    // async findFieldsByAffiliation(affiliation){
    //     try {
    //         this.TranscodingField.removeAttribute('id')
    //         const result = await this.TranscodingField.findAll({
    //             where: {source:affiliation}
    //         });

    //         const response = new Set();
    //         result.map(model => {
    //             const {
    //                 refStructureName,
    //                 companyName,
    //                 fieldName,
    //                 sectorName,
    //                 thesisName
    //             } = model;

    //             const key = `${refStructureName} - ${companyName} - ${fieldName} - ${sectorName} - ${thesisName}`;
    //             response.add(key)
    //         });

    //         return response;
    //     } catch (error) {
    //         console.error(`Error on finding transcoding fields for affiliation ${affiliation} caused by: ${error.message}`);
    //     }
    // }

}

export default UserRepository;