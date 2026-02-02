export class Farm{
    constructor(
        farmName,
        companyId,
        location,
        farmId,
    ) {
        this.id = farmId;
        this.name = farmName;
        this.companyId = companyId;
        this.location = location
    }
}


export class FarmData{
    constructor(
        farmId,
        farmName,
        location,
        company,
        sectors
    ) {
        this.id = farmId
        this.name = farmName
        this.location = location
        this.company = company,
        this.sectors = sectors
    }
}