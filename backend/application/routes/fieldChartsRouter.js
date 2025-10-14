import { Router } from 'express';

import { InterpolatedDataResponse } from '../dtos/interpolatedDataDto.js';

const fieldChartRouter = ({authenticationService, authorizationService, fieldService}) => {
    const router = Router();

    /**
     * @swagger
     * /fieldCharts/{thesisId}/signals:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Retrieves data for one or more given types of signals for a given thesis, optionally filtered by time
     *     tags: [Field Chart Data]
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the Thesis
     *       - in: query
     *         name: signalTypes
     *         required: true
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *           collectionFormat: multi
     *         description: Array of Signal Types 
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
     *               type: object
     *               properties:
     *                 values:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       thesisName:
     *                         type: string
     *                       signalType:
     *                         type: string
     *                       signalTypeDescription:
     *                         type: string
     *                       signals:
     *                         type: array
     *                         items:
     *                           type: object
     *                           properties:
     *                             signalId:
     *                               type: integer
     *                             deviceId:
     *                               type: integer
     *                             signalDescription:
     *                               type: string
     *                             x:
     *                               type: number
     *                             y:
     *                               type: number
     *                             z:
     *                               type: number
     *                             virtual:
     *                               type: boolean
     *                             unit:
     *                               type: string
     *                             measurements:
     *                               type: array
     *                               items:
     *                                 type: object
     *                                 properties:
     *                                   timestamp:
     *                                     type: integer
     *                                   value:
     *                                     type: object
     *                                     description: Can be a single value or an array
     *                                   computed:
     *                                     type: boolean
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


    router.get('/:thesisId/signals', async (req, res) => {
        const thesisId = parseInt(req.params.thesisId);

        // signalTypes come in query string: ?signalTypes=1&signalTypes=2
        let signalTypes = req.query.signalTypes || [];
        if (!Array.isArray(signalTypes)) signalTypes = [signalTypes];
        //signalTypes = signalTypes.map(s => `'${s}'`);

        const timeFilterFrom = req.query.timeFilterFrom
            ? Number(req.query.timeFilterFrom)
            : null;

        const timeFilterTo = req.query.timeFilterTo
            ? Number(req.query.timeFilterTo)
            : null;
        
        if (timeFilterFrom === null || isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid date' });
        }
        if (!timeFilterTo === null || isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid date' });
        }

        try {
            const results = await fieldService.getHumidityEventsByThesis(
                thesisId,
                signalTypes,
                timeFilterFrom,
                timeFilterTo
            );
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });
    return router;
}

export default fieldChartRouter;


// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/groundWaterPotential:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves ground water potential data
//  *     tags: [Field Chart Data]
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
//  *         description: Time filter from
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         description: Time filter to
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/groundWaterPotential', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {

//         const detectedValueTypeId = ['GRND_WATER_G', 'GRND_WATER_W', 'GRND_WATER'];

//         const result = await fieldService.getAverageByFieldReference(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/dripperAndPluv:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves dripper, pluv and sprinkler punctual data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/dripperAndPluv', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {
//         const detectedValueTypeId = ['DRIPPER', 'PLUV_CURR', 'SPRINKLER'];

//         const result = await fieldService.getHumidityEventsByFieldReference(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }


// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/dripper:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves dripper data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true 
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/dripper', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         console.log(error)
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {
//         const detectedValueTypeId = ['DRIPPER'];

//         const result = await fieldService.getHumidityEventsByFieldReference(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }


// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/pluv:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves pluv data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/pluv', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {
//         const detectedValueTypeId = ['PLUV_CURR'];

//         const result = await fieldService.getHumidityEventsByFieldReference(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }


// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/waterAggregate:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves watering data for the field aggregated daily, including for example dripper, pluv and sprinkler
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/waterAggregate', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {
//         const result = await fieldService.getWaterAggregate(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/airTemp:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves air temperature data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/airTemp', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {
//         const detectedValueTypeId = ['AIR_TEMP', 'AIR_TEMP_FOL'];

//         const result = await fieldService.getAverageByFieldReference(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/groundTemp:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves ground temperature data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/groundTemp', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {
//         const detectedValueTypeId = ['GRND_TEMP'];

//         const result = await fieldService.getAverageByFieldReference(detectedValueTypeId, timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/electricalConductivity:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves ec average data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/electricalConductivity', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }
    
//     try {
//         const result = await fieldService.getEcAverageByFieldReference(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/humidityBins:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves humidity bins data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/humidityBins', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {

//         const result = await fieldService.getHumidityBins(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/dynamicHeatmap:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves dynamic heatmap data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/dynamicHeatmap', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }
    
//     try {


//         const result = await fieldService.getDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, thesisName, timeFilterFrom, timeFilterTo);

//         res.status(200).json(result);

//     } catch (error) {
//         res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/heatmap:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves heatmap data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/heatmap', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timestampFrom = req.query.timeFilterFrom
//     const timestampTo = req.query.timeFilterTo

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestampFrom, timestampTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {

//         const result = await fieldService.getDataInterpolatedRange(refStructureName, companyName, fieldName, sectorName, thesisName, timestampFrom, timestampTo);
//         res.status(200).json(result);
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }
// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/profileStatistics:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves statistics data of profile, specifically the mean and std for each cell
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/profileStatistics', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {

//         const result = await fieldService.getInterpolatedMeans(refStructureName, companyName, fieldName, sectorName, thesisName, timeFilterFrom, timeFilterTo);

//         res.status(200).json(new InterpolatedDataResponse(result));
//     } catch (error) {
//         return res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fieldCharts/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/delta:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Retrieves delta data
//  *     tags: [Field Chart Data]
//  *     parameters:
//  *       - in: path
//  *         name: refStructureName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: companyName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: fieldName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: sectorName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: path
//  *         name: thesisName
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: timeFilterFrom
//  *         schema:
//  *           type: string
//  *         required: true
//  *       - in: query
//  *         name: timeFilterTo
//  *         schema:
//  *           type: string
//  *         required: true
//  *     responses:
//  *       200:
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/DataResponse'
//  *       401:
//  *         description: Unauthorized request
//  *       403:
//  *         description: Authentication failed
//  *       500:
//  *         description: Internal server error
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/delta', async (req, res) => {

//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timeFilterFrom = req.query.timeFilterFrom;
//     const timeFilterTo = req.query.timeFilterTo;

//     try {
//         const user = await authenticationService.validateJwt(req.headers.authorization);
//         if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timeFilterFrom, timeFilterTo)))
//             return res.status(401).json({message: 'Unauthorized request'});
//     } catch (error) {
//         return res.status(403).json({message: 'Authentication failed'});
//     }

//     try {


//         const result = await fieldService.getDelta(timeFilterFrom, timeFilterTo, refStructureName, companyName, fieldName, sectorName, thesisName);

//         res.status(200).json(result);
//     } catch (error) {
//         res.status(500).json({message: error.message});
//     }

// });

// /**
//  * @swagger
//  * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/getOptimalState:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Get optimal state for a field
//  *     description: Get the optimal state for a field.
//  *     tags: [Field Chart Data]
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
//  *         name: timestamp
//  *         schema:
//  *           type: string
//  *         description: The timestamp in which find the information
//  *     responses:
//  *       '200':
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/OptStateDto'
//  *       '400':
//  *         description: Invalid request or thesis not found.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on retrieve optimal field matrix.
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/getOptimalState', async (req, res) => {
  
//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;
  
//     try {
//       const user = await authenticationService.validateJwt(req.headers.authorization);
//       if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
//         return res.status(401).json({ message: 'Unauthorized request' });
//     } catch (error) {
//       return res.status(403).json({ message: 'Authentication failed' });
//     }
  
//     try {
//       const result = await fieldService.getOptimalState(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp);
//       res.status(200).json(result);
//     } catch (error) {
//       return res.status(500).json({ message: error.message });
//     }
  
//   });

//   /**
//  * @swagger
//  * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/getDistanceFromOptimalState:
//  *   get:
//  *     security:
//  *       - bearerAuth: []
//  *     summary: Get distance from optimal state for a field
//  *     description: Get distance from optimal state for a field.
//  *     tags: [Field Chart Data]
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
//  *         name: timestamp
//  *         schema:
//  *           type: string
//  *         description: The timestamp in which find the information
//  *     responses:
//  *       '200':
//  *         description: Success
//  *         content:
//  *           application/json:
//  *             schema:
//  *                     $ref: '#/components/schemas/DataValue'
//  *       '400':
//  *         description: Invalid request or thesis not found.
//  *       '401':
//  *         description: Unauthorized request.
//  *       '403':
//  *         description: Authentication failed.
//  *       '500':
//  *         description: Error on retrieve optimal field matrix.
//  */
// fieldChartRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/getDistanceFromOptimalState', async (req, res) => {
  
//     const refStructureName = req.params.refStructureName;
//     const companyName = req.params.companyName;
//     const fieldName = req.params.fieldName;
//     const sectorName = req.params.sectorName;
//     const thesisName = req.params.thesisName;
//     const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;
//     console.log(req.query)

//     try {
//       const user = await authenticationService.validateJwt(req.headers.authorization);
//       if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
//         return res.status(401).json({ message: 'Unauthorized request' });
//     } catch (error) {
//       return res.status(403).json({ message: 'Authentication failed' });
//     }
  
//     try {
//       const result = await fieldService.getPunctualDistance(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp);
//       res.status(200).json(result);
//     } catch (error) {
//       return res.status(500).json({ message: error.message });
//     }
  
//   });
