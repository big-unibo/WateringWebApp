export class CreateThesisDto {
    /**
     * @param {string} thesisName - Name of the thesis
     * @param {number} sectorId - Id of the sector the thesis is applied to
     * @param {number} weight - Weight of the thesis in the sector
     * @param {Date} validFrom - start of validty period for the thesis (optional)
     */
    constructor(
            thesisName, 
            sectorId, 
            weight,
            validFrom
    ) {
        this.thesisName = thesisName;
        this.sectorId = sectorId;
        this.weight = weight;
        this.validFrom = validFrom;
    }
}