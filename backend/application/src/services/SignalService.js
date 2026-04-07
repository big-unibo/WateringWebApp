import { TABLES } from "../commons/constants.js";
import DtoConverter from './DtoConverter.js';
import { _updateEntity } from '../commons/entityServiceUtils.js';
import PaginationService from "./PaginationService.js";

const dtoConverter = new DtoConverter();
const paginationService = new PaginationService()

class SignalService {
    constructor(signalRepository, userActionService) {
        this.signalRepository = signalRepository;
        this.userActionService = userActionService;
    }

    async createSignal(userId, signal) {
        try {
            const signalId = await this.signalRepository.createSignal(signal);
            if (signalId) {
                this.userActionService.logCreation(userId, TABLES.SIGNAL, signalId, null);
                return signalId
            }
        } catch (error) {
            console.error(`Error creating signal: ${error.message}`);
            throw error;
        }
    }
    async updateSignal(userId, signalUpdateData) {
        await _updateEntity(userId, signalUpdateData, this.signalRepository.updateSignal.bind(this.signalRepository), this.userActionService, TABLES.SIGNAL)
    }

    async addMeasurements(measurementsData) {
        try {
            const { id, measurements } = measurementsData;
            const mappedMeasurements = measurements.map(m => {
                const dateObj = new Date(m.timestamp * 1000);
                const value = m.value;

                return {
                    signalId: Number(id),
                    timestamp: Number(m.timestamp),
                    date: dateObj.toISOString().slice(0, 10),
                    time: dateObj.toISOString().slice(11, 19),
                    computed: m.computed,
                    value: (typeof value === 'number' && !isNaN(value)) ? value : null,
                    rawValue: (typeof value === 'number' && !isNaN(value)) ? value.toString() : value
                }
            })

            await this.signalRepository.addMeasurements(id, mappedMeasurements);
        } catch (error) {
            console.error(`Error creating measurements: ${error.message}`);
            throw error;
        }
    }

    async disableSignal(userId, signalId, validTo) {
        try {
            const disabledDeviceSignalIds = await this.signalRepository.disableSignalInDevices(signalId, validTo);
            if (disabledDeviceSignalIds.length > 0) {
                await disabledDeviceSignalIds.map(async (dsId) => {
                    await this.userActionService.logDisabling(userId, TABLES.DEVICE_SIGNAL, dsId);
                })
            }
            await this.signalRepository.disableSignal(signalId, validTo);
            await this.userActionService.logDisabling(userId, TABLES.SIGNAL, signalId);
        }
        catch (error) {
            throw error;
        }
    }

    async getSignals(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds, page, itemsPerPage){
        const signalsCount = await this.signalRepository.countSignals(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds)
        const paginationMetadata = paginationService.computePaginationMetadata(signalsCount, page, itemsPerPage)

        const offset = (paginationMetadata.page - 1) * paginationMetadata.pageSize;
        const limit = paginationMetadata.pageSize;
        const signals = await this.signalRepository.getSignals(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds, offset, limit)
        return {
            data: dtoConverter.convertSignalWrapper(signals),
            pagination: paginationMetadata
        }
        
    }

    async getSignalInfo(signalId, timestamp) {
        const signalInfo = await this.signalRepository.getSignalInfo(signalId, timestamp)
        if (signalInfo?.length > 0) {
            return dtoConverter.convertSignalInfoEntries(signalInfo)[0]
        }
    }

    async getSignalAssociations(signalId, timestamp, userId, isAdmin) {
        const signalAssociations = await this.signalRepository.getSignalAssociationEntries(signalId, timestamp, userId, isAdmin)
        if (signalAssociations?.length > 0) {
            return dtoConverter.convertAssociationsEntries(signalAssociations)
        } 
    }

    async getSignalTypes() {
        const signalTypes = await this.signalRepository.getSignalTypes()
        return dtoConverter.convertSignalTypes(signalTypes)

    }

    async signalExists(signalId) {
        return await this.signalRepository.signalExists(signalId);
    }

    async getProviders() {
        return await this.signalRepository.getProviders();
    }
}

export default SignalService;