import { SignalTargetType } from "../dtos/deviceDto.js";
import DtoConverter from './DtoConverter.js';
import PaginationService from "./PaginationService.js";

const dtoConverter = new DtoConverter()
const paginationService = new PaginationService()

class DeviceService {
    constructor(deviceRepository, signalRepository, fieldRepository) {
        this.deviceRepository = deviceRepository;
        this.signalRepository = signalRepository;
        this.fieldRepository = fieldRepository;
    }

    async createDevice(device) {
        try {
            const createdDeviceId = await this.deviceRepository.createDevice({
                type: device.type,
                providerId: device.providerId,
                description: device.description,
                location: device.location,
                binningId: device.binningId
            });

            if (!createdDeviceId) {
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
        } catch (error) {
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
        } catch (error) {
            console.error(`Error assigning signal: ${error.message}`);
            throw error;
        }
    }

    async getDevices(userId, timeFilterFrom, timeFilterTo, providerIds, types, page, itemsPerPage) {

        const devicesCount = await this.deviceRepository.countDevices(userId, timeFilterFrom, timeFilterTo, providerIds, types)
        const paginationMetadata = paginationService.computePaginationMetadata(devicesCount, page, itemsPerPage)

        const offset = (paginationMetadata.page - 1) * paginationMetadata.pageSize;
        const limit = paginationMetadata.pageSize;
        const devices = await this.deviceRepository.getDevices(userId, timeFilterFrom, timeFilterTo, providerIds, types, offset, limit)
        return {
            data: dtoConverter.convertDevicesDataWrapper(devices),
            pagination: paginationMetadata
        }
    }

    async getDevice(deviceId, timestamp) {
        const deviceData = await this.deviceRepository.getDevice(deviceId, timestamp)
        if (Array.isArray(deviceData) && deviceData.length > 0) {
            return dtoConverter.convertDevicesDataWrapper(deviceData)[0]
        }
        return null;
    }

    async getProviders() {
        return await this.deviceRepository.getProviders();
    }

    async disableDevice(deviceId, timestamp) {
        try {
            await this.fieldRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp)

            const device = await this.getDevice(deviceId, timestamp);
            device.signals.forEach(signal => {
                this.signalRepository.disableSignal(signal.signalId, timestamp)
            });
        } catch (error) {
            console.error(`Error disabling device: ${error.message}`);
            throw error;
        }
    }
}

export default DeviceService;