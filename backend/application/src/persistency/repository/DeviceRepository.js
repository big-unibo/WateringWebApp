import { Op } from "sequelize";
import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js";
import { removeUndefined } from "../../commons/utils.js";

class DeviceRepository {
    constructor(models, sequelize) {
        this.Device = models.Device
        this.Signal = models.Signal
        this.DevicesSignals = models.DevicesSignals
        this.DeviceInFarm = models.DeviceInFarm
        this.DeviceInSector = models.DeviceInSector
        this.DeviceInThesis = models.DeviceInThesis
        this.ThesesAllSignals = models.ThesesAllSignals
        this.sequelize = sequelize
    }

    async deviceExists(deviceId) {
        const count = await this.Device.count({
            where: { id: deviceId }
        });
        return count > 0;
    }

    async createDevice(deviceData) {
        try {
            const device = await this.Device.create({
                type: deviceData.type,
                description: deviceData.description,
                location: deviceData.location,
                binningId: deviceData.binningId,
                companyId: deviceData.companyId
            });

            return device.id;
        } catch (error) {
            throw new Error(`Error creating new device caused by: ${error.message}`);
        }
    }

    async connectSignalsToDevice(deviceId, signalIds, validFrom) {
        try {

            const attachedSignals = await this.DevicesSignals.bulkCreate(
                signalIds.map(signalId => ({
                    deviceId: deviceId,
                    signalId: signalId,
                    validFrom: validFrom
                }))
            );

            return attachedSignals.map(as => as.id);
            
        } catch (error) {
            throw new Error(`Error connecting signals to device caused by: ${error.message}`);
        }
    }

    async disconnectSignalsFromDevice(deviceId, signalIds, validTo) {
        try {
            const [_, updatedRecords] = await this.DevicesSignals.update({
                validTo: validTo
            }, {
                where: {
                    deviceId: deviceId,
                    signalId: {
                        [Op.in]: [...signalIds]
                    },
                },
                returning: ["id"]
            });
            return updatedRecords.map(record => record.id);  
        } catch (error) {
            throw new Error(`Error disconnecting signals from device caused by: ${error.message}`);
        }
    }

    async getDevice(deviceId, timestamp) {
        const query = `
        SELECT 
            ds.device_id AS "deviceId",
            ds.device_type AS "deviceType",
            ds.device_description AS "deviceDescription",
            ds.device_binning_id AS "binningId",
            d.location,
            ds.provider_id AS "providerId",
            ds.signal_id_on_provider AS "idOnProvider",
            ds.signal_id AS "signalId",
            ds.signal_description AS "signalDescription",
            ds.signal_type AS "signalType",
            ds.signal_type_description AS "signalTypeDescription",
            m.measurement_timestamp AS "lastMeasurementTimestamp",
            ds.virtual,
            ds.unit,
            ds.x, ds.y, ds.z
        FROM devices_signals_denormalized ds
        JOIN devices d ON d.id = ds.device_id
        JOIN LATERAL (
            SELECT MAX(timestamp) AS measurement_timestamp
            FROM measurements m
            WHERE m.signal_id = ds.signal_id
        ) m ON true
        WHERE ds.device_id = :deviceId
            ${timestamp ? "AND valid_from < :timestamp AND COALESCE(valid_to, 'infinity') > :timestamp" : ""}`
        try {
            const results = await this.sequelize.query(query, {
                replacements: { deviceId, timestamp },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving device data: ${error.message}`);
            throw error;
        }
    }

    async updateDevice(deviceId, updates) {
        try {
            const device = await this.Device.findByPk(deviceId);
            if (!device) throw new Error("Device not found");
            return await device.update(updates);
        } catch (error) {
            throw new Error(`Error while updating device caused by: ${error.message}`);
        }
    }

    async getDeviceAssociationEntries(deviceId, timestamp, userId, isAdmin) {
        try {
            const query = `
            SELECT DISTINCT device_id AS "deviceId", device_description AS "deviceDescription", farm_id AS "farmId",
                farm_name AS "farmName", tas.sector_id AS "sectorId", sector_name AS "sectorName", 
                thesis_id AS "thesisId", thesis_name AS "thesisName", association_type AS "associationType"
            FROM theses_all_signals tas
            LEFT JOIN (SELECT DISTINCT sector_id FROM master_data_permits WHERE user_id = :userId) p ON tas.sector_id = p.sector_id
            WHERE device_id = :deviceId
                AND valid_from < :timestamp
                AND COALESCE(valid_to, 'infinity') > :timestamp
                AND (:isAdmin = true OR p.sector_id IS NOT NULL)
            `
            const deviceAssociations = await this.sequelize.query(query, {
                replacements: { deviceId, timestamp, userId, isAdmin},
                type: this.sequelize.QueryTypes.SELECT
            });
            return deviceAssociations;
        } catch (error) {
            throw new Error(`Error while finding device associations: ${error.message}`);
        }
    }

    async getSignals(deviceId) {
        const result = await this.Signal.findAll({
            where: {
                deviceId: deviceId
            }
        });
        return result.map(r => r.get({ plain: true }));
    }

    async countDevices(filteringIds, timeFilterFrom, timeFilterTo, providerIds, types, companyIds) {
        const query = ` SELECT COUNT(DISTINCT ds.device_id) AS total
            FROM devices_signals_denormalized ds
            WHERE valid_from < :timeFilterTo
                AND COALESCE(valid_to, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND provider_id = ANY(ARRAY[:providerIds]::int[])" : ""}
                ${companyIds?.length > 0 ? "AND device_company_id = ANY(ARRAY[:companyIds]::int[])" : ""}
                ${types?.length > 0 ? "AND device_type = ANY(ARRAY[:types])" : ""}
                AND ${filteringIds === null
                ? 'TRUE'
                : filteringIds.length === 0
                    ? 'FALSE'
                    : 'ds.device_id = ANY(ARRAY[:filteringIds])'}`
        try {
            const [results] = await this.sequelize.query(query, {
                replacements: { timeFilterFrom, timeFilterTo, providerIds, types, companyIds, filteringIds },
                type: this.sequelize.QueryTypes.SELECT
            });
            return Number(results.total);
        } catch (error) {
            console.error(`Fail counting devices data: ${error.message}`);
            throw error;
        }
    }

    async getDevices(filteringIds, timeFilterFrom, timeFilterTo, providerIds, types, companyIds, offset, limit) {
        const query = `WITH paginated_devices AS (
            SELECT DISTINCT ds.device_id
            FROM devices_signals_denormalized ds
            WHERE valid_from < :timeFilterTo
                AND COALESCE(valid_to, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND provider_id = ANY(ARRAY[:providerIds]::int[])" : ""}
                ${types?.length > 0 ? "AND device_type = ANY(ARRAY[:types])" : ""}
                ${companyIds?.length > 0 ? "AND device_company_id = ANY(ARRAY[:companyIds]::int[])" : ""}
                AND ${filteringIds === null
                ? 'TRUE'
                : filteringIds.length === 0
                    ? 'FALSE'
                    : 'ds.device_id = ANY(ARRAY[:filteringIds])'}
            ORDER BY ds.device_id
            LIMIT :limit
            OFFSET :offset
        )
        SELECT DISTINCT
            ds.device_id AS "deviceId",
            ds.device_type AS "deviceType",
            ds.device_description AS "deviceDescription",
            ds.provider_id AS "providerId",
            ds.signal_id_on_provider AS "idOnProvider",
            ds.signal_id AS "signalId",
            ds.signal_description AS "signalDescription",
            ds.signal_type AS "signalType",
            ds.signal_type_description AS "signalTypeDescription",
            m.measurement_timestamp AS "lastMeasurementTimestamp",
            ds.virtual,
            ds.unit,
            ds.x, ds.y, ds.z
        FROM devices_signals_denormalized ds
        JOIN paginated_devices pd ON pd.device_id = ds.device_id
        JOIN LATERAL (
            SELECT MAX(timestamp) AS measurement_timestamp
            FROM measurements m
            WHERE m.signal_id = ds.signal_id
        ) m ON true
        WHERE valid_from < :timeFilterTo
            AND COALESCE(valid_to, 'infinity') > :timeFilterFrom`

        try {
            const results = await this.sequelize.query(query, {
                replacements: { timeFilterFrom, timeFilterTo, providerIds, types, companyIds, offset, limit, filteringIds},
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving devices data: ${error.message}`);
            throw error;
        }
    }

    async linkDeviceToFarm(associationData) {
        try {
            const model = await this.DeviceInFarm.create({
                deviceId: associationData.deviceId,
                farmId: associationData.farmId,
                validFrom: associationData.validFrom
            });
            return model.id;
        } catch (error) {
            throw new Error(`Error creating association between device and farm: ${error.message}`);
        }
    }

    async linkDeviceToSector(associationData) {
        try {
            const model = await this.DeviceInSector.create({
                deviceId: associationData.deviceId,
                sectorId: associationData.sectorId,
                validFrom: associationData.validFrom
            });
            return model.id;
        } catch (error) {
            throw new Error(`Error creating association between device and sector: ${error.message}`);
        }
    }

    async linkDeviceToThesis(associationData) {
        try {
            const model = await this.DeviceInThesis.create({
                deviceId: associationData.deviceId,
                thesisId: associationData.thesisId,
                validFrom: associationData.validFrom
            });
            return model.id;
        } catch (error) {
            throw new Error(`Error creating association between device and thesis: ${error.message}`);
        }
    }

    _getValidityConditions(deviceId, validTo) {
        return {
            deviceId: deviceId,
            validFrom: {
                [Op.lt]: validTo
            },
            validTo: {
                [Op.or]: [
                    { [Op.is]: null },
                    { [Op.gt]: validTo }
                ]
            }
        };
    }

    async unlinkDeviceFromFarm(associationData) {
        try {
            const [_, updatedRecords] = await this.DeviceInFarm.update({
                validTo: associationData.validTo
            }, {
                where: {
                    ...associationData.farmId !== "ALL" ? {farmId: associationData.farmId} : {},
                    ...this._getValidityConditions(associationData.deviceId, associationData.validTo),
                },
                returning: ["id"]
            });
            return updatedRecords.map(record => record.id);
        } catch (error) {
            throw new Error(`Error unlinking device from farm: ${error.message}`);
        }
    }

    async unlinkDeviceFromSector(associationData) {
        try {
            
            const [_, updatedRecords] = await this.DeviceInSector.update({
                validTo: associationData.validTo
            }, {
                where: {
                    ...associationData.sectorId !== "ALL" ? {sectorId: associationData.sectorId} : {},
                    ...this._getValidityConditions(associationData.deviceId, associationData.validTo),
                },
                returning: ["id"]
            });
            return updatedRecords.map(record => record.id);
        } catch (error) {
            throw new Error(`Error unlinking device from sector: ${error.message}`);
        }
    }

    async unlinkDeviceFromThesis(associationData) {
        try {
            const [_, updatedRecords] = await this.DeviceInThesis.update({
                validTo: associationData.validTo
            }, {
                where: {
                    ...associationData.thesisId !== "ALL" ? {thesisId: associationData.thesisId} : {},
                    ...this._getValidityConditions(associationData.deviceId, associationData.validTo),
                },
                returning: ["id"]
            });
            return updatedRecords.map(record => record.id);
        } catch (error) {
            throw new Error(`Error unlinking device from thesis: ${error.message}`);
        }
    }

    async deleteDeviceInFarm(farmId, deviceId) {
        try {
            return await _deleteFromModelByParams(this.DeviceInFarm, removeUndefined({ farmId, deviceId }))
        } catch (error) {
            throw new Error(`Error deleting device from farm: ${error.message}`);
        }
    }

    async deleteDeviceInSector(sectorId, deviceId) {
        try {
            return await _deleteFromModelByParams(this.DeviceInSector, removeUndefined({ sectorId, deviceId }))
        } catch (error) {
            throw new Error(`Error deleting device from sector: ${error.message}`);
        }
    }

    async deleteDeviceInThesis(thesisId, deviceId) {
        try {
            return await _deleteFromModelByParams(this.DeviceInThesis, removeUndefined({ thesisId, deviceId }))
        } catch (error) {
            throw new Error(`Error deleting device from thesis: ${error.message}`);
        }
    }

    async deleteDevice(deviceId) {
        try {
            await _deleteFromModelByParams(this.Device, {
                id: deviceId
            })
        } catch (error) {
            throw new Error(`Error deleting signals associations from device: ${error.message}`);
        }
    }

    async disableDeviceSignals(deviceId, validTo){
        try {
            const [updatedCount, updatedRecords] = await this.DevicesSignals.update(
                {
                    validTo: validTo
                },
                {
                    where: this._getValidityConditions(deviceId, validTo),
                    returning: true
                }
            )
            
            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords.map(record => record.id);
            }
            return null;
        } catch (error) {
            throw new Error(`Error disabling signals from device: ${error.message}`);
        }
    }

    async deleteDeviceSignals(deviceId) {
        try {
            return await _deleteFromModelByParams(this.DevicesSignals, {
                deviceId: deviceId
            })
        } catch (error) {
            throw new Error(`Error deleting signals associations from device: ${error.message}`);
        }
    }

    async getThesisAssociatedDevices(thesisId, timestamp) {
        try {
            const associations = await this.DeviceInThesis.findAll({
                where: {
                    thesisId: thesisId,
                    validFrom: {
                        [Op.lte]: timestamp
                    },
                    [Op.or]: [
                        { validTo: { [Op.gt]: timestamp } },
                        { validTo: null }
                    ]
                },
                include: [{
                    model: this.Device,
                    required: true,
                    as: "device"
                }]
            });

            return associations.map(association => {
                if (association.device) {
                    return association.device.get({ plain: true });
                }
                return null;
            }).filter(s => s !== null);

        } catch (error) {
            throw new Error(`Error while retrieving thesis devices: ${error.message}`);
        }
    }

    async getSectorAssociatedDevices(sectorId, timestamp) {
        try {
            const associations = await this.DeviceInSector.findAll({
                where: {
                    sectorId: sectorId,
                    validFrom: {
                        [Op.lte]: timestamp
                    },
                    [Op.or]: [
                        { validTo: { [Op.gt]: timestamp } },
                        { validTo: null }
                    ]
                },
                include: [{
                    model: this.Device,
                    required: true,
                    as: "device"
                }]
            });

            return associations.map(association => {
                if (association.device) {
                    return association.device.get({ plain: true });
                }
                return null;
            }).filter(s => s !== null);

        } catch (error) {
            throw new Error(`Error while retrieving sectors devices: ${error.message}`);
        }
    }

    async getFarmAssociatedDevices(farmId, timestamp) {
        try {
            const associations = await this.DeviceInFarm.findAll({
                where: {
                    farmId: farmId,
                    validFrom: {
                        [Op.lte]: timestamp
                    },
                    [Op.or]: [
                        { validTo: { [Op.gt]: timestamp } },
                        { validTo: null }
                    ]
                },
                include: [{
                    model: this.Device,
                    required: true,
                    as: "device"
                }]
            });

            return associations.map(association => {
                if (association.device) {
                    return association.device.get({ plain: true });
                }
                return null;
            }).filter(s => s !== null);

        } catch (error) {
            throw new Error(`Error while retrieving farm devices: ${error.message}`);
        }
    }

    async getDevicesByCompany(companyId){
        try {
            return await this.Device.findAll({
                where: {
                    companyId: companyId
                }
            })
        } catch (error) {
            throw new Error(`Error while retrieving farm devices: ${error.message}`)
        }
    }
}

export default DeviceRepository;