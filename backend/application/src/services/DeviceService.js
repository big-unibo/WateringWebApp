import { DEVICES_LOG_TABLE, FARMS_DEVICES_LOG_TABLE, SECTORS_DEVICES_LOG_TABLE, SIGNALS_LOG_TABLE, DEVICES_SIGNALS_LOG_TABLE, THESES_DEVICES_LOG_TABLE, OPTIMAL_PROFILES_LOG_TABLE } from "../commons/constants.js";
import { DeviceTargetType } from "../dtos/deviceDto.js";
import DtoConverter from './DtoConverter.js';
import PaginationService from "./PaginationService.js";
import { _updateEntity } from '../commons/entityServiceUtils.js';

const dtoConverter = new DtoConverter()
const paginationService = new PaginationService()

class DeviceService {
    constructor(deviceRepository, signalRepository, thesisRepository, interpolatedProfileRepository, optimalStateRepository, userActionService) {
        this.deviceRepository = deviceRepository;
        this.signalRepository = signalRepository;
        this.thesisRepository = thesisRepository;
        this.userActionService = userActionService;
        this.interpolatedProfileRepository = interpolatedProfileRepository;
        this.optimalStateRepository = optimalStateRepository;
    }

    async createDevice(userId, device) {
        try {
            const createdDeviceId = await this.deviceRepository.createDevice({
                type: device.type,
                description: device.description,
                location: device.location,
                binningId: device.binningId,
                companyId: device.companyId
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

    async connectSignalsToDevice(userId, deviceId, signalIds, validFrom) {
        try {
            if (!await this.deviceRepository.deviceExists(deviceId)) {
                throw new Error(`Device with id ${deviceId} does not exist`)
            }

            if (!(await Promise.all(signalIds.map(id => this.signalRepository.signalExists(id)))).every(Boolean)) {
                throw new Error("One or more signals do not exist");
            }

            const signalDeviceIds = await this.deviceRepository.connectSignalsToDevice(deviceId, signalIds, validFrom)
            if (Array.isArray(signalDeviceIds) && signalDeviceIds.length > 0) {
                await this.userActionService.logCreation(userId, DEVICES_SIGNALS_LOG_TABLE, signalDeviceIds, null)
            }
        } catch (error) {
            console.error(`Error connecting signals to device: ${error.message}`)
            throw error
        }
    }

    async disconnectSignalsFromDevice(userId, deviceId, signalIds, validTo) {
        try {
            if (!await this.deviceRepository.deviceExists(deviceId)) {
                throw new Error(`Device with id ${deviceId} does not exist`)
            }

            if (!(await Promise.all(signalIds.map(id => this.signalRepository.signalExists(id)))).every(Boolean)) {
                throw new Error("One or more signals do not exist");
            }

            const signalDeviceIds = await this.deviceRepository.disconnectSignalsFromDevice(deviceId, signalIds, validTo)
            if (Array.isArray(signalDeviceIds) && signalDeviceIds.length > 0) {
                await this.userActionService.logDisabling(userId, DEVICES_SIGNALS_LOG_TABLE, signalDeviceIds, null)
            }
        } catch (error) {
            console.error(`Error disconnecting signals from device: ${error.message}`)
            throw error
        }
    }

    async deviceExists(deviceId) {
        return await this.deviceRepository.deviceExists(deviceId)
    }

    async linkDevice(userId, deviceAssociation) {
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
                [DeviceTargetType.FARM]: async (args) => await this.deviceRepository.linkDeviceToFarm(args),
                [DeviceTargetType.SECTOR]: async (args) => await this.deviceRepository.linkDeviceToSector(args),
                [DeviceTargetType.THESIS]: async (args) => await this.deviceRepository.linkDeviceToThesis(args)
            }

            const logTables = {
                [DeviceTargetType.FARM]: FARMS_DEVICES_LOG_TABLE,
                [DeviceTargetType.SECTOR]: SECTORS_DEVICES_LOG_TABLE,
                [DeviceTargetType.THESIS]: THESES_DEVICES_LOG_TABLE
            }

            const linkId = await assingFunctions[deviceAssociation.targetType]({
                    deviceId: deviceAssociation.sourceId,
                    [deviceAssociation.targetType.toLowerCase() + "Id"]: deviceAssociation.targetId,
                    validFrom
            })
            await this.userActionService.logCreation(userId, logTables[deviceAssociation.targetType], linkId, null)

        } catch (error) {
            console.error(`Error linking device: ${error.message}`);
            throw error;
        }
    }

    async unlinkDevice(userId, deviceAssociation) {
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

            const validTo = deviceAssociation.validTo ?? Date.now() / 1000;

            const unlinkingFunctions = {
                [DeviceTargetType.FARM]: async (args) => await this.deviceRepository.unlinkDeviceFromFarm(args),
                [DeviceTargetType.SECTOR]: async (args) => await this.deviceRepository.unlinkDeviceFromSector(args),
                [DeviceTargetType.THESIS]: async (args) => await this.deviceRepository.unlinkDeviceFromThesis(args)
            }

            const logTables = {
                [DeviceTargetType.FARM]: FARMS_DEVICES_LOG_TABLE,
                [DeviceTargetType.SECTOR]: SECTORS_DEVICES_LOG_TABLE,
                [DeviceTargetType.THESIS]: THESES_DEVICES_LOG_TABLE
            }

            const linkId = await unlinkingFunctions[deviceAssociation.targetType]({
                    deviceId: deviceAssociation.sourceId,
                    [deviceAssociation.targetType.toLowerCase() + "Id"]: deviceAssociation.targetId,
                    validTo
            })
            await this.userActionService.logDisabling(userId, logTables[deviceAssociation.targetType], linkId, null)

        } catch (error) {
            console.error(`Error unlinking device: ${error.message}`);
            throw error;
        }
    }

    async getDevices(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, types, companyIds, page, itemsPerPage) {

        const devicesCount = await this.deviceRepository.countDevices(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, types, companyIds)
        const paginationMetadata = paginationService.computePaginationMetadata(devicesCount, page, itemsPerPage)

        const offset = (paginationMetadata.page - 1) * paginationMetadata.pageSize;
        const limit = paginationMetadata.pageSize;
        const devices = await this.deviceRepository.getDevices(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, types, companyIds, offset, limit)
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

    async updateDevice(userId, device){
        await _updateEntity(userId, device, this.deviceRepository.updateDevice.bind(this.deviceRepository), this.userActionService, DEVICES_LOG_TABLE)
    }

    async getDeviceAssociations(deviceId, timestamp, userId, isAdmin) {
        const deviceAssociations = await this.deviceRepository.getDeviceAssociationEntries(deviceId, timestamp, userId, isAdmin)
        if (deviceAssociations?.length > 0) {
            return dtoConverter.convertAssociationsEntries(deviceAssociations)
        } 
    } 

    async disableDevice(userId, deviceId, timestamp) {
        try {
            const optimalProfileAssignmentId = await this.optimalStateRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp);
            if (optimalProfileAssignmentId) {
                await this.userActionService.logDisabling(userId, OPTIMAL_PROFILES_LOG_TABLE, optimalProfileAssignmentId, null);
            }


            // 1. Thesis
            const thesisDevId = await this.deviceRepository.unlinkDeviceFromThesis({deviceId: deviceId, validTo: timestamp, thesisId: "ALL"});
            if (thesisDevId) {
                await this.userActionService.logDisabling(userId, THESES_DEVICES_LOG_TABLE, thesisDevId, null);
            }

            // 2. Sector
            const sectorDevId = await this.deviceRepository.unlinkDeviceFromSector({deviceId: deviceId, validTo: timestamp, sectorId: "ALL"});
            if (sectorDevId) {
                await this.userActionService.logDisabling(userId, SECTORS_DEVICES_LOG_TABLE, sectorDevId, null);
            }

            // 3. Farm
            const farmDevId = await this.deviceRepository.unlinkDeviceFromFarm({deviceId: deviceId, validTo: timestamp, farmId: "ALL"});
            if (farmDevId) {
                await this.userActionService.logDisabling(userId, FARMS_DEVICES_LOG_TABLE, farmDevId, null);
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

    async deleteDevice(userId, deviceId) {
        try {
            const signalIds = (await this.getDevice(deviceId))?.signals?.map(signal => signal.id)
            const signalsToDelete = []
            for(const signalId of signalIds){
                const deviceIds = new Set((await this.signalRepository.getSignalInfo(signalId, Date.now()/1000)).map(s=> s.deviceId))
                if(deviceIds.size === 1 && deviceIds.has(deviceId)) {
                    signalsToDelete.push(signalId)              
                }
            }


            const signalDeviceIds = await this.deviceRepository.deleteDeviceSignals(deviceId);
            if (Array.isArray(signalDeviceIds) && signalDeviceIds.length > 0) {
                await this.userActionService.logDeletion(userId, DEVICES_SIGNALS_LOG_TABLE, signalDeviceIds);
            }

            await Promise.all(signalsToDelete.map(async id => await this.signalRepository.deleteSignal(id)))
            await this.userActionService.logDeletion(userId, SIGNALS_LOG_TABLE, signalsToDelete, null)

            const thesisDevId = await this.deviceRepository.deleteDeviceInThesis(deviceId);
            if (thesisDevId) {
                await this.userActionService.logDeletion(userId, THESES_DEVICES_LOG_TABLE, thesisDevId, null);
            }
            const sectorDevId = await this.deviceRepository.deleteDeviceInSector(deviceId);
            if (sectorDevId) {
                await this.userActionService.logDeletion(userId, SECTORS_DEVICES_LOG_TABLE, sectorDevId, null);
            }
            const farmDevId = await this.deviceRepository.deleteDeviceInFarm(deviceId);
            if (farmDevId) {
                await this.userActionService.logDeletion(userId, FARMS_DEVICES_LOG_TABLE, farmDevId, null);
            }
            await this.interpolatedProfileRepository.deleteInterpolatedProfiles(deviceId)

            const gridAssigmentId = await this.optimalStateRepository.deleteGridOptimalProfileAssignments(deviceId)
            if (gridAssigmentId) {
                await this.userActionService.logDeletion(userId, OPTIMAL_PROFILES_LOG_TABLE, gridAssigmentId)
            }

            await this.deviceRepository.deleteDevice(deviceId)
            await this.userActionService.logDeletion(userId, DEVICES_LOG_TABLE, deviceId)
            
         } catch (error) {
            console.error(`Error deleting device: ${error.message}`);
            throw error;
        }
    }

}

export default DeviceService;