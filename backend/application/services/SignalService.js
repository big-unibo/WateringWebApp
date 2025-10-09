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
                const dateObj = new Date(m.timestamp); 
                const value = m.value;

                const dateString = dateObj.toISOString().slice(0, 10); 
                const timeString = dateObj.toISOString().slice(11, 19);
                return{
                    signalId: id,
                    timestamp: m.timestamp,
                    date: dateString, 
                    time: timeString,
                    computed: m.computed,
                    value: (typeof value === 'number' && !isNaN(value)) ? value : null,
                    rawValue: (typeof value === 'number' && !isNaN(value)) ? null : value
                }
            })

            await this.signalRepository.addMeasurements(id,mappedMeasurements);
        } catch(error){
            console.error(`Error creating measurements: ${error.message}`);
            throw error;
        }
    }
}

export default SignalService;