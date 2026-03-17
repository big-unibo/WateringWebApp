import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js";

class SectorServiceRepository {
    constructor(models, sequelize) {
        this.SectorServices = models.SectorServices;
        this.sequelize = sequelize;
    }

    async getSectorServices() {
        try {
            const services = await this.SectorServices.findAll()
            return services;
        } catch (error) {
            throw new Error(`Error retrieving sector services caused by: ${error.message}`);
        }
    }

    async deleteSectorServices(sectorId) {
        try {
            return _deleteFromModelByParams(this.SectorServices, {
                sectorId: sectorId
            })
        } catch (error) {
            throw new Error(`Error deleting sector services: ${error.message}`);
        }
    }
}


export default SectorServiceRepository