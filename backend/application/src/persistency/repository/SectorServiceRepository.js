import { Op, where } from "sequelize";
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

    async enableSectorService(sectorId, serviceId, validFrom, validTo){
        const model = await this.SectorServices.create({
            sectorId,
            serviceId,
            validFrom,
            validTo
        });
        return model.id;
    }

    async disableSectorService(sectorId, serviceId, validTo) {
        try {
            const [_, updatedRecords] = await this.SectorServices.update({
                validTo
            }, {
                where: {
                    sectorId,
                    serviceId,
                    validFrom: {
                        [Op.lt]: validTo
                    },
                    validTo: {
                        [Op.or]: [
                            { [Op.is]: null },
                            { [Op.gt]: validTo }
                        ]
                    }
                }
            })
            return updatedRecords?.map(r => r.id)
        } catch (error) {
            throw new Error(`Error disabling service in sector caused by: ${error.message}`);
        }
    }

    async deleteSectorServices(sectorId) {
        try {
            return await _deleteFromModelByParams(this.SectorServices, {
                sectorId: sectorId
            })
        } catch (error) {
            throw new Error(`Error deleting sector services: ${error.message}`);
        }
    }
}


export default SectorServiceRepository