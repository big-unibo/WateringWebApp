import { Op, Sequelize } from "sequelize";

class WateringScheduleRepository {
    constructor(models, sequelize){
        this.Thesis = models.Thesis;
        this.ThesisInSector = models.ThesisInSector;
        this.WateringEvent = models.WateringEvent;
        this.User = models.User;
        this.Advice = models.Advice;
        this.sequelize = sequelize;
    }

    async getSchedule(sectorId, timeFilterFrom, timeFilterTo) {
        sectorId = 30
        try {
            const query = `
                SELECT 
                    we.sector_id as "sectorId",
                    we.date as "date",
                    we.update_timestamp as "updateTimestamp",
                    we.watering_start as "wateringStart",
                    we.watering_end as "wateringEnd",
                    we.advice as "advice",
                    we.duration as "duration",
                    we.expected_water as "expectedWater",
                    we.note as "note",
                    u.email as "updatedBy",
                    tis.thesis_id as "thesisId",
                    t.thesis_name as "thesisName",
                    s.sector_name as "sectorName",
                    tis.weight as "weight",
                    a.image_timestamp as "imageTimestamp"

                FROM public.watering_events we
                
                LEFT JOIN public.users u ON we.user_id = u.id
                
                -- INNER JOIN Tesi/Settore (Controlla che l'evento cada nel periodo della tesi)
                INNER JOIN theses_in_sectors tis ON tis.sector_id = we.sector_id
                    AND tis.valid_from <= we.watering_start
                    AND (tis.valid_to IS NULL OR tis.valid_to >= we.watering_start) 
                    AND tis.valid_from <= :timeFilterTo
                    AND (tis.valid_to IS NULL OR tis.valid_to >= :timeFilterFrom)
                    
                LEFT JOIN advices a
                    ON tis.thesis_id = a.thesis_id
                    AND we.watering_start = a.watering_start
                    
                INNER JOIN theses t ON t.id = tis.thesis_id
                INNER JOIN sectors s ON s.id = tis.sector_id
                
                WHERE we.sector_id = :sectorId
                AND we.deleted = false
                AND we.latest = true
                AND we.date BETWEEN 
                    TO_TIMESTAMP(:timeFilterFrom) :: DATE AND 
                    TO_TIMESTAMP(:timeFilterTo) :: DATE
            `;

            const results = await this.sequelize.query(query, {
                replacements: { 
                    sectorId: sectorId, 
                    timeFilterFrom: timeFilterFrom, 
                    timeFilterTo: timeFilterTo 
                },
                type: this.sequelize.QueryTypes.SELECT
            });

            console.log(results); 
            return results;

        } catch (error) {
            console.error('Error on find watering events:', error);
            throw error; 
        }
    }
    }

export default WateringScheduleRepository;


// import { SCHEDULE_SAFE_INTERVAL } from '../../commons/constants.js';
// import { Op, where } from "sequelize";




// class WateringScheduleRepository {

//     constructor(WateringSchedule, WateringThesis, Users, sequelize) {
//         this.WateringSchedule = WateringSchedule
//         this.WateringThesis = WateringThesis
//         this.Users = Users
//         this.sequelize = sequelize

//         Users.hasMany(WateringSchedule, { foreignKey: 'userid' });
//         WateringSchedule.belongsTo(Users, { foreignKey: 'userId' });
//     }

//     async getSchedule(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo) {
//         try {
//             this.WateringThesis.removeAttribute('id')
//             const masterThesis = await this.WateringThesis.findAll({
//                 attributes: ['timestamp_from', 'timestamp_to', 'thesisName'],
//                 where: {
//                     refStructureName: refStructureName,
//                     companyName: companyName,
//                     fieldName: fieldName,
//                     sectorName: sectorName,
//                     weight: 1,
//                     timestamp_from: { [Op.lt]: timestampTo },
//                     timestamp_to: {
//                         [Op.or]: {
//                             [Op.is]: null,
//                             [Op.gt]: timestampFrom
//                         },
//                     }
//                 }
//             })

//             const thesisFilters = masterThesis.map(el => {
//                 return {
//                     watering_start: {
//                         [Op.gte]: el.dataValues.timestamp_from,
//                         [Op.lte]: el.dataValues.timestamp_to ? el.dataValues.timestamp_to : 9999999999
//                     },
//                     thesisName: el.dataValues.thesisName
//                 }
//             }).map(filter => { return { [Op.and]: filter } })

//             this.WateringSchedule.removeAttribute('id')

//             return (await this.WateringSchedule.findAll({
//                 attributes: ['source', 'refStructureName', 'companyName', 'fieldName', 'sectorName', 'thesisName', 'date',
//                     ['watering_start', 'wateringStart'], ['watering_end', 'wateringEnd'], 'duration',
//                     'enabled', ['expected_water', 'expectedWater'], 'advice', ['advice_timestamp', 'adviceTimestamp'],
//                     ['update_timestamp', 'updateTimestamp'], 'note'],
//                 where: {
//                     refStructureName: refStructureName,
//                     companyName: companyName,
//                     fieldName: fieldName,
//                     sectorName: sectorName,
//                     latest: true,
//                     deleted: false,
//                     date: {
//                         [Op.gte]: new Date(parseFloat(timestampFrom) * 1000).toISOString().split('T')[0],
//                         [Op.lte]: new Date(parseFloat(timestampTo) * 1000).toISOString().split('T')[0],
//                     },
//                     [Op.or]: thesisFilters
//                 },
//                 include: {
//                     model: this.Users,
//                     attributes: [['email', 'updatedBy']]
//                 },
//             })).map(el => el.dataValues);
//         } catch (error) {
//             console.error('Error on find watering events:', error);
//         }
//     }

//     async updateWateringEvent(event, userId) {
//         try {
//             if ((Number(event.wateringStart) - (new Date().getTime()/1000)) < SCHEDULE_SAFE_INTERVAL || event.date !== new Date(Number(event.wateringStart)*1000).toISOString().slice(0,10)) {
//                 throw Error("Invalid watering start timestamp")
//             }
//             this.WateringSchedule.removeAttribute('id')
//             this.WateringSchedule.removeAttribute('userid')

//             await this.WateringSchedule.update(
//                 {
//                     latest: false
//                 }, 
//                 {
//                     where: {
//                         source: event.source,
//                         refStructureName: event.refStructureName,
//                         companyName: event.companyName,
//                         fieldName: event.fieldName,
//                         sectorName: event.sectorName,
//                         latest: true,
//                         deleted: false,
//                         date: event.date,
//                         update_timestamp: {
//                             [Op.gte]: Math.floor(event.updateTimestamp),
//                             [Op.lte]: Math.ceil(event.updateTimestamp)
//                         }
//                     }
//                 })
            
//             await this.createWateringEvent(event, userId);

//             return 
//         } catch (error) {
//             console.error('Error on update watering event:', error);
//             throw error;
//         }
//     }

//     async createWateringEvent(event, userId) {
//         try {
//             this.WateringSchedule.removeAttribute('id')
//             this.WateringSchedule.removeAttribute('userid')
//             this.WateringThesis.removeAttribute('id')

//             if ((Number(event.wateringStart) - (new Date().getTime()/1000)) < SCHEDULE_SAFE_INTERVAL || event.date !== new Date(Number(event.wateringStart)*1000).toISOString().slice(0,10)) {
//                 throw Error("Invalid watering start timestamp")
//             }
            
//             const activeThesis = (await this.WateringThesis.findAll({
//                 where: {
//                     source: event.source,
//                     refStructureName: event.refStructureName,
//                     companyName: event.companyName,
//                     fieldName: event.fieldName,
//                     sectorName: event.sectorName,
//                     timestamp_from: { [Op.lt]: event.wateringStart },
//                     timestamp_to: {
//                         [Op.or]: {
//                             [Op.is]: null,
//                             [Op.gt]: event.wateringStart
//                         },
//                     }
//                 }
//             })).map(el => el.dataValues)

//             for (const thesis of activeThesis) {
//                 const newEventModel = this.WateringSchedule.build({
//                     source: event.source,
//                     refStructureName: event.refStructureName,
//                     companyName: event.companyName,
//                     fieldName: event.fieldName,
//                     sectorName: event.sectorName,
//                     thesisName: thesis.thesisName,
//                     date: event.date,
//                     watering_start: event.wateringStart,
//                     enabled: event.enabled,
//                     latest: true,
//                     expected_water: event.expectedWater,
//                     userId: userId,
//                     update_timestamp: Date.now() / 1000,
//                     note: event.note
//                 })
//                 await newEventModel.save()
//             }
//             return
//         } catch (error) {
//             console.error('Error on create watering event:', error);
//             throw error;
//         }
//     }

//     async deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp){
//         const numAdviceAfterTimestamp = await this.WateringSchedule.count({
//             where:{
//                 refStructureName: refStructureName,
//                 companyName: companyName,
//                 fieldName: fieldName,
//                 sectorName: sectorName,
//                 latest: true,
//                 deleted: false,
//                 watering_start: {
//                     [Op.gt]: timestamp
//                 },
//                 date: {
//                     [Op.gte]: new Date(timestamp*1000).toISOString().split('T')[0]
//                 },
//                 r: {
//                     [Op.not]: null
//                 },
//                 advice: {
//                     [Op.not]: null
//                 }
//             }
//         })

//         if(numAdviceAfterTimestamp > 0){
//             throw Error("Invalid end season timestamp: there are advice computed after given timestamp")
//         }

//         await this.WateringSchedule.update({
//             deleted: true
//         }, {
//             where: {
//                 refStructureName: refStructureName,
//                 companyName: companyName,
//                 fieldName: fieldName,
//                 sectorName: sectorName,
//                 deleted: false,
//                 watering_start: {
//                     [Op.gt]: timestamp
//                 },
//                 date: {
//                     [Op.gte]: new Date(timestamp*1000).toISOString().split('T')[0]
//                 }
//             }
//         })
//     }
// }

// export default WateringScheduleRepository;