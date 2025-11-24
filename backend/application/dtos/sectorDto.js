export class Sector {
  /**
   * @param {string} sectorName - Name of the sector
   * @param {number} fieldId - Id of the field this sector belongs to
   * @param {string} culture - Culture of the sector
   * @param {string} [cultureType] - Optional type of culture
   * @param {Object} [location] - Optional location as a geometry object
   * @param {boolean} [prescriptive] - Optional prescriptive flag
   * @param {boolean} [advice] - Optional advice flag
   * @param {number} [dripperCapacity] - Optional dripper capacity
   * @param {number} [sprinklerCapacity] - Optional sprinkler capacity
   * @param {boolean} [doubleWing] - Optional double wing flag
   */
  constructor(
    sectorName,
    fieldId,
    culture,
    cultureType = null,
    location = null,
    prescriptive = null,
    advice = null,
    dripperCapacity = null,
    sprinklerCapacity = null,
    doubleWing = null
  ) {
    this.sectorName = sectorName;
    this.fieldId = fieldId;
    this.culture = culture;
    this.cultureType = cultureType;
    this.location = location;
    this.prescriptive = prescriptive;
    this.advice = advice;
    this.dripperCapacity = dripperCapacity;
    this.sprinklerCapacity = sprinklerCapacity;
    this.doubleWing = doubleWing;
  }
}


export class SectorCompactDto{
  constructor(sectorId, sectorName, culture, cultureType, location, field, company, organization) {
    this.id = sectorId;
    this.name = sectorName;
    this.culture = culture;
    this.cultureType = cultureType;
    this.location = location;
    this.field = field;
    this.company = company;
    this.organization = organization;
  }
}


export class SectorDataDto {
    constructor(
        sectorId,
        sectorName,
        culture,
        cultureType,
        location,
        prescriptive,
        advice,
        dripperCapacity,
        sprinklerCapacity,
        doubleWing,
        field,
        company,
        organization,
        theses
    ) {
        this.sectorId = sectorId;
        this.sectorName = sectorName;
        this.culture = culture;
        this.cultureType = cultureType;
        this.location = location;
        this.prescriptive = prescriptive;
        this.advice = advice;
        this.dripperCapacity = dripperCapacity;
        this.sprinklerCapacity = sprinklerCapacity;
        this.doubleWing = doubleWing;
        this.field = field;
        this.company = company;
        this.organization = organization;
        this.theses = theses;
    }
}