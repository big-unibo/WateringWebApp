import { Router } from 'express';

const wateringScheduleRouter = ({ authenticationService, authorizationService, wateringScheduleService }) => {
    const router = Router();

    /**
     * @swagger
     * /wateringSchedule/{thesisId}/calendar:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: TO DO
     *     tags: [Watering Schedule Operation]
     *     description: TO DO
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: number
     *         description: Id of thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
     *     responses:
     *       200:
     *         description: Successfully retrieved signal data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/SignalsDataResponse"
     *       400:
     *         description: Invalid or missing query parameters
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized (user not allowed to view signals)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Authentication failed (invalid or missing JWT)
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
    router.get('/:thesisId/calendar', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        try {
            //[TO DO]: Authorzation
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'companies')))
            //     return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || req.body === '')
                throw new Error('Body is empty');

            const thesisId = parseInt(req.params.thesisId);
             if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
                return res.status(400).json({ message: 'thesis ID is required and must be a number' });
            }

            const result = await wateringScheduleService.getSchedule(thesisId, 1,1762267709);
            res.status(200).json(result);
        } catch (error) {
            console.log(`Failed retrieving calendar caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while retrieving calendar" });
        }
    })

    return router;
};

export default wateringScheduleRouter;

// import { Router } from 'express';

// import sequelize from '../configs/dbConfig.js';

// import WateringScheduleService from '../services/WateringScheduleService.js';
// import AuthenticationService from '../services/AuthenticationService.js';
// import AuthorizationService from '../services/AuthorizationService.js';
// import FieldService from '../services/FieldService.js';


// const wateringScheduleRouter = Router();
// const wateringScheduleService = new WateringScheduleService(sequelize);
// const fieldService = new FieldService(sequelize);
// const authenticationService = new AuthenticationService(sequelize);
// const authorizationService = new AuthorizationService(sequelize)

// /**
//  *
//  * /wateringSchedule/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/calendar:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Get watering calendar for a thesis
//  *     description:  Get watering calendar for a thesis
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
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The thesisName
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *     responses:
//  *       '200':
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/WateringScheduleResponse'
//  *       '400':
//  *         description: Invalid request or thesis not found.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on retrieving data.
//  */
// wateringScheduleRouter.get("/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/calendar", async (req, res) => {
//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timestampFrom = req.query.timeFilterFrom
//     const timestampTo = req.query.timeFilterTo
//     try {

//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestampFrom, timestampTo)))
//             return res.status(401).json({ message: 'Unauthorized request' });
//     } catch (error) {
//         return res.status(403).json({ message: 'Authentication failed' });
//     }

//     try {


//         const result = await wateringScheduleService.getSchedule(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo);
//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// })

// /**
//  *
//  * /wateringSchedule/updateWateringEvent:
//  *   put:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Update a watering event
//  *     description:  Update a watering event with information given in body
//  *     tags: [Watering Schedule Operation]
//  *     requestBody:
//  *         required: true
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/WateringEventUpdateRequest'
//  *     responses:
//  *       '200':
//  *         description: Watering event updated successfully
//  *       '400':
//  *         description: Invalid request.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on update data.
//  */
// wateringScheduleRouter.put("/updateWateringEvent", async (req, res) => {
//     let user
//     try {
//         user = await authenticationService.validateJwt(req.headers.authorization);
//     } catch (error) {
//         console.log(error)
//         return res.status(403).json({ message: 'Authentication failed' });
//     }

//     if (!req.body || req.body === '')
//         return res.status(400).json({ message: 'Invalid request' })

//     if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, req.body.refStructureName, req.body.companyName, req.body.fieldName, req.body.sectorName, req.body.thesisName, 'WA')))
//         return res.status(401).json({ message: 'Unauthorized request' });

//     try {
//         const result = await wateringScheduleService.updateWateringEvent(req.body, user.userid)
//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// })

// /**
//  *
//  * /wateringSchedule/createWateringEvent:
//  *   post:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Create a watering event
//  *     description:  Create a watering event with information given in body
//  *     tags: [Watering Schedule Operation]
//  *     requestBody:
//  *         required: true
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/WateringEventUpdateRequest'
//  *     responses:
//  *       '200':
//  *         description: Watering event created successfully
//  *       '400':
//  *         description: Invalid request.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on event creation.
//  */
// wateringScheduleRouter.post("/createWateringEvent", async (req, res) => {
//     let user
//     try {
//         user = await authenticationService.validateJwt(req.headers.authorization);
//     } catch (error) {
//         console.log(error)
//         return res.status(403).json({ message: 'Authentication failed' });
//     }

//     if (!req.body && req.body === '')
//         return res.status(400).json({ message: 'Invalid request' })

//     if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, req.body.refStructureName, req.body.companyName, req.body.fieldName, req.body.sectorName, req.body.thesisName, 'WA')))
//         return res.status(401).json({ message: 'Unauthorized request' });

//     try {
//         const result = await wateringScheduleService.createWateringEvent(req.body, user.userid)
//         res.status(200).json({ message: 'Watering event created with success' });
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// })

// /**
//  *
//  * /wateringSchedule/{refStructureName}/{companyName}/{fieldName}/{sectorName}/createCalendar:
//  *   post:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Create watering events for a sector
//  *     description:  Crete watering events for a sector based on the watering parameters
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
//  *         name: dateFrom
//  *         required: true
//  *         description: The first date in wich watering events should be created
//  *         schema:
//  *           type: string
//  *           format: date
//  *       - in: query
//  *         name: dateTo
//  *         required: true
//  *         description: The last date in wich watering events should be created
//  *         schema:
//  *           type: string
//  *           format: date
//  *     responses:
//  *       '200':
//  *         description: Calendar events created successfully
//  *       '400':
//  *         description: Invalid request.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on create calendar events.
//  */
// wateringScheduleRouter.post("/:refStructureName/:companyName/:fieldName/:sectorName/createCalendar", async (req, res) => {
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
//     const dateFrom = req.query.dateFrom;
//     const dateTo = req.query.dateTo;

//     if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, null, 'WA')))
//         return res.status(401).json({ message: 'Unauthorized request' });

//     if (!dateFrom || !dateTo || isNaN(new Date(dateFrom).getTime()) || isNaN(new Date(dateTo).getTime())) {
//         return res.status(400).json({ message: 'Invalid request, invalid params dateFrom and dateTo' });
//     }
//     try {
//         if( new Date(dateFrom) > new Date(dateTo)) {
//             return res.status(400).json({ message: 'Invalid request, dateFrom must be before dateTo' });
//         }

//         await wateringScheduleService.createWateringCalendar(refStructureName, companyName, fieldName, sectorName, dateFrom, dateTo, -1);
//         res.status(200).json({message: `Watering calendar create with success`});
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// })

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