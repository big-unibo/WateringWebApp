import { Router } from 'express';

import { Farm } from '../dtos/farmDto.js';
import { Sector } from '../dtos/sectorDto.js';
import { ROLES } from '../commons/permissionRoles.js';

const farmsRouter = ({ authenticationService, authorizationService, fieldService }) => {
    const router = Router();


    /**
     * @swagger
     * /farms/{farmId}:
     *   get:
     *     summary: Retrives data about a farm.
     *     tags: [Farms]
     *     description: |
     *       Retrives data about a farm including:
     *       
     *       - Info about the company owning it
     *       - Info about the organization owning it
     *       - Names and ids of its sectors
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: farmId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of farm to reterieve
     *       - in: query
     *         name: timeFilterFrom
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp to filter farm relation after (Seconds elapsed since 1/1/1970).
     *       - in: query
     *         name: timeFilterTo
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp to filter farm relation before (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Detailed farm information
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/FarmData'
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
     *         description: Unauthorized request – user not allowed view farm data
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
    router.get('/:farmId', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        
        const farmId = req.params.farmId;
        const timeFilterFrom = req.query.timeFilterFrom ?? Math.floor(Date.now()/1000);
        const timeFilterTo = req.query.timeFilterTo ?? Math.ceil(Date.now()/1000);

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'FARM', farmId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const result = await fieldService.getFarmDetails(farmId, timeFilterFrom, timeFilterTo, requestUserData.userId, requestUserData.isAdmin)
            return res.status(200).json(result)
        } catch (error) {
            console.log(`Failed retrieving farm data: ${error.message}`)
            return res.status(500).json({ error: "Internal error retrieving farm data" })
        }
    })


    /**
     * @swagger
     * /farms/create:
     *   post:
     *     summary: Creates a new farm
     *     description: Creates a new farm within a company. Requires authentication and proper authorization.
     *     tags:
     *       - Farms
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateFarm'
     *     responses:
     *       200:
     *         description: Farm created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the new Farm   
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
     *         description: Unauthorized (user not allowed to create farms)
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
     *
    */
    router.post('/create', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId;
            const companyId = Number(req.body.companyId)

            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'COMPANY', companyId))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const farmLocation = req.body.location
            const farmName = req.body.name
            const createdAt = req.body.createdAt
            const farm = new Farm(farmName, companyId, farmLocation, null, createdAt);

            const farmId = await fieldService.createFarm(userId, farm);
            return res.status(200).json({ message: `Farm created with success`, id: farmId })
        } catch (error) {
            console.log(`Failed creating farm caused by: ${error.message}`)
            return res.status(500).json({ message: "Error on creating farm" })
        }
    })


    /**
     * @swagger
     * /farms/{farmId}/disable:
     *   post:
     *     summary: Disables a farm.
     *     tags: [Farms]
     *     description: |
     *       Disables a farm by:
     *       
     *       - Ending validity period of the devices associated with the farm.
     *       - Disabling all of the sectors associated with the farm.
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: farmId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of farm to disable
     *       - in: query
     *         name: validTo
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the farm validity, if not set takes actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Farm successfully disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Farm successfully disabled.
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
     *         description: Unauthorized request – user not allowed to end farm validity.
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
    router.post('/:farmId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId;

        const farmId = req.params.farmId;
        const exists = await fieldService.farmExists(farmId);
        if (!exists) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const validTo = req.query.validTo ?? currentTimestamp;

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'FARM', farmId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            if (validTo < currentTimestamp - (24 * 60 * 60)) {
                return res.status(400).json({ message: 'Invalid validTo timestamp provided. It must be a timestamp in the last 24 hours' })
            }
            await fieldService.disableFarm(userId, requestUserData.isAdmin, farmId, validTo)
            return res.status(200).json({ message: `Farm validity successfully endend` })
        } catch (error) {
            console.log(`Failed disabling farm: ${error.message}`)
            return res.status(500).json({ error: "Internal error disabling thesis" })
        }
    })

    /**
     * @swagger
     * /farms/{farmId}/delete:
     *   delete:
     *     summary: Deletes a given farm
     *     tags: [Farms]
     *     description: |
     *       Deletes a farm including:
     *       - Deletion of device associations.
     *       - Deletion of all sectors of the farm.
     * 
     *       Requires Authentication and proper Authorization
     *     parameters:
     *       - in: path
     *         name: farmId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of farm to delete
     *     responses:
     *       200:
     *         description: Farm successfully deleted.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Farm successfully deleted.
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
     *         description: Unauthorized request – user not allowed to delete this farm.
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
    router.delete('/:farmId/delete', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId
        const farmId = req.params.farmId;

        const exists = await fieldService.farmExists(farmId);
        if (!exists) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ADMINISTRATOR, requestUserData.isAdmin, 'FARM', farmId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            await fieldService.deleteFarm(userId, farmId)
            return res.status(200).json({ message: `Farm successfully deleted` })
        } catch (error) {
            console.log(`Failed deleting farm: ${error.message}`)
            return res.status(500).json({ error: "Internal error deleting farm" })
        }
    })

    /**
     * @swagger
     * /farms/{farmId}/createSector:
     *   post:
     *     summary: Creates a new sector
     *     description: Creates a new sector within a farm. Requires authentication and proper authorization.
     *     tags:
     *       - Farms
     *     parameters:
     *       - in: path
     *         name: farmId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the farm the sector belongs to
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateSector'
     *     responses:
     *       200:
     *         description: Sector created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the new Sector          
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
     *         description: Unauthorized (user not allowed to create sectors for the given farm)
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
     *         description: Internal server error – unexpected error while creating the sector
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
    */
    router.post('/:farmId/createSector', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const userId = requestUserData.userId
            const farmId = Number(req.params.farmId)


            const exists = await fieldService.farmExists(farmId);
            if (!exists) {
                return res.status(404).json({ message: 'Farm not found' });
            }

            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'FARM', farmId))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const {
                name,
                culture,
                cultureType,
                location,
                dripperCapacity,
                sprinklerCapacity,
                doubleWing,
                createdAt
            } = req.body;

            const sector = new Sector(
                name,
                farmId,
                culture,
                cultureType,
                location,
                dripperCapacity,
                sprinklerCapacity,
                doubleWing,
                createdAt
            );

            const sectorId = await fieldService.createSector(userId, sector);
            return res.status(200).json({ message: `Sector created with success`, id: sectorId })
        } catch (error) {
            console.log(`Failed creating sector caused by: ${error.message}`)
            return res.status(500).json({ message: "Error on creating sector" })
        }
    })

    /**
     * @swagger
     * /farms/{farmId}/devices:
     *   get:
     *     summary: Gets all the devices info for a given farm
     *     tags: [Farms]
     *     description: Returns devices directly assigned to the farm and, optionally, devices from descendant entities
     *       (e.g. thesis or sectors). Inheritance behavior is controlled via the `includeDescendants` parameter. Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: farmId
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
     *         description: Include devices assigned to child entities (e.g. sectors, theses)
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
    router.get('/:farmId/devices', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const farmId = Number(req.params.farmId)
        const exists = await fieldService.farmExists(farmId);
        if (!exists) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        try {
            if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'FARM', farmId))){
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000
            const deviceTypes = req.query.deviceTypes;
            const includeDescendants = String(req.query.includeDescendants).toLowerCase() === 'true';
            const results = await fieldService.getDevicesByFarm(farmId, timestamp, deviceTypes, includeDescendants, requestUserData.userId, requestUserData.isAdmin);
            return res.status(200).json(results)
        } catch (error) {
            console.log(`Fail retrieving devices data: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices data" });
        }
    })

    /**
     * @swagger
     * /farms/{farmId}/update:
     *   put:
     *     summary: Update a farm
     *     description: Updates one or more properties of an existing farm (name, location). Requires authentication and proper authorization.
     *     tags:
     *       - Farms
     *     parameters:
     *       - in: path
     *         name: farmId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the farm to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Farm'
     *     responses:
     *       200:
     *         description: Farm updated successfully
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
     *         description: Unauthorized (user not allowed to update farm)
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
     *         description: Internal server error – unexpected error while updating the farm
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */

    router.put('/:farmId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId;

        const farmId = Number(req.params.farmId);
        const exists = await fieldService.farmExists(farmId);
        if (!exists) {
            return res.status(404).json({ message: 'Farm not found' });
        }
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'FARM', farmId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const name = req.body.name;
        const location = req.body.location;

        try {
            const farmUpdateData = new Farm(name, undefined, location, farmId)
            await fieldService.updateFarm(userId, farmUpdateData);
            return res.status(200).json({ message: 'Farm successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating farm caused by: ${error.message}`)
            return res.status(500).json({ error: "Error on updating farm" })
        }
    });

    /**
     * @swagger
     * /farms:
     *   get:
     *     summary: Retrieve all farms available for the user
     *     tags: [Farms]
     *     description: | 
     *       Retrieve all farms available for the user.
     *       Requires Authentication and proper authorization
     *     responses:
     *       200:
     *         description: List of farms for the user
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Farm'
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

        try {
            let userAvailableIds = await authorizationService.getAvailableEntityIds(requestUserData.userId, 'FARM', ROLES.VIEWER, requestUserData.isAdmin)
            if (Array.isArray(userAvailableIds) && userAvailableIds.length > 0) {
                if (userAvailableIds.includes('ALL')) {
                    userAvailableIds = null
                }
                const farms = await fieldService.getFarms(userAvailableIds);
                return res.status(200).json(farms);
            }
            return res.status(404).json({
                error: "User has no permission to view any farms"
            });
        } catch (error) {
            console.log(`Fail retrieving farms caused by: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving farms" });
        }
    });

    return router;
}
export default farmsRouter;