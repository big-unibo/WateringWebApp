import { Router } from 'express';
import { WateringEvent } from '../dtos/wateringScheduleDto.js';

const wateringScheduleRouter = ({ authenticationService, authorizationService, wateringScheduleService }) => {
    const router = Router();

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/calendar:
     *   get:
     *     summary: Retrivies calendar data for a given secotr within a time range
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
     *         description: Successfully retrieved signal data
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
            //[TO DO]: Authorzation
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'companies')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const sectorId = parseInt(req.params.sectorId);

            const timeFilterFrom = Number(req.query.timeFilterFrom)
            const timeFilterTo = Number(req.query.timeFilterTo)

            const result = await wateringScheduleService.getSchedule(sectorId, timeFilterFrom, timeFilterTo);
            res.status(200).json(result);
        } catch (error) {
            console.log(`Failed retrieving calendar caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while retrieving calendar" });
        }
    })

    /**
     * @swagger
     * /wateringSchedule/{eventId}/update:
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

    router.put('/:eventId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            //[TO DO]: Authorzation
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'companies')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const eventId = req.params.eventId;

            const allowedFields = ['wateringStart', 'expectedWater', 'note', 'enabled'];
            const fieldsToUpdate = Object.fromEntries(
                allowedFields
                    .filter(k => req.body.hasOwnProperty(k))
                    .map(k => [k, req.body[k]])
            )

            /*Cheking validity of new watering start in relation to the following event */
            if(Object.hasOwn(fieldsToUpdate, 'wateringStart')){
                if(!await wateringScheduleService.isEventUpdateAllowed(eventId, fieldsToUpdate.wateringStart)){
                    return res.status(400).json({ message: "Watering start not allowed for this event" });
                }
            }

            const result = await wateringScheduleService.updateWateringEvent(eventId, fieldsToUpdate);
            if (!result) {
                return res.status(404).json({ message: "No event found with the given id" });
            }
            return res.status(200).json({ message: "Event successfully updated" });
        } catch (error) {
            console.log(`Failed retrieving calendar caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while retrieving calendar" });
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
            //[TO DO]: Authorization
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'watering_events')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const event = new WateringEvent({
                sectorId: req.params.sectorId,
                wateringStart: req.body.wateringStart,
                expectedWater: req.body.expectedWater,
                note: req.body.note,
                enabled: req.body.enabled ?? true
            });

            const newEventId = await wateringScheduleService.createWateringEvent(event);
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
            //[TO DO]: Authorization
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'watering_events')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const sectorId = req.params.sectorId;
            const timestampFrom = req.query.timestampFrom;
            const timestampTo = req.query.timestampTo;


            const newEventIds = await wateringScheduleService.createPeriodicWateringEvent(sectorId, timestampFrom, timestampTo);
            res.status(200).json({ message: 'Watering events created successfully', eventIds: newEventIds });
        } catch (error) {
            console.error(`Error creating watering events: ${error.message}`);
            res.status(500).json({ message: 'Error while creating watering calendar' });
        }
    });

    /**
     * @swagger
     * /wateringSchedule/{sectorId}/endIrrigationSeason:
     *   get:
     *     summary: Stop the irrigation season by deleting all the watering events after a given timestamp or now by defaults
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
     *         description: Succesfully deleted watering events
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Succesfully deleted watering events
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
    router.get('/:sectorId/endIrrigationSeason', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            //[TO DO]: Authorzation
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'companies')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const sectorId = parseInt(req.params.sectorId);
            const timestamp = req.query.timestamp || Date.now()/1000

            const deletedEventsIds = await wateringScheduleService.deleteWateringEvents(sectorId, timestamp);
            res.status(200).json({ message: 'Watering seson ended successfully'});
        } catch (error) {
            console.log(`Failed ending watering seasons caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while trying to end watering season" });
        }
    })

    return router;
};

export default wateringScheduleRouter;

// /**
//  *
//  * /wateringSchedule/{refStructureName}/{companyName}/{fieldName}/{sectorName}/endIrrigationSeason:
//  *   post:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Stop the irrigation season deleting all watering event after a given timestamp or now by default
//  *     description:  Stop the watering advice and the irrigation season deleting all watering event after a given timestamp or now by default
//  *     tags: [Watering Schedule Operation]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The reference structure name
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The company name
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The field name
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The sector name
//  *       - in: query
//  *         name: timestamp
//  *         description: The timestamp of the end of watering season
//  *         schema:
//  *           type: string
//  *     responses:
//  *       '200':
//  *         description: Field updated successfully
//  *       '400':
//  *         description: Invalid request.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on update data.
//  */
// wateringScheduleRouter.post("/:refStructureName/:companyName/:fieldName/:sectorName/endIrrigationSeason", async (req, res) => {
//     let user
//     try {
//         user = await authenticationService.validateJwt(req.headers.authorization);
//     } catch (error) {
//         console.log(error)
//         return res.status(403).json({ message: 'Authentication failed' });
//     }
//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const timestamp = req.query.timestamp || Date.now()/1000

//     if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, null, '*')))
//         return res.status(401).json({ message: 'Unauthorized request' });

//     try {
//         await wateringScheduleService.deleteWateringEvents(refStructureName, companyName, fieldName, sectorName, timestamp)
//         await fieldService.disableWateringBaseline(refStructureName, companyName, fieldName, sectorName, timestamp)
//         await fieldService.disableOptimalState(refStructureName, companyName, fieldName, sectorName, timestamp)
//         res.status(200).json({message: `Irrigation season stopped with success`});
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// })


// export default wateringScheduleRouter;