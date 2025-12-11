import { FIELDS_LOG_TABLE, FIELDS_SIGNALS_LOG_TABLE, OPTIMAL_PROFILES_LOG_TABLE, SECTORS_LOG_TABLE, SECTORS_SIGNALS_LOG_TABLE, THESES_IN_SECTORS_LOG_TABLE, THESES_LOG_TABLE, THESES_SIGNALS_LOG_TABLE, WATERING_ALGORITHM_LOG_TABLE, WATERING_EVENTS_LOG_TABLE } from '../commons/constants.js';
import { OptimalStateData } from '../dtos/optStateDto.js';
import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30

class FieldService {

    constructor(fieldRepository, companyRepository, thesesAllSignalsRepository, interpolatedProfileRepository, humidityBinsRepository, optimalDistanceRepository, wateringAdviceRepository, signalsRepository, wateringScheduleRepository, userActionService) {
        this.fieldRepository = fieldRepository
        this.companyRepository = companyRepository
        this.thesesAllSignalsRepository = thesesAllSignalsRepository
        this.interpolatedProfileRepository = interpolatedProfileRepository
        this.humidityBinsRepository = humidityBinsRepository
        this.optimalDistanceRepository = optimalDistanceRepository
        this.wateringAdviceRepository = wateringAdviceRepository
        this.signalsRepository = signalsRepository
        this.wateringScheduleRepository = wateringScheduleRepository
        this.userActionService = userActionService
    }

    async createField(userId, field) {
        try {
            const fieldCreated = await this.fieldRepository.createField(field.fieldName, field.companyId, field.location);
            const fieldId = fieldCreated.id;
            if (fieldId) {
                this.userActionService.logCreation(userId, FIELDS_LOG_TABLE, fieldId, null)
                return fieldId
            }
        } catch (error) {
            console.error(`Error creating field ${field.fieldName}: ${error.message}`);
            throw error;
        }
    }

    async createSector(userId, sector) {
        try {
            const sectorCreated = await this.fieldRepository.createSector(sector);

            const sectorId = sectorCreated.id;
            if (sectorId) {
                this.userActionService.logCreation(userId, SECTORS_LOG_TABLE, sectorId, null)
                return sectorId
            }
        } catch (error) {
            console.error(`Error creating sector ${sector.sectorName}: ${error.message}`);
            throw error;
        }
    }

    async getSectorOwner(sectorId) {
        const result = await this.fieldRepository.getSectorDetails(sectorId, Date.now() / 1000);

        if (!result || !result.field || !result.field.company) {
            throw new Error(`Company not found for sector ${sectorId}`);
        }

        return dtoConverter.convertCompany(result.field.company);
    }

    async createThesis(userId, thesis) {
        const newThesisId = await this.fieldRepository.createThesis(thesis.thesisName);
        if (!newThesisId) {
            throw Error("Impossible to create thesis")
        }
        await this.userActionService.logCreation(userId, THESES_LOG_TABLE, newThesisId, null);
        const assignmentId = await this.fieldRepository.assignThesisToSector(newThesisId, thesis.sectorId, undefined, thesis.validFrom || Math.floor(Date.now() / 1000));
        await this.userActionService.logCreation(userId, THESES_IN_SECTORS_LOG_TABLE, assignmentId, null);
        return newThesisId;
    }

    async getFieldOwner(fieldId) {
        const result = await this.fieldRepository.getFieldDetails(fieldId);
        if (!result.company) {
            throw new Error(`Company not found for field ${fieldId}`);
        }
        return dtoConverter.convertCompany(result.company);
    }

    async getFieldDetails(fieldId) {
        const result = await this.fieldRepository.getFieldDetails(fieldId);
        return dtoConverter.convertFieldDataWrapper(result);;
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
            ['DRIPPER', 'SPRINKER', 'PLUV_CURR'],
            timeFilterFrom,
            timeFilterTo,
            'SUM',
            24 * 60 * MINUTE_TO_SECONDS
        );

        return dtoConverter.convertMeasurementsDataWrapper([...advicesAndExpectedWater, ...measurements, ...measurementsEt0]);
    }


    async getSectors(userId, timeFilterFrom, timeFilterTo) {
        const result = await this.fieldRepository.getSectors(userId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertSectorsDataWrapper(result);
    }

    async getSectorDetails(sectorId, timestamp) {
        const result = await this.fieldRepository.getSectorDetails(sectorId, timestamp);
        return dtoConverter.convertSectorDataWrapper(result);
    }

    async getThesisDetails(thesisId, timestamp) {
        const result = await this.fieldRepository.getThesisDetails(thesisId, timestamp || Date.now() / 1000)
        if (result) {
            return dtoConverter.convertThesisDataWrapper(result)
        }
    }

    async getDevicesByThesis(thesisId, timestamp) {
        const result = await this.thesesAllSignalsRepository.getDevicesByThesis(thesisId, timestamp);
        return dtoConverter.convertDevicesDataWrapper(result);
    }

    async getBinningInfo(binningId) {
        return this.humidityBinsRepository.getBinningInfo(binningId);
    }

    async getSignalsByThesis(thesisId, signalTypes, timestamp) {
        const result = await this.thesesAllSignalsRepository.getSignalsByThesis(thesisId, signalTypes, timestamp);
        return dtoConverter.convertSignalsDataWrapper(result);
    }

    async getPunctualDistance(thesisId, timestamp) {
        const result = await this.optimalDistanceRepository.findPunctualDistance(thesisId, timestamp);
        return dtoConverter.convertPunctualDistanceWrapper(result);
    }

    async getOptimalState(thesisId, timestamp) {
        const result = await this.fieldRepository.getOptimalState(thesisId, timestamp)
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
        if (result.length > 0) {
            return dtoConverter.convertInterpolatedMeansWrapper(result)
        } else {
            return null
        }
    }

    async findThesisPoints(gridId) {
        return this.interpolatedProfileRepository.findThesisPoints(gridId)
    }

    async createMatrixOptimalState(userId, gridOptimalProfiles) {
        const matrixData = await this.fieldRepository.createMatrixOptimalState(
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
            await this.fieldRepository.createMatrixProfile(matrixId, optimalProfile.x, optimalProfile.y, optimalProfile.z, optimalProfile.value, optimalProfile.weight)
        }
        await this.userActionService.logCreation(userId, OPTIMAL_PROFILES_LOG_TABLE, matrixData.optimalProfileAssignmentId, null)
        return matrixData.optimalProfileAssignmentId
    }

    async setOptimalState(userId, gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId) {
        const matrixData = await this.fieldRepository.createMatrixOptimalState(gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId)
        if (!matrixData.matrixId || !matrixData.optimalProfileAssignmentId) {
            throw Error("Impossible to create optimal matrix for this thesis")
        }
        await this.userActionService.logCreation(userId, OPTIMAL_PROFILES_LOG_TABLE, matrixData.optimalProfileAssignmentId, null)
        return matrixData.optimalProfileAssignmentId
    }

    async getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo) {
        return await this.interpolatedProfileRepository.getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo);
    }

    async setThesesContributions(sectorId, thesesContributions, validFrom, validTo) {
        const thesesIds = new Set((await this.getSectorDetails(sectorId, validFrom)).theses.map(t => t.id))
        const paramThesisIds = new Set(thesesContributions.map(t => t.id))

        //Find invalid params (present in params but NOT in DB)
        const invalidParams = [...paramThesisIds].filter(id => !thesesIds.has(id));
        if (invalidParams.length > 0) {
            throw new Error(`Invalid thesis IDs: ${invalidParams.join(", ")}`);
        }

        await thesesContributions.forEach(async t => {
            await this.fieldRepository.disableThesisInSector(sectorId, t.id, validFrom)
            await this.fieldRepository.assignThesisToSector(t.id, sectorId, t.weight, validFrom, validTo)
        })
        await [...thesesIds].filter(id => !paramThesisIds.has(id)).forEach(async id => {
            await this.fieldRepository.disableThesisInSector(sectorId, id, validFrom)
            await this.fieldRepository.assignThesisToSector(id, sectorId, 0, validFrom, validTo)
        })
    }

    async disableThesis(userId, thesisId, timestamp) {
        try {
            const deviceId = await this.thesesAllSignalsRepository.getGridDeviceByThesis(thesisId, timestamp, timestamp)
            const optimalProfileAssignmentId = await this.fieldRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp)
            if (optimalProfileAssignmentId) {
                this.userActionService.logDisabling(userId, OPTIMAL_PROFILES_LOG_TABLE, optimalProfileAssignmentId, null)
            }
            const algorithmId = await this.wateringAdviceRepository.setWateringAlgorithmParamsEndDate(thesisId, timestamp)
            if (algorithmId) {
                this.userActionService.logDisabling(userId, WATERING_ALGORITHM_LOG_TABLE, algorithmId, null)
            }

            const signals = await this.signalsRepository.getThesisAssociatedSignals(thesisId, timestamp)
            await Promise.all(signals.map(async (signal) => {
                const signalAssignmentId = await this.signalsRepository.disableSignalInThesis(signal.id, timestamp);
                if (signalAssignmentId) {
                    await this.userActionService.logDisabling(userId, THESES_SIGNALS_LOG_TABLE, signalAssignmentId, null);
                }
            }));

            const sectorAssignmentsIds = await this.fieldRepository.disableThesisFromSectors(thesisId, timestamp)
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
            //Signals disabling
            const signals = await this.signalsRepository.getSectorAssociatedSignals(sectorId, timestamp);
            await Promise.all(signals.map(async (signal) => {
                const signalAssignmentId = await this.signalsRepository.disableSignalInSector(signal.id, timestamp);
                if (signalAssignmentId) {
                    await this.userActionService.logDisabling(userId, SECTORS_SIGNALS_LOG_TABLE, signalAssignmentId, null);
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

    async disableField(userId, fieldId, timestamp) {
        try {
            const signals = await this.signalsRepository.getFieldAssociatedSignals(fieldId, timestamp);
            await Promise.all(signals.map(async (signal) => {
                const signalAssignmentId = await this.signalsRepository.disableSignalInField(signal.id, timestamp);
                if (signalAssignmentId) {
                    await this.userActionService.logDisabling(userId, FIELDS_SIGNALS_LOG_TABLE, signalAssignmentId, null);
                }
            }));
            const fieldData = await this.fieldRepository.getFieldDetails(fieldId);

            if (fieldData && fieldData.sectors && Array.isArray(fieldData.sectors)) {
                await Promise.all(fieldData.sectors.map(sector => {
                    return this.disableSector(userId, sector.id, timestamp).catch(err => {
                        console.error(`Failed to disable sector ${sector.id} inside field disable: ${err.message}`);
                    });
                }));
            }

        } catch (error) {
            console.error(`Error disabling field: ${error.message}`);
            throw error;
        }
    }
}

export default FieldService;