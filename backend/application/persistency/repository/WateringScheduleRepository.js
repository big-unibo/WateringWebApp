import { SCHEDULE_SAFE_INTERVAL } from '../../commons/constants.js';
import { Op, where } from "sequelize";


class WateringScheduleRepository {

    constructor(WateringSchedule, WateringThesis, Users, sequelize) {
        this.WateringSchedule = WateringSchedule
        this.WateringThesis = WateringThesis
        this.Users = Users
        this.sequelize = sequelize

        Users.hasMany(WateringSchedule, { foreignKey: 'userid' });
        WateringSchedule.belongsTo(Users, { foreignKey: 'userId' });
    }

    async getSchedule(refStructureName, companyName, fieldName, sectorName, plantRow, timestampFrom, timestampTo) {
        try {
            this.WateringThesis.removeAttribute('id')
            const masterThesis = await this.WateringThesis.findAll({
                attributes: ['timestamp_from', 'timestamp_to', 'plantRow'],
                where: {
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    weight: 1,
                    timestamp_from: { [Op.lt]: timestampTo },
                    timestamp_to: {
                        [Op.or]: {
                            [Op.is]: null,
                            [Op.gt]: timestampFrom
                        },
                    }
                }
            })

            const thesisFilters = masterThesis.map(el => {
                return {
                    watering_start: {
                        [Op.gte]: el.dataValues.timestamp_from,
                        [Op.lte]: el.dataValues.timestamp_to ? el.dataValues.timestamp_to : 9999999999
                    },
                    plantRow: el.dataValues.plantRow
                }
            }).map(filter => { return { [Op.and]: filter } })

            this.WateringSchedule.removeAttribute('id')

            return (await this.WateringSchedule.findAll({
                attributes: ['refStructureName', 'companyName', 'fieldName', 'sectorName', 'plantRow', 'date',
                    ['watering_start', 'wateringStart'], ['watering_end', 'wateringEnd'], 'duration',
                    'enabled', ['expected_water', 'expectedWater'], 'advice', ['advice_timestamp', 'adviceTimestamp'],
                    ['update_timestamp', 'updateTimestamp'], 'note'],
                where: {
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    latest: true,
                    deleted: false,
                    date: {
                        [Op.gte]: new Date(parseFloat(timestampFrom) * 1000).toISOString().split('T')[0],
                        [Op.lte]: new Date(parseFloat(timestampTo) * 1000).toISOString().split('T')[0],
                    },
                    [Op.or]: thesisFilters
                },
                include: {
                    model: this.Users,
                    attributes: [['email', 'updatedBy']]
                },
            })).map(el => el.dataValues);
        } catch (error) {
            console.error('Error on find watering events:', error);
        }
    }

    async updateWateringEvent(refStructureName, companyName, fieldName, sectorName, plantRow, date, wateringStart,
        wateringEnd, duration, enabled, expectedWater, advice, adviceTimestamp, userId, note) {
        try {
            this.WateringSchedule.removeAttribute('id')
            this.WateringSchedule.removeAttribute('userid')
            const activeThesisEvents = await this.WateringSchedule.findAll({
                where: {
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    latest: true,
                    deleted: false,
                    date: date
                }
            })
            if (wateringStart - Math.min(...activeThesisEvents.map(e => e.wateringStart)) < SCHEDULE_SAFE_INTERVAL && new Date(date) !== new Date(wateringStart)) {
                throw Error("Invalid watering start timestamp")
            }

            for (const activeEvent of activeThesisEvents) {
                await this.WateringSchedule.update(
                    {
                        latest: false
                    }, {
                    where: {
                        refStructureName: refStructureName,
                        companyName: companyName,
                        fieldName: fieldName,
                        sectorName: sectorName,
                        plantRow: activeEvent.plantRow,
                        latest: true,
                        deleted: false,
                        date: date,
                        update_timestamp: {
                            [Op.gte]: Math.floor(activeEvent.update_timestamp),
                            [Op.lt]: Math.ceil(activeEvent.update_timestamp)
                        }
                    }
                })
                const newEventModel = this.WateringSchedule.build({
                    refStructureName: refStructureName,
                    companyName: companyName,
                    fieldName: fieldName,
                    sectorName: sectorName,
                    plantRow: activeEvent.plantRow,
                    date: date,
                    watering_start: wateringStart,
                    watering_end: wateringEnd,
                    duration: duration,
                    enabled: enabled,
                    latest: true,
                    expected_water: expectedWater,
                    advice: advice,
                    advice_timestamp: adviceTimestamp,
                    userId: userId,
                    update_timestamp: Date.now() / 1000,
                    note: note,
                    evapotrans: activeEvent.evapotrans,
                    r: activeEvent.r,
                    pluv: activeEvent.pluv,
                    delta: activeEvent.delta,
                    kp: activeEvent.kp,
                    ki: activeEvent.ki
                })
                await newEventModel.save()
            }
            return 
        } catch (error) {
            console.error('Error on update watering event:', error);
        }
    }

    async deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp){
        const numAdviceAfterTimestamp = await this.WateringSchedule.count({
            where:{
                refStructureName: refStructureName,
                companyName: companyName,
                fieldName: fieldName,
                sectorName: sectorName,
                latest: true,
                deleted: false,
                watering_start: {
                    [Op.gt]: timestamp
                },
                date: {
                    [Op.gte]: new Date(timestamp*1000).toISOString().split('T')[0]
                },
                r: {
                    [Op.not]: null
                },
                advice: {
                    [Op.not]: null
                }
            }
        })

        if(numAdviceAfterTimestamp > 0){
            throw Error("Invalid end season timestamp: there are advice computed after given timestamp")
        }

        await this.WateringSchedule.update({
            deleted: true
        }, {
            where: {
                refStructureName: refStructureName,
                companyName: companyName,
                fieldName: fieldName,
                sectorName: sectorName,
                deleted: false,
                watering_start: {
                    [Op.gt]: timestamp
                },
                date: {
                    [Op.gte]: new Date(timestamp*1000).toISOString().split('T')[0]
                }
            }
        })
    }
}

export default WateringScheduleRepository;