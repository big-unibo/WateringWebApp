import { Router } from 'express';

import { Thesis } from '../dtos/thesisDto.js';
import { THESES_LOG_TABLE } from '../commons/constants.js';

const sectorsRouter = ({ authenticationService, authorizationService, fieldService, wateringScheduleService, userActionService }) => {
    const router = Router();


	/**
	 * @swagger
	 * /sectors:
	 *   get:
	 *     summary: Retrieve all sectors available for the user
	 *     tags: [Sectors]
	 *     description: Retrieve all sectors available for the user, filtered by a time range of active theses.
     *       Time filter is optional. Requires Authentication and proper authorization
	 *     parameters:
	 *       - in: query
	 *         name: timeFilterFrom
	 *         schema:
	 *           type: number
	 *         description: Time filter start (timestamp in seconds since 01/01/1970)
	 *       - in: query
	 *         name: timeFilterTo
	 *         schema:
	 *           type: number
	 *         description: Time filter end (timestamp in seconds since 01/01/1970)
	 *     responses:
	 *       200:
	 *         description: List of sectors for the user
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SectorsCompact'
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

        const timeFilterFrom = req.query.timeFilterFrom ?? null
        const timeFilterTo = req.query.timeFilterTo ?? null

		try {
			const sectors = await fieldService.getSectors(requestUserData.userId, timeFilterFrom, timeFilterTo);
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
	 *       - in: query
	 *         name: timestamp
     *         schema:
     *           type: number
     *         description: The timestamp in which find the information
	 *     responses:
	 *       200:
	 *         description: Detailed sector information
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/SectorData'
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
		let requestUserData
		try {
			requestUserData = await authenticationService.validateJwt(req.headers.authorization)
		} catch (error) {
			return res.status(401).json({ message: 'Authentication failed' })
		}

		const sectorId = Number(req.params.sectorId)
        const timestamp = req.params.timestamp ?? Date.now()/1000

		if(!authorizationService.isUserAuthorizedById(requestUserData.userId, 'monitoring', 'sectors', sectorId))
			return res.status(403).json({message: 'Unauthorized request'})

		try {
			const sectorData = await fieldService.getSectorDetails(sectorId, timestamp)

			if (!sectorData) {
				return res.status(404).json({ 
					error: "No sector found with the given Id to retrieve informations from" 
				})
			}

			return res.status(200).json(sectorData)
		} catch (error) {
			console.log(`Fail retrieving sectors caused by: ${error.message}`)
			return res.status(500).json({ error: "Error while retrieving sectors" })
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
     *             type: object
     *             allOf:
     *              - $ref: '#/components/schemas/CreateThesis'
     *              - type: object
     *                properties:
     *                  validFrom:
     *                    type: number
     *                    description: Timestamp indicating the start date of the thesis in the sector (Seconds elapsed since 1/1/1970).
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
        const userId = requestUserData.userId

		const sectorId = Number(req.params.sectorId)
		const thesis = new Thesis(req.body.name, sectorId, req.query.validFrom);

         // if (!(await authorizationService.isUserAuthorizedInSector(userId, 'update', sectorId)))
		// 		return res.status(403).json({message: 'Unauthorized request'});

		try {
			const thesisId = await fieldService.createThesis(thesis);
            if(thesisId){
                userActionService.logCreation(userId, THESES_LOG_TABLE, thesisId, null);
            }
			return res.status(200).json({message: 'Thesis created with success', id: thesisId});
		} catch (error) {
			console.log(`Fail creating thesis caused by: ${error.message}`);
			return res.status(500).json({error: "Error on creating thesis"});
		}
    });

    /**
     * @swagger
     * /sectors/{sectorId}/thesesContributions:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Set the theses weigths to use for computation of sector watering advice
     *     description: Set the theses weigths to use for computation of sector watering advice. The sum of specified weights must be 1,
     *                      if some thesis is not specified will be assumed as weight 0
     *     tags: [Sectors]
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of sector in which update theses weights
     *       - in: query
     *         name: validFrom
     *         schema:
     *           type: number
     *         description: Timestamp indicating the start date of the new weigths validity, if not set take actual timestamp (Seconds elapsed since 1/1/1970).
     *       - in: query
     *         name: validTo
     *         schema:
     *           type: number
     *         description: Timestamp for the end date of the new weights validity (Seconds elapsed since 1/1/1970).
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ThesesContributions'
     *     responses:
     *       200:
     *         description: Theses contribution updated with success
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string  
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
     *         description: Internal server error – unexpected error while updating theses contribution
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.put('/:sectorId/thesesContributions', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

        try {
            const sectorId = req.params.sectorId
        
            if (!(await authorizationService.isUserAuthorizedById(requestUserData.userId, 'EDIT_ADVICE', 'sectors', sectorId)))
                return res.status(403).json({ message: 'Unauthorized request' });

            const validFrom = req.query.validFrom ?? Date.now()/1000
            const validTo = req.query.validTo
            const thesesContributions = req.body.theses

            if (Math.abs(thesesContributions.reduce((sum, t) => sum + Number(t.weight), 0) - 1) > 1e-9) {
                return res.status(400).json({ message: "Total weight must be exactly 1" });
            }

            await fieldService.setThesesContributions(sectorId, thesesContributions, validFrom, validTo)

            return res.status(200).json({message: `Theses contributions updated with success`})

        } catch (error) {
            console.log(`Fail updating theses contributions caused by: ${error.message}`)
            return res.status(500).json({error: "Error updating theses contributions"})
        }

    });


    /**
     * @swagger
     * /sectors/{sectorId}/disable:
     *   post:
     *     summary: Disables a sector.
     *     tags: [Sectors]
     *     description: |
     *       Disables a sector by:
     *       
     *       - Ending validity period of the signals associated with the sector.
     *       - Disabling all of the theses associated with the sector.
     *       - Ending the irrigation season (Deleting the scheduled watering event).
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of sector to disable
     *       - in: query
     *         name: timestamp
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the sector validity, if not set take actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Sector succesfuly disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Sector succesfuly disabled.
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
     *       401:
     *         description: Authentication failed (Invalid or missing JWT).
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized request – user not allowed to end sector validity.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error during the process.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.post('/:sectorId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }

        const sectorId = req.params.sectorId;
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        //[TO DO]: Authorization

        try{
            await fieldService.disableSector(sectorId, timestamp)
            return res.status(200).json({ message: `Sector validity succesfully endend` })
        } catch (error) {
            console.log(`Failed disabling Sector: ${error.message}`)
            return res.status(500).json({ error: "Internal error disablingthesis" })
        }
    })
  
    return router;
}
export default sectorsRouter;