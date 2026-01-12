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
import initDeviceInField from './DeviceInField.js';
import initDeviceInSector from './DeviceInSector.js';
import initDeviceInThesis from './DeviceInThesis.js';
import initMeasurement from './Measurement.js';
import initThesesAllSignals from './ThesesAllSignals.js';
import initAdvice from './Advice.js';
import initWateringEvent from './WateringEvent.js';
import initGridOptimalProfileAssignment from './GridOptimalProfileAssignment.js';
import initOptimalProfile from './OptimalProfile.js';
import initUserAction from './UserAction.js';
import initProvider from './Provider.js';
import initDevicesSignals from './DevicesSignals.js';
import initSignalsDenormalized from './SignalsDenormalized.js';


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
    DevicesSignals: initDevicesSignals(sequelize),
    Signal : initSignal(sequelize),
    SignalsDenormalized: initSignalsDenormalized(sequelize),
    DeviceInField : initDeviceInField(sequelize),
    DeviceInSector : initDeviceInSector(sequelize),
    DeviceInThesis : initDeviceInThesis(sequelize),
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

  models.Provider.hasMany(models.Signal, {foreignKey: "providerId", as: "signals"});
  models.Signal.belongsTo(models.Provider, {foreignKey: "providerId", as: "provider"});

  models.Device.hasMany(models.DevicesSignals, {foreignKey: "deviceId", as: "signals"});
  models.DevicesSignals.belongsTo(models.Device, {foreignKey: "deviceId", as: "device"});
  models.Signal.hasMany(models.DevicesSignals, {foreignKey: "signalId", as: "devices"});
  models.DevicesSignals.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Field.hasMany(models.DeviceInField, {foreignKey: "fieldId", as: "signals"});
  models.DeviceInField.belongsTo(models.Field, {foreignKey: "fieldId", as: "field"});
  models.Signal.hasMany(models.DeviceInField, {foreignKey: "signalId", as: "signalsInFields"});
  models.DeviceInField.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Sector.hasMany(models.DeviceInSector, {foreignKey: "sectorId", as: "signals"});
  models.DeviceInSector.belongsTo(models.Sector, {foreignKey: "sectorId", as: "sector"});
  models.Signal.hasMany(models.DeviceInSector, {foreignKey: "signalId", as: "signalsInSectors"});
  models.DeviceInSector.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

  models.Thesis.hasMany(models.DeviceInThesis, {foreignKey: "thesisId", as: "signals"});
  models.DeviceInThesis.belongsTo(models.Thesis, {foreignKey: "thesisId", as: "thesis"});
  models.Signal.hasMany(models.DeviceInThesis, {foreignKey: "signalId", as: "signalsInTheses"});
  models.DeviceInThesis.belongsTo(models.Signal, {foreignKey: "signalId", as: "signal"});

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
