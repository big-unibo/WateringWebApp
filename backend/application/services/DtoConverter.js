import { InterpolatedDataResponse, InterpolatedDataValue, InterpolatedMeanMeasureData, InterpolatedMeasureData } from "../dtos/interpolatedDataDto.js";
import { ColtureDto } from "../dtos/coltureDto.js";
import { Company } from "../dtos/companyDto.js";
import { DataResponse, SignalData, MeasureData ,SignalTypeData} from '../dtos/dataDto.js';
import { WateringScheduleResponse, WateringEventDto } from "../dtos/wateringScheduleDto.js";
import { MatrixData, MatrixDistanceData, OptStateDto } from "../dtos/optStateDto.js";
import { WateringAdviceDto } from "../dtos/wateringAdviceDto.js";

class DtoConverter {

    convertCompany(company){
        return new Company(
            company.companyName,
            company.organizationId,
            company.id
        );
    }

    convertDataInterpolatedMeanWrapper(refStructureName, companyName, fieldName, sectorName, thesisName, wrappers) {
        const measures = wrappers.map(wrapper => new InterpolatedMeanMeasureData(wrapper.zz, wrapper.yy, wrapper.xx, wrapper.std, wrapper.mean));
        return new InterpolatedDataValue(refStructureName, companyName, fieldName, sectorName, thesisName, measures);
    }

    convertDataInterpolatedWrapper(wrappers){
        const map = this.#buildGenericReferenceMap(wrappers);

        const interpolatedValues = Array.from(map, ([key, values]) => {
            const keyObject = JSON.parse(key);
            const measures = Array.from(values.reduce((accumulator, currentValue) => {
                if (!accumulator.has(currentValue.timestamp))
                    accumulator.set(currentValue.timestamp, []);
                accumulator.get(currentValue.timestamp).push(new InterpolatedMeasureData(currentValue.zz, currentValue.yy, currentValue.xx, currentValue.value));
                return accumulator
            }, new Map()), ([key, values]) => { return { timestamp: key, image: values } })
            return new InterpolatedDataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, measures);
        });

        return new InterpolatedDataResponse(interpolatedValues);
    }

    convertHumidityBinWrapper(wrappers) {
        const map = this.#buildGenericReferenceMap(wrappers);

        const dataValues = Array.from(map, ([key, values]) => {
            const keyObject = JSON.parse(key);
            const measures = values.map(value => new HumidityBinMeasureData(value.humidity_bin, value.timestamp, value.count));
            return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, undefined, measures);
        });

        return new DataResponse(dataValues);
    }

    convertWaterAggregateWrapper(wrappers){
        return this.#convertGenericReferenceData(wrappers);
    }

    convertThesesAllSignalsWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
            const typeKey = `${curr.thesisName}_${curr.signalType}`;
            if (!acc[typeKey]) {
                acc[typeKey] = {
                    thesisName: curr.thesisName,
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    signals: {}
                };
            }

            const signalKey = `${curr.signalId}_${curr.signalDescription}`;
            if (!acc[typeKey].signals[signalKey]) {
                acc[typeKey].signals[signalKey] = {
                    signalId: curr.signalId,
                    deviceId: curr.deviceId,
                    signalDescription: curr.signalDescription,
                    x: curr.x,
                    y: curr.y,
                    z: curr.z,
                    virtual: curr.virtual,
                    unit: curr.unit,
                    values: []
                };
            }

            acc[typeKey].signals[signalKey].values.push(curr);

            return acc;
            }, {});

            const signalTypeDataArray = Object.values(grouped).map(typeGroup => {
                const signals = Object.values(typeGroup.signals).map(signalGroup => {
                    const measurements = signalGroup.values.map(v => new MeasureData(v.timestamp, v.value, v.computed));
                    return new SignalData(
                        signalGroup.signalId,
                        signalGroup.deviceId,
                        signalGroup.signalDescription,
                        signalGroup.x,
                        signalGroup.y,
                        signalGroup.z,
                        signalGroup.virtual,
                        signalGroup.unit,
                        measurements
                    );
                });

            return new SignalTypeData(
                typeGroup.thesisName,
                typeGroup.signalType,
                typeGroup.signalTypeDescription,
                signals
            );
            });

            console.log(signalTypeDataArray)

            return new DataResponse(signalTypeDataArray);
    }


    convertViewDataOriginalWrapper(wrappers) {
        const map = wrappers.reduce((accumulator, currentValue) => {
            const key = {
                refStructureName: currentValue.refStructureName,
                companyName: currentValue.companyName,
                fieldName: currentValue.fieldName,
                sectorName: currentValue.sectorName,
                thesisName: currentValue.thesisName,
                colture: currentValue.colture,
                coltureType: currentValue.coltureType
            };
            if(accumulator.has(JSON.stringify(key)))
                accumulator.get(JSON.stringify(key)).push(currentValue);
            else {
                accumulator.set(JSON.stringify(key), []);
                accumulator.get(JSON.stringify(key)).push(currentValue);
            }
            return accumulator;
        }, new Map());

        const dataValues = Array.from(map, ([key, values]) => {
            const keyObject = JSON.parse(key);
            const colture = new ColtureDto(keyObject.colture, keyObject.coltureType);
            const measures = values.map(value => new MeasureData(value.detectedValueTypeDescription, value.timestamp, value.value));
            return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, colture, measures);
        });

        return new DataResponse(dataValues);
    }

    convertDeltaWrapper(wrappers) {
        return this.#convertGenericReferenceData(wrappers);
    }

    convertWateringScheduleWrapper(wrappers) {
        const schedules = wrappers.reduce((accumulator, currentValue) => {
            const key = {
                source: currentValue.source,
                refStructureName: currentValue.refStructureName,
                companyName: currentValue.companyName,
                fieldName: currentValue.fieldName,
                sectorName: currentValue.sectorName
            };
            if (!accumulator.has(JSON.stringify(key)))
                accumulator.set(JSON.stringify(key), []);
            accumulator.get(JSON.stringify(key)).push(currentValue);
            return accumulator;
        }, new Map())

        if (schedules.size > 0) {
            const [key, events] = schedules.entries().next().value
            const { source, refStructureName, companyName, fieldName, sectorName } = JSON.parse(key);
            const eventsRes = events.map(event => new WateringEventDto(
                event.thesisName,
                event.date,
                event.wateringStart,
                event.wateringEnd,
                event.duration,
                event.enabled,
                event.expectedWater,
                event.advice,
                event.adviceTimestamp,
                event.user !== null ? event.user.dataValues.updatedBy : null,
                event.updateTimestamp,
                event.note
            ));
            return new WateringScheduleResponse(source, refStructureName, companyName, fieldName, sectorName, eventsRes)
        }
    }

    convertOptimalStateWrapper(wrappers){
        const [[jsonKey, values]] = this.#buildGenericReferenceMap(wrappers).entries();
        const key = JSON.parse(jsonKey)
        const exampleData = values[0]
        const optimalState = values.map(v => new MatrixData(v.xx, v.yy, v.zz, v.optValue, v.weight))

        return new OptStateDto(key.refStructureName, key.companyName, key.fieldName, key.sectorName, key.thesisName, 
            exampleData.validFrom, exampleData.validTo, exampleData.matrixId, optimalState)
    }

    convertWateringAdviceWrapper(wrappers){
        const res = wrappers[0]
        return new WateringAdviceDto(res.refStructureName, res.companyName, res.fieldName, res.sectorName, res.thesisName,
            res.advice, res.profile_timestamp, res.duration, res.watering_start, res.watering_end, res.r, res.ki, res.kp, res.lastIrrigation);
    }

    convertPunctualDistanceWrapper(wrappers){
        const [[jsonKey, values]] = this.#buildGenericReferenceMap(wrappers).entries();
        const key = JSON.parse(jsonKey)
        const distances = values.map(v => new MatrixDistanceData(v.xx, v.yy, 0, v.distance, v.weight))
        return new InterpolatedDataValue(key.refStructureName, key.companyName, key.fieldName, key.sectorName, key.thesisName, distances)
    }

    #buildGenericReferenceMap(wrappers) {
        return wrappers.reduce((accumulator, currentValue) => {
            const key = {
                source: currentValue.source,
                refStructureName: currentValue.refStructureName,
                companyName: currentValue.companyName,
                fieldName: currentValue.fieldName,
                sectorName: currentValue.sectorName,
                thesisName: currentValue.thesisName
            };
            if(accumulator.has(JSON.stringify(key)))
                accumulator.get(JSON.stringify(key)).push(currentValue);
            else {
                accumulator.set(JSON.stringify(key), []);
                accumulator.get(JSON.stringify(key)).push(currentValue);
            }
            return accumulator;
        }, new Map());
    }

    #convertGenericReferenceData(wrappers) {
        const map = this.#buildGenericReferenceMap(wrappers);

        const dataValues = Array.from(map, ([key, values]) => {
            const keyObject = JSON.parse(key);
            const measures = values.map(value => new MeasureData(value.detectedValueTypeDescription, value.timestamp, value.value));
            return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, undefined, measures);
        });

        return new DataResponse(dataValues);
    }

}

export default DtoConverter;