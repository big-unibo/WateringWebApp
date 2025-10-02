import { Model, DataTypes } from 'sequelize';

class Company extends Model {

}

function initCompany(sequelize) {
    Company.init({
        companyid: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        organizationid: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        modelName : 'company',
        timpestamps: false,
        sequelize
    });

    return Company;
}

export default initCompany;