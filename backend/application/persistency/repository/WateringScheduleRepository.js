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
        try {
            const query = `
                SELECT 
                    we.sector_id as "sectorId",
                    we.date as "date",
                    we.watering_start as "wateringStart",
                    we.watering_end as "wateringEnd",
                    we.advice as "advice",
                    we.duration as "duration",
                    we.enabled as "enabled",
                    we.expected_water as "expectedWater",
                    we.id as "eventId",
                    we.note as "note",
                    ua.timestamp as "updateTimestamp",
                    u.email as "updatedBy",
                    tis.thesis_id as "thesisId",
                    t.thesis_name as "thesisName",
                    s.sector_name as "sectorName",
                    tis.weight as "weight",
                    a.image_timestamp as "imageTimestamp"
                FROM public.watering_events we
                LEFT JOIN public.users_actions ua 
                    ON we.id = ua.id_key
                    AND ua.table = 'watering_events'
                    AND ua.action = 'UPDATE'
                LEFT JOIN users u
                    ON ua.user_id = u.id
                JOIN theses_in_sectors tis 
                    ON tis.sector_id = we.sector_id
                    AND tis.valid_from <= we.watering_start
                    AND (tis.valid_to IS NULL OR tis.valid_to >= we.watering_start) 
                    AND tis.valid_from <= :timeFilterTo
                    AND (tis.valid_to IS NULL OR tis.valid_to >= :timeFilterFrom)  
                LEFT JOIN advices a
                    ON tis.thesis_id = a.thesis_id
                    AND we.watering_start = a.watering_start
                JOIN theses t 
                    ON t.id = tis.thesis_id
                JOIN sectors s 
                    ON s.id = tis.sector_id
                WHERE we.sector_id = :sectorId
                    AND we.watering_start BETWEEN :timeFilterFrom AND :timeFilterTo
            `;

            const results = await this.sequelize.query(query, {
                replacements: { 
                    sectorId: sectorId, 
                    timeFilterFrom: timeFilterFrom, 
                    timeFilterTo: timeFilterTo 
                },
                type: this.sequelize.QueryTypes.SELECT
            });

            return results;

        } catch (error) {
            throw new Error(`Error while retrieving watering events caused by: ${error.message}`);
        }
    }

    async updateWateringEvent(eventId, fieldsToUpdate) {
        if (fieldsToUpdate.hasOwnProperty('wateringStart') && fieldsToUpdate.wateringStart !== null) {
            const unixSeconds = fieldsToUpdate.wateringStart;
            const dateObj = new Date(unixSeconds * 1000);
            const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
            fieldsToUpdate.date = formattedDate;
        }
        try{
            const event = await this.WateringEvent.findByPk(eventId);
            if(!event) return null;
            return await event.update(fieldsToUpdate);      
        }catch (error){
           throw new Error(`Error while updating watering event caused by: ${error.message}`);
        }
    }

    async findFollowingEvent(eventId){
        const query = `
            WITH reference_event AS (
                SELECT sector_id, watering_start
                FROM watering_events
                WHERE id = :eventId
            )
            SELECT 
                w.id,
                w.sector_id as "sectorId",
                w.date,
                w.watering_start as "wateringStart",
                w.watering_end as "wateringEnd",
                w.advice,
                w.duration,
                w.expected_water as expectedWater,
                w.note,
                w.enabled
            FROM watering_events w
            JOIN reference_event r ON w.sector_id = r.sector_id
            WHERE w.watering_start > r.watering_start
            ORDER BY w.watering_start ASC
            LIMIT 1;
        `

        try{
            const result = await this.sequelize.query(query, {
                replacements: { 
                    eventId: eventId
                },
                type: this.sequelize.QueryTypes.SELECT,
                plain: true
            });

            return result

        } catch (error) {
            throw new Error(`Error while searching following event caused by: ${error.message}`);
        }
    }



    async createWateringEvent({
        sectorId, 
        wateringStart, 
        expectedWater = null, 
        note = null, 
        enabled = true
    }) {
        try {
            let date = null;
            if (wateringStart !== null && wateringStart !== undefined) {
                const dateObj = new Date(wateringStart * 1000);
                date = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2,'0')}-${String(dateObj.getDate()).padStart(2,'0')}`;
            }

            const newEvent = await this.WateringEvent.create({
                sectorId,
                wateringStart,
                expectedWater,
                note,
                enabled,
                date
            });

            return newEvent.id;

        } catch (error) {
            throw new Error(`Error while creating watering event caused by: ${error.message}`);
        }
    }

    async deleteWateringEvents(sectorId, timestamp){
        try {
            const events = await this.WateringEvent.findAll({
                attributes: ['id'],
                where: {
                    sectorId,
                    wateringStart: { [Op.gt]: timestamp },
                    advice: null
                }
            });

            if (events.length === 0) return [];

            const idsToDelete = events.map(e => e.id);

            await this.WateringEvent.destroy({
                where: { id: idsToDelete }
            });

            return idsToDelete;

        } catch (error) {
            throw new Error(`Deletion failed: ${error.message}`);
        }
    }
}

export default WateringScheduleRepository;