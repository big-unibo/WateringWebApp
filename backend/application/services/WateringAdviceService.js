import DataInterpolatedRepository from '../persistency/repository/DataInterpolatedRepository.js';
import DeltaRepository from '../persistency/repository/DeltaRepository.js';
import HumidityBinsRepository from '../persistency/repository/HumidityBinsRepository.js';
import ViewDataOriginalRepository from '../persistency/repository/ViewDataOriginalRepository.js';
import WateringAggregateRepository from '../persistency/repository/WateringAggregateRepository.js';
import WateringAdviceRepository from '../persistency/repository/WateringAdviceRepository.js';
import FieldRepository from '../persistency/repository/FieldRepository.js';
import { WateringAdviceDto } from '../dtos/wateringAdviceDto.js';

import initMatrixProfile from '../persistency/model/MatrixProfile.js';
import initMatrixField from '../persistency/model/MatrixField.js';
import initTranscodingField from '../persistency/model/TranscodingField.js';
import initWateringThesis from '../persistency/model/WateringThesis.js';
import initWateringAlgorithmParams from '../persistency/model/WateringAlgorithmParams.js';
import initWateringSector from '../persistency/model/WateringSector.js';
import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter();

const LAST_ADVICE_MIN_DISTANCE = 6 * 3600 // 6 hours in seconds 
const MIN_WATERING_DURATION = 20 // 20 minutes

const applyWateringRules = (advice, humidityBin, maxIrrigation) => {
    //RULE 1: min watering 0
    if (advice < 0) {
        advice = 0;
    }

    //RULE 2: max watering
    if (advice > maxIrrigation) {
        advice = maxIrrigation;
    }

    //RULE 3: Do not water if nCells (-100, 0] > 70 % or (-30, 0] > 50 %
    const nCells = humidityBin.reduce((acc, curr) => acc + Number(curr.count), 0);
    const blueCells = humidityBin.filter(bin => bin.humidity_bin.split('*')[1] === '(-30, 0]').reduce((acc, curr) => acc + Number(curr.count), 0);
    const cyanCells = humidityBin.filter(bin => bin.humidity_bin.split('*')[1] === '(-100, -30]').reduce((acc, curr) => acc + Number(curr.count), 0);

    console.log("Cells (-100, 0] (%): ", ((blueCells + cyanCells)/nCells) * 100);
    console.log("% Cells (-30, 0] (%): ", blueCells/nCells * 100);

    if(blueCells/nCells > 0.5 || (cyanCells+blueCells)/nCells > 0.7) {
        console.log("Safety measure: the field is too wet, not watering!")
        advice = 0;
    }

    return advice;
}

const computeIrrigation = (advice, sectorDetails, maxIrrigation, humidityBins, expectedWater) => {
    //applyWatering rules
    advice = applyWateringRules(advice, humidityBins, maxIrrigation)

    const irrigationQuantity = Math.max(0, advice - expectedWater)

    //compute time
    const wateringCapacity = sectorDetails.dripper_capacity || sectorDetails.sprinkler_capacity
    let duration = Math.ceil(irrigationQuantity / wateringCapacity * 60)

    if (duration < MIN_WATERING_DURATION) {
        duration = 0
    }

    return {
        advice,
        duration
    };
}


export class WateringAdviceService {

    constructor(sequelize) {
        this.dataInterpolatedRepository = new DataInterpolatedRepository(sequelize);
        this.deltaRepository = new DeltaRepository(sequelize);
        this.humidityBinsRepository = new HumidityBinsRepository(sequelize);
        this.viewDataOriginalRepository = new ViewDataOriginalRepository(sequelize);
        this.wateringAggregateRepository = new WateringAggregateRepository(sequelize);
        this.humidityBinsRepository = new HumidityBinsRepository(sequelize);
        this.wateringAdviceRepository = new WateringAdviceRepository(sequelize);
        this.fieldRepository = new FieldRepository(initMatrixProfile(sequelize), initMatrixField(sequelize), initTranscodingField(sequelize), initWateringThesis(sequelize), initWateringSector(sequelize), initWateringAlgorithmParams(sequelize), sequelize);
    
    }

    async getLastWateringAdvice(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp) {
        const result = await this.wateringAdviceRepository.getLastWateringAdvice(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp)
        if (result.length > 0){
            return dtoConverter.convertWateringAdviceWrapper(result)
        }
        return new WateringAdviceDto(refStructureName, companyName, fieldName, sectorName, plantRow)
    }

    async getWateringAdvice(refStructureName, companyName, fieldName, sectorName, plantRow, expectedWater, timestamp) {
        try{

            let r

            const sectorDetails = await this.fieldRepository.getWateringSectorDetails(refStructureName, companyName, fieldName, sectorName, timestamp)
            const algorithmParams = await this.fieldRepository.getWateringAlgorithmParams(refStructureName, companyName, fieldName, sectorName, timestamp)

            const lastImageTimestamp = await this.dataInterpolatedRepository.findLastInterpolationTimestamp(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp);

            if (lastImageTimestamp) {
                const humidityBins = await this.humidityBinsRepository.findHumidityBins(lastImageTimestamp, lastImageTimestamp, refStructureName, companyName, fieldName, sectorName, plantRow)

                const differences = await this.deltaRepository.findPunctualDelta(refStructureName, companyName, fieldName, sectorName, plantRow, lastImageTimestamp)
                r = differences.reduce((acc, curr) => acc + curr.distance, 0) / differences.reduce((acc, curr) => acc + curr.weight, 0)

                const oldParams = await this.getLastWateringAdvice(refStructureName, companyName, fieldName, sectorName, plantRow, Math.min(timestamp - LAST_ADVICE_MIN_DISTANCE, lastImageTimestamp));

                console.log("Last advice params:", oldParams);
                if (oldParams) {
                    let advicePID = oldParams.advice + algorithmParams.kp * (r - oldParams.r) + algorithmParams.ki * r

                    const {advice, duration} = computeIrrigation(advicePID, sectorDetails, algorithmParams.max_irrigation, humidityBins, expectedWater)

                    const lastIrrigation = (await this.viewDataOriginalRepository.findHumidityEventsByFieldReference(
                        ['DRIPPER'], 
                        oldParams.computedOn, 
                        lastImageTimestamp, 
                        refStructureName, 
                        companyName, 
                        fieldName, 
                        sectorName, 
                        plantRow, 
                        (lastImageTimestamp - oldParams.computedOn + 2) * 2))[0]?.value || 0;

                    return new WateringAdviceDto(
                        refStructureName, 
                        companyName, 
                        fieldName, 
                        sectorName, 
                        plantRow, 
                        advice, 
                        lastImageTimestamp, 
                        duration, 
                        timestamp, 
                        timestamp + duration * 60, 
                        r, 
                        algorithmParams.ki, 
                        algorithmParams.kp, 
                        lastIrrigation)

                } else {
                    console.warn("No old params found, using baseline");
                }            
            }

            const {advice, duration} = computeIrrigation(algorithmParams.irrigation_baseline, sectorDetails, algorithmParams.max_irrigation, humidityBins, expectedWater)
            return new WateringAdviceDto(
                refStructureName,
                companyName,
                fieldName,
                sectorName,
                plantRow,
                advice,
                lastImageTimestamp,
                duration,
                timestamp,
                timestamp + duration * 60,
                r)

        }
        catch (error) {
            console.error("Error in getWateringAdvice:", error);
            throw new Error("Failed to compute watering advice");
        }
        
    }
}

export default WateringAdviceService;