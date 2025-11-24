class LogService {

    constructor(logRepository) {
        this.logRepository =logRepository;
    }

    async getThesisLogs(thesisId, timestampFrom, timestampTo) {
        const results = await this.logRepository.getThesisLogs(thesisId, timestampFrom, timestampTo)
        return results
    }
}

export default LogService;