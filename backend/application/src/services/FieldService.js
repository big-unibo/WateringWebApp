import { TABLES } from '../commons/constants.js';
import { OptimalStateData } from '../dtos/optStateDto.js';
import DtoConverter from './DtoConverter.js';
import { _updateEntity } from '../commons/entityServiceUtils.js';

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30

class FieldService {

    constructor(companyRepository, farmRepository, sectorRepository, thesisRepository, thesesAllSignalsRepository, interpolatedProfileRepository, humidityBinsRepository, optimalDistanceRepository, wateringAdviceRepository, deviceRepository, wateringScheduleRepository, optimalStateRepository, sectorServiceRepository, sectorServicesService, userActionService) {
        this.farmRepository = farmRepository
        this.companyRepository = companyRepository
        this.sectorRepository = sectorRepository
        this.thesisRepository = thesisRepository
        this.thesesAllSignalsRepository = thesesAllSignalsRepository
        this.interpolatedProfileRepository = interpolatedProfileRepository
        this.humidityBinsRepository = humidityBinsRepository
        this.optimalDistanceRepository = optimalDistanceRepository
        this.wateringAdviceRepository = wateringAdviceRepository
        this.deviceRepository = deviceRepository
        this.wateringScheduleRepository = wateringScheduleRepository
        this.optimalStateRepository = optimalStateRepository
        this.sectorServiceRepository = sectorServiceRepository
        this.sectorServicesService = sectorServicesService
        this.userActionService = userActionService
    }

    async thesisExists(thesisId) {
        return await this.thesisRepository.thesisExists(thesisId)
    }

    async farmExists(farmId) {
        return await this.farmRepository.farmExists(farmId)
    }

    async sectorExists(sectorId) {
        return await this.sectorRepository.sectorExists(sectorId)
    }

    async createFarm(userId, farm) {
        try {
            const farmCreated = await this.farmRepository.createFarm(farm.name, farm.companyId, farm.location);
            const farmId = farmCreated.id;
            if (farmId) {
                this.userActionService.logCreation(userId, TABLES.FARM, farmId, null)
                return farmId
            }
        } catch (error) {
            console.error(`Error creating farm ${farm.name}: ${error.message}`);
            throw error;
        }
    }

    async updateFarm(userId, farm){
        await _updateEntity(userId, farm, this.farmRepository.updateFarm.bind(this.farmRepository), this.userActionService, TABLES.FARM)
    }

    async getFarms(filteringIds) {
        const result = await this.farmRepository.getFarms(filteringIds);
        return dtoConverter.convertFarms(result);
    }


    async createSector(userId, sector) {
        try {
            const sectorCreated = await this.sectorRepository.createSector(sector);

            const sectorId = sectorCreated.id;
            if (sectorId) {
                this.userActionService.logCreation(userId, TABLES.SECTOR, sectorId, null)
                return sectorId
            }
        } catch (error) {
            console.error(`Error creating sector ${sector.name}: ${error.message}`);
            throw error;
        }
    }

    async updateSector(userId, sector){
        await _updateEntity(userId, sector, this.sectorRepository.updateSector.bind(this.sectorRepository), this.userActionService, TABLES.SECTOR)
    }

    async getSectorOwner(sectorId) {
        const result = await this.sectorRepository.getSectorDetails(sectorId, Date.now() / 1000);

        if (!result || !result.farm || !result.farm.company) {
            throw new Error(`Company not found for sector ${sectorId}`);
        }
        return dtoConverter.convertCompany(result.farm.company);
    }

    async createThesis(userId, thesis) {
        const newThesisId = await this.thesisRepository.createThesis(thesis.name);
        if (!newThesisId) {
            throw Error("Impossible to create thesis")
        }
        await this.userActionService.logCreation(userId, TABLES.THESIS, newThesisId, null);
        const assignmentId = await this.thesisRepository.assignThesisToSector(newThesisId, thesis.sectorId, undefined, thesis.validFrom || Math.floor(Date.now() / 1000));
        await this.userActionService.logCreation(userId, TABLES.THESIS_IN_SECTOR, assignmentId, null);
        return newThesisId;
    }

    async updateThesis(userId, thesis){
        await _updateEntity(userId, thesis, this.thesisRepository.updateThesis.bind(this.thesisRepository), this.userActionService, TABLES.THESIS)
    }

    async getFarmDetails(farmId, userId, isAdmin) {
        const result = await this.farmRepository.getFarmDetails(farmId, userId, isAdmin);
        return dtoConverter.convertFarmDataWrapper(result);
    }

    async getMeasurementsByThesis(thesisId, signalTypes, timeFilterFrom, timeFilterTo, aggregationType, aggregationPeriod = null) {

        const period = aggregationPeriod ?? this.getDefaultAggregationPeriod(timeFilterFrom, timeFilterTo);

        const result = await this.thesesAllSignalsRepository.getMeasurementsByThesis(
            thesisId,
            signalTypes,
            timeFilterFrom,
            timeFilterTo,
            aggregationType,
            period
        );

        return dtoConverter.convertMeasurementsDataWrapper(result);
    }

    getDefaultAggregationPeriod(timeFilterFrom, timeFilterTo) {
        const requestPeriod = timeFilterTo - timeFilterFrom;

        const rules = [
            { limit: 3 * MONTH_TO_SECONDS, period: 24 * 60 * MINUTE_TO_SECONDS },  //Over 3 months -> 1 day
            { limit: 1.5 * MONTH_TO_SECONDS, period: 12 * 60 * MINUTE_TO_SECONDS }, //Over 1.5 months -> 12 hours
            { limit: 14 * 24 * 60 * MINUTE_TO_SECONDS, period: 3 * 60 * MINUTE_TO_SECONDS }, // Over 2 weeks-> 3 hours
            { limit: 3 * 24 * 60 * MINUTE_TO_SECONDS, period: 60 * MINUTE_TO_SECONDS } // Over 3 days -> 1 hour
        ];
        const rule = rules.find(r => requestPeriod > r.limit);

        return rule?.period ?? MINUTE_TO_SECONDS; // default: 1 minute
    }

    async getHeatmapByThesis(thesisId, timeFilterFrom, timeFilterTo) {
        const result = await this.interpolatedProfileRepository.getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertHeatmapDataWrapper(result);
    }

    async getHumidityBinsByThesis(thesisId, timeFilterFrom, timeFilterTo) {
        const result = await this.humidityBinsRepository.getHumidityBins(thesisId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertHumidityBinsDataWrapper(result);
    }

    async getWaterAggregateByThesis(thesisId, timeFilterFrom, timeFilterTo) {
        const advicesAndExpectedWater = await this.thesesAllSignalsRepository.getAdvicesAndExpectedWaterByThesis(thesisId, timeFilterFrom, timeFilterTo, 24 * 60 * MINUTE_TO_SECONDS);
        const measurementsEt0 = await this.thesesAllSignalsRepository.getMeasurementsByThesis(
            thesisId,
            ['ET0'],
            timeFilterFrom,
            timeFilterTo,
            'SUM',
            24 * 60 * MINUTE_TO_SECONDS
        );

        measurementsEt0.forEach(m => {
            m.value = -Math.abs(Number(m.value));
        });

        const measurements = await this.thesesAllSignalsRepository.getMeasurementsByThesis(
            thesisId,
            ['DRIPPER', 'SPRINKLER', 'PLUV_CURR'],
            timeFilterFrom,
            timeFilterTo,
            'SUM',
            24 * 60 * MINUTE_TO_SECONDS
        );

        return dtoConverter.convertMeasurementsDataWrapper([...advicesAndExpectedWater, ...measurements, ...measurementsEt0]);
    }


    async getSectors(filteringIds, timeFilterFrom, timeFilterTo) {
        const result = await this.sectorRepository.getSectors(filteringIds, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertSectorsDataWrapper(result);
    }

    async getSectorDetails(sectorId, timestamp) {
        const result = await this.sectorRepository.getSectorDetails(sectorId, timestamp);
        return dtoConverter.convertSectorDataWrapper(result);
    }

    async getThesisDetails(thesisId, timestamp) {
        const result = await this.thesisRepository.getThesisDetails(thesisId, timestamp)
        if (result) {
            return dtoConverter.convertThesisDataWrapper(result)
        }
    }

    async getDevicesByThesis(thesisId, timestamp, deviceTypes, includeAnchestors) {
        const result = await this.thesesAllSignalsRepository.getDevicesByThesis(thesisId, timestamp, deviceTypes, includeAnchestors);
        return dtoConverter.convertDevicesDataWrapper(result);
    }

    async getDevicesBySector(sectorId, timestamp, deviceTypes, includeAnchestors, includeDescendants) {
        const result = await this.thesesAllSignalsRepository.getDevicesBySector(sectorId, timestamp, deviceTypes, includeAnchestors, includeDescendants);
        return dtoConverter.convertDevicesDataWrapper(result);
    }

    async getDevicesByFarm(farmId, timestamp, deviceTypes, includeDescendants, userId, isAdmin){
        const result = await this.thesesAllSignalsRepository.getDevicesByFarm(farmId, timestamp, deviceTypes, includeDescendants, userId, isAdmin);
        return dtoConverter.convertDevicesDataWrapper(result);
    }

    async getBinningInfo(binningId) {
        return dtoConverter.convertBinningInfoWrapper(await this.humidityBinsRepository.getBinningInfo(binningId))?.[0];
    }

    async getAllBinningInfo() {
        try {
            const result = await this.humidityBinsRepository.getBinningInfo();
            return dtoConverter.convertBinningInfoWrapper(result);
        } catch (error) {
            console.error(`Error retrieving binning info: ${error.message}`);
            throw error;
        }
    }

    async getSignalsByThesis(thesisId, timestamp, signalTypes) {
        const result = await this.thesesAllSignalsRepository.getSignalsByThesis(thesisId, timestamp, signalTypes);
        return dtoConverter.convertSignalsDataWrapper(result);
    }

    async getPunctualDistance(thesisId, timestamp) {
        const result = await this.optimalDistanceRepository.findPunctualDistance(thesisId, timestamp);
        return dtoConverter.convertPunctualDistanceWrapper(result);
    }

    async getOptimalState(thesisId, timestamp) {
        const result = await this.thesisRepository.getOptimalState(thesisId, timestamp)
        if (result.length > 0) {
            return dtoConverter.convertOptimalStateWrapper(result)
        }
        return new OptimalStateData(undefined, undefined, undefined, undefined, undefined, undefined, undefined, [])
    }

    async getOptimalDistanceData(thesisId, timeFilterFrom, timeFilterTo) {
        const result = await this.optimalDistanceRepository.findOptimalDistance(thesisId, timeFilterFrom, timeFilterTo)
        return dtoConverter.convertOptimalDistanceWrapper(result)
    }

    async getInterpolatedMeans(thesisId, timeFilterFrom, timeFilterTo) {
        const result = await this.interpolatedProfileRepository.getInterpolatedMeans(thesisId, timeFilterFrom, timeFilterTo)
        return dtoConverter.convertInterpolatedMeansWrapper(result)
    }

    async findThesisPoints(gridId) {
        return this.interpolatedProfileRepository.findThesisPoints(gridId)
    }

    async createMatrixOptimalState(userId, gridOptimalProfiles) {
        const matrixData = await this.optimalStateRepository.createMatrixOptimalState(
            gridOptimalProfiles.gridId,
            gridOptimalProfiles.validFrom,
            gridOptimalProfiles.validTo,
            gridOptimalProfiles.stopPercentage,
            gridOptimalProfiles.optimalDryBound,
            gridOptimalProfiles.optimalWetBound,
        )

        if (!matrixData.matrixId || !matrixData.optimalProfileAssignmentId) {
            throw Error("Impossible to create optimal matrix for this thesis")
        }
        const matrixId = matrixData.matrixId

        for (const optimalProfile of gridOptimalProfiles.optimalState) {
            await this.optimalStateRepository.createOptimalProfileCell(matrixId, optimalProfile.x, optimalProfile.y, optimalProfile.z, optimalProfile.value, optimalProfile.weight)
        }
        await this.userActionService.logCreation(userId, TABLES.OPTIMAL_PROFILE, matrixData.optimalProfileAssignmentId, null)
        return matrixData.optimalProfileAssignmentId
    }

    async setOptimalState(userId, gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId) {
        const matrixData = await this.optimalStateRepository.createMatrixOptimalState(gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId)
        if (!matrixData.matrixId || !matrixData.optimalProfileAssignmentId) {
            throw Error("Impossible to create optimal matrix for this thesis")
        }
        await this.userActionService.logCreation(userId, TABLES.OPTIMAL_PROFILE, matrixData.optimalProfileAssignmentId, null)
        return matrixData.optimalProfileAssignmentId
    }

    async getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo) {
        return await this.interpolatedProfileRepository.getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo);
    }

    async setThesesContributions(userId, sectorId, thesesContributions, validFrom, validTo) {
        const thesesIds = new Set((await this.getSectorDetails(sectorId, validFrom)).theses.map(t => t.id))
        const paramThesisIds = new Set(thesesContributions.map(t => t.id))

        //Find invalid params (present in params but NOT in DB)
        const invalidParams = [...paramThesisIds].filter(id => !thesesIds.has(id));
        if (invalidParams.length > 0) {
            throw new Error(`Invalid thesis IDs: ${invalidParams.join(", ")}`);
        }

        await thesesContributions.forEach(async t => {
            const sectorAssignmentsIds = await this.thesisRepository.disableThesisInSector(sectorId, t.id, validFrom)
            if (sectorAssignmentsIds) {
                await this.userActionService.logDisabling(userId, TABLES.THESIS_IN_SECTOR, sectorAssignmentsIds, null);
            }

            const assignmentId = await this.sectorRepository.assignThesisToSector(t.id, sectorId, t.weight, validFrom, validTo)
            if (assignmentId) {
                await this.userActionService.logCreation(userId, TABLES.THESIS_IN_SECTOR, assignmentId, null);
            }
        })
        await [...thesesIds].filter(id => !paramThesisIds.has(id)).forEach(async id => {
            const sectorAssignmentsIds = await this.thesisRepository.disableThesisInSector(sectorId, id, validFrom)
            if (sectorAssignmentsIds) {
                await this.userActionService.logDisabling(userId, TABLES.THESIS_IN_SECTOR, sectorAssignmentsIds, null);
            }
            const assignmentId = await this.thesisRepository.assignThesisToSector(id, sectorId, 0, validFrom, validTo)
            if (assignmentId) {
                await this.userActionService.logCreation(userId, TABLES.THESIS_IN_SECTOR, assignmentId, null);
            }
        })
    }

    async disableThesis(userId, thesisId, timestamp) {
        try {
            // const deviceId = await this.thesesAllSignalsRepository.getGridDeviceByThesis(thesisId, timestamp, timestamp)
            // const optimalProfileAssignmentId = await this.optimalStateRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp)
            // if (optimalProfileAssignmentId) {
            //     this.userActionService.logDisabling(userId, TABLES.OPTIMAL_PROFILE, optimalProfileAssignmentId, null)
            // }
            const algorithmId = await this.wateringAdviceRepository.setWateringAlgorithmParamsEndDate(thesisId, timestamp)
            if (algorithmId) {
                this.userActionService.logDisabling(userId, TABLES.WATERING_ALGORITHM, algorithmId)
            }

            const devices = await this.deviceRepository.getThesisAssociatedDevices(thesisId, timestamp)
            await Promise.all(devices.map(async (device) => {
                const deviceAssignmentId = await this.deviceRepository.unlinkDeviceFromThesis({thesisId: thesisId, deviceId: device.id, validTo: timestamp});
                if (deviceAssignmentId) {
                    await this.userActionService.logDisabling(userId, TABLES.THESIS_DEVICE, deviceAssignmentId);
                }
            }));

            const sectorAssignmentsIds = await this.thesisRepository.disableThesisFromSectors(thesisId, timestamp)
            if (sectorAssignmentsIds) {
                await this.userActionService.logDisabling(userId, TABLES.THESIS_IN_SECTOR, sectorAssignmentsIds);
            }

            await this.thesisRepository.disableThesis(thesisId, timestamp)
            await this.userActionService.logDisabling(userId, TABLES.THESIS, thesisId);
        } catch (error) {
            console.error(`Error disabling Thesis: ${error.message}`);
            throw error;
        }
    }

    async deleteThesis(userId, thesisId) {
        try {
            const algorithmParamsIds = await this.wateringAdviceRepository.deleteWateringAlgorithmParams(thesisId);
            if (algorithmParamsIds) {
                await this.userActionService.logDeletion(userId, TABLES.WATERING_ALGORITHM, algorithmParamsIds);
            }
            await this.wateringAdviceRepository.deleteWateringAdvices(thesisId);

            const thesisDevId = await this.deviceRepository.deleteDeviceInThesis(thesisId);
            if (thesisDevId) {
                await this.userActionService.logDeletion(userId, TABLES.THESIS_DEVICE, thesisDevId);
            }
            const sectorAssignmentsIds = await this.thesisRepository.deleteThesisFromSectors(thesisId)
            if (sectorAssignmentsIds) {
                await this.userActionService.logDeletion(userId, TABLES.THESIS_IN_SECTOR, sectorAssignmentsIds);
            }

            await this.thesisRepository.deleteThesis(thesisId)
            await this.userActionService.logDeletion(userId, TABLES.THESIS, thesisId)

        } catch (error) {
            console.error(`Error deleting thesis: ${error.message}`);
            throw error;
        }
    }


    async disableSector(userId, sectorId, timestamp) {
        try {
            //Devices disabling
            const devices = await this.deviceRepository.getSectorAssociatedDevices(sectorId, timestamp);
            await Promise.all(devices.map(async (device) => {
                const deviceAssignmentId = await this.deviceRepository.unlinkDeviceFromSector({sectorId: sectorId, deviceId: device.id, validTo: timestamp});
                if (deviceAssignmentId) {
                    await this.userActionService.logDisabling(userId, TABLES.SECTOR_DEVICE, deviceAssignmentId, null);
                }
            }));

            //Thesis disabling
            const sectorData = await this.getSectorDetails(sectorId, timestamp);
            if (sectorData && sectorData.theses && Array.isArray(sectorData.theses)) {
                await Promise.all(sectorData.theses.map(async thesis =>
                    await this.disableThesis(userId, thesis.id, timestamp)
                ));
            }
            const sectorServices = await this.sectorServicesService.getSectorServices(sectorId, timestamp, 9999999999)
            console.log("Sector services to disable: ", sectorServices)
            if (Array.isArray(sectorServices)) {
                await Promise.all(sectorServices.map(async service => {
                    console.log(`Disabling service ${service.name} in sector ${sectorId}`)
                    await this.sectorServicesService.disableSectorService(userId, sectorId, service.id, timestamp);
                }))
            }

            //Deletion of scheduled events for the sector
            const deletedEventsIds = await this.wateringScheduleRepository.deleteWateringEvents(sectorId, timestamp)
            if (deletedEventsIds) {
                await this.userActionService.logDeletion(userId, TABLES.WATERING_EVENT, deletedEventsIds, null);
            }

            await this.sectorRepository.disableSector(sectorId, timestamp)
            await this.userActionService.logDisabling(userId, TABLES.SECTOR, sectorId);

        } catch (error) {
            console.error(`Error disabling sector ${sectorId}: ${error.message}`);
            throw error;
        }
    }

    async deleteSector(userId, sectorId) {
        try {

            const deletedEventsIds = await this.wateringScheduleRepository.deleteWateringEvents(sectorId, 0)
            if (deletedEventsIds) {
                await this.userActionService.logDeletion(userId, TABLES.WATERING_EVENT, deletedEventsIds);
            }

            const sectorDevId = await this.deviceRepository.deleteDeviceInSector(sectorId);
            if (sectorDevId) {
                await this.userActionService.logDeletion(userId, TABLES.SECTOR_DEVICE, sectorDevId);
            }

            const sectorServiceIds = await this.sectorServiceRepository.deleteSectorServices(sectorId);
            if(sectorServiceIds) {
                await this.userActionService.logDeletion(userId, TABLES.SECTOR_SERVICE, sectorId)
            }

            const sectorData = await this.getSectorDetails(sectorId);
            if (sectorData && sectorData.theses && Array.isArray(sectorData.theses)) {
                await Promise.all(sectorData.theses.map(async thesis =>
                    await this.deleteThesis(userId, thesis.id)
                ));
            }

            await this.sectorRepository.deleteSector(sectorId)
            await this.userActionService.logDeletion(userId, TABLES.SECTOR, sectorId)

        } catch (error) {
            console.error(`Error deleting sector: ${error.message}`);
            throw error;
        }
    }

    async disableFarm(userId, isAdmin, farmId, timestamp) {
        try {
            const devices = await this.deviceRepository.getFarmAssociatedDevices(farmId, timestamp);
            await Promise.all(devices.map(async (device) => {
                const deviceAssignmentId = await this.deviceRepository.unlinkDeviceFromFarm({farmId: farmId, deviceId: device.id, validTo: timestamp});
                if (deviceAssignmentId) {
                    await this.userActionService.logDisabling(userId, TABLES.FARM_DEVICE, deviceAssignmentId, null);
                }
            }));
            const farmData = await this.farmRepository.getFarmDetails(farmId, userId, isAdmin);

            if (farmData && farmData.sectors && Array.isArray(farmData.sectors)) {
                await Promise.all(farmData.sectors.map(async sector => {
                    try {
                        return await this.disableSector(userId, sector.id, timestamp);
                    } catch (err) {
                        console.error(`Failed to disable sector ${sector.id} inside farm disable: ${err.message}`);
                    }
                }));
            }

        } catch (error) {
            console.error(`Error disabling farm: ${error.message}`);
            throw error;
        }
    }

    async deleteFarm(userId, farmId) {
        try {
            const farmDevId = await this.deviceRepository.deleteDeviceInFarm(farmId);
            if (farmDevId) {
                await this.userActionService.logDeletion(userId, TABLES.FARM_DEVICE, farmDevId);
            }

            const farmData = await this.sectorRepository.getSectorsByFarm(farmId);
            if (farmData && Array.isArray(farmData)) {
                await Promise.all(farmData.map(async sector =>
                    await this.deleteSector(userId, sector.id)
                ));
            }

            await this.farmRepository.deleteFarm(farmId)
            await this.userActionService.logDeletion(userId, TABLES.FARM, farmId)

        } catch (error) {
            console.error(`Error deleting farm: ${error.message}`);
            throw error;
        }
    }
}

export default FieldService;