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
}

export default DeviceRepository;