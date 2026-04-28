import { Router } from 'express';
import { WateringEvent } from '../dtos/wateringScheduleDto.js';
import { SCHEDULE_SAFE_INTERVAL } from '../commons/constants.js';
import { ROLES } from '../commons/permissionRoles.js';

const wateringScheduleRouter = ({ authenticationService, authorizationService, wateringScheduleService, fieldService }) => {
    const router = Router();

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/calendar:
     *   get:
     *     summary: Retrivies calendar data for a given sector within a time range
     *     tags: [Watering Schedule Operation]
     *     description: Returns every watering event for a given sector and within a given time range, also including the contribution of every thesis for the event. Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the sector
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds elapsed since 1/1/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds elapsed since 1/1/1970)
     *     responses:
     *       200:
     *         description: Successfully retrieved sector calendar data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/WateringScheduleResponse"
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation.
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation.
     *                       message:
     *                         type: string
     *                         description: Description of the error.
     *       '401':
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to view calendar
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/:sectorId/calendar', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const sectorId = parseInt(req.params.sectorId);
            const exists = await fieldService.sectorExists(sectorId);
            if (!exists) {
                return res.status(404).json({ message: 'Sector not found' });
            }
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'SECTOR', sectorId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const timeFilterFrom = Number(req.query.timeFilterFrom)
            const timeFilterTo = Number(req.query.timeFilterTo)

            const result = await wateringScheduleService.getSectorSchedules(sectorId, timeFilterFrom, timeFilterTo);
            res.status(200).json(result);
        } catch (error) {
            console.log(`Failed retrieving calendar caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while retrieving calendar" });
        }
    })

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/{eventId}/update:
     *   put:
     *     summary: Updates a watering event with the specified fields
     *     tags: [Watering Schedule Operation]
     *     description: Updates the specified watering event. Only the fields provided in the request body will be updated. Fields can be set to null if needed. Requires authentication and proper Authorization.
     *     parameters:
     *       - in: path
     *         name: eventId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the watering event to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: "#/components/schemas/UpdateWateringEvent"
     *     responses:
     *       200:
     *         description: Event successfully updated
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Event successfully updated
     *       400:
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation
     *                       message:
     *                         type: string
     *                         description: Description of the error
     *       401:
     *         description: Authentication failed – invalid or missing JWT token
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized – user does not have permission to update the event
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Event not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */

    router.put('/:sectorId/:eventId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const userId = requestUserData.userId
            if (!(await authorizationService.isUserAuthorized(userId, ROLES.PLANNER, requestUserData.isAdmin, 'SECTOR', req.params.sectorId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }
            const eventId = req.params.eventId;

            const allowedFields = ['wateringStart', 'expectedWater', 'note', 'enabled'];
            const fieldsToUpdate = Object.fromEntries(
                allowedFields
                    .filter(k => req.body.hasOwnProperty(k))
                    .map(k => [k, req.body[k]])
            )

            /*Cheking validity of new watering start in relation to the following event */
            if (Object.hasOwn(fieldsToUpdate, 'wateringStart')) {
                if (!await wateringScheduleService.isEventUpdateAllowed(eventId, fieldsToUpdate.wateringStart)) {
                    return res.status(400).json({ message: "Watering start not allowed for this event" });
                }
            }

            const result = await wateringScheduleService.updateWateringEvent(userId, eventId, fieldsToUpdate);
            if (!result) {
                return res.status(404).json({ message: "No event found with the given id" });
            }
            return res.status(200).json({ message: "Event successfully updated" });
        } catch (error) {
            console.log(`Failed updating event, cause: ${error.message}`);
            return res.status(500).json({ message: "Error while updating event" });
        }
    })

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/createEvent:
     *   post:
     *     summary: Create a new watering event
     *     tags: [Watering Schedule Operation]
     *     description: Creates a new watering event with the provided details. Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the sector to create the watering event for
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema: 
     *              $ref: "#/components/schemas/WateringEvent"
     *     responses:
     *       200:
     *         description: Watering event created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 eventId:
     *                   type: integer
     *                   description: ID of the newly created event
     *       400:
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation
     *                       message:
     *                         type: string
     *                         description: Description of the error
     *       '401':
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to view calendar
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */

    router.post('/:sectorId/createEvent', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId

            const sectorId = req.params.sectorId
            const exists = await fieldService.sectorExists(sectorId);
            if (!exists) {
                return res.status(404).json({ message: 'Sector not found' });
            }
            if (!(await authorizationService.isUserAuthorized(userId, ROLES.PLANNER, requestUserData.isAdmin, 'SECTOR', sectorId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            if( req.body.wateringStart < Date.now()/1000 + SCHEDULE_SAFE_INTERVAL){
                return res.status(400).json({message: 'Invalid watering start provided! It is not possible create event in the past'})
            }

            const event = new WateringEvent({
                sectorId: sectorId,
                wateringStart: req.body.wateringStart,
                expectedWater: req.body.expectedWater,
                note: req.body.note,
                enabled: req.body.enabled ?? true
            });

            const newEventId = await wateringScheduleService.createWateringEvent(userId, event);
            res.status(200).json({ message: 'Watering event created successfully', eventId: newEventId });
        } catch (error) {
            console.error(`Error creating watering event: ${error.message}`);
            res.status(500).json({ message: 'Error while creating watering event' });
        }
    });

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/createCalendar:
     *   post:
     *     summary: Create periodic watering events for a sector
     *     tags: [Watering Schedule Operation]
     *     description: |
     *        Creates multiple watering events for a given sector within the specified time range based on the watering algorithm.  
     *        Requires authentication and proper authorization.  
     *        Steps performed:  
     *            - The `timestampFrom` sets the watering_start timestamp for the first event.  
     *            - Subsequent events are generated following the frequency defined in the watering algorithms assigned to theses of the sector.  
     *            - Events are not generated beyond the `timestampTo` threshold.  
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the sector to create the watering events for
     *       - in: query
     *         name: timestampFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Start timestamp (in seconds since Unix epoch) for the watering events
     *       - in: query
     *         name: timestampTo
     *         required: true
     *         schema:
     *           type: number
     *         description: End timestamp (in seconds since Unix epoch) for the watering events
     *     responses:
     *       200:
     *         description: Watering events created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Watering events created successfully
     *                 eventIds:
     *                   type: array
     *                   description: IDs of the newly created watering events
     *                   items:
     *                     type: integer
     *       400:
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation.
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation.
     *                       message:
     *                         type: string
     *                         description: Description of the error.
     *       401:
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Authentication failed
     *       403:
     *         description: Unauthorized – user does not have permission to create watering events
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Unauthorized request
     *       '404':
     *         description: Resource not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Error while creating watering calendar
     */

    router.post('/:sectorId/createCalendar', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId
            const sectorId = req.params.sectorId;
            const exists = await fieldService.sectorExists(sectorId);
            if (!exists) {
                return res.status(404).json({ message: 'Sector not found' });
            }
            if (!(await authorizationService.isUserAuthorized(userId, ROLES.PLANNER, requestUserData.isAdmin, 'SECTOR', sectorId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }
            const timestampFrom = req.query.timestampFrom;
            const timestampTo = req.query.timestampTo;

            if(timestampFrom > timestampTo || timestampFrom < Date.now()/1000 + SCHEDULE_SAFE_INTERVAL){
                return res.status(400).json({message: 'Invalid time range params! It is not possible create event in the past'})
            }

            const newEventIds = await wateringScheduleService.createPeriodicWateringEvent(userId, sectorId, Number(timestampFrom), Number(timestampTo));
            res.status(200).json({ message: 'Watering events created successfully', eventIds: newEventIds });
        } catch (error) {
            console.error(`Error creating watering events: ${error.message}`);
            res.status(500).json({ message: 'Error while creating watering calendar' });
        }
    });

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/endIrrigationSeason:
     *   post:
     *     summary: Stop the irrigation season by deleting all the watering events after a given timestamp or now + safety period by defaults
     *     tags: [Watering Schedule Operation]
     *     description: Deletes all of the watering events present with watering start after a given timestamp and no advice calculated. Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the sector
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: Timestamp of watering season end (timestamp in seconds elapsed since 1/1/1970)
     *     responses:
     *       200:
     *         description: successfully deleted watering events
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: successfully deleted watering events
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation.
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation.
     *                       message:
     *                         type: string
     *                         description: Description of the error.
     *       '401':
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to end watering season
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.post('/:sectorId/endIrrigationSeason', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const userId = requestUserData.userId

            const now = Date.now() / 1000
            const sectorId = parseInt(req.params.sectorId);
            const exists = await fieldService.sectorExists(sectorId);
            if (!exists) {
                return res.status(404).json({ message: 'Sector not found' });
            }

            if (!(await authorizationService.isUserAuthorized(userId, ROLES.PLANNER, 'SECTOR', requestUserData.isAdmin, sectorId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const timestamp = req.query.timestamp || now + SCHEDULE_SAFE_INTERVAL
            if (req.query.timestamp < now + SCHEDULE_SAFE_INTERVAL) {
                return res.status(400).json({ message: "End timestamp is too soon" });
            }

            const deletedEventsIds = await wateringScheduleService.deleteWateringEvents(userId, sectorId, timestamp);
            res.status(200).json({ message: 'Irrigation season ended successfully' });
        } catch (error) {
            console.log(`Failed ending watering seasons caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while trying to end watering season" });
        }
    })

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/{eventId}/schedule:
     *   put:
     *     summary: Updates a watering event by scheduling it
     *     tags: [Watering Schedule Operation]
     *     description: Schedules a specific event Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: eventId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the watering event to schedule
     *     responses:
     *       200:
     *         description: Event successfully scheduled
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Event successfully scheduled
     *       400:
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation
     *                       message:
     *                         type: string
     *                         description: Description of the error
     *       401:
     *         description: Authentication failed – invalid or missing JWT token
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized – user does not have permission to schedule the event
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Event not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */

    router.put('/:sectorId/:eventId/schedule', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }


        const userId = requestUserData.userId
        const eventId = req.params.eventId;
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.PLANNER, requestUserData.isAdmin, 'SECTOR', req.params.sectorId, 'Prescriptive Watering Advice'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const event = await wateringScheduleService.validateEventForScheduling(eventId);
            await wateringScheduleService.scheduleWateringEvent(userId, eventId);
            return res.status(200).json({ message: "Event successfully scheduled" });

        } catch (error) {
            if (error.code === "EVENT_NOT_FOUND") {
                return res.status(404).json({ message: "No event found with the given id" });
            }

            if (error.code === "EVENT_NOT_COMPUTED") {
                return res.status(400).json({ message: "Event has not yet been computed" });
            }

            console.error(error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    })

    /**
     * @swagger
     * /wateringSchedule/:
     *   get:
     *     summary: Retrivies all events within a time range for requesting user grouped by sector
     *     tags: [Watering Schedule Operation]
     *     description: Retrivies all events within a time range for requesting user grouped by sector.
     *     parameters:
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds elapsed since 1/1/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds elapsed since 1/1/1970)
     *     responses:
     *       200:
     *         description: Successfully retrieved events data
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: "#/components/schemas/WateringScheduleResponse"
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Input validation failed against OpenAPI schema
     *                 errors:
     *                   type: array
     *                   description: Details of the OpenAPI schema violation.
     *                   items:
     *                     type: object
     *                     properties:
     *                       path:
     *                         type: string
     *                         description: Field or path that failed validation.
     *                       message:
     *                         type: string
     *                         description: Description of the error.
     *       '401':
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization)
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' })
        }
        try {
            const timeFilterFrom = Number(req.query.timeFilterFrom)
            const timeFilterTo = Number(req.query.timeFilterTo)

            let userAvailableSectorIds = await authorizationService.getAvailableEntityIds(requestUserData.userId, 'SECTOR', ROLES.VIEWER, requestUserData.isAdmin,'Watering Advice')
            if (Array.isArray(userAvailableSectorIds) && userAvailableSectorIds.length > 0)
            {
                if (userAvailableSectorIds.includes('ALL')) {
                    userAvailableSectorIds = null
                }
                const result = await wateringScheduleService.getUserWateringEvents(userAvailableSectorIds, timeFilterFrom, timeFilterTo, requestUserData.userId)
                res.status(200).json(result);
            } 
        } catch (error) {
            console.log(`Failed retrieving calendar caused by: ${error.message}`)
            return res.status(500).json({ message: "Error while retrieving calendar" })
        }
    })

    return router;
};

export default wateringScheduleRouter;