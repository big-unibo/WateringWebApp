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
                location: device.location,
                binningId: device.binningId
            });

            if(!createdDeviceId){
                throw new Error("Device creation failed");
            }
            const signalsToCreate = (device.signals || []).map(sig => ({
                ...sig,
                deviceId: createdDeviceId
            }));

            if (signalsToCreate.length > 0) {
                await this.deviceRepository.createSignals(signalsToCreate);
            }

            return createdDeviceId;
        }catch(error){
            console.error(`Error creating Device with signals: ${error.message}`);
            throw error;
        }
    }

    async assignSignals(signalAssociation) {
        try {

            if (!signalAssociation.sourceId) {
                throw new Error("deviceId is required");
            }
            if (!signalAssociation.targetId) {
                throw new Error("targetId is required");
            }
            if (!Object.values(SignalTargetType).includes(signalAssociation.targetType)) {
                throw new Error(`Invalid targetType: ${signalAssociation.targetType}`);
            }

            const validFrom = signalAssociation.validFrom ?? Date.now() / 1000;
            const signals = await this.deviceRepository.getSignals(signalAssociation.sourceId);

            const assingFunctions = {
                [SignalTargetType.FIELD]: async (args) => await this.signalRepository.assignSignalToField(args),
                [SignalTargetType.SECTOR]: async (args) => await this.signalRepository.assignSignalToSector(args),
                [SignalTargetType.THESIS]: async (args) => await this.signalRepository.assignSignalToThesis(args)
            }
        
            for (const signal of signals) {
                await assingFunctions[signalAssociation.targetType]({
                    signalId: signal.id,
                    [signalAssociation.targetType + "Id"]: signalAssociation.targetId,
                    validFrom
                })
            }
        }catch(error){
            console.error(`Error assigning signal: ${error.message}`);
            throw error; 
        }
    }
}

export default DeviceService;