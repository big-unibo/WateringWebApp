class DeviceRepository {
    constructor(models, sequelize){
        this.Device = models.Device;
        this.Signal = models.Signal;
        this.sequelize = sequelize;
    }
    
    /**
     * Create a new Device
     * @param {Object} deviceData - Data for the device
     * @param {string} deviceData.type - Type of the device
     * @param {number} deviceData.providerId - Provider ID
     * @param {string} [deviceData.description] - Optional description
     * @param {Object} deviceData.location - GeoJSON location
     * @returns {number} Id of the created device instance
     */
    async createDevice(deviceData) {
        try {
            const device = await this.Device.create({
                type: deviceData.type,
                providerId: deviceData.providerId,
                description: deviceData.description,
                location: deviceData.location
            });

            console.log(device);

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
}

export default DeviceRepository;