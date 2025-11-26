class DeviceRepository {
    constructor(models, sequelize){
        this.Device = models.Device;
        this.Signal = models.Signal;
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

    async getSignals(deviceId) {
        const result = await this.Signal.findAll({
            where : {
                deviceId : deviceId
            }
        });
        return result.map(r => r.get({ plain: true }));
    }

    async getDevices(userId, timeFilterFrom, timeFilterTo, providerIds, types){
        //TODO user permits filter
        const query = `
            SELECT DISTINCT 
                device_id AS "deviceId",
                device_type AS "deviceType",
                device_description AS "deviceDescription",
                provider_id AS "providerId",
                signal_id AS "signalId",
                signal_description AS "signalDescription",
                signal_type AS "signalType",
                signal_type_description AS "signalTypeDescription",
                measurement_timestamp AS "lastMeasurementTimestamp",
                virtual,
                unit,
                x, y, z
            FROM theses_all_signals ts
            JOIN LATERAL(
                SELECT MAX(timestamp) AS measurement_timestamp
                FROM measurements m
                WHERE m.signal_id = ts.signal_id
            ) m ON true
            WHERE valid_from < :timeFilterTo AND COALESCE(valid_to, 'infinity') > :timeFilterFrom
                ${ providerIds?.length > 0 ? "AND provider_id = ANY(ARRAY[:providerIds])" : "" }
                ${ types?.length > 0 ? "AND device_type = ANY(ARRAY[:types])" : "" }
        `;

        try {
            const results = await this.sequelize.query(query, {
                replacements: { timeFilterFrom, timeFilterTo, providerIds, types },
                type: this.sequelize.QueryTypes.SELECT
            });
            return results;
        } catch (error) {
            console.error(`Fail retrieving devices data: ${error.message}`);
            throw error;
        }
    }
}

export default DeviceRepository;