import { QueryTypes, Op } from "sequelize";

class UserRepository {

    constructor(User, FieldsPermit, TranscodingField, sequelize) {
        this.User = User
        this.FieldsPermit = FieldsPermit
        this.TranscodingField = TranscodingField
        this.sequelize = sequelize

        User.hasMany(FieldsPermit, { foreignKey: 'userid'});
        FieldsPermit.belongsTo(User, { foreignKey: 'userid'});
    }

    async findUser(userid) {
        return await this.User.findOne({ where: { userid: userid } });
    }

    async findUserByEmail(email) {
        return await this.User.findOne({ where: { email: email } });
    }

    async findUserPermissions(userid) {
        try {
            this.FieldsPermit.removeAttribute('id')
            return (await this.FieldsPermit.findAll({
                where: { userid: userid }
            })).map(el => el.dataValues);
        } catch (error) {
            console.error('Error on find user:', error);
        }
    }

    async findAdminPermissions() {
        try {
            this.TranscodingField.removeAttribute('id')
            const res = (await this.TranscodingField.findAll({
                attributes: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'plantRow'],
                group: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'plantRow']
            })).map(el => el.dataValues);


            return res
        } catch (error) {
            console.error('Error on find admin permissions:', error);
        }
    }

    async findUserPermissionsInPeriod(userid, timestamp_from, timestamp_to) {
        try {
            const query = `
                SELECT DISTINCT permit.userid, permit.affiliation, permit."refStructureName", permit."companyName", permit."fieldName", permit."sectorName", permit."plantRow", permit.permit
                    FROM public.permit_fields AS permit
                    JOIN public.transcoding_field AS transcoding
                        ON permit."refStructureName" = transcoding."refStructureName"
                            AND permit."companyName" = transcoding."companyName"
                            AND permit."fieldName" = transcoding."fieldName"
                            AND permit."sectorName" = transcoding."sectorName"
                            AND permit."plantRow" = transcoding."plantRow"
                    WHERE (permit.userid = '${userid}') 
                        AND transcoding.valid_from < '${timestamp_to}' 
                        AND (transcoding.valid_to > '${timestamp_from}' OR transcoding.valid_to IS NULL)
                    ORDER BY permit."refStructureName", permit."companyName", permit."fieldName", permit."sectorName", permit."plantRow"`

            return await this.sequelize.query(query, {
                type: QueryTypes.SELECT,
                bind: {
                    userid,
                    timestamp_from,
                    timestamp_to
                }
            });
        } catch (error) {
            console.error('Error on find user permissions:', error);
        }
    }

    async findAdminPermissionsInPeriod(timestamp_from, timestamp_to) {
        try {
            this.TranscodingField.removeAttribute('id')
            const res = (await this.TranscodingField.findAll({
                attributes: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'plantRow'],
                group: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'plantRow'],
                where: {
                    valid_from: {
                        [Op.lt]: Number(timestamp_to)
                    },
                    valid_to: {
                        [Op.or]:{
                            [Op.gt]: Number(timestamp_from),
                            [Op.is]: null
                        }
                    }
                },
                order: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'plantRow']
            })).map(el => el.dataValues);
            return res
        } catch (error) {
            console.error('Error on find user permissions:', error);
        }
    }


    async createUser(username, auth_type, affiliation, pwd, name) {
        try {
            let userCreated = this.User.build({
                userid: await this.User.max('userid') + 1,
                email: username,
                auth_type: auth_type,
                affiliation: affiliation,
                pwd: pwd,
                name: name,
                role: 'user'
            })
            return await userCreated.save();
        } catch (error) {
            throw Error(`Error save new user caused by: ${error.message}`)
        }
    }

    async createFieldPermit(userId, affiliation, refStructureName, companyName, fieldName, sectorName, plantRow, permit) {
        let model = this.FieldsPermit.build({
            userid: userId,
            affiliation: affiliation,
            refStructureName: refStructureName,
            companyName: companyName,
            fieldName: fieldName,
            sectorName: sectorName,
            plantRow: plantRow,
            permit: permit
        })
        this.FieldsPermit.removeAttribute('id')
        return await model.save()
    }

    async findFieldsByAffiliation(affiliation){
        try {
            this.TranscodingField.removeAttribute('id')
            const result = await this.TranscodingField.findAll({
                where: {source:affiliation}
            });

            const response = new Set();
            result.map(model => {
                const {
                    refStructureName,
                    companyName,
                    fieldName,
                    sectorName,
                    plantRow
                } = model;

                const key = `${refStructureName} - ${companyName} - ${fieldName} - ${sectorName} - ${plantRow}`;
                response.add(key)
            });

            return response;
        } catch (error) {
            console.error(`Error on finding transcoding fields for affiliation ${affiliation} caused by: ${error.message}`);
        }
    }

}

export default UserRepository;