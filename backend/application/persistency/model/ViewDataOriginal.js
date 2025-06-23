import { Model, DataTypes } from 'sequelize';

class ViewDataOriginal extends Model {

}

function initViewDataOriginal(sequelize) {
    ViewDataOriginal.init({
        source: DataTypes.TEXT,
        refStructureId: DataTypes.TEXT,
        refStructureName: DataTypes.TEXT,
        companyId: DataTypes.DOUBLE,
        companyName: DataTypes.TEXT,
        fieldId: DataTypes.DOUBLE,
        fieldName: DataTypes.TEXT,
        plantId: DataTypes.DOUBLE,
        plantName: DataTypes.TEXT,
        sectorName: DataTypes.DOUBLE,
        plantRow: DataTypes.TEXT,
        colture: DataTypes.TEXT,
        coltureType: DataTypes.TEXT,
        nodeId: DataTypes.TEXT,
        nodeDescription: DataTypes.TEXT,
        detectedValueTypeId: DataTypes.TEXT,
        detectedValueTypeDescription: DataTypes.TEXT,
        yy: DataTypes.DOUBLE,
        xx: DataTypes.DOUBLE,
        value: DataTypes.DOUBLE,
        unit: DataTypes.TEXT,
        date: DataTypes.DATE,
        time: DataTypes.TEXT,
        latitude: DataTypes.DOUBLE,
        longitude: DataTypes.DOUBLE,
        timestamp: DataTypes.INTEGER,
        zz: DataTypes.DOUBLE,
    }, {
        modelName: 'view_data_original',
        timestamps: false,
        sequelize
    });
}




export default initViewDataOriginal;