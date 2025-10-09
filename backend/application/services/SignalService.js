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
}

export default SignalService;