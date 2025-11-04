import { HumidityBinMeasureData, HumidityBinsDataResponse, InterpolatedDataResponse, InterpolatedImageData, InterpolatedMeasureData } from "../dtos/interpolatedDataDto.js";
import { ColtureDto } from "../dtos/coltureDto.js";
import { Company } from "../dtos/companyDto.js";
import { SignalData, MeasureData, SignalTypeData } from '../dtos/dataDto.js';
import { WateringScheduleResponse, WateringEventDto } from "../dtos/wateringScheduleDto.js";
import { MatrixData, MatrixDistanceData, OptStateDto } from "../dtos/optStateDto.js";
import { WateringAdviceDto } from "../dtos/wateringAdviceDto.js";
import { SectorCompactDto, SectorDataDto, ThesisRefDto } from "../dtos/sectorDto.js";
import { Signal, Device } from "../dtos/deviceDto.js";
import { Thesis } from "../dtos/thesisDto.js";

class DtoConverter {

    convertCompany(company) {
        return new Company(
            company.companyName,
            company.organizationId,
            company.id
        );
    }

    convertSectorsDataWrapper(sectorsData) {
        if (!Array.isArray(sectorsData)) return [];

        return sectorsData.map(s => new SectorCompactDto({
            sectorId: s.sectorId,
            sectorName: s.sectorName,
            culture: s.culture,
            cultureType: s.cultureType,
            location: s.location,
            field: {
                id: s.fieldId,
                name: s.fieldName
            },
            company: {
                id: s.companyId,
                name: s.companyName
            },
            organization: {
                id: s.organizationId,
                name: s.organizationName
            }
        }));
    }


    convertSectorDataWrapper(sectorData) {
        const theses = sectorData.thesisInSector?.map(t => ({
            id: t.thesisId,
            name: t.thesis?.thesisName
        })) || [];

        const uniqueTheses = Array.from(new Map(theses.map(t => [t.id, t])).values());
        const thesisDtos = uniqueTheses.map(t => new ThesisRefDto(t));

        const organization = {
            id: sectorData.field.company.organizationId,
            name: sectorData.field.company.organization.organizationName
        };

        const company = {
            id: sectorData.field.companyId,
            name: sectorData.field.company.companyName
        };

        const field = {
            id: sectorData.fieldId,
            name: sectorData.field.fieldName,
            location: sectorData.field.location
        };


        return new SectorDataDto({
            sectorId: sectorData.id,
            sectorName: sectorData.sectorName,
            culture: sectorData.culture,
            cultureType: sectorData.cultureType,
            location: sectorData.location,
            prescriptive: sectorData.prescriptive,
            advice: sectorData.advice,
            dripperCapacity: sectorData.dripperCapacity,
            sprinklerCapacity: sectorData.sprinklerCapacity,
            doubleWing: sectorData.doubleWing,
            field,
            company,
            organization,
            theses: thesisDtos
        });
    }

    convertThesisDetailsWrapper(result){
        return new Thesis(result.thesisName, result.sectorId, result.weight)
    }


    // convertDataInterpolatedMeanWrapper(refStructureName, companyName, fieldName, sectorName, thesisName, wrappers) {
    //     const measures = wrappers.map(wrapper => new InterpolatedMeanMeasureData(wrapper.zz, wrapper.yy, wrapper.xx, wrapper.std, wrapper.mean));
    //     return new InterpolatedDataValue(refStructureName, companyName, fieldName, sectorName, thesisName, measures);
    // }

    // convertDataInterpolatedWrapper(wrappers){
    //     const map = this.#buildGenericReferenceMap(wrappers);

    //     const interpolatedValues = Array.from(map, ([key, values]) => {
    //         const keyObject = JSON.parse(key);
    //         const measures = Array.from(values.reduce((accumulator, currentValue) => {
    //             if (!accumulator.has(currentValue.timestamp))
    //                 accumulator.set(currentValue.timestamp, []);
    //             accumulator.get(currentValue.timestamp).push(new InterpolatedMeasureData(currentValue.zz, currentValue.yy, currentValue.xx, currentValue.value));
    //             return accumulator
    //         }, new Map()), ([key, values]) => { return { timestamp: key, image: values } })
    //         return new InterpolatedDataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, measures);
    //     });

    //     return new InterpolatedDataResponse(interpolatedValues);
    // }

    convertHumidityBinWrapper(wrappers) {
        const map = this.#buildGenericReferenceMap(wrappers);

        const dataValues = Array.from(map, ([key, values]) => {
            const keyObject = JSON.parse(key);
            const measures = values.map(value => new HumidityBinMeasureData(value.humidity_bin, value.timestamp, value.count));
            return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, undefined, measures);
        });

        return new DataResponse(dataValues);
    }

    convertWaterAggregateWrapper(wrappers) {
        return this.#convertGenericReferenceData(wrappers);
    }

    convertMeasurementsDataWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
            const typeKey = `${curr.thesisName}_${curr.signalType}_${curr.signalTypeDescription}`;
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
                const measurements = (signalGroup.values ?? [])
                    .filter(v => v != null && v.timestamp != null && v.value != null)
                    .map(v => new MeasureData(v.timestamp, v.value, v.computed));
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
                typeGroup.signalType,
                typeGroup.signalTypeDescription,
                signals,
                typeGroup.thesisName
            );
        });

        return signalTypeDataArray;
    }

    convertHeatmapDataWrapper(wrappers) {
        if (!wrappers || wrappers.length === 0) {
            return null;
        }
        const { thesisName, deviceId, binningId } = wrappers[0];

        const imagesMap = wrappers.reduce((acc, curr) => {
            const key = curr.timestamp;

            if (!acc[key]) {
                acc[key] = {
                    timestamp: curr.timestamp,
                    measures: []
                };
            }

            acc[key].measures.push(
                new InterpolatedMeasureData(curr.x, curr.y, curr.z, curr.value)
            );

            return acc;
        }, {});

        const images = Object.values(imagesMap).map(
            img => new InterpolatedImageData(img.timestamp, img.measures)
        );
        return new InterpolatedDataResponse(thesisName, deviceId, binningId, images);
    }


    convertHumidityBinsDataWrapper(wrappers) {
        if (!wrappers || wrappers.length === 0) {
            return null;
        }

        const { thesisName, deviceId } = wrappers[0];

        const measures = wrappers.map(curr =>
            new HumidityBinMeasureData(curr.humidityBin, curr.humidityBinDescription, curr.timestamp, curr.count)
        );

        return new HumidityBinsDataResponse(thesisName, deviceId, measures);
    };

    convertDevicesDataWrapper(devicesData) {
        const grouped = devicesData.reduce((acc, curr) => {
            const deviceKey = `${curr.deviceId}`;
            if (!acc[deviceKey]) {
                acc[deviceKey] = {
                    deviceId: curr.deviceId,
                    deviceType: curr.deviceType,
                    deviceDescription: curr.deviceDescription,
                    signals: {}
                };
            }

            const signalKey = `${curr.signalId}`;
            if (!acc[deviceKey].signals[signalKey]) {
                acc[deviceKey].signals[signalKey] = {
                    signalId: curr.signalId,
                    deviceId: curr.deviceId,
                    signalDescription: curr.signalDescription,
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    x: curr.x,
                    y: curr.y,
                    z: curr.z,
                    virtual: curr.virtual,
                    unit: curr.unit
                };
            }
            return acc;
        }, {});

        const devicesArray = Object.values(grouped).map(deviceGroup => {
            const signalsArray = Object.values(deviceGroup.signals).map(signalGroup => {
                return new Signal({
                    signalId: signalGroup.signalId,
                    signalDescription: signalGroup.signalDescription,
                    signalType: signalGroup.signalType,
                    signalTypeDescription: signalGroup.signalTypeDescription,
                    x: signalGroup.x,
                    y: signalGroup.y,
                    z: signalGroup.z,
                    virtual: signalGroup.virtual,
                    unit: signalGroup.unit
                });
            });

            return new Device({
                deviceId: deviceGroup.deviceId,
                deviceType: deviceGroup.deviceType,
                deviceDescription: deviceGroup.deviceDescription,
                signals: signalsArray
            });
        });

        return devicesArray;
    }

    convertSignalsDataWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
            const typeKey = `${curr.signalType}_${curr.signalTypeDescription}`;
            if (!acc[typeKey]) {
                acc[typeKey] = {
                    signalType: curr.signalType,
                    signalTypeDescription: curr.signalTypeDescription,
                    signals: []
                };
            }

            acc[typeKey].signals.push(curr);

            return acc;
        }, {});


        const signalTypeDataArray = Object.values(grouped).map(typeGroup => {
            const signals = (typeGroup.signals ?? [])
                .map(s => new SignalData(
                    s.signalId,
                    s.deviceId,
                    s.signalDescription,
                    s.x,
                    s.y,
                    s.z,
                    s.virtual,
                    s.unit,
                ));

            return new SignalTypeData(
                typeGroup.signalType,
                typeGroup.signalTypeDescription,
                signals
            );
        });

        return signalTypeDataArray;
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
            if (accumulator.has(JSON.stringify(key)))
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

    convertOptimalStateWrapper(wrappers) {
        const [[jsonKey, values]] = this.#buildGenericReferenceMap(wrappers).entries();
        const key = JSON.parse(jsonKey)
        const exampleData = values[0]
        const optimalState = values.map(v => new MatrixData(v.xx, v.yy, v.zz, v.optValue, v.weight))

        return new OptStateDto(key.refStructureName, key.companyName, key.fieldName, key.sectorName, key.thesisName,
            exampleData.validFrom, exampleData.validTo, exampleData.matrixId, optimalState)
    }

    convertWateringAdviceWrapper(adviceWrapper) {
        return new WateringAdviceDto(adviceWrapper.thesisName, adviceWrapper.advice, adviceWrapper.duration, adviceWrapper.imageTimestamp,
            adviceWrapper.wateringStart, adviceWrapper.r, adviceWrapper.lastWatering);
    }

    convertPunctualDistanceWrapper(wrappers) {
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
            if (accumulator.has(JSON.stringify(key)))
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