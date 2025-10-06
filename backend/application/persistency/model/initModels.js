import initUser from './User.js';
import initCompany from './Company.js';
import initOrganization from './Organization.js';
import initField from './Field.js';
import initMatrixProfile from './MatrixProfile.js';
import initMatrixField from './MatrixField.js';
import initTranscodingField from './TranscodingField.js';
import initWateringThesis from './WateringThesis.js';
import initWateringSector from './WateringSector.js';
import initWateringAlgorithmParams from './WateringAlgorithmParams.js';
import initPermit from './Permit.js';

export default function initModels(sequelize) {
  const models = {
    User: initUser(sequelize),
    Company: initCompany(sequelize),
    Organization: initOrganization(sequelize),
    Field: initField(sequelize),
    MatrixProfile: initMatrixProfile(sequelize),
    MatrixField: initMatrixField(sequelize),
    TranscodingField: initTranscodingField(sequelize),
    WateringThesis: initWateringThesis(sequelize),
    WateringSector: initWateringSector(sequelize),
    WateringAlgorithmParams: initWateringAlgorithmParams(sequelize),
    Permit: initPermit(sequelize),
  };

  models.Company.belongsTo(models.Organization, { foreignKey: "organization_id" });
  models.Organization.hasMany(models.Company, { foreignKey: "organization_id" });

  models.Field.belongsTo(models.Company, { foreignKey: "company_id" });
  models.Company.hasMany(models.Field, { foreignKey: "company_id" });

  models.MatrixField.hasMany(models.MatrixProfile, { foreignKey: "matrixId" });
  models.MatrixProfile.belongsTo(models.MatrixField, { foreignKey: "matrixId" });

  models.User.hasMany(models.Permit, {foreignKey: "user_id" });
  models.Permit.hasMany(models.User, {foreignKey: "user_id" });

  //[TO DO]: il resto....
  return models;
}
