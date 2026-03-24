import { Op, where } from "sequelize";
import { _deleteFromModelByParams } from "../../commons/repositoryUtils.js";
import { removeUndefined } from "../../commons/utils.js";

class SectorServiceRepository {
    constructor(models, sequelize) {
        this.SectorServices = models.SectorServices;
        this.Service = models.Service;
        this.sequelize = sequelize;
    }

    async getServices() {
        try {
            const services = await this.Service.findAll()
            return services;
        } catch (error) {
            throw new Error(`Error retrieving sector services caused by: ${error.message}`);
        }
    }

    async getSectorServices(sectorId, timeFilterFrom, timeFilterTo){
        try {
            const sectorServices = await this.SectorServices.findAll({
                where: {
                    sectorId: sectorId,
                    validFrom: { [Op.lte]: timeFilterTo },
                    validTo: {
                        [Op.or]: [
                            { [Op.is]: null },
                            { [Op.gt]:  timeFilterFrom}
                        ]
                    }
                },
                include: [
                    {
                        model: this.Service,
                        as: 'service'
                    }
                ]
            })
            return sectorServices;
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

    async deleteSectorServices(sectorId, serviceId) {
        try {
            return await _deleteFromModelByParams(this.SectorServices, removeUndefined({ sectorId, serviceId }))
        } catch (error) {
            throw new Error(`Error deleting sector services: ${error.message}`);
        }
    }
}


export default SectorServiceRepository