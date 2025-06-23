export class InterpolatedDataResponse {

    constructor(values) {
        this.values = values;
    }

}

export class InterpolatedDataValue {

    constructor(refStructureName, companyName, fieldName, plant, measures) {
        this.refStructureName = refStructureName;
        this.companyName = companyName;
        this.fieldName = fieldName;
        this.plant = plant;
        this.measures = measures;
    }

}

export class InterpolatedMeasureData {

    constructor(zz, yy, xx, value) {
        this.zz = zz;
        this.yy = yy;
        this.xx = xx;
        this.value = value;
    }

}

export class InterpolatedMeanMeasureData {

    constructor(zz, yy, xx, std, mean) {
        this.zz = zz;
        this.yy = yy;
        this.xx = xx;
        this.std = std;
        this.mean = mean;
    }

}