import { Model, DataTypes } from 'sequelize';

class SectorServices extends Model {

}

function initSectorServices(sequelize) {
    SectorServices.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sectorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "sector_id"
        },
        serviceId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "service_id"
        },
        validFrom: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            field: "valid_from"
        },
        validTo: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "valid_to"
        },
    }, {
        modelName: 'SectorServices',
        tableName: 'sectors_services',
        timestamps: false,
        sequelize
    });

    return SectorServices;
}

export default initSectorServices;