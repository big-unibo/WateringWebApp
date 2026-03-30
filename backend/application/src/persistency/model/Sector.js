import { Model, DataTypes } from 'sequelize';

class Sector extends Model {

}

function initSector(sequelize) {
    Sector.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        sectorName: {
            type: DataTypes.TEXT,
            allowNull: false,
            field: "sector_name"
        },
        farmId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "farm_id"
        },
        culture: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        cultureType: {
            type: DataTypes.TEXT,
            allowNull: true,
            field: "culture_type"
        },
        location: {
            type: DataTypes.GEOMETRY,
            allowNull: true
        },
        dripperCapacity: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field : "dripper_capacity"
        },
        sprinklerCapacity: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field : "sprinkler_capacity"
        },
        doubleWing: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field : "double_wing"
        },
        disabledAt: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field: "disabled_at"
        }
    }, {
        modelName:'Sector',
        tableName: 'sectors',
        timestamps: false,
        sequelize
    });

    return Sector;
}

export default initSector;