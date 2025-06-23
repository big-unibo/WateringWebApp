export class Thesis {
    /**
     * @param {string} source - source
     * @param {string} refStructureName - Reference structure name
     * @param {string} companyName - Company name
     * @param {string} fieldName - Field name
     * @param {string} sectorName - Sector name
     * @param {string} plantRow - Plant row
     * @param {number} dripperPosition - Dripper position
     */
    constructor(
        source,
        refStructureName,
        companyName,
        fieldName,
        sectorName,
        plantRow,
        dripperPosition
    ) {
        this.source = source
        this.refStructureName = refStructureName
        this.companyName = companyName
        this.fieldName = fieldName
        this.sectorName = sectorName
        this.plantRow = plantRow
        this.dripperPosition = dripperPosition
    }
}