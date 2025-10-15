export class InterpolatedDataResponse {

    constructor(thesisName, deviceId, images) {
        this.thesisName = thesisName;
        this.deviceId = deviceId;
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
    constructor(z, y, x, value) {
        this.z = z;
        this.y = y;
        this.x = x;
        this.value = value;
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