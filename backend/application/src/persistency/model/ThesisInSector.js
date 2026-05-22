import { Model, DataTypes } from 'sequelize';

class ThesisInSector extends Model {}

function initThesisInSector(sequelize) {
    ThesisInSector.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        thesisId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "thesis_id"
        },
        sectorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "sector_id"
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
        weight: {
            type: DataTypes.DOUBLE,
            allowNull: true
        }
    }, {
        tableName: 'theses_in_sectors',
        modelName: 'ThesisInSector',
        timestamps: false,
        sequelize
    });

    return ThesisInSector;
}

export default initThesisInSector;
