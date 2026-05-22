export class Farm{
    constructor(
        farmName,
        companyId,
        location,
        farmId,
        createdAt,
        disabledAt
    ) {
        this.id = farmId;
        this.name = farmName;
        this.companyId = companyId;
        this.location = location;
        this.createdAt = createdAt;
        this.disabledAt = disabledAt;
    }
}


export class FarmData{
    constructor(
        farmId,
        farmName,
        location,
        company,
        sectors,
        createdAt,
        disabledAt
    ) {
        this.id = farmId
        this.name = farmName
        this.location = location
        this.company = company,
        this.sectors = sectors
        this.createdAt = createdAt
        this.disabledAt = disabledAt
    }
}