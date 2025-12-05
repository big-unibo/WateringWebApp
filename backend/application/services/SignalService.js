import { SignalTargetType } from "../dtos/signalDto.js";
import DtoConverter from './DtoConverter.js';

const dtoConverter = new DtoConverter();

class SignalService{
    constructor(signalRepository){
        this.signalRepository = signalRepository;
    }

    async createSignal(deviceId, signal){
        try {
            const signalCreated = await this.signalRepository.createSignals(deviceId, [signal]);
            return signalCreated[0].id;
        } catch (error) {
            console.error(`Error creating signal: ${error.message}`);
            throw error;
        }
    }

    async assignSignal(signalAssociation) {
        try {
            if (!signalAssociation.sourceId) {
                throw new Error("signalId is required");
            }
            if (!signalAssociation.targetId) {
                throw new Error("targetId is required");
            }
            if (!Object.values(SignalTargetType).includes(signalAssociation.targetType)) {
                throw new Error(`Invalid targetType: ${signalAssociation.targetType}`);
            }

            const validFrom = signalAssociation.validFrom ?? Date.now() / 1000;

            const assingFunctions = {
                [SignalTargetType.FIELD]: async (args) => await this.signalRepository.assignSignalToField(args),
                [SignalTargetType.SECTOR]: async (args) => await this.signalRepository.assignSignalToSector(args),
                [SignalTargetType.THESIS]: async (args) => await this.signalRepository.assignSignalToThesis(args)
            }
        
            await assingFunctions[signalAssociation.targetType]({
                signalId: signalAssociation.sourceId,
                [signalAssociation.targetType + "Id"]: signalAssociation.targetId,
                validFrom
            })
        }catch(error){
            console.error(`Error assigning signal: ${error.message}`);
            throw error; 
        }
    }

    async updateSignal(signalUpdateData){
        try{
            const {id, ...fields} = signalUpdateData;

            await this.signalRepository.updateSignal(
                id,
                Object.fromEntries(Object.entries(fields).filter(([_, v]) => v !== undefined))
            )
        } catch(error){
            console.error(`Error updating signal: ${error.message}`);
            throw error;
        }
    }

    async addMeasurements(measurementsData){
        try{
            const {id, measurements} = measurementsData;
            const mappedMeasurements = measurements.map(m => {
                const dateObj = new Date(m.timestamp * 1000); 
                const value = m.value;

                return{
                    signalId: Number(id),
                    timestamp: Number(m.timestamp),
                    date: dateObj.toISOString().slice(0, 10),         
                    time: dateObj.toISOString().slice(11, 19), 
                    computed: m.computed,
                    value: (typeof value === 'number' && !isNaN(value)) ? value : null,
                    rawValue: (typeof value === 'number' && !isNaN(value)) ? value.toString() : value
                }
            })

            await this.signalRepository.addMeasurements(id,mappedMeasurements);
        } catch(error){
            console.error(`Error creating measurements: ${error.message}`);
            throw error;
        }
    }

    async disableSignal(signalId, validTo){
        await this.signalRepository.disableSignal(signalId, validTo)
    }

    async getSignalInfo(signalId, timestamp){
        const signalAssociations = await this.signalRepository.getSignalAssociationEntries(signalId, timestamp)
        if (signalAssociations?.length > 0){
            return dtoConverter.convertSignalAssociationsEntries(signalAssociations)
        }
    }
}

export default SignalService;