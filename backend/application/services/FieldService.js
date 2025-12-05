import { OptimalStateData } from '../dtos/optStateDto.js';
import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30

class FieldService {

    constructor(fieldRepository, companyRepository, thesesAllSignalsRepository, interpolatedProfileRepository, humidityBinsRepository, optimalDistanceRepository, wateringAdviceRepository, signalsRepository, wateringScheduleRepository) {
        this.fieldRepository = fieldRepository
        this.companyRepository = companyRepository
        this.thesesAllSignalsRepository = thesesAllSignalsRepository
        this.interpolatedProfileRepository = interpolatedProfileRepository
        this.humidityBinsRepository = humidityBinsRepository
        this.optimalDistanceRepository = optimalDistanceRepository
        this.wateringAdviceRepository = wateringAdviceRepository
        this.signalsRepository = signalsRepository
        this.wateringScheduleRepository = wateringScheduleRepository
    }

    async createField(field) {
        try {
            const fieldCreated = await this.fieldRepository.createField(field.fieldName, field.companyId, field.location);
            return fieldCreated.id;
        } catch (error) {
            console.error(`Error creating field ${field.fieldName}: ${error.message}`);
            throw error;
        }
    }

    async createSector(sector) {
        try {
            const sectorCreated = await this.fieldRepository.createSector(sector);

            return sectorCreated.id;
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

    async createThesis(thesis) {
        const newThesisId = await this.fieldRepository.createThesis(thesis.thesisName);
        if (!newThesisId) {
            throw Error("Impossible to create thesis")
        }
        await this.fieldRepository.assignThesisToSector(newThesisId, thesis.sectorId, undefined, thesis.validFrom || Math.floor(Date.now() / 1000));
        return newThesisId;
    }

    async getFieldOwner(fieldId) {
        const result = await this.fieldRepository.getFieldDetails(fieldId);
        if (!result.company) {
            throw new Error(`Company not found for field ${fieldId}`);
        }
        return dtoConverter.convertCompany(result.company);
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
            return dtoConverter.convertThesisDetailsWrapper(result)
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

    async createMatrixOptimalState(gridOptimalProfiles) {
        const matrixId = await this.fieldRepository.createMatrixOptimalState(
            gridOptimalProfiles.gridId,
            gridOptimalProfiles.validFrom,
            gridOptimalProfiles.validTo,
            gridOptimalProfiles.stopPercentage,
            gridOptimalProfiles.optimalDryBound,
            gridOptimalProfiles.optimalWetBound,
        )

        if (!matrixId) {
            throw Error("Impossible to create optimal matrix for this thesis")
        }

        for (const optimalProfile of gridOptimalProfiles.optimalState) {
            await this.fieldRepository.createMatrixProfile(matrixId, optimalProfile.x, optimalProfile.y, optimalProfile.z, optimalProfile.value, optimalProfile.weight)
        }
    }

    async setOptimalState(gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId) {
        return await this.fieldRepository.createMatrixOptimalState(gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, profileId)
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

    async disableThesis(thesisId, timestamp) {
        try {
            const deviceId = await this.thesesAllSignalsRepository.getGridDeviceByThesis(thesisId, timestamp, timestamp)
            await this.fieldRepository.setOptimalProfileAssignmentEndDate(deviceId, timestamp)
            await this.wateringAdviceRepository.setWateringAlgorithmParamsEndDate(thesisId, timestamp)

            const signals = await this.signalsRepository.getThesisAssociatedSignals(thesisId, timestamp)
            await Promise.all(signals.map(signal =>
                this.signalsRepository.disableSignalInThesis(signal.id, timestamp)
            ));
            await this.fieldRepository.disableThesisFromSector(thesisId, timestamp)
        } catch (error) {
            console.error(`Error disabling Thesis: ${error.message}`);
            throw error;
        }
    }


    async disableSector(sectorId, timestamp) {
        try {
            const signals = await this.signalsRepository.getSectorAssociatedSignals(sectorId, timestamp);
            if (signals && signals.length > 0) {
                await Promise.all(signals.map(signal =>
                    this.signalRepository.disableSignalInSector(signal.id, timestamp)
                ));
            }

            try {
                const sectorData = await this.getSectorDetails(sectorId, timestamp);

                if (sectorData && sectorData.theses && Array.isArray(sectorData.theses)) {
                    await Promise.all(sectorData.theses.map(thesis =>
                        this.disableThesis(thesis.id, timestamp)
                    ));
                }
            } catch (innerError) {
                console.warn(`Skipping thesis disable for sector ${sectorId}: ${innerError.message}`);
            }

            await this.wateringScheduleRepository.deleteWateringEvents(sectorId, timestamp);

        } catch (error) {
            console.error(`Error disabling sector ${sectorId}: ${error.message}`);
            throw error;
        }
    }

    async disableField(fieldId, timestamp) {
        try {
            const signals = await this.signalsRepository.getFieldAssociatedSignals(fieldId, timestamp);
            if (signals && signals.length > 0) {
                await Promise.all(signals.map(signal =>
                    this.signalRepository.disableSignalInField(signal.id, timestamp)
                ));
            }
            const fieldData = await this.fieldRepository.getFieldDetails(fieldId);

            if (fieldData && fieldData.sectors && Array.isArray(fieldData.sectors)) {
                await Promise.all(fieldData.sectors.map(sector => {
                    return this.disableSector(sector.id, timestamp).catch(err => {
                        console.error(`Failed to disable sector ${sector.id} inside field disable: ${err.message}`);
                    });
                }));
            }

        } catch (error) {
            console.error(`Error disabling field: ${error.message}`);
            throw error;
        }
    }

    // async updateWateringSectorDetails(sectorDetails, timestampFrom) {
    //     await this.fieldRepository.updateWateringSectorDetails(sectorDetails, timestampFrom || Math.floor(Date.now()/1000))
    // }

    // async getDripperInfo(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
    //     return this.fieldRepository.getDripperInfo(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp)
    // }

    // async findThesisPoints(refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     return this.dataInterpolatedRepository.findThesisPoints(refStructureName, companyName, fieldName, sectorName, thesisName)
    // }

    // async disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp) {
    //     await this.fieldRepository.disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp)
    // }

    // async disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp){
    //     await this.fieldRepository.disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp)
    // }

    // async disableMonitoringThesis(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
    //     await this.fieldRepository.disableMonitoringThesis(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp)
    // }

    // async disableSector(refStructureName, companyName, fieldName, sectorName, timestamp) {
    //     await this.fieldRepository.disableSector(refStructureName, companyName, fieldName, sectorName, timestamp)
    // }

    // async disableNode(refStructureName, companyName, fieldName, sectorName, thesisName, nodeId, timestamp) {
    //     await this.fieldRepository.disableNode(refStructureName, companyName, fieldName, sectorName, thesisName, nodeId, timestamp)
    // }

}

export default FieldService;