import DtoConverter from "./DtoConverter.js";

const dtoConverter = new DtoConverter();

class SectorServicesService {
    constructor(serviceRepository ) {
        this.serviceRepository = serviceRepository;
    }

    async getServices() {
        const result = await this.serviceRepository.getServices();
        return dtoConverter.convertServices(result);
    }

}

export default SectorServicesService