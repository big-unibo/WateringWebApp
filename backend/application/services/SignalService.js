class SignalService{
    constructor(signalRepository){
        this.signalRepository = signalRepository;
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
}

export default SignalService;