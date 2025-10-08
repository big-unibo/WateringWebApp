class DeviceService {
    constructor(deviceRepository, signalRepository){
        this.deviceRepository = deviceRepository;
        this.signalRepository = signalRepository
    }

    async createDevice(device){
        try{
            const createdDeviceId = await this.deviceRepository.createDevice({
                type: device.type,
                providerId: device.providerId,
                description: device.description,
                location: device.location
            });

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

    async associateSignal(signalAssociation){
        try{
            switch(signalAssociation.targetType) {
                case SignalTargetType.FIELD:
                    await this.signalRepository.associateSignalToField({
                        signalId: signalAssociation.signalId,
                        fieldId: signalAssociation.targetId,
                        validFrom: signalAssociation.validFrom ?? Date.now() / 1000,
                    });
                    break;
                case SignalTargetType.SECTOR:
                    await this.signalRepository.associateSignalToSector({
                        signalId: signalAssociation.signalId,
                        sectorId: signalAssociation.targetId,
                        validFrom: signalAssociation.validFrom ?? Date.now() / 1000,
                    });
                    break;
                case SignalTargetType.THESIS:
                    await this.signalRepository.associateSignalToThesis({
                        signalId: signalAssociation.signalId,
                        thesisId: signalAssociation.targetId,
                        validFrom: signalAssociation.validFrom ?? Date.now() / 1000,
                    });
                break;
            }
        }catch(error){
            console.error(`Error associating signal: ${error.message}`);
            throw error; 
        }
    }
}

export default DeviceService;