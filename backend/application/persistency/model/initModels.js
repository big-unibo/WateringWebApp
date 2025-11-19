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
    OptimalProfile: initOptimalProfile(sequelize)
  };

  models.Company.belongsTo(models.Organization, { foreignKey: "organization_id", as: "organization" });
  models.Organization.hasMany(models.Company, { foreignKey: "organization_id" , as:  "companies"});

  models.Field.belongsTo(models.Company, { foreignKey: "company_id" , as: "company"});
  models.Company.hasMany(models.Field, { foreignKey: "company_id" , as: "fields"});

  models.User.hasMany(models.Permit, {foreignKey: "user_id", as: "permits" });
  models.Permit.belongsTo(models.User, {foreignKey: "user_id", as: "user" });

  models.Field.hasMany(models.Sector, {foreignKey: "field_id", as: "sectors"});
  models.Sector.belongsTo(models.Field, {foreignKey: "field_id", as: 'field'});

  models.Thesis.hasMany(models.ThesisInSector, { foreignKey: "thesis_id",  as: "thesisInSector"});
  models.ThesisInSector.belongsTo(models.Thesis, { foreignKey: "thesis_id", as: "thesis" });

  models.Sector.hasMany(models.ThesisInSector, { foreignKey: "sector_id", as: "thesisInSector" });
  models.ThesisInSector.belongsTo(models.Sector, { foreignKey: "sector_id", as: "sector" });

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

  models.Thesis.hasMany(models.Advice, {foreignKey: "thesis_id", as: "advices"})
  models.Advice.belongsTo(models.Thesis, {foreignKey: "thesis_id", as: "thesis"})

  models.User.hasMany(models.WateringEvent, {foreign_key: "user_id", as: "updatedEvents"})
  models.WateringEvent.belongsTo(models.User, {foreign_key: "user_id", as: "user"})
  
  models.Thesis.hasMany(models.WateringAlgorithmParams, {foreignKey: "thesis_id", as: "algorithmParams"})
  models.WateringAlgorithmParams.belongsTo(models.Thesis, {foreignKey: "thesis_id", as: "thesis"})

  //[TO DO]: il resto....
  return models;
}
