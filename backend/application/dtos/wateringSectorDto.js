export class WateringSectorDto {
    /**
     * @param {string} source - source
     * @param {string} refStructureName - Reference structure name
     * @param {string} companyName - Company name
     * @param {string} fieldName - Field name
     * @param {string} sectorName - Sector name
     * @param {boolean} advice - Flag that indicates if the advice is enabled
     * @param {boolean} prescriptive - Flag that indicates if operate on valves
     * @param {string} valveId - Valve identifier
     * @param {number} dripperCapacity - Dripper capacity
     * @param {number} sprinklerCapacity - Sprinkler capacity
     */
    constructor(
        source,
        refStructureName,
        companyName,
        fieldName,
        sectorName,
        advice,
        prescriptive,
        valveId,
        dripperCapacity,
        sprinklerCapacity
    ) {
        this.source = source
        this.refStructureName = refStructureName
        this.companyName = companyName
        this.fieldName = fieldName
        this.sectorName = sectorName
        this.advice = advice
        this.prescriptive = prescriptive
        this.valveId = valveId
        this.dripperCapacity = dripperCapacity
        this.sprinklerCapacity = sprinklerCapacity
    }
}