import { SignalTargetType } from "../dtos/deviceDto.js";

class DeviceService {
    constructor(deviceRepository, signalRepository){
        this.deviceRepository = deviceRepository;
        this.signalRepository = signalRepository;
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
                idOnProvider: sig.idOnProvider,
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

    async assignSignals(signalAssociation) {
        try {

            if (!signalAssociation.deviceId) {
                throw new Error("deviceId is required");
            }
            if (!signalAssociation.targetId) {
                throw new Error("targetId is required");
            }
            if (!Object.values(SignalTargetType).includes(signalAssociation.targetType)) {
                throw new Error(`Invalid targetType: ${signalAssociation.targetType}`);
            }

            const validFrom = signalAssociation.validFrom ?? Date.now() / 1000;
            const signals = await this.deviceRepository.getSignals(signalAssociation.deviceId);

        
            for (const signal of signals) {
                switch (signalAssociation.targetType) {
                case SignalTargetType.FIELD:
                    return await this.signalRepository.assignSignalToField({
                        signalId: signal.id,
                        fieldId: signalAssociation.targetId,
                        validFrom
                    });
                case SignalTargetType.SECTOR:
                    return await this.signalRepository.assignSignalToSector({
                        signalId: signal.id,
                        sectorId: signalAssociation.targetId,
                        validFrom
                    });
                case SignalTargetType.THESIS:
                    return await this.signalRepository.assignSignalToThesis({
                        signalId: signal.id,
                        thesisId: signalAssociation.targetId,
                        validFrom
                    });
                default:
                    throw new Error("Unknown targetType");
                }
            }
        }catch(error){
            console.error(`Error assigning signal: ${error.message}`);
            throw error; 
        }
    }
}

export default DeviceService;