class SectorServiceRepository {
    constructor(models, sequelize) {
        this.SectorService = models.SectorService;
        this.sequelize = sequelize;
    }

    async getSectorServices() {
        try {
            const services = await this.SectorService.findAll()
            return services;
        } catch (error) {
            throw new Error(`Error retrieving sector services caused by: ${error.message}`);
        }
    }
}


export default SectorServiceRepository