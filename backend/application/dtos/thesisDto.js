export class Thesis {
    /**
     * @param {string} thesisName - Name of the thesis
     * @param {number} sectorId - Id of the sector the thesis is applied to
     * @param {number} validFrom - start of validty period for the thesis (optional)
     */
    constructor(
            thesisName, 
            sectorId, 
            validFrom
    ) {
        this.thesisName = thesisName;
        this.sectorId = sectorId;
        this.validFrom = validFrom;
    }
}