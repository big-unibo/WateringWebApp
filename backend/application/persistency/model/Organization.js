import { Model, DataTypes } from 'sequelize';

class Organization extends Model {

}

function initOrganization(sequelize) {
    Organization.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        organization_name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        modelName: 'organizations',
        timestamps: false,
        sequelize
    });

    return Organization;
}

export default initOrganization;