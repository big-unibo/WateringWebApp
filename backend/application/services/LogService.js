class LogService {

    constructor(logRepository, userActionService) {
        this.logRepository =logRepository;
        this.userActionService = userActionService;
    }

    async getThesisLogs(thesisId, timestampFrom, timestampTo) {
        const results = await this.logRepository.getThesisLogs(thesisId, timestampFrom, timestampTo)
        return results
    }
}

export default LogService;