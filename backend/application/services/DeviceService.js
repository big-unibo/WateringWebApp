class DeviceService {
    constructor(deviceRepository){
        this.deviceRepository = deviceRepository;
    }

    async createDevice(device){
        try{
            const createdDeviceId = await this.deviceRepository.createDevice({
                type: device.type,
                providerId: device.providerId,
                description: device.description,
                location: device.location
            });

            console.log(createdDeviceId);

            if(!createdDeviceId){
                throw new Error("Device creation failed");
            }

            const signalsToCreate = (device.signals || []).map(sig => ({
                typeId: sig.typeId,
                description: sig.description,
                x: sig.x,
                y: sig.y,
                z: sig.z,
                virtual: sig.virtual,
                unit: sig.unit,
                deviceId: createdDeviceId
            }));

            if (signalsToCreate.length > 0) {
                await this.deviceRepository.createSignals(signalsToCreate);
            }

        }catch(error){
            console.error(`Error creating Device with signals: ${error.message}`);
            throw error;
        }
    }
}

export default DeviceService;