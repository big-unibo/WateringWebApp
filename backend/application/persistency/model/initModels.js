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
import initDevice from './Device.js';
import initSignal from './Signal.js';
import initSignalInField from './SignalInField.js';
import initSignalInSector from './SignalInSector.js';
import initSignalInThesis from './SignalInThesis.js';
import { Measurement } from '../../dtos/deviceDto.js';
import initMeasurement from './Measurement.js';
import initThesesAllSignals from './ThesesAllSignals.js';


export default function initModels(sequelize) {
  const models = {
    User: initUser(sequelize),
    Company: initCompany(sequelize),
    Organization: initOrganization(sequelize),
    Field: initField(sequelize),
    Sector: initSector(sequelize),
    Thesis: initThesis(sequelize),
    Permit: initPermit(sequelize),
    ThesisInSector: initThesisInSector(sequelize),
    Device: initDevice(sequelize),
    Signal : initSignal(sequelize),
    SignalInField : initSignalInField(sequelize),
    SignalInSector : initSignalInSector(sequelize),
    SignalInThesis : initSignalInThesis(sequelize),
    Measurement : initMeasurement(sequelize),
    MatrixProfile: initMatrixProfile(sequelize),
    MatrixField: initMatrixField(sequelize),
    TranscodingField: initTranscodingField(sequelize),
    WateringAlgorithmParams: initWateringAlgorithmParams(sequelize),
    ThesesAllSignals: initThesesAllSignals(sequelize)
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

  models.Device.hasMany(models.Signal, {foreignKey: "device_id", as: "signals"});
  models.Signal.belongsTo(models.Device, {foreignKey: "device_id", as: "device"});

  models.Field.hasMany(models.SignalInField, {foreignKey: "field_id", as: "signals"});
  models.SignalInField.belongsTo(models.Field, {foreignKey: "field_id", as: "field"});
  models.Signal.hasMany(models.SignalInField, {foreignKey: "signal_id", as: "signalsInFields"});
  models.SignalInField.belongsTo(models.Signal, {foreignKey: "signal_id", as: "signal"});

  models.Sector.hasMany(models.SignalInSector, {foreignKey: "sector_id", as: "signals"});
  models.SignalInSector.belongsTo(models.Sector, {foreignKey: "sector_id", as: "sector"});
  models.Signal.hasMany(models.SignalInSector, {foreignKey: "signal_id", as: "signalsInSectors"});
  models.SignalInSector.belongsTo(models.Signal, {foreignKey: "signal_id", as: "signal"});

  models.Thesis.hasMany(models.SignalInThesis, {foreignKey: "thesis_id", as: "signals"});
  models.SignalInThesis.belongsTo(models.Thesis, {foreignKey: "thesis_id", as: "thesis"});
  models.Signal.hasMany(models.SignalInThesis, {foreignKey: "signal_id", as: "signalsInTheses"});
  models.SignalInThesis.belongsTo(models.Signal, {foreignKey: "signal_id", as: "signal"});

  models.Signal.hasMany(models.Measurement, {foreignKey: "signal_id", as: "measurements"});
  models.Measurement.belongsTo(models.Signal, {foreignKey: "signal_id", as: "signal"});



  //[TO DO]: il resto....
  return models;
}
