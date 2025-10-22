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

    /**
     * Bulk create signals for a device
     * @param {Array<Object>} signalsData - List of signals
     */
    async createSignals(signalsData = []) {
        try {
            if (!Array.isArray(signalsData) || signalsData.length === 0) {
                return []; 
            }

            console.log(signalsData);
            await this.Signal.bulkCreate(signalsData);
        } catch (error) {
            throw new Error(`Error creating signals caused by: ${error.message}`);
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
}

export default DeviceRepository;