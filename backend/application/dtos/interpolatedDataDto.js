export class InterpolatedDataResponse {

    constructor(thesisName, deviceId, binningId, images) {
        this.thesisName = thesisName;
        this.deviceId = deviceId;
        this.binningId = binningId;
        this.images = images;
    }

}

export class InterpolatedImageData {
    constructor(timestamp, image) {
        this.timestamp = timestamp;
        this.image = image;
    }
}


export class InterpolatedMeasureData {
    constructor(x, y, z, value) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.value = value;
    }
}

export class HumidityBinsDataResponse {
    constructor(thesisName, deviceId, measures) {
        this.thesisName = thesisName;
        this.deviceId = deviceId;
        this.measures = measures;
    }
}


export class HumidityBinMeasureData {
    constructor(humidityBin, humidityBinDescription, timestamp, count) {
        this.humidityBin = humidityBin;
        this.humidityBinDescription = humidityBinDescription;
        this.timestamp = timestamp;
        this.count = count;
    }
}

// export class InterpolatedMeanMeasureData {

//     constructor(zz, yy, xx, std, mean) {
//         this.zz = zz;
//         this.yy = yy;
//         this.xx = xx;
//         this.std = std;
//         this.mean = mean;
//     }

// }