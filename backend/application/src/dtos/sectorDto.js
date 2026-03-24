export class Sector {
  /**
   * @param {string} sectorName - Name of the sector
   * @param {number} farmId - Id of the farm this sector belongs to
   * @param {string} culture - Culture of the sector
   * @param {string} [cultureType] - Optional type of culture
   * @param {Object} [location] - Optional location as a geometry object
   * @param {number} [dripperCapacity] - Optional dripper capacity
   * @param {number} [sprinklerCapacity] - Optional sprinkler capacity
   * @param {boolean} [doubleWing] - Optional double wing flag
   */
  constructor(
    sectorName,
    farmId,
    culture,
    cultureType,
    location,
    dripperCapacity,
    sprinklerCapacity,
    doubleWing
  ) {
    this.name = sectorName;
    this.farmId = farmId;
    this.culture = culture;
    this.cultureType = cultureType;
    this.location = location;
    this.dripperCapacity = dripperCapacity;
    this.sprinklerCapacity = sprinklerCapacity;
    this.doubleWing = doubleWing;
  }
}


export class SectorCompact{
  constructor(sectorId, sectorName, culture, cultureType, location, farm, company, organization) {
    this.id = sectorId;
    this.name = sectorName;
    this.culture = culture;
    this.cultureType = cultureType;
    this.location = location;
    this.farm = farm;
    this.company = company;
    this.organization = organization;
  }
}


export class SectorData {
    constructor(
        sectorId,
        sectorName,
        culture,
        cultureType,
        location,
        dripperCapacity,
        sprinklerCapacity,
        doubleWing,
        farm,
        company,
        theses
    ) {
        this.id = sectorId;
        this.name = sectorName;
        this.culture = culture;
        this.cultureType = cultureType;
        this.location = location;
        this.dripperCapacity = dripperCapacity;
        this.sprinklerCapacity = sprinklerCapacity;
        this.doubleWing = doubleWing;
        this.farm = farm;
        this.company = company;
        this.theses = theses;
    }
}

export class Service {
  constructor(serviceName, serviceId){
    this.name = serviceName
    this.id = serviceId
  }
}

export class SectorService extends Service {
  constructor(serviceName, serviceId, validFrom, validTo){
    super(serviceName, serviceId);
    this.validFrom = validFrom;
    this.validTo = validTo;
  }
}