import initUser from './User.js';
import initCompany from './Company.js';
import initOrganization from './Organization.js';
import initField from './Field.js';
import initMatrixProfile from './MatrixProfile.js';
import initMatrixField from './MatrixField.js';
import initTranscodingField from './TranscodingField.js';
import initThesis from './Thesis.js';
import initWateringAlgorithmParams from './WateringAlgorithmParams.js';
import initPermit from './Permit.js';
import initSector from './Sector.js';
import initThesisInSector from './ThesisInsector.js';


export default function initModels(sequelize) {
  const models = {
    User: initUser(sequelize),
    Company: initCompany(sequelize),
    Organization: initOrganization(sequelize),
    Field: initField(sequelize),
    Sector: initSector(sequelize),
    Thesis: initThesis(sequelize),
    ThesisInSector: initThesisInSector(sequelize),
    MatrixProfile: initMatrixProfile(sequelize),
    MatrixField: initMatrixField(sequelize),
    TranscodingField: initTranscodingField(sequelize),
    WateringAlgorithmParams: initWateringAlgorithmParams(sequelize),
    Permit: initPermit(sequelize),
  };

  models.Company.belongsTo(models.Organization, { foreignKey: "organization_id" });
  models.Organization.hasMany(models.Company, { foreignKey: "organization_id" });

  models.Field.belongsTo(models.Company, { foreignKey: "company_id" , as: "company"});
  models.Company.hasMany(models.Field, { foreignKey: "company_id" , as: "fields"});

  models.MatrixField.hasMany(models.MatrixProfile, { foreignKey: "matrixId" });
  models.MatrixProfile.belongsTo(models.MatrixField, { foreignKey: "matrixId" });

  models.User.hasMany(models.Permit, {foreignKey: "user_id", as: "permits" });
  models.Permit.belongsTo(models.User, {foreignKey: "user_id", as: "user" });

  models.Field.hasMany(models.Sector, {foreignKey: "field_id", as: "sectors"});
  models.Sector.belongsTo(models.Field, {foreignKey: "field_id", as: 'field'});

  models.Thesis.hasMany(models.ThesisInSector, { foreignKey: "thesis_id" });
  models.ThesisInSector.belongsTo(models.Thesis, { foreignKey: "thesis_id" });

  models.Sector.hasMany(models.ThesisInSector, { foreignKey: "sector_id" });
  models.ThesisInSector.belongsTo(models.Sector, { foreignKey: "sector_id" });

  //[TO DO]: il resto....
  return models;
}
