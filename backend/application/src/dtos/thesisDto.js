export class Thesis {
    /**
     * @param {string} thesisName - Name of the thesis
     * @param {number} sectorId - Id of the sector the thesis is applied to
     * @param {number} weight - weight of thesis advice in sector (optional) 
     * @param {number} validFrom - start of validty period for the thesis (optional)
     * @param {number} validTo - end of validty period for the thesis (optional)
     */
    constructor(
            thesisName,
            sectorId,
            weight,
            validFrom,
            validTo
    ) {
        this.thesisName = thesisName
        this.sectorId = sectorId
        this.validFrom = validFrom
        this.validTo = validTo
        this.weight = weight
    }
}

export class ThesisRef {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

export class ThesisData{
    constructor(
        thesisId,
        thesisName,
        validFrom,
        validTo,
        weight,
        organization,
        company,
        field,
        sector
    ) {
        this.thesisId = thesisId
        this.thesisName = thesisName
        this.validFrom = validFrom
        this.validTo = validTo
        this.weight = weight
        this.organization = organization,
        this.company = company,
        this.field = field,
        this.sector = sector
    }
}