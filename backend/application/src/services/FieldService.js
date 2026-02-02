import { FARMS_LOG_TABLE, FARMS_DEVICES_LOG_TABLE, OPTIMAL_PROFILES_LOG_TABLE, SECTORS_LOG_TABLE, SECTORS_DEVICES_LOG_TABLE, THESES_IN_SECTORS_LOG_TABLE, THESES_LOG_TABLE, THESES_DEVICES_LOG_TABLE, WATERING_ALGORITHM_LOG_TABLE, WATERING_EVENTS_LOG_TABLE } from '../commons/constants.js';
import { OptimalStateData } from '../dtos/optStateDto.js';
import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30

class FieldService {

    constructor(companyRepository, farmRepository, sectorRepository, thesisRepository, thesesAllSignalsRepository, interpolatedProfileRepository, humidityBinsRepository, optimalDistanceRepository, wateringAdviceRepository, deviceRepository, wateringScheduleRepository, userActionService) {
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
                this.userActionService.logCreation(userId, FARMS_LOG_TABLE, farmId, null)
                return farmId
            }
        } catch (error) {
            console.error(`Error creating farm ${farm.name}: ${error.message}`);
            throw error;
        }
    }

    async getFarms(userId) {
        const result = await this.farmRepository.getFarms();
        return dtoConverter.convertFarms(result);
    }


    async createSector(userId, sector) {
        try {
            const sectorCreated = await this.sectorRepository.createSector(sector);

            const sectorId = sectorCreated.id;
            if (sectorId) {
                this.userActionService.logCreation(userId, SECTORS_LOG_TABLE, sectorId, null)
                return sectorId
            }
        } catch (error) {
            console.error(`Error creating sector ${sector.name}: ${error.message}`);
            throw error;
        }
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
        await this.userActionService.logCreation(userId, THESES_LOG_TABLE, newThesisId, null);
        const assignmentId = await this.thesisRepository.assignThesisToSector(newThesisId, thesis.sectorId, undefined, thesis.validFrom || Math.floor(Date.now() / 1000));
        await this.userActionService.logCreation(userId, THESES_IN_SECTORS_LOG_TABLE, assignmentId, null);
        return newThesisId;
    }

    async getFarmOwner(farmId) {
        const result = await this.farmRepository.getFarmDetails(farmId);
        if (!result.company) {
            throw new Error(`Company not found for farm ${farmId}`);
        }
        return dtoConverter.convertCompany(result.company);
    }

    async getFarmDetails(farmId) {
        const result = await this.farmRepository.getFarmDetails(farmId);
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


    async getSectors(userId, timeFilterFrom, timeFilterTo) {
        const result = await this.sectorRepository.getSectors(userId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertSectorsDataWrapper(result);
    }

    async getSectorDetails(sectorId, timestamp) {
        const result = await this.sectorRepository.getSectorDetails(sectorId, timestamp);
        return dtoConverter.convertSectorDataWrapper(result);
    }

    async getThesisDetails(thesisId, timestamp) {
        const result = await this.thesisRepository.getThesisDetails(thesisId, timestamp || Date.now() / 1000)
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

    async getDevicesByFarm(farmId, timestamp, deviceTypes, includeDescendants){
        const result = await this.thesesAllSignalsRepository.getDevicesByFarm(farmId, timestamp, deviceTypes, includeDescendants);
        return dtoConverter.convertDevicesDataWrapper(result);
    }

    async getBinningInfo(binningId) {
        return this.humidityBinsRepository.getBinningInfo(binningId);
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
        const matrixData = await this.thesisRepository.createMatrixOptimalState(
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
            await this.thesisRepository.createMatrixProfile(matrixId, optimalProfile.x, optimalProfile.y, optimalProfile.z, optimalProfile.value, optimalProfile.weight)
        }
        await this.userActionService.logCreation(userId, OPTIMAL_PROFILES_LOG_TABLE, matrixData.optimalProfileAssignmentId, null)
        return matrixData.optimalProfileAssignmentId
    }

    async setOptimalState(userId, gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId) {
        const matrixData = await this.thesisRepository.createMatrixOptimalState(gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId)
        if (!matrixData.matrixId || !matrixData.optimalProfileAssignmentId) {
            throw Error("Impossible to create optimal matrix for this thesis")
        }
        await this.userActionService.logCreation(userId, OPTIMAL_PROFILES_LOG_TABLE, matrixData.optimalProfileAssignmentId, null)
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
                await this.userActionService.logDisabling(userId, THESES_IN_SECTORS_LOG_TABLE, sectorAssignmentsIds, null);
            }

            const assignmentId = await this.sectorRepository.assignThesisToSector(t.id, sectorId, t.weight, validFrom, validTo)
            if (assignmentId) {
                await this.userActionService.logCreation(userId, THESES_IN_SECTORS_LOG_TABLE, assignmentId, null);
            }
        })
        await [...thesesIds].filter(id => !paramThesisIds.has(id)).forEach(async id => {
            const sectorAssignmentsIds = await this.thesisRepository.disableThesisInSector(sectorId, id, validFrom)
            if (sectorAssignmentsIds) {
                await this.userActionService.logDisabling(userId, THESES_IN_SECTORS_LOG_TABLE, sectorAssignmentsIds, null);
            }
            const assignmentId = await this.thesisRepository.assignThesisToSector(id, sectorId, 0, validFrom, validTo)
            if (assignmentId) {
                await this.userActionService.logCreation(userId, THESES_IN_SECTORS_LOG_TABLE, assignmentId, null);
            }
        })
    }

    async disableThesis(userId, thesisId, timestamp) {
        try {
            const deviceId = await this.thesesAllSignalsRepository.getGridDeviceByThesis(thesisId, timestamp, timestamp)
            const optimalProfileAssignmentId = await this.thesisRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp)
            if (optimalProfileAssignmentId) {
                this.userActionService.logDisabling(userId, OPTIMAL_PROFILES_LOG_TABLE, optimalProfileAssignmentId, null)
            }
            const algorithmId = await this.wateringAdviceRepository.setWateringAlgorithmParamsEndDate(thesisId, timestamp)
            if (algorithmId) {
                this.userActionService.logDisabling(userId, WATERING_ALGORITHM_LOG_TABLE, algorithmId, null)
            }

            const devices = await this.deviceRepository.getThesisAssociatedDevices(thesisId, timestamp)
            await Promise.all(devices.map(async (device) => {
                const deviceAssignmentId = await this.deviceRepository.disableDeviceInThesis(device.id, timestamp);
                if (deviceAssignmentId) {
                    await this.userActionService.logDisabling(userId, THESES_DEVICES_LOG_TABLE, deviceAssignmentId, null);
                }
            }));

            const sectorAssignmentsIds = await this.thesisRepository.disableThesisFromSectors(thesisId, timestamp)
            if (sectorAssignmentsIds) {
                await this.userActionService.logDisabling(userId, THESES_IN_SECTORS_LOG_TABLE, sectorAssignmentsIds, null);
            }
        } catch (error) {
            console.error(`Error disabling Thesis: ${error.message}`);
            throw error;
        }
    }


    async disableSector(userId, sectorId, timestamp) {
        try {
            //Devices disabling
            const devices = await this.deviceRepository.getSectorAssociatedDevices(sectorId, timestamp);
            await Promise.all(devices.map(async (device) => {
                const deviceAssignmentId = await this.deviceRepository.disableDeviceInSector(device.id, timestamp);
                if (deviceAssignmentId) {
                    await this.userActionService.logDisabling(userId, SECTORS_DEVICES_LOG_TABLE, deviceAssignmentId, null);
                }
            }));

            try {
                //Thesis disabling
                const sectorData = await this.getSectorDetails(sectorId, timestamp);
                if (sectorData && sectorData.theses && Array.isArray(sectorData.theses)) {
                    await Promise.all(sectorData.theses.map(thesis =>
                        this.disableThesis(userId, thesis.id, timestamp)
                    ));
                }
            } catch (innerError) {
                console.warn(`Skipping thesis disable for sector ${sectorId}: ${innerError.message}`);
            }

            //Deletion of scheduled events for the sector
            const deletedEventsIds = await this.wateringScheduleRepository.deleteWateringEvents(sectorId, timestamp)
            if (deletedEventsIds) {
                await this.userActionService.logDeletion(userId, WATERING_EVENTS_LOG_TABLE, deletedEventsIds, null);
            }

        } catch (error) {
            console.error(`Error disabling sector ${sectorId}: ${error.message}`);
            throw error;
        }
    }

    async disableFarm(userId, farmId, timestamp) {
        try {
            const devices = await this.deviceRepository.getFarmAssociatedDevices(farmId, timestamp);
            await Promise.all(devices.map(async (device) => {
                const deviceAssignmentId = await this.deviceRepository.disableDeviceInFarm(device.id, timestamp);
                if (deviceAssignmentId) {
                    await this.userActionService.logDisabling(userId, FARMS_DEVICES_LOG_TABLE, deviceAssignmentId, null);
                }
            }));
            const farmData = await this.farmRepository.getFarmDetails(farmId);

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
}

export default FieldService;