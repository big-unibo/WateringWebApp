import { DEVICES_LOG_TABLE, FIELDS_DEVICES_LOG_TABLE, SECTORS_DEVICES_LOG_TABLE, DEVICES_SIGNALS_LOG_TABLE, THESES_DEVICES_LOG_TABLE } from "../commons/constants.js";
import { DeviceTargetType } from "../dtos/deviceDto.js";
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
                description: device.description,
                location: device.location,
                binningId: device.binningId
            });

            if (!createdDeviceId) {
                throw new Error("Device creation failed");
            }
            await this.userActionService.logCreation(userId, DEVICES_LOG_TABLE, createdDeviceId, null);
            return createdDeviceId

        } catch (error) {
            console.error(`Error creating device: ${error.message}`)
            throw error
        }
    }

    async attachSignalsToDevice(userId, deviceId, signalIds, validFrom) {
        try {
            if (!await this.deviceRepository.deviceExists(deviceId)) {
                throw new Error(`Device with id ${deviceId} does not exist`)
            }

            if (!(await Promise.all(signalIds.map(id => this.signalRepository.signalExists(id)))).every(Boolean)) {
                throw new Error("One or more signals do not exist");
            }

            const signalDeviceIds = await this.deviceRepository.attachSignalsToDevice(deviceId, signalIds, validFrom)
            if (Array.isArray(signalDeviceIds) && signalDeviceIds.length > 0) {
                await this.userActionService.logCreation(userId, DEVICES_SIGNALS_LOG_TABLE, signalDeviceIds, null)
            }
        } catch (error) {
            console.error(`Error attaching signals to device: ${error.message}`)
            throw error
        }
    }

    async deviceExists(deviceId) {
        return await this.deviceRepository.deviceExists(deviceId)
    }

    async assignDevice(userId, deviceAssociation) {
        try {

            if (!deviceAssociation.sourceId) {
                throw new Error("deviceId is required");
            }
            if (!deviceAssociation.targetId) {
                throw new Error("targetId is required");
            }
            if (!Object.values(DeviceTargetType).includes(deviceAssociation.targetType)) {
                throw new Error(`Invalid targetType: ${deviceAssociation.targetType}`);
            }

            const validFrom = deviceAssociation.validFrom ?? Date.now() / 1000;

            const assingFunctions = {
                [SignalTargetType.FIELD]: async (args) => await this.deviceRepository.assignDeviceToField(args),
                [SignalTargetType.SECTOR]: async (args) => await this.deviceRepository.assignDeviceToSector(args),
                [SignalTargetType.THESIS]: async (args) => await this.deviceRepository.assignDeviceToThesis(args)
            }

            const logTables = {
                [SignalTargetType.FIELD]: FIELDS_DEVICES_LOG_TABLE,
                [SignalTargetType.SECTOR]: SECTORS_DEVICES_LOG_TABLE,
                [SignalTargetType.THESIS]: THESES_DEVICES_LOG_TABLE
            }

            const assignmentId = await assingFunctions[deviceAssociation.targetType]({
                    deviceId: deviceAssociation.deviceId,
                    [deviceAssociation.targetType + "Id"]: deviceAssociation.targetId,
                    validFrom
            })
            await this.userActionService.logCreation(userId, logTables[deviceAssociation.targetType], assignmentId, null)

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
    }

    async disableDevice(userId, deviceId, timestamp) {
        try {
            const optimalProfileAssignmentId = await this.fieldRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp);
            if (optimalProfileAssignmentId) {
                await this.userActionService.logDisabling(userId, OPTIMAL_PROFILES_LOG_TABLE, optimalProfileAssignmentId, null);
            }


            // 1. Thesis
            const thesisSigId = await this.deviceRepository.disableDeviceInThesis(deviceId, timestamp);
            if (thesisSigId) {
                await this.userActionService.logDisabling(userId, THESES_DEVICES_LOG_TABLE, thesisSigId, null);
            }

            // 2. Sector
            const sectorSigId = await this.deviceRepository.disableDeviceInSector(deviceId, timestamp);
            if (sectorSigId) {
                await this.userActionService.logDisabling(userId, SECTORS_DEVICES_LOG_TABLE, sectorSigId, null);
            }

            // 3. Field
            const fieldSigId = await this.deviceRepository.disableDeviceInField(deviceId, timestamp);
            if (fieldSigId) {
                await this.userActionService.logDisabling(userId, FIELDS_DEVICES_LOG_TABLE, fieldSigId, null);
            }

            const signalDeviceIds = await this.deviceRepository.disableDeviceSignals(deviceId, timestamp);
            if (Array.isArray(signalDeviceIds) && signalDeviceIds.length > 0) {
                await this.userActionService.logDisabling(userId, DEVICES_SIGNALS_LOG_TABLE, signalDeviceIds, null);
            }

        } catch (error) {
            console.error(`Error disabling device: ${error.message}`);
            throw error;
        }
    }
}

export default DeviceService;