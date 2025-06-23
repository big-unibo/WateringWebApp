export class HumidityBinWrapper {

    constructor(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp, count, humidity_bin) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.sectorName = sectorName;
        this.plantRow = plantRow;
        this.timestamp = timestamp;
        this.count = count;
        this.humidity_bin = humidity_bin;
    }

}