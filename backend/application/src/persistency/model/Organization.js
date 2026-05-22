import { Model, DataTypes } from 'sequelize';

class Organization extends Model {

}

function initOrganization(sequelize) {
    Organization.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        organizationName: {
            type: DataTypes.STRING,
            allowNull: false,
            field: "organization_name"
        }
    }, {
        modelName: 'Organization',
        tableName: 'organizations',
        timestamps: false,
        sequelize
    });

    return Organization;
}

export default initOrganization;