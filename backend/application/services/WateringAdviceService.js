import { WateringAdviceDto } from '../dtos/wateringAdviceDto.js';


import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter();

const applyWateringRules = (advice, maxWatering) => {
    //RULE 1: min watering 0
    if (advice < 0) {
        advice = 0;
    }

    //RULE 2: max watering
    if (advice > maxWatering) {
        advice = maxWatering;
    }

    //TODO early stop threshold

    // if(humidityBin){
    //     //RULE 3: Do not water if nCells (-100, 0] > 70 % or (-30, 0] > 50 %
    //     const nCells = humidityBin.reduce((acc, curr) => acc + Number(curr.count), 0);
    //     const blueCells = humidityBin.filter(bin => bin.humidity_bin.split('*')[1] === '(-30, 0]').reduce((acc, curr) => acc + Number(curr.count), 0);
    //     const cyanCells = humidityBin.filter(bin => bin.humidity_bin.split('*')[1] === '(-100, -30]').reduce((acc, curr) => acc + Number(curr.count), 0);

    //     console.log("Cells (-100, 0] (%): ", ((blueCells + cyanCells)/nCells) * 100);
    //     console.log("% Cells (-30, 0] (%): ", blueCells/nCells * 100);

    //     if(blueCells/nCells > 0.5 || (cyanCells+blueCells)/nCells > 0.7) {
    //         console.log("Safety measure: the field is too wet, not watering!")
    //         advice = 0;
    //     }
    // }

    return advice;
}

const computeIrrigation = (advice, sectorDetails, maxWatering, expectedWater) => {
    //applyWatering rules
    advice = applyWateringRules(advice, maxWatering)

    const irrigationQuantity = Math.max(0, advice - expectedWater)

    //compute time
    const wateringCapacity = sectorDetails.dripperCapacity || sectorDetails.sprinklerCapacity
    let duration = Math.ceil(irrigationQuantity / wateringCapacity * 60)

    return {
        advice,
        duration
    };
}


export class WateringAdviceService {

    constructor(wateringAdviceRepository, fieldRepository, interpolatedProfileRepository, optimalDistanceRepository, thesesAllSignalsRepository){
        this.wateringAdviceRepository = wateringAdviceRepository
        this.fieldRepository = fieldRepository
        this.interpolatedProfileRepository = interpolatedProfileRepository
        this.optimalDistanceRepository = optimalDistanceRepository
        this.thesesAllSignalsRepository = thesesAllSignalsRepository
    }

    async getThesisLastWateringAdvice(thesisId, timestamp) {
        const result = await this.wateringAdviceRepository.getThesisLastWateringAdvice(thesisId, timestamp)
        if (result){
            return dtoConverter.convertWateringAdviceWrapper(result)
        }
    }

    async getWateringAdvice(thesisId, expectedWater, timestamp) {
        try{

            let r
            
            const thesisDetails = await this.fieldRepository.getThesisDetails(thesisId, timestamp)
            const algorithmParams = await this.wateringAdviceRepository.getWateringAlgorithmParams(thesisId, timestamp)
            if (!thesisDetails || !algorithmParams) {
                console.warn("Thesis details or algorithm params not found, returning empty advice");
                throw new Error("Thesis details or algorithm params not found");
            }
            const sectorDetails = await this.fieldRepository.getSectorDetails(thesisDetails.sectorId, timestamp)
            if (!sectorDetails){
                console.warn("Sector details not found, returning empty advice");
                throw new Error("Sector details not found");
            }

            const lastImageTimestamp = await this.interpolatedProfileRepository.findLastInterpolationTimestamp(thesisId, timestamp - algorithmParams.wateringFrequency * 3600, timestamp);

            if (lastImageTimestamp) {

                const differences = await this.optimalDistanceRepository.findPunctualDistance(thesisId, lastImageTimestamp)

                if(differences.length > 0){

                    r = differences.reduce((acc, curr) => acc + curr.distance, 0) / differences.reduce((acc, curr) => acc + curr.weight, 0)
                    const oldParams = await this.wateringAdviceRepository.getThesisLastWateringAdvice(thesisId, Math.min(timestamp - (algorithmParams.wateringFrequency/2 * 3600), lastImageTimestamp));

                    if (oldParams.advice != null && oldParams.r != null && oldParams.imageTimestamp != null) {
                        let advicePID = oldParams.advice + algorithmParams.kp * (r - oldParams.r) + algorithmParams.ki * r

                        const {advice, duration} = computeIrrigation(advicePID, sectorDetails, algorithmParams.maxWatering, expectedWater)

                        const lastWatering = (await this.thesesAllSignalsRepository.getMeasurementsByThesis(
                            thesisId,
                            ['DRIPPER'],
                            oldParams.imageTimestamp,
                            lastImageTimestamp,
                            'SUM',
                            (lastImageTimestamp - oldParams.imageTimestamp + 2) * 2
                        ))[0]?.value || 0;

                        return new WateringAdviceDto( 
                            thesisDetails.thesisName, 
                            advice,
                            duration, 
                            Number(lastImageTimestamp), 
                            Number(timestamp), 
                            r,  
                            lastWatering, 
                            false)

                    } else {
                        console.warn("No old params found, using baseline");
                    }            
                }
                else {
                    console.warn("No optimal image found, using baseline");
                }
            } else {
                console.warn("No observed profile found during last irrigation period, using baseline")
            }

            const {advice, duration} = computeIrrigation(algorithmParams.wateringBaseline, sectorDetails, algorithmParams.maxWatering, expectedWater)
            return new WateringAdviceDto(
                thesisDetails.thesisName,
                advice,
                duration,
                Number(lastImageTimestamp),
                Number(timestamp),
                r, undefined, true)
        }
        catch (error) {
            console.error("Error in getWateringAdvice:", error);
            throw new Error("Failed to compute watering advice");
        }
    }

    async setWateringAlgorithmParams(thesisId, wateringParams, validFrom, validTo) {
        await this.wateringAdviceRepository.setWateringAlgorithmParams(thesisId, wateringParams, validFrom, validTo)
    }
}

export default WateringAdviceService;