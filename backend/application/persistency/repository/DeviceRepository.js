class DeviceRepository {
    constructor(models, sequelize) {
        this.Device = models.Device;
        this.Signal = models.Signal;
        this.DevicesSignals = models.DevicesSignals;
        this.sequelize = sequelize;
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
            });

            return device.id;
        } catch (error) {
            throw new Error(`Error creating new device caused by: ${error.message}`);
        }
    }

    async attachSignalsToDevice(deviceId, signalIds, validFrom) {
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
            throw new Error(`Error attaching signals to device caused by: ${error.message}`);
        }
    }

    async getDevice(deviceId, timestamp) {
        const query = `
        SELECT 
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
        JOIN LATERAL (
            SELECT MAX(timestamp) AS measurement_timestamp
            FROM measurements m
            WHERE m.signal_id = ds.signal_id
        ) m ON true
        WHERE ds.device_id = :deviceId
            AND valid_from < :timestamp
            AND COALESCE(valid_to, 'infinity') > :timestamp`


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


    async getSignals(deviceId) {
        const result = await this.Signal.findAll({
            where: {
                deviceId: deviceId
            }
        });
        return result.map(r => r.get({ plain: true }));
    }

    async countDevices(userId, timeFilterFrom, timeFilterTo, providerIds, types) {
        const query = ` SELECT COUNT(DISTINCT ds.device_id) AS total
            FROM devices_signals_denormalized ds
            WHERE valid_from < :timeFilterTo
                AND COALESCE(valid_to, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND provider_id = ANY(ARRAY[:providerIds])" : ""}
                ${types?.length > 0 ? "AND device_type = ANY(ARRAY[:types])" : ""}`

        try {
            const [results] = await this.sequelize.query(query, {
                replacements: { timeFilterFrom, timeFilterTo, providerIds, types },
                type: this.sequelize.QueryTypes.SELECT
            });
            return Number(results.total);
        } catch (error) {
            console.error(`Fail counting devices data: ${error.message}`);
            throw error;
        }
    }

    async getDevices(userId, timeFilterFrom, timeFilterTo, providerIds, types, offset, limit) {
        //TODO user permits filter
        const query = `WITH paginated_devices AS (
            SELECT DISTINCT ds.device_id
            FROM devices_signals_denormalized ds
            WHERE valid_from < :timeFilterTo
                AND COALESCE(valid_to, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND provider_id = ANY(ARRAY[:providerIds])" : ""}
                ${types?.length > 0 ? "AND device_type = ANY(ARRAY[:types])" : ""}
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
                replacements: { timeFilterFrom, timeFilterTo, providerIds, types, offset, limit },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving devices data: ${error.message}`);
            throw error;
        }
    }

    async assignDeviceToField(associationData) {
        try {
            const model = await this.SignalInField.create({
                deviceId: associationData.deviceId,
                fieldId: associationData.fieldId,
                validFrom: associationData.validFrom
            });
            return model.id;
        } catch (error) {
            throw new Error(`Error creating association between signal and field: ${error.message}`);
        }
    }

    async assignDeviceToSector(associationData) {
        try {
            const model = await this.SignalInSector.create({
                deviceId: associationData.deviceId,
                sectorId: associationData.sectorId,
                validFrom: associationData.validFrom
            });
            return model.id;
        } catch (error) {
            throw new Error(`Error creating association between signal and sector: ${error.message}`);
        }
    }

    async assignDeviceToThesis(associationData) {
        try {
            const model = await this.SignalInThesis.create({
                deviceId: associationData.deviceId,
                thesisId: associationData.thesisId,
                validFrom: associationData.validFrom
            });
            return model.id;
        } catch (error) {
            throw new Error(`Error creating association between signal and thesis: ${error.message}`);
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

    async disableDeviceInThesis(deviceId, validTo) {
        try {
            const [updatedCount, updatedRecords] = await this.DeviceInThesis.update(
                { validTo: validTo },
                {
                    where: this._getValidityConditions(deviceId, validTo),
                    returning: true
                }
            );

            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords[0].id;
            }
        } catch (error) {
            throw new Error(`Error disabling device in Thesis: ${error.message}`);
        }
    }

    async disableDeviceInSector(deviceId, validTo) {
        try {
            const [updatedCount, updatedRecords] = await this.DeviceInSector.update(
                { validTo: validTo },
                {
                    where: this._getValidityConditions(deviceId, validTo),
                    returning: true
                }
            );

            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords[0].id;
            }
        } catch (error) {
            throw new Error(`Error disabling device in Sector: ${error.message}`);
        }
    }

    async disableDeviceInField(deviceId, validTo) {
        try {
            const [updatedCount, updatedRecords] = await this.DeviceInField.update(
                { validTo: validTo },
                {
                    where: this._getValidityConditions(deviceId, validTo),
                    returning: true
                }
            );

            if (updatedRecords && updatedRecords.length > 0) {
                return updatedRecords[0].id;
            }
        } catch (error) {
            throw new Error(`Error disabling device in Field: ${error.message}`);
        }
    }

    async getThesisAssociatedSignals(thesisId, timestamp) {
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

    async getFieldAssociatedDevices(fieldId, timestamp) {
        try {
            const associations = await this.DeviceInField.findAll({
                where: {
                    fieldId: fieldId,
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
            throw new Error(`Error while retrieving field devices: ${error.message}`);
        }
    }
}

export default DeviceRepository;