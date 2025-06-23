import { Model, DataTypes } from 'sequelize';

class TranscodingField extends Model {

}

function initTranscodingField(sequelize) {

    TranscodingField.init({
        source: DataTypes.TEXT,
        refStructureName: DataTypes.TEXT,
        companyName: DataTypes.TEXT,
        fieldName: DataTypes.TEXT,
        sectorName: DataTypes.TEXT,
        plantRow: DataTypes.TEXT,
        colture: DataTypes.TEXT,
        coltureType: DataTypes.TEXT
    }, {
        modelName: 'transcoding_field',
        timestamps: false,
        sequelize
    });

    return TranscodingField;
}

export default initTranscodingField;