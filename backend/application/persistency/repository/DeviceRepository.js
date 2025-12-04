class DeviceRepository {
    constructor(models, sequelize) {
        this.Device = models.Device;
        this.Signal = models.Signal;
        this.Provider = models.Provider;
        this.sequelize = sequelize;
    }

    async createDevice(deviceData) {
        try {
            const device = await this.Device.create({
                type: deviceData.type,
                providerId: deviceData.providerId,
                description: deviceData.description,
                location: deviceData.location,
                binningId: deviceData.binningId,
            });

            return device.id;
        } catch (error) {
            throw new Error(`Error creating new device caused by: ${error.message}`);
        }
    }

    async getDevice(deviceId, timestamp) {
        const query = `
        SELECT 
            ts.device_id AS "deviceId",
            ts.device_type AS "deviceType",
            ts.device_description AS "deviceDescription",
            ts.provider_id AS "providerId",
            ts.signal_id_on_provider AS "idOnProvider",
            ts.signal_id AS "signalId",
            ts.signal_description AS "signalDescription",
            ts.signal_type AS "signalType",
            ts.signal_type_description AS "signalTypeDescription",
            m.measurement_timestamp AS "lastMeasurementTimestamp",
            ts.virtual,
            ts.unit,
            ts.x, ts.y, ts.z
        FROM theses_all_signals ts
        JOIN LATERAL (
            SELECT MAX(timestamp) AS measurement_timestamp
            FROM measurements m
            WHERE m.signal_id = ts.signal_id
        ) m ON true
        WHERE ts.device_id = :deviceId
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
        const query = ` SELECT COUNT(DISTINCT ts.device_id) AS total
            FROM theses_all_signals ts
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
            SELECT DISTINCT ts.device_id
            FROM theses_all_signals ts
            WHERE valid_from < :timeFilterTo
                AND COALESCE(valid_to, 'infinity') > :timeFilterFrom
                ${providerIds?.length > 0 ? "AND provider_id = ANY(ARRAY[:providerIds])" : ""}
                ${types?.length > 0 ? "AND device_type = ANY(ARRAY[:types])" : ""}
            ORDER BY ts.device_id
            LIMIT :limit
            OFFSET :offset
        )
        SELECT 
            ts.device_id AS "deviceId",
            ts.device_type AS "deviceType",
            ts.device_description AS "deviceDescription",
            ts.provider_id AS "providerId",
            ts.signal_id_on_provider AS "idOnProvider",
            ts.signal_id AS "signalId",
            ts.signal_description AS "signalDescription",
            ts.signal_type AS "signalType",
            ts.signal_type_description AS "signalTypeDescription",
            m.measurement_timestamp AS "lastMeasurementTimestamp",
            ts.virtual,
            ts.unit,
            ts.x, ts.y, ts.z
        FROM theses_all_signals ts
        JOIN paginated_devices pd ON pd.device_id = ts.device_id
        JOIN LATERAL (
            SELECT MAX(timestamp) AS measurement_timestamp
            FROM measurements m
            WHERE m.signal_id = ts.signal_id
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

    async getProviders() {
        try {
            const providers = await this.Provider.findAll();
            return providers
        } catch {
            throw new Error(`Error while retrieving providers data caused by: ${error.message}`);
        }
    }
}

export default DeviceRepository;