import { Router } from 'express';

import { Thesis } from '../dtos/thesisDto.js';

const sectorsRouter = ({ authenticationService, authorizationService, fieldService }) => {
    const router = Router();


	/**
	 * @swagger
	 * /sectors:
	 *   get:
	 *     security:
	 *       - bearerAuth: []
	 *     summary: Retrieve all sectors available for the user
	 *     tags: [Sectors]
	 *     description: Retrieve all sectors available for the user, filtered by a time range of active theses.
	 *     parameters:
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
	 *         description: List of sectors for the user
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SectorsCompactDto'
	 *       400:
	 *         description: Bad request – missing or invalid query parameters
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *       403:
	 *         description: Authentication failed – invalid or missing JWT
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
			return res.status(403).json({ message: 'Authentication failed' });
		}

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)
        
        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

		try {
			const sectors = await fieldService.getSectors(requestUserData.userid, timeFilterFrom, timeFilterTo);
			if (!sectors || sectors.length === 0) {
				return res.status(404).json({ 
					error: "User has no permission to view any sectors" 
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
	 *     security:
	 *       - bearerAuth: []
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
	 *       400:
	 *         description: Bad request – missing or invalid sectorId or userId
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *       401:
	 *         description: Unauthorized – user not allowed to view the sector
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 message:
	 *                   type: string
	 *       403:
	 *         description: Authentication failed – invalid or missing JWT
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
			return res.status(403).json({ message: 'Authentication failed' });
		}

		const sectorId = Number(req.body.sectorId)

		if (isNaN(sectorId) || !Number.isInteger(sectorId)) {
			return res.status(400).json({ message: 'Sector ID is required and must be a number' });
		}

		if(!authorizationService.isUserAuthorizedById(requestUserData.userid, 'monitoring', 'sectors', sectorId))
			return res.status(401).json({message: 'Unauthorized request'});

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
     *     security:
     *      - bearerAuth: []
     *     summary: Create a thesis and associate it with a sector
     *     tags: [Sectors]
     *     description: Endpoint to create a new thesis and link it to a sector.
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
     *       400:
     *         description: Bad request (missing or invalid sectorId or thesisName)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized request – user not allowed to create a thesis for the given sector
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Authentication failed – invalid or missing JWT
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
			return res.status(403).json({message: 'Authentication failed'});
		}

		if(!req.body || req.body === '')
			return res.status(400).json({message: 'Invalid request'});

		const sectorId = Number(req.body.sectorId)

		if (isNaN(sectorId) || !Number.isInteger(sectorId)) {
			return res.status(400).json({ message: 'Sector ID is required and must be a number' });
		}
		const { thesisName, validFrom } = req.body;
		const thesis = new Thesis(thesisName, sectorId, undefined, validFrom);

		try {
			if (!(await authorizationService.isUserAuthorizedInSector(requestUserData.userid, 'update', sectorId)))
				return res.status(401).json({message: 'Unauthorized request'});

			const thesisId = await fieldService.createThesis(thesis);
			return res.status(200).json({message: 'Thesis created with success', id: thesisId});
		} catch (error) {
			console.log(`Fail creating thesis caused by: ${error.message}`);
			return res.status(500).json({error: "Error on creating thesis"});
		}
    });
  
    return router;
}
export default sectorsRouter;