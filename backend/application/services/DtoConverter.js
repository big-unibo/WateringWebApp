import { HumidityBinMeasureData, HumidityBinsDataResponse, InterpolatedDataResponse, InterpolatedImageData, InterpolatedMeanMeasureData, InterpolatedMeansData, InterpolatedMeasureData } from "../dtos/interpolatedDataDto.js";
import { Company } from "../dtos/companyDto.js";
import { SignalData, MeasureData, SignalTypeData } from '../dtos/dataDto.js';
import { WateringScheduleResponse, WateringEventData, ThesisContributionData } from "../dtos/wateringScheduleDto.js";
import { DistanceValue, OptimalDistanceData, DistanceProfile, OptimalProfileData, OptimalStateData } from "../dtos/optStateDto.js";
import { WateringAdvice } from "../dtos/wateringAdviceDto.js";
import { SectorCompact, SectorData } from "../dtos/sectorDto.js";
import { Signal, Device } from "../dtos/deviceDto.js";
import { Thesis,ThesisRef} from "../dtos/thesisDto.js";
import { WateringParams } from "../dtos/wateringParamsDto.js";

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

        return sectorsData.map(s => new SectorCompact(
            s.sectorId,
            s.sectorName,
            s.culture,
            s.cultureType,
            s.location,
            {
                id: s.fieldId,
                name: s.fieldName
            },
            {
                id: s.companyId,
                name: s.companyName
            },
            {
                id: s.organizationId,
                name: s.organizationName
            }
        ));
    }


    convertSectorDataWrapper(sectorData) {
        const theses = sectorData.thesisInSector?.map(t => ({
            id: t.thesisId,
            name: t.thesis?.thesisName
        })) || [];

        const uniqueTheses = Array.from(new Map(theses.map(t => [t.id, t])).values());
        const thesisDtos = uniqueTheses.map(t => new ThesisRef(t.id, t.name));

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


        return new SectorData(
            sectorData.id,
            sectorData.sectorName,
            sectorData.culture,
            sectorData.cultureType,
            sectorData.location,
            sectorData.prescriptive,
            sectorData.advice,
            sectorData.dripperCapacity,
            sectorData.sprinklerCapacity,
            sectorData.doubleWing,
            field,
            company,
            organization,
            thesisDtos
        );
    }

    convertThesisDetailsWrapper(result) {
        return new Thesis(result.thesisName, result.sectorId, result.weight)
    }

    // convertHumidityBinWrapper(wrappers) {
    //     const map = this.#buildGenericReferenceMap(wrappers);

    //     const dataValues = Array.from(map, ([key, values]) => {
    //         const keyObject = JSON.parse(key);
    //         const measures = values.map(value => new HumidityBinMeasureData(value.humidity_bin, value.timestamp, value.count));
    //         return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, undefined, measures);
    //     });

    //     return new DataResponse(dataValues);
    // }

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
                return new SignalData({
                    ...signalGroup,
                    measurements: measurements
                });
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
                    providerId: curr.providerId,
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
                    unit: curr.unit,
                    lastMeasurementTimestamp: curr.lastMeasurementTimestamp,
                    idOnProvider: curr.idOnProvider
                };
            }
            return acc;
        }, {});

        const devicesArray = Object.values(grouped).map(deviceGroup => {
            const signalsArray = Object.values(deviceGroup.signals).map(signalGroup => {
                return new Signal(signalGroup);
            });

            return new Device({
                deviceId: deviceGroup.deviceId,
                deviceType: deviceGroup.deviceType,
                deviceDescription: deviceGroup.deviceDescription,
                providerId: deviceGroup.providerId,
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
                .map(s => new SignalData(s));

            return new SignalTypeData(
                typeGroup.signalType,
                typeGroup.signalTypeDescription,
                signals
            );
        });

        return signalTypeDataArray;
    }

    convertCalendarWrapper(wrappers) {
        const groupedMap = wrappers.reduce((acc, curr) => {
            const sectorIdKey = curr.sectorId;

            if (!acc[sectorIdKey]) {
                acc[sectorIdKey] = {
                    sectorId: curr.sectorId,
                    sectorName: curr.sectorName,
                    events: []
                };
            }

            const sector = acc[sectorIdKey];
            let existingEvent = sector.events.find(event =>
                event.date === curr.date &&
                event.updateTimestamp === curr.updateTimestamp &&
                event.wateringStart === curr.wateringStart &&
                event.wateringEnd === curr.wateringEnd
            );

            if (!existingEvent) {
                existingEvent = {
                    eventId: curr.eventId,
                    date: curr.date,
                    updateTimestamp: curr.updateTimestamp,
                    wateringStart: curr.wateringStart,
                    wateringEnd: curr.wateringEnd,
                    advice: curr.advice,
                    duration: curr.duration,
                    expectedWater: curr.expectedWater,
                    note: curr.note,
                    updatedBy: curr.updatedBy,
                    enabled: curr.enabled ?? false,
                    theses: []
                };
                sector.events.push(existingEvent);
            }

            existingEvent.theses.push(new ThesisContributionData(
                curr.thesisId,
                curr.thesisName,
                curr.weight,
                curr.imageTimestamp
            ));

            return acc;
        }, {});

        const finalResponse = Object.values(groupedMap).map(sectorGroup => {
            const eventsData = sectorGroup.events.map(event => {
                return new WateringEventData(
                    event.eventId,
                    event.date,
                    event.wateringStart,
                    event.wateringEnd,
                    event.duration,
                    event.enabled,
                    event.advice,
                    event.expectedWater,
                    event.note,
                    event.updateTimestamp,
                    event.updatedBy,
                    event.theses
                );
            });
            return new WateringScheduleResponse(
                sectorGroup.sectorId,
                eventsData,
                sectorGroup.sectorName,
            );
        });

        return finalResponse.length > 0 ? finalResponse[0] : null;
    }

    // convertViewDataOriginalWrapper(wrappers) {
    //     const map = wrappers.reduce((accumulator, currentValue) => {
    //         const key = {
    //             refStructureName: currentValue.refStructureName,
    //             companyName: currentValue.companyName,
    //             fieldName: currentValue.fieldName,
    //             sectorName: currentValue.sectorName,
    //             thesisName: currentValue.thesisName,
    //             colture: currentValue.colture,
    //             coltureType: currentValue.coltureType
    //         };
    //         if (accumulator.has(JSON.stringify(key)))
    //             accumulator.get(JSON.stringify(key)).push(currentValue);
    //         else {
    //             accumulator.set(JSON.stringify(key), []);
    //             accumulator.get(JSON.stringify(key)).push(currentValue);
    //         }
    //         return accumulator;
    //     }, new Map());

    //     const dataValues = Array.from(map, ([key, values]) => {
    //         const keyObject = JSON.parse(key);
    //         const colture = new ColtureDto(keyObject.colture, keyObject.coltureType);
    //         const measures = values.map(value => new MeasureData(value.detectedValueTypeDescription, value.timestamp, value.value));
    //         return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, colture, measures);
    //     });

    //     return new DataResponse(dataValues);
    // }

    // convertOptimalDistanceWrapper(wrappers) {
    //     return this.#convertGenericReferenceData(wrappers);
    // }

    // convertWateringScheduleWrapper(wrappers) {
    //     const schedules = wrappers.reduce((accumulator, currentValue) => {
    //         const key = {
    //             source: currentValue.source,
    //             refStructureName: currentValue.refStructureName,
    //             companyName: currentValue.companyName,
    //             fieldName: currentValue.fieldName,
    //             sectorName: currentValue.sectorName
    //         };
    //         if (!accumulator.has(JSON.stringify(key)))
    //             accumulator.set(JSON.stringify(key), []);
    //         accumulator.get(JSON.stringify(key)).push(currentValue);
    //         return accumulator;
    //     }, new Map())

    //     if (schedules.size > 0) {
    //         const [key, events] = schedules.entries().next().value
    //         const { source, refStructureName, companyName, fieldName, sectorName } = JSON.parse(key);
    //         const eventsRes = events.map(event => new WateringEventDto(
    //             event.thesisName,
    //             event.date,
    //             event.wateringStart,
    //             event.wateringEnd,
    //             event.duration,
    //             event.enabled,
    //             event.expectedWater,
    //             event.advice,
    //             event.adviceTimestamp,
    //             event.user !== null ? event.user.dataValues.updatedBy : null,
    //             event.updateTimestamp,
    //             event.note
    //         ));
    //         return new WateringScheduleResponse(source, refStructureName, companyName, fieldName, sectorName, eventsRes)
    //     }
    // }

    convertWateringAlgorithmParamsWrapper(results){
        const {
            maxWatering,
            minWatering,
            wateringBaseline,
            wateringFrequency,
            ki,
            kp,
            errorFunction,
            description
        } = results
        return new WateringParams(maxWatering, minWatering, wateringBaseline, wateringFrequency, ki, kp, errorFunction, description)
    }

    convertOptimalStateWrapper(results) {
        const optimalProfile = results.map(v => new OptimalProfileData(v.x, v.y, v.z, v.value, v.weight))
        return new OptimalStateData(results[0].thesisName, results[0].gridId, results[0].binningId, results[0].validFrom, results[0].validTo, results[0].stopPercentage, results[0].optimalDryBound, results[0].optimalWetBound, optimalProfile)
    }

    convertWateringAdviceWrapper(adviceWrapper) {
        return new WateringAdvice(adviceWrapper.thesisName, adviceWrapper.advice, adviceWrapper.duration, adviceWrapper.imageTimestamp,
            adviceWrapper.wateringStart, adviceWrapper.r, adviceWrapper.lastWatering);
    }

    convertPunctualDistanceWrapper(results) {
        const distances = results.map(v => new OptimalProfileData(v.x, v.y, v.z, v.distance, v.weight))
        return new DistanceProfile(results[0].thesisName, results[0].timestamp, distances)
    }

    convertOptimalDistanceWrapper(wrappers) {
        const grouped = wrappers.reduce((acc, curr) => {
            const typeKey = `${curr.thesisName}_${curr.deviceId}_${curr.valueType}`;
            if (!acc[typeKey]) {
                acc[typeKey] = {
                    thesisName: curr.thesisName,
                    deviceId: curr.deviceId,
                    unit: curr.unit,
                    valueType: curr.valueType,
                    values: []
                };
            }

            acc[typeKey].values.push(curr);

            return acc;
        }, {});


        const signalTypeDataArray = Object.values(grouped).map(typeGroup => {
            const values = (typeGroup.values ?? [])
                .map(s => new DistanceValue(
                    s.value,
                    s.timestamp
                ));

            return new OptimalDistanceData(
                typeGroup.thesisName,
                typeGroup.deviceId,
                typeGroup.unit,
                typeGroup.valueType,
                values
            );
        });

        return signalTypeDataArray;
    }

    convertInterpolatedMeansWrapper(results) {
        const measures = results.map(v => new InterpolatedMeanMeasureData(v.x, v.y, v.z, v.std, v.mean))
        return new InterpolatedMeansData(results[0].thesisName, results[0].deviceId, results[0].binningId , measures)
    }

    // #buildGenericReferenceMap(wrappers) {
    //     return wrappers.reduce((accumulator, currentValue) => {
    //         const key = {
    //             source: currentValue.source,
    //             refStructureName: currentValue.refStructureName,
    //             companyName: currentValue.companyName,
    //             fieldName: currentValue.fieldName,
    //             sectorName: currentValue.sectorName,
    //             thesisName: currentValue.thesisName
    //         };
    //         if (accumulator.has(JSON.stringify(key)))
    //             accumulator.get(JSON.stringify(key)).push(currentValue);
    //         else {
    //             accumulator.set(JSON.stringify(key), []);
    //             accumulator.get(JSON.stringify(key)).push(currentValue);
    //         }
    //         return accumulator;
    //     }, new Map());
    // }

    // #convertGenericReferenceData(wrappers) {
    //     const map = this.#buildGenericReferenceMap(wrappers);

    //     const dataValues = Array.from(map, ([key, values]) => {
    //         const keyObject = JSON.parse(key);
    //         const measures = values.map(value => new MeasureData(value.detectedValueTypeDescription, value.timestamp, value.value));
    //         return new DataValue(keyObject.refStructureName, keyObject.companyName, keyObject.fieldName, keyObject.sectorName, keyObject.thesisName, undefined, measures);
    //     });

    //     return new DataResponse(dataValues);
    // }

}

export default DtoConverter;