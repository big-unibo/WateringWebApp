import { Router } from 'express';

import { Thesis } from '../dtos/thesisDto.js';

const sectorsRouter = ({ authenticationService, authorizationService, fieldService, wateringScheduleService }) => {
    const router = Router();


	/**
	 * @swagger
	 * /sectors:
	 *   get:
	 *     summary: Retrieve all sectors available for the user
	 *     tags: [Sectors]
	 *     description: Retrieve all sectors available for the user, filtered by a time range of active theses.
	 *     parameters:
	 *       - in: query
	 *         name: timeFilterFrom
	 *         required: true
	 *         schema:
	 *           type: number
	 *         description: Time filter start (timestamp in seconds since 01/01/1970)
	 *       - in: query
	 *         name: timeFilterTo
	 *         required: true
	 *         schema:
	 *           type: number
	 *         description: Time filter end (timestamp in seconds since 01/01/1970)
	 *     responses:
	 *       200:
	 *         description: List of sectors for the user
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SectorsCompactDto'
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
	 *       404:
	 *         description: No sectors found for the current user and time filter
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *       500:
	 *         description: Internal server error – unexpected error while retrieving sectors
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 */
    router.get('/', async (req, res) => {
		let requestUserData;
		try {
			requestUserData = await authenticationService.validateJwt(req.headers.authorization);
		} catch (error) {
			return res.status(401).json({ message: 'Authentication failed' });
		}

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

		try {
			const sectors = await fieldService.getSectors(requestUserData.userid, timeFilterFrom, timeFilterTo);
			if (!sectors || sectors.length === 0) {
				return res.status(404).json({ 
					error: "User has no permission to view any sectors in the given period" 
				});
			}

			return res.status(200).json(sectors);
		} catch (error) {
			console.log(`Fail retrieving sectors caused by: ${error.message}`);
			return res.status(500).json({ error: "Error while retrieving sectors" });
		}
	});


	/**
	 * @swagger
	 * /sectors/{sectorId}:
	 *   get:
	 *     summary: Returns detailed information for a sector by its ID
	 *     tags: [Sectors]
	 *     description: Returns all sector information given its ID. User must have monitoring permits for the requested sector.
	 *     parameters:
	 *       - in: path
	 *         name: sectorId
	 *         required: true
	 *         schema:
	 *           type: integer
	 *         description: ID of the sector to retrieve information for
	 *     responses:
	 *       200:
	 *         description: Detailed sector information
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SectorDataDto'
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized (user not allowed to retrieve detailed info for this sector)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
	 *       404:
	 *         description: No sector found for the given ID
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 *       500:
	 *         description: Internal server error – unexpected error while retrieving the sector
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 error:
	 *                   type: string
	 */

    router.get('/:sectorId', async (req, res) => {
		let requestUserData;
		try {
			requestUserData = await authenticationService.validateJwt(req.headers.authorization);
		} catch (error) {
			return res.status(401).json({ message: 'Authentication failed' });
		}

		const sectorId = Number(req.params.sectorId)

		if(!authorizationService.isUserAuthorizedById(requestUserData.userid, 'monitoring', 'sectors', sectorId))
			return res.status(403).json({message: 'Unauthorized request'});

		try {
			const sectorData = await fieldService.getSectorDetails(sectorId);

			if (!sectorData) {
				return res.status(404).json({ 
					error: "No sector found with the given Id to retrieve informations from" 
				});
			}

			return res.status(200).json(sectorData);
		} catch (error) {
			console.log(`Fail retrieving sectors caused by: ${error.message}`);
			return res.status(500).json({ error: "Error while retrieving sectors" });
		}
	});


    /**
     * @swagger
     * /sectors/{sectorId}/createThesis:
     *   post:
     *     summary: Create a thesis and associate it with a sector
     *     tags: [Sectors]
     *     description: Endpoint to create a new thesis and link it to a sector. Requires authentication and proper validation
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the sector to associate the thesis with
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateThesis'
     *     responses:
     *       200:
     *         description: Thesis created with success
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the thesis       
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized (user not allowed to create theses for the given sector)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while creating the thesis
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.post('/:sectorId/createThesis', async (req,res) => {
		let requestUserData;
		try {
			requestUserData = await authenticationService.validateJwt(req.headers.authorization);
		} catch (error) {
			return res.status(401).json({message: 'Authentication failed'});
		}

		const sectorId = Number(req.params.sectorId)
		const { thesisName, validFrom, weight } = req.body;
		const thesis = new Thesis(thesisName, sectorId, weight, validFrom);

		try {
			if (!(await authorizationService.isUserAuthorizedInSector(requestUserData.userid, 'update', sectorId)))
				return res.status(403).json({message: 'Unauthorized request'});

			const thesisId = await fieldService.createThesis(thesis);
			return res.status(200).json({message: 'Thesis created with success', id: thesisId});
		} catch (error) {
			console.log(`Fail creating thesis caused by: ${error.message}`);
			return res.status(500).json({error: "Error on creating thesis"});
		}
    });

	/**
     * @swagger
     * /sectors/{sectorId}/wateringCalendar:
     *   get:
     *     summary: Retrivies calendar data for a given sector within a time range
     *     tags: [Sectors]
     *     description: Returns every watering event for a given sector and within a given time range, also including the contribution of every thesis for the event.
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized (user not allowed to view calendar)
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
    router.get('/:sectorId/wateringCalendar', async (req, res) => {
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

            const sectorId = Number(req.params.sectorId);

            const timeFilterFrom = Number(req.query.timeFilterFrom)
            const timeFilterTo = Number(req.query.timeFilterTo)
            
            const result = await wateringScheduleService.getSchedule(sectorId, timeFilterFrom, timeFilterTo);
            res.status(200).json(result);
        } catch (error) {
            console.log(`Failed retrieving calendar caused by: ${error.message}`);
            return res.status(500).json({ message: "Error while retrieving calendar" });
        }
    })
  
    return router;
}
export default sectorsRouter;