import DataInterpolatedRepository from '../persistency/repository/DataInterpolatedRepository.js';
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
import initWateringThesis from '../persistency/model/WateringThesis.js';
import initWateringAlgorithmParams from '../persistency/model/WateringAlgorithmParams.js';
import initWateringSector from '../persistency/model/WateringSector.js';

const dtoConverter = new DtoConverter();

const MINUTE_TO_SECONDS = 60
const MONTH_TO_SECONDS = MINUTE_TO_SECONDS * 60 * 24 * 30

class FieldService {

    constructor(sequelize) {
        this.dataInterpolatedRepository = new DataInterpolatedRepository(sequelize);
        this.deltaRepository = new DeltaRepository(sequelize);
        this.humidityBinsRepository = new HumidityBinsRepository(sequelize);
        this.viewDataOriginalRepository = new ViewDataOriginalRepository(sequelize);
        this.wateringAggregateRepository = new WateringAggregateRepository(sequelize);
        this.humidityBinsRepository = new HumidityBinsRepository(sequelize);
        this.fieldRepository = new FieldRepository(initMatrixProfile(sequelize), initMatrixField(sequelize), initTranscodingField(sequelize), initWateringThesis(sequelize), initWateringSector(sequelize), initWateringAlgorithmParams(sequelize), sequelize);
    }

    async getInterpolatedMeans(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo) {
        const result = await this.dataInterpolatedRepository.findInterpolatedMeans(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo);
        return [dtoConverter.convertDataInterpolatedMeanWrapper(refStructureName, companyName, fieldName, sectorName, plantRow, result)];
    }

    async getDataInterpolated(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {
        const result = await this.dataInterpolatedRepository.findDataInterpolated(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp);
        return dtoConverter.convertDataInterpolatedWrapper(result);
    }

    async getDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo) {
        const result = await this.dataInterpolatedRepository.findDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo);
        return dtoConverter.convertDataInterpolatedWrapper(result);
    }

    async getDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const result = await this.deltaRepository.findDelta(timestampFrom, timestampTo, refStructureName, companyName, fieldName, sectorName, plantRow);
        return dtoConverter.convertDeltaWrapper(result);
    }

    async getPunctualDistance(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {
        const result = await this.deltaRepository.findPunctualDelta(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp);
        return dtoConverter.convertPunctualDistanceWrapper(result);
    }

    async getHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const result = await this.humidityBinsRepository.findHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow);
        return dtoConverter.convertHumidityBinWrapper(result);
    }

    async getHumidityBinEvents(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const result = await this.humidityBinsRepository.findHumidityBinEvents(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow);
        return dtoConverter.convertHumidityBinEventWrapper(result);
    }

    async getAverageByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const requestPeriod = timeFilterTo - timeFilterFrom
        let aggregationPeriod = MINUTE_TO_SECONDS //one minute minimum aggregation
        if(requestPeriod > 3 * MONTH_TO_SECONDS){
            aggregationPeriod = 24 * 60 * MINUTE_TO_SECONDS
        } else if(requestPeriod > 1.5 * MONTH_TO_SECONDS){
            aggregationPeriod = 12 * 60 * MINUTE_TO_SECONDS
        } else if(requestPeriod > 14 * 24 * 60 * MINUTE_TO_SECONDS){//two weeks
            aggregationPeriod = 3 * 60 * MINUTE_TO_SECONDS
        } else if(requestPeriod > 3 * 24 * 60 * MINUTE_TO_SECONDS){ // 3 days
            aggregationPeriod = 60 * MINUTE_TO_SECONDS
        }
        const result = await this.viewDataOriginalRepository.findAverageByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow, aggregationPeriod);
        return dtoConverter.convertViewDataOriginalWrapper(result);
    }

    async getEcAverageByFieldReference(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const result = await this.viewDataOriginalRepository.findEcAverageByFieldReference(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow, MINUTE_TO_SECONDS);
        return dtoConverter.convertViewDataOriginalWrapper(result);
    }

    async getHumidityEventsByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const result = await this.viewDataOriginalRepository.findHumidityEventsByFieldReference(detectedValueTypeDescription, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, plantRow, MINUTE_TO_SECONDS);
        return dtoConverter.convertViewDataOriginalWrapper(result);
    }

    async getWaterAggregate(timefilterFrom, timefilterTo, refStructureName, companyName, fieldName, sectorName, plantRow) {
        const result = await this.wateringAggregateRepository.findWaterAggregate(timefilterFrom, timefilterTo, refStructureName, companyName, fieldName, sectorName, plantRow);
        return dtoConverter.convertWaterAggregateWrapper(result);
    }

    async getOptimalState(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp){
        const result = await this.fieldRepository.getOptimalState(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp)
        if (result.length > 0){
            return dtoConverter.convertOptimalStateWrapper(result)
        }
        return new OptStateDto(refStructureName, companyName, fieldName, sectorName, plantRow, undefined, undefined, undefined, [])
    }

    async createMonitoringThesis(thesis, timestampFrom) {
        await this.fieldRepository.createThesis(thesis, timestampFrom || Math.floor(Date.now()/1000))
    }

    async updateWateringSectorDetails(sectorDetails, timestampFrom) {
        await this.fieldRepository.updateWateringSectorDetails(sectorDetails, timestampFrom || Math.floor(Date.now()/1000))
    }

    async createMatrixOptState(optStateDto) {
        const matrixId = await this.fieldRepository.createMatrixField('iFarming', optStateDto.refStructureName, optStateDto.companyName, optStateDto.fieldName, optStateDto.sectorName, optStateDto.plantRow, optStateDto.validFrom, optStateDto.validTo)
        if(!matrixId){
            throw Error("Impossible to create optimal matrix for this field")
        }
        for (const matrixData of optStateDto.optimalState) {
            await this.fieldRepository.createMatrixProfile(matrixId, matrixData.xx, matrixData.yy, matrixData.zz, matrixData.value)
        }
    }

    async setOptimalState(refStructureName, companyName, fieldName, sectorName, plantRow, matrixId, timestampFrom) {
        return this.fieldRepository.createMatrixField('iFarming', refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, null, matrixId)
    }

    async getDripperInfo(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {
        return this.fieldRepository.getDripperInfo(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp)
    }

    async findThesisPoints(refStructureName, companyName, fieldName, sectorName, plantRow) {
        return this.dataInterpolatedRepository.findThesisPoints(refStructureName, companyName, fieldName, sectorName, plantRow)
    }

    async setWateringBaseline(baseline, timestampFrom) {
        await this.fieldRepository.setWateringBaseline(baseline, timestampFrom || Math.floor(Date.now()/1000))
    }

    async setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom) {
        await this.fieldRepository.setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom || Math.floor(Date.now()/1000))
    }

    async disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp) {
        await this.fieldRepository.disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp)
    }

    async disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp){
        await this.fieldRepository.disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp)
    }

    async disableMonitoringThesis(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {
        await this.fieldRepository.disableMonitoringThesis(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp)
    }

    async disableSector(refStructureName, companyName, fieldName, sectorName, timestamp) {
        await this.fieldRepository.disableSector(refStructureName, companyName, fieldName, sectorName, timestamp)
    }

}

export default FieldService;