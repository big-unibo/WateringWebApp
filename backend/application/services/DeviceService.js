import { DEVICES_LOG_TABLE, FIELDS_SIGNALS_LOG_TABLE, SECTORS_SIGNALS_LOG_TABLE, SIGNALS_LOG_TABLE, THESES_SIGNALS_LOG_TABLE } from "../commons/constants.js";
import { SignalTargetType } from "../dtos/signalDto.js";
import DtoConverter from './DtoConverter.js';
import PaginationService from "./PaginationService.js";

const dtoConverter = new DtoConverter()
const paginationService = new PaginationService()

class DeviceService {
    constructor(deviceRepository, signalRepository, fieldRepository, userActionService) {
        this.deviceRepository = deviceRepository;
        this.signalRepository = signalRepository;
        this.fieldRepository = fieldRepository;
        this.userActionService = userActionService;
    }

    async createDevice(userId, device) {
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
            await this.userActionService.logCreation(userId, DEVICES_LOG_TABLE, createdDeviceId, null);

            const signalsToCreate = (device.signals || []).map(sig => ({
                ...sig,
                deviceId: createdDeviceId
            }));

            if (signalsToCreate.length > 0) {
                const signalsIds = await this.signalRepository.createSignals(createdDeviceId, signalsToCreate);
                if (Array.isArray(signalsIds) && signalsIds.length > 0) {
                    const logPromises = signalsIds.map(id =>
                        this.userActionService.logCreation(userId, SIGNALS_LOG_TABLE, id, null)
                    );
                    await Promise.all(logPromises);
                }
                return {
                    deviceId: createdDeviceId,
                    signalsIds: signalsIds
                }
            }
            return {
                deviceId: createdDeviceId,
                signalsIds: []
            }
        } catch (error) {
            console.error(`Error creating Device with signals: ${error.message}`);
            throw error;
        }
    }

    async assignSignals(userId, signalAssociation) {
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
                [SignalTargetType.FIELD]: async (args) => await this.signalRepository.assignSignalToField(userId, args),
                [SignalTargetType.SECTOR]: async (args) => await this.signalRepository.assignSignalToSector(userId, args),
                [SignalTargetType.THESIS]: async (args) => await this.signalRepository.assignSignalToThesis(userId, args)
            }

            const logTables = {
                [SignalTargetType.FIELD]: FIELDS_SIGNALS_LOG_TABLE,
                [SignalTargetType.SECTOR]: SECTORS_SIGNALS_LOG_TABLE,
                [SignalTargetType.THESIS]: THESES_SIGNALS_LOG_TABLE
            }

            for (const signal of signals) {
                const assignmentId = await assingFunctions[signalAssociation.targetType]({
                    signalId: signal.id,
                    [signalAssociation.targetType + "Id"]: signalAssociation.targetId,
                    validFrom
                })
                await this.userActionService.logCreation(userId, logTables[signalAssociation.targetType], assignmentId, null)
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

    async disableDevice(userId, deviceId, timestamp) {
        try {
            const optimalProfileAssignmentId = await this.fieldRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp);
            if (optimalProfileAssignmentId) {
                await this.userActionService.logDisabling(userId, OPTIMAL_PROFILES_LOG_TABLE, optimalProfileAssignmentId, null);
            }

            const device = await this.getDevice(deviceId, timestamp);
            await Promise.all(device.signals.map(async (signal) => {

                // 1. Thesis
                const thesisSigId = await this.signalsRepository.disableSignalInThesis(signal.signalId, timestamp);
                if (thesisSigId) {
                    await this.userActionService.logDisabling(userId, THESES_SIGNALS_LOG_TABLE, thesisSigId, null);
                }

                // 2. Sector
                const sectorSigId = await this.signalsRepository.disableSignalInSector(signal.signalId, timestamp);
                if (sectorSigId) {
                    await this.userActionService.logDisabling(userId, SECTORS_SIGNALS_LOG_TABLE, sectorSigId, null);
                }

                // 3. Field
                const fieldSigId = await this.signalsRepository.disableSignalInField(signal.signalId, timestamp);
                if (fieldSigId) {
                    await this.userActionService.logDisabling(userId, FIELDS_SIGNALS_LOG_TABLE, fieldSigId, null);
                }
            }));

        } catch (error) {
            console.error(`Error disabling device: ${error.message}`);
            throw error;
        }
    }
}

export default DeviceService;