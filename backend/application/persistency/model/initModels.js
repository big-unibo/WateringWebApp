import initUser from './User.js';
import initCompany from './Company.js';
import initOrganization from './Organization.js';
import initField from './Field.js';
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
import initMeasurement from './Measurement.js';
import initThesesAllSignals from './ThesesAllSignals.js';
import initAdvice from './Advice.js';
import initWateringEvent from './WateringEvent.js';
import initGridOptimalProfileAssignment from './GridOptimalProfileAssignment.js';
import initOptimalProfile from './OptimalProfile.js';
import initUserAction from './UserAction.js';
import initProvider from './Provider.js';


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
    TranscodingField: initTranscodingField(sequelize),
    WateringAlgorithmParams: initWateringAlgorithmParams(sequelize),
    ThesesAllSignals: initThesesAllSignals(sequelize),
    Advice: initAdvice(sequelize),
    WateringEvent: initWateringEvent(sequelize),
    WateringAlgorithmParams: initWateringAlgorithmParams(sequelize),
    GridOptimalProfileAssignment : initGridOptimalProfileAssignment(sequelize),
    OptimalProfile: initOptimalProfile(sequelize),
    UserAction : initUserAction(sequelize),
    Provider : initProvider(sequelize)
  };

  models.Company.belongsTo(models.Organization, { foreignKey: "organizationId", as: "organization" });
  models.Organization.hasMany(models.Company, { foreignKey: "organizationId" , as:  "companies"});

  models.Field.belongsTo(models.Company, { foreignKey: "companyId" , as: "company"});
  models.Company.hasMany(models.Field, { foreignKey: "companyId" , as: "fields"});

  models.User.hasMany(models.Permit, {foreignKey: "userId", as: "permits" });
  models.Permit.belongsTo(models.User, {foreignKey: "userId", as: "user" });

  models.User.hasMany(models.UserAction, {foreignKey: "userId", as: "userActions" });
  models.UserAction.belongsTo(models.User, {foreignKey: "userId", as: "user" });

  models.Field.hasMany(models.Sector, {foreignKey: "fieldId", as: "sectors"});
  models.Sector.belongsTo(models.Field, {foreignKey: "fieldId", as: 'field'});

  models.Thesis.hasMany(models.ThesisInSector, { foreignKey: "thesisId",  as: "thesisInSector"});
  models.ThesisInSector.belongsTo(models.Thesis, { foreignKey: "thesisId", as: "thesis" });

  models.Sector.hasMany(models.ThesisInSector, { foreignKey: "sectorId", as: "thesisInSector" });
  models.ThesisInSector.belongsTo(models.Sector, { foreignKey: "sectorId", as: "sector" });

  models.Device.hasMany(models.Signal, {foreignKey: "deviceId", as: "signals"});
  models.Signal.belongsTo(models.Device, {foreignKey: "deviceId", as: "device"});

  models.Provider.hasMany(models.Device, {foreignKey: "providerId", as: "devices"});
  models.Device.belongsTo(models.Provider, {foreignKey: "providerId", as: "provider"});

  models.Field.hasMany(models.SignalInField, {foreignKey: "fieldId", as: "signals"});
  models.SignalInField.belongsTo(models.Field, {foreignKey: "fieldId", as: "field"});
  models.Signal.hasMany(models.SignalInField, {foreignKey: "signalId", as: "signalsInFields"});
  models.SignalInField.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Sector.hasMany(models.SignalInSector, {foreignKey: "sectorId", as: "signals"});
  models.SignalInSector.belongsTo(models.Sector, {foreignKey: "sectorId", as: "sector"});
  models.Signal.hasMany(models.SignalInSector, {foreignKey: "signalId", as: "signalsInSectors"});
  models.SignalInSector.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Thesis.hasMany(models.SignalInThesis, {foreignKey: "thesisId", as: "signals"});
  models.SignalInThesis.belongsTo(models.Thesis, {foreignKey: "thesisId", as: "thesis"});
  models.Signal.hasMany(models.SignalInThesis, {foreignKey: "signalId", as: "signalsInTheses"});
  models.SignalInThesis.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Signal.hasMany(models.Measurement, {foreignKey: "signalId", as: "measurements"});
  models.Measurement.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Thesis.hasMany(models.Advice, {foreignKey: "thesisId", as: "advices"})
  models.Advice.belongsTo(models.Thesis, {foreignKey: "thesisId", as: "thesis"})
  
  models.Thesis.hasMany(models.WateringAlgorithmParams, {foreignKey: "thesisId", as: "algorithmParams"})
  models.WateringAlgorithmParams.belongsTo(models.Thesis, {foreignKey: "thesisId", as: "thesis"})

  models.GridOptimalProfileAssignment.belongsTo(models.Device, {foreignKey: "gridId", as: "device" })
  models.Device.hasMany(models.GridOptimalProfileAssignment,{foreignKey: "gridId", as: "gridOptimalProfileAssignments" })

  return models;
}
