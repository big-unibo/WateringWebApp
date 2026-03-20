import { Router } from 'express';

import { Thesis } from '../dtos/thesisDto.js';
import { SectorData} from '../dtos/sectorDto.js'
import { ROLES } from '../commons/permissionRoles.js';

const sectorsRouter = ({ authenticationService, authorizationService, fieldService }) => {
    const router = Router();


    /**
     * @swagger
     * /sectors:
     *   get:
     *     summary: Retrieve all sectors available for the user
     *     tags: [Sectors]
     *     description: | 
     *       Retrieve all sectors available for the user, filtered by a time range of active theses.
     *       Time filter is optional, if not used, every sector is returned despite it being inactive. 
     *       Requires Authentication and proper authorization
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
            let userAvailableIds = await authorizationService.getAvailableEntityIds(requestUserData.userId, 'SECTOR', ROLES.VIEWER, requestUserData.isAdmin)
            if (Array.isArray(userAvailableIds) && userAvailableIds.length > 0) {
                if (userAvailableIds.includes('ALL')) {
                    userAvailableIds = null
                }
                const sectors = await fieldService.getSectors(userAvailableIds, timeFilterFrom, timeFilterTo)
                return res.status(200).json(sectors)
            }
            return res.status(404).json({
                error: "User has no permission to view any company"
            })
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
     *     description: |
     *        Returns all sector information given its ID. User must have monitoring permits for the requested sector.
     *        If timestamp is not specified, sector data is returned despite it not having any associated theses.              
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
        const timestamp = req.query.timestamp ?? null
        

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'SECTOR', sectorId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const sectorData = await fieldService.getSectorDetails(sectorId, timestamp)

            if (!sectorData) {
                return res.status(404).json({
                    error: "No sector found with the given Id"
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
     * /sectors/{sectorId}/update:
     *   put:
     *     summary: Update a sector
     *     description: Updates one or more properties of an existing sector (name, culture, cultureType, location, dripperCapacity, sprinklerCapacity, doubleWing). Requires authentication and proper authorization.
     *     tags:
     *       - Sectors
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the sector to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SectorBase'
     *     responses:
     *       200:
     *         description: Company updated successfully
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
     *         description: Unauthorized (user not allowed to update sector)
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
     *         description: Internal server error – unexpected error while updating the sector
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */

    router.put('/:sectorId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId;

        const sectorId = Number(req.params.sectorId);
        const exists = await fieldService.sectorExists(sectorId);
        if (!exists) {
            return res.status(404).json({ message: 'Sector not found' });
        }
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'SECTOR', sectorId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const name = req.body.name;
        const culture = req.body.culture;
        const cultureType = req.body.cultureType;
        const location = req.body.location;
        const dripperCapacity = req.body.dripperCapacity;
        const sprinklerCapacity = req.body.sprinklerCapacity;
        const doubleWing = req.body.doubleWing;

        try {
            const sectorUpdateData = new SectorData(sectorId, name, culture, cultureType, location, dripperCapacity, sprinklerCapacity, doubleWing)
            await fieldService.updateSector(userId, sectorUpdateData);
            return res.status(200).json({ message: 'Sector successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating sector caused by: ${error.message}`)
            return res.status(500).json({ error: "Error on updating sector" })
        }
    });

    /**
     * @swagger
     * /sectors/{sectorId}/delete:
     *   delete:
     *     summary: Deletes a given sector
     *     tags: [Sectors]
     *     description: |
     *       Deletes a sector including:
     *       - Deletion of device associations.
     *       - Deletion of watering events.
     *       - Deletion of all thesis of the sector
     *       - Deletion of service avilable for the sector 
     * 
     *       Requires Authentication and proper Authorization
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of sector to delete
     *     responses:
     *       200:
     *         description: Sector successfully deleted.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Sector successfully deleted.
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
     *         description: Unauthorized request – user not allowed to delete this sector.
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
     *         description: Internal server error – unexpected error during the process.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.delete('/:sectorId/delete', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId
        const sectorId = req.params.sectorId;

        const exists = await fieldService.sectorExists(sectorId);
        if (!exists) {
            return res.status(404).json({ message: 'Sector not found' });
        }

        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ADMINISTRATOR, requestUserData.isAdmin, 'SECTOR', sectorId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            await fieldService.deleteSector(userId, sectorId)
            return res.status(200).json({ message: `Sector successfully deleted` })
        } catch (error) {
            console.log(`Failed deleting sector: ${error.message}`)
            return res.status(500).json({ error: "Internal error deleting sector" })
        }
    })


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
     *         description: Internal server error – unexpected error while creating the thesis
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.post('/:sectorId/createThesis', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId

        const sectorId = Number(req.params.sectorId)
        const exists = await fieldService.sectorExists(sectorId);
        if (!exists) {
            return res.status(404).json({ message: 'Sector not found' });
        }

        const thesis = new Thesis(req.body.name, sectorId, undefined, req.body.validFrom ?? Date.now()/1000);

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'SECTOR', sectorId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const thesisId = await fieldService.createThesis(userId, thesis);
            return res.status(200).json({ message: 'Thesis created with success', id: thesisId });
        } catch (error) {
            console.log(`Fail creating thesis caused by: ${error.message}`);
            return res.status(500).json({ error: "Error on creating thesis" });
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
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId
            const sectorId = req.params.sectorId

            const exists = await fieldService.sectorExists(sectorId);
            if (!exists) {
                return res.status(404).json({ message: 'Sector not found' });
            }

            if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.PLANNER, requestUserData.isAdmin, 'SECTOR', sectorId, 'Watering Advice'))){
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const validFrom = req.query.validFrom ?? Date.now() / 1000
            const validTo = req.query.validTo
            const thesesContributions = req.body.theses

            if (Math.abs(thesesContributions.reduce((sum, t) => sum + Number(t.weight), 0) - 1) > 1e-9) {
                return res.status(400).json({ message: "Total weight must be exactly 1" });
            }

            await fieldService.setThesesContributions(userId, sectorId, thesesContributions, validFrom, validTo)

            return res.status(200).json({ message: `Theses contributions updated with success` })

        } catch (error) {
            console.log(`Fail updating theses contributions caused by: ${error.message}`)
            return res.status(500).json({ error: "Error updating theses contributions" })
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
     *       - Ending validity period of the devices associated with the sector.
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
     *       '404':
     *         description: Resource nto found
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
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId

        const sectorId = req.params.sectorId;
        const exists = await fieldService.sectorExists(sectorId);
        if (!exists) {
            return res.status(404).json({ message: 'Sector not found' });
        }

        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'SECTOR', sectorId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            await fieldService.disableSector(userId, sectorId, timestamp)
            return res.status(200).json({ message: `Sector validity succesfully endend` })
        } catch (error) {
            console.log(`Failed disabling Sector: ${error.message}`)
            return res.status(500).json({ error: "Internal error disablingthesis" })
        }
    })

    /**
     * @swagger
     * /sectors/{sectorId}/devices:
     *   get:
     *     summary: Get devices info for a given sector
     *     tags: [Sectors]
     *     description: Returns devices directly assigned to the sector and, optionally, devices from descendant or anchestor entities
     *       (e.g. thesis or farm). Inheritance behavior is controlled via the `includeDescendants` and `includeAnchestors` parameter. Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the sector
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: Timestamp in which find the information
     *       - in: query
     *         name: includeDescendants
     *         schema:
     *           type: boolean
     *         description: Include devices assigned to child entities (e.g. theses)
     *       - in: query
     *         name: includeAnchestors
     *         schema:
     *           type: boolean
     *         description: Include devices assigned to parent entity (e.g. farm)
     *       - in: query
     *         name: deviceTypes
     *         required: false
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         description: Array of device types to filter the response
     *     responses:
     *       200:
     *         description: Informations about devices and signals assigned to the given thesis
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                  $ref: '#/components/schemas/Device'
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
     *         description: Unauthorized (user not allowed to get devices info for this thesis)
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
     *         description: Internal server error – unexpected error while retrieving devices info
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.get('/:sectorId/devices', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const sectorId = Number(req.params.sectorId)
        const exists = await fieldService.sectorExists(sectorId);
        if (!exists) {
            return res.status(404).json({ message: 'Sector not found' });
        }

        try {
            if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'SECTOR', sectorId))){
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000
            const deviceTypes = req.query.deviceTypes;
            const includeDescendants = String(req.query.includeDescendants).toLowerCase() === 'true';
            const includeAnchestors = String(req.query.includeAnchestors).toLowerCase() === 'true';
            const results = await fieldService.getDevicesBySector(sectorId, timestamp, deviceTypes, includeAnchestors, includeDescendants);
            return res.status(200).json(results)
        } catch (error) {
            console.log(`Fail retrieving devices data: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices data" });
        }
    });

    return router;
}
export default sectorsRouter;