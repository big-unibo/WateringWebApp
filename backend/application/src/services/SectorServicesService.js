import { TABLES } from "../commons/constants.js";
import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

class SectorServicesService {
    constructor(serviceRepository, userActionService ) {
        this.serviceRepository = serviceRepository;
        this.userActionService = userActionService;
    }

    async getServices() {
        const result = await this.serviceRepository.getServices();
        return dtoConverter.convertServices(result);
    }

    async enableSectorService(userId, sectorId, serviceId, validFrom, validTo){
        this.disableSectorService(userId, sectorId, serviceId, validFrom)
        const serviceAssociationId = await this.serviceRepository.enableSectorService(sectorId, serviceId, validFrom, validTo)
        await this.userActionService.logCreation(userId, TABLES.SECTOR_SERVICE, serviceAssociationId)
    }

    async disableSectorService(userId, sectorId, serviceId, validTo) {
        const disabledServiceAssociationId = await this.serviceRepository.disableSectorService(sectorId, serviceId, validTo)
        if (disabledServiceAssociationId) {
            await this.userActionService.logDisabling(userId, TABLES.SECTOR_SERVICE, disabledServiceAssociationId)
        }
    }

}

export default SectorServicesService