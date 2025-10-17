import DeltaRepository from '../persistency/repository/DeltaRepository.js';
import HumidityBinsRepository from '../persistency/repository/HumidityBinsRepository.js';
import ViewDataOriginalRepository from '../persistency/repository/ViewDataOriginalRepository.js';
import WateringAggregateRepository from '../persistency/repository/WateringAggregateRepository.js';
import DtoConverter from './DtoConverter.js';
import FieldRepository from '../persistency/repository/FieldRepository.js';
import { OptStateDto } from "../dtos/optStateDto.js";

import initMatrixProfile from '../persistency/model/MatrixProfile.js';
import initMatrixField from '../persistency/model/MatrixField.js';
import initTranscodingField from '../persistency/model/TranscodingField.js';
import initWateringThesis from '../persistency/model/Thesis.js';
import initWateringAlgorithmParams from '../persistency/model/WateringAlgorithmParams.js';
import initWateringSector from '../persistency/model/Sector.js';
import initField from '../persistency/model/Field.js';
import initCompany from '../persistency/model/Company.js'
import CompanyRepository from '../persistency/repository/CompanyRepository.js';
import initOrganization from '../persistency/model/Organization.js';

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30

class FieldService {

    // constructor(sequelize) {
    //     this.dataInterpolatedRepository = new DataInterpolatedRepository(sequelize);
    //     this.deltaRepository = new DeltaRepository(sequelize);
    //     this.humidityBinsRepository = new HumidityBinsRepository(sequelize);
    //     this.viewDataOriginalRepository = new ViewDataOriginalRepository(sequelize);
    //     this.wateringAggregateRepository = new WateringAggregateRepository(sequelize);
    //     this.companyRepository = new CompanyRepository(initOrganization(sequelize));
    //     this.fieldRepository = new FieldRepository(initField(sequelize), initCompany(sequelize), initMatrixProfile(sequelize), initMatrixField(sequelize), initTranscodingField(sequelize), initWateringThesis(sequelize), initWateringSector(sequelize), initWateringAlgorithmParams(sequelize), sequelize);
    // }

    constructor(fieldRepository, companyRepository, thesesAllSignalsRepository, interpolatedProfileRepository, humidityBinsRepository){
        this.fieldRepository = fieldRepository;
        this.companyRepository = companyRepository;
        this.thesesAllSignalsRepository = thesesAllSignalsRepository;
        this.interpolatedProfileRepository = interpolatedProfileRepository;
        this.humidityBinsRepository = humidityBinsRepository;
    }

    async createField(field){ 
        try {
            await this.fieldRepository.createField(field.fieldName, field.companyId, field.location);
        } catch (error) {
            console.error(`Error creating field ${field.fieldName}: ${error.message}`);
            throw error;
        }    
    }

    async createSector(sector) {
        try {
            const result = await this.fieldRepository.createSector({
                sectorName: sector.sectorName,
                fieldId: sector.fieldId,
                culture: sector.culture,
                cultureType: sector.cultureType,
                location: sector.location,
                prescriptive: sector.prescriptive,
                advice: sector.advice,
                dripperCapacity: sector.dripperCapacity,
                sprinklerCapacity: sector.sprinklerCapacity,
                doubleWing: sector.doubleWing
            });

            return result;
        } catch (error) {
            console.error(`Error creating sector ${sector.sectorName}: ${error.message}`);
            throw error;
        }
    }

    async getSectorOwner(sectorId){
        const result = await this.fieldRepository.getSectorDetails(sectorId);

        if (!result || !result.field || !result.field.company) {
            throw new Error(`Company not found for sector ${sectorId}`);
        }

        return dtoConverter.convertCompany(result.field.company); 
    }

    async createThesis(thesis) {
        const newThesisId = await this.fieldRepository.createThesis(thesis.thesisName);
        if(!newThesisId){
            throw Error("Impossible to create thesis")
        }
        await this.fieldRepository.assignThesisToSector(newThesisId, thesis.sectorId, thesis.weight , thesis.validFrom || Math.floor(Date.now()/1000));
    }

    async getFieldOwner(fieldId){
        const result = await this.fieldRepository.getFieldDetails(fieldId);
        if (!result ||  !result.company) {
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

    async getHeatmapByThesis(thesisId, timeFilterFrom, timeFilterTo){
        // const gridId = await this.thesesAllSignalsRepository.getGridDeviceByThesis(thesisId, timeFilterFrom, timeFilterTo);
        // if(!gridId){
        //     throw Error("No GRID type device found assigned to the given thesis");
        // }

        const result = await this.interpolatedProfileRepository.getInterpolatedProfiles(thesisId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertHeatmapDataWrapper(result);
    }

    async getHumidtyBinsByThesis(thesisId, timeFilterFrom, timeFilterTo){
        // const gridId = await this.thesesAllSignalsRepository.getGridDeviceByThesis(thesisId, timeFilterFrom, timeFilterTo);
        // if(!gridId){
        //     throw Error("No GRID type device found assigned to the given thesis");
        // }

        const result = await this.humidityBinsRepository.getHumidityBins(thesisId, timeFilterFrom, timeFilterTo);
        return dtoConverter.convertHumidtyBinsDataWrapper(result);
    }

    async getSectors(userId, timeFilterFrom, timeFilterTo){
        const result = await this.fieldRepository.getSectors(userId, timeFilterFrom, timeFilterTo);
        return result.map(r => ({ sectorId: r.idKey }));
    }

    async getSectorById(userId, sectorId){
        const result = await this.fieldRepository.getSectorDetails(userId, sectorId);
        return dtoConverter.convertSectorDataWrapper(result);
    }

    // async getInterpolatedMeans(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo) {
    //     const result = await this.dataInterpolatedRepository.findInterpolatedMeans(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo);
    //     return [dtoConverter.convertDataInterpolatedMeanWrapper(refStructureName, companyName, fieldName, sectorName, thesisName, result)];
    // }

    // async getDataInterpolated(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
    //     const result = await this.dataInterpolatedRepository.findDataInterpolated(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp);
    //     return dtoConverter.convertDataInterpolatedWrapper(result);
    // }

    // async getDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo) {
    //     const result = await this.dataInterpolatedRepository.findDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo);
    //     return dtoConverter.convertDataInterpolatedWrapper(result);
    // }

    // async getDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     const result = await this.deltaRepository.findDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, thesisName);
    //     return dtoConverter.convertDeltaWrapper(result);
    // }

    // async getPunctualDistance(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
    //     const result = await this.deltaRepository.findPunctualDelta(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp);
    //     return dtoConverter.convertPunctualDistanceWrapper(result);
    // }

    // async getHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     const result = await this.humidityBinsRepository.findHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);
    //     return dtoConverter.convertHumidityBinWrapper(result);
    // }

    // async getAverageByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     const requestPeriod = timeFilterTo - timeFilterFrom
    //     let aggregationPeriod = MINUTE_TO_SECONDS //one minute minimum aggregation
    //     if(requestPeriod > 3 * MONTH_TO_SECONDS){
    //         aggregationPeriod = 24 * 60 * MINUTE_TO_SECONDS
    //     } else if(requestPeriod > 1.5 * MONTH_TO_SECONDS){
    //         aggregationPeriod = 12 * 60 * MINUTE_TO_SECONDS
    //     } else if(requestPeriod > 14 * 24 * 60 * MINUTE_TO_SECONDS){//two weeks
    //         aggregationPeriod = 3 * 60 * MINUTE_TO_SECONDS
    //     } else if(requestPeriod > 3 * 24 * 60 * MINUTE_TO_SECONDS){ // 3 days
    //         aggregationPeriod = 60 * MINUTE_TO_SECONDS
    //     }
    //     const result = await this.viewDataOriginalRepository.findAverageByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, aggregationPeriod);
    //     return dtoConverter.convertViewDataOriginalWrapper(result);
    // }

    // async getEcAverageByFieldReference(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     const result = await this.viewDataOriginalRepository.findEcAverageByFieldReference(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, MINUTE_TO_SECONDS);
    //     return dtoConverter.convertViewDataOriginalWrapper(result);
    // }

    // async getHumidityEventsByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     const result = await this.viewDataOriginalRepository.findHumidityEventsByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName, MINUTE_TO_SECONDS);
    //     return dtoConverter.convertViewDataOriginalWrapper(result);
    // }

    // async getWaterAggregate(timefilterFrom, timefilterTo, refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     const result = await this.wateringAggregateRepository.findWaterAggregate(timefilterFrom, timefilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);
    //     return dtoConverter.convertWaterAggregateWrapper(result);
    // }

    // async getOptimalState(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp){
    //     const result = await this.fieldRepository.getOptimalState(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp)
    //     if (result.length > 0){
    //         return dtoConverter.convertOptimalStateWrapper(result)
    //     }
    //     return new OptStateDto(refStructureName, companyName, fieldName, sectorName, thesisName, undefined, undefined, undefined, [])
    // }

    // async updateWateringSectorDetails(sectorDetails, timestampFrom) {
    //     await this.fieldRepository.updateWateringSectorDetails(sectorDetails, timestampFrom || Math.floor(Date.now()/1000))
    // }

    // async createMatrixOptState(optStateDto) {
    //     const matrixId = await this.fieldRepository.createMatrixField('iFarming', optStateDto.refStructureName, optStateDto.companyName, optStateDto.fieldName, optStateDto.sectorName, optStateDto.thesisName, optStateDto.validFrom, optStateDto.validTo)
    //     if(!matrixId){
    //         throw Error("Impossible to create optimal matrix for this field")
    //     }
    //     for (const matrixData of optStateDto.optimalState) {
    //         await this.fieldRepository.createMatrixProfile(matrixId, matrixData.xx, matrixData.yy, matrixData.zz, matrixData.value)
    //     }
    // }

    // async setOptimalState(refStructureName, companyName, fieldName, sectorName, thesisName, matrixId, timestampFrom) {
    //     return this.fieldRepository.createMatrixField('iFarming', refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, null, matrixId)
    // }

    // async getDripperInfo(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp) {
    //     return this.fieldRepository.getDripperInfo(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp)
    // }

    // async findThesisPoints(refStructureName, companyName, fieldName, sectorName, thesisName) {
    //     return this.dataInterpolatedRepository.findThesisPoints(refStructureName, companyName, fieldName, sectorName, thesisName)
    // }

    // async setWateringBaseline(baseline, timestampFrom) {
    //     await this.fieldRepository.setWateringBaseline(baseline, timestampFrom || Math.floor(Date.now()/1000))
    // }

    // async setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom) {
    //     await this.fieldRepository.setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom || Math.floor(Date.now()/1000))
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