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
        fieldId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "field_id"
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

        prescriptive: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },

        advice: {
            type: DataTypes.BOOLEAN,
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

        dripperScalingFactor: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            field : "dripper_scaling_factor"
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