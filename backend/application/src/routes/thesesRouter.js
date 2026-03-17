import { Router } from 'express'
import { HUMIDITY_DEVICE_TYPE } from '../commons/constants.js'
import { GridOptimalProfiles } from '../dtos/optStateDto.js'
import { WateringParams } from '../dtos/wateringParamsDto.js'
import { ROLES } from '../commons/permissionRoles.js'

const thesesRouter = ({ authenticationService, authorizationService, fieldService, wateringAdviceService }) => {
    const router = Router();

    /**
     * @swagger
     * /theses/{thesisId}:
     *   get:
     *     summary: Return detailed information for a thesis by its ID
     *     tags: [Theses]
     *     description: Return thesis information given its ID. Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the thesis
     *       - in: query
     *         name: timestamp
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp in which find the information (Unix timestamp in seconds elapsed since 1/1/1970)
     *     responses:
     *       200:
     *         description: Deteiled thesis information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/ThesisData'
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
     *         description: Unauthorized (user not allowed to create theses in this sector)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Thesis not found for specified id and timestamp.
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
    router.get('/:thesisId', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const timestamp = Number(req.query.timestamp)

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'THESIS', thesisId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const result = await fieldService.getThesisDetails(thesisId, timestamp);
            if (result) {
                return res.status(200).json(result)
            } else {
                return res.status(404).json({ message: "Thesis not found at given timestamp" })
            }

        } catch (error) {
            console.log(`Fail retrieving thesis data: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving thesis data" });
        }
    });

    /**
     * @swagger
     * /theses/{thesisId}/update:
     *   put:
     *     summary: Update a thesis
     *     description: Updates one or more properties of an existing thesis (name). Requires authentication and proper authorization.
     *     tags:
     *       - Theses
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the thesis to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateThesis'
     *     responses:
     *       200:
     *         description: Thesis updated successfully
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
     *         description: Unauthorized (user not allowed to update thesis)
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
     *         description: Internal server error – unexpected error while updating the thesis
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */

    router.put('/:thesisId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId;

        const thesisId = Number(req.params.thesisId);
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'THESIS', thesisId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const name = req.body.name;

        try {
            await fieldService.updateThesis(userId, { id: thesisId, name: name });
            return res.status(200).json({ message: 'Thesis successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating thesis caused by: ${error.message}`)
            return res.status(500).json({ error: "Error on updating thesis" })
        }
    });

    /**
     * @swagger
     * /theses/{thesisId}/devices:
     *   get:
     *     summary: Gets devices info for a given thesis
     *     tags: [Theses]
     *     description: Returns devices directly assigned to the thesis and, optionally, devices from anchestor entities
     *       (e.g. sector or farm). Inheritance behavior is controlled via the `includeAnchestors` parameter.
     *       Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the thesis
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: Timestamp in which find the information
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
    router.get('/:thesisId/devices', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'THESIS', thesisId))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000
            const includeAnchestors = String(req.query.includeAnchestors).toLowerCase() === 'true';
            const deviceTypes = req.query.deviceTypes;
            const results = await fieldService.getDevicesByThesis(thesisId, timestamp, deviceTypes, includeAnchestors);
            return res.status(200).json(results)
        } catch (error) {
            console.log(`Fail retrieving devices data: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices data" });
        }
    });

    /**
     * @swagger
     * /theses/{thesisId}/signals:
     *   get:
     *     summary: Gets all signals data for a given thesis
     *     tags: [Theses]
     *     description: >
     *       Endpoint to retrieve all signal information related to a specific thesis at a given timestamp.
     *       Supports filtering by signal types through query parameters.
     *       Requires authentication and proper authorization
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the thesis.
     *       - in: query
     *         name: signalTypes
     *         required: false
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         style: form
     *         explode: true
     *         description: Signal types to include.
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: Unix timestamp (seconds elapsed since 1/1/1970) in which find available signal for the thesis
     *     responses:
     *       200:
     *         description: Successfully retrieved signals data for the specified thesis
     *         content:
     *           application/json:
     *             schema:
     *                 $ref: '#/components/schemas/SignalsDataBaseResponse'
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
     *         description: Unauthorized (user not allowed to retrieve this thesis signals)
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
     *         description: Internal server error — unexpected error while retrieving signals data.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/:thesisId/signals', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        let signalTypes = req.query.signalTypes;
        const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000;

        try {
            if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'THESIS', thesisId))){
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const results = await fieldService.getSignalsByThesis(thesisId, timestamp, signalTypes);
            return res.status(200).json(results)
        } catch (error) {
            console.log(`Fail retrieving devices data: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices data" });
        }
    })

    /**
     * @swagger
     * /theses/{thesisId}/lastWateringAdvice:
     *   get:
     *     summary: Get last watering advice for a thesis
     *     description: Get last watering advice for a thesis. Requires validation and proper authorization.
     *     parameters:
     *      - in: path
     *        name: thesisId
     *        required: true
     *        schema:
     *          type: integer
     *        description: ID of the thesis.
     *      - in: query
     *        name: timestamp
     *        schema:
     *          type: number
     *        description: Timestamp in which find the information   
     *     tags: [Theses]
     *     responses:
     *       '200':
     *         description: Last advice returned successfully.
     *         content:
     *           application/json:
     *             schema:
     *                $ref: '#/components/schemas/WateringAdviceResponse'
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
     *         description: Unauthorized (User not authorized to view this thesis last watering advice)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Advice not found for specified thesis and timestamp.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error — unexpected error while retrieving last watering advice
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.get('/:thesisId/lastWateringAdvice', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000;

        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'THESIS', thesisId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const result = await wateringAdviceService.getThesisLastWateringAdvice(thesisId, timestamp)
            if (result) {
                return res.status(200).json(result)
            } else {
                return res.status(404).json({ message: 'No advice found for specified thesis' });
            }
        } catch (error) {
            console.log(`Failed getting watering advice caused by: ${error.message}`)
            return res.status(500).json({ error: "Error getting watering advice" })
        }
    });

    /**
     * @swagger
     * /theses/{thesisId}/wateringAdvice:
     *   get:
     *     summary: Simulate watering advice for a thesis
     *     description: SImulate the watering advice for a thesis in a given timestamp (Requires authentication and proper validation)
     *     parameters:
     *      - in: path
     *        name: thesisId
     *        required: true
     *        schema:
     *           type: integer
     *        description: The thesis identifier
     *      - in: query
     *        name: expectedWater
     *        schema:
     *           type: number
     *      - in: query
     *        name: timestamp
     *        schema:
     *           type: number
     *     tags: [Theses]
     *     responses:
     *       '200':
     *         description: Advice returned successfully.
     *         content:
     *           application/json:
     *             schema:
     *                $ref: '#/components/schemas/WateringAdviceResponse'
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
     *         description: Unauthorized (User not authorized to view this thesis watering advice)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Advice not found for specified thesis and timestamp.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error — unexpected error while retrieving watering advice
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.get('/:thesisId/wateringAdvice', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)

        const expectedWater = req.query.expectedWater ? Number(req.query.expectedWater) : 0;
        const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000;


        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'THESIS', thesisId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const result = await wateringAdviceService.getWateringAdvice(thesisId, expectedWater, timestamp)

            return res.status(200).json(result)
        } catch (error) {
            console.log(`Failed to compute watering advice caused by: ${error.message}`)
            return res.status(500).json({ error: "Error computing watering advice" })
        }
    });


    /**
     * @swagger
     * /theses/{thesisId}/setOptimalState:
     *   put:
     *     summary: Sets the new optimal state (soil moisture grid profile) for a thesis.
     *     tags: [Theses]
     *     description: |
     *       This endpoint allows defining the optimal soil moisture profile associated with a thesis's grid 
     *       for a specified validity period starting from `validFrom`.
     *
     *       The **request behavior is determined by the query parameters:**
     *
     *       1. **Quick Update (optimalProfileId):**  
     *          If `optimalProfileId` is present, the optimal state is set by referencing an already existing
     *          image with a predefined profile ID.  
     *
     *       2. **Copy from Image (source thesisId & imageTimestamp):**  
     *          If the source `thesisId` and `imageTimestamp` are present, the optimal state is calculated by copying
     *          the interpolated profiles (a snapshot) from another thesis and timestamp.  
     *
     *       3. **Direct Matrix (Body):**  
     *          If neither of the above options is used, the optimal state must be provided directly as the `optimalState` 
     *          array in the request body.
     *
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the thesis to associate the new optimal state with (Destination).
     *       - in: query
     *         name: validFrom
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating the start date of the new optimal state's validity (Seconds elapsed since 1/1/1970).
     *       - in: query
     *         name: validTo
     *         schema:
     *           type: number
     *         description: Timestamp for the end date of the new optimal state's validity (Optional).
     *       - in: query
     *         name: optimalProfileId
     *         required: false
     *         schema:
     *           type: integer
     *         description: |
     *           **CASE 1.** ID of an existing optimal profile to be associated.  
     *           Excludes the use of source `thesisId`/`imageTimestamp` and the `optimalState` field from body array.
     *
     *       - in: query
     *         name: thesisId
     *         required: false
     *         schema:
     *           type: integer
     *         description: |
     *           **CASE 2.** ID of the SOURCE thesis from which to copy the interpolated matrix. 
     *           Excludes the use of the `optimalState` field from body array. 
     *           Requires `imageTimestamp`.
     *
     *       - in: query
     *         name: imageTimestamp
     *         required: false
     *         schema:
     *           type: number
     *         description: |
     *           **CASE 2.** Timestamp of the matrix snapshot to copy from the source thesis.  
     *           Excludes the use of the `optimalState` field from body array. 
     *           Requires source `thesisId`.
     *
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               stopPercentage:
     *                 type: integer
     *                 description: Irrigation stop percentage (Optional).
     *               optimalWetBound:
     *                 type: integer
     *                 description: Optimal wet boundary limit (Optional).
     *               optimalDryBound:
     *                 type: integer
     *                 description: Optimal dry boundary limit (Optional).
     *               optimalState:
     *                 type: array
     *                 description: |
     *                   **CASE 3.** Array of objects that define the optimal state matrix.  
     *                   Required if neither `optimalProfileId` nor the source `thesisId`/`imageTimestamp` pair is provided.
     *                 items:
     *                   type: object
     *                   properties:
     *                     x: { type: integer }
     *                     y: { type: integer }
     *                     z: { type: integer }
     *                     value: { type: number }
     *                     weight: { type: number }
     *
     *     responses:
     *       200:
     *         description: Optimal state successfully associated or created.
     *
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
     *         description: Unauthorized (user not allowed to set optimal state)
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
    router.put('/:thesisId/setOptimalState', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.PLANNER, requestUserData.isAdmin, 'THESIS', thesisId, 'Watering Advice'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const validFrom = req.query.validFrom ? Number(req.query.validFrom) : Math.floor(Date.now() / 1000);
        const validTo = req.query.validTo

        const {
            stopPercentage: stopPercentage,
            optimalWetBound: optimalWetBound,
            optimalDryBound: optimalDryBound,
        } = req.body;

        try {
            const userId = requestUserData.userId

            const devices = await fieldService.getDevicesByThesis(thesisId, validFrom)
            const device = devices.find(d => d.type === HUMIDITY_DEVICE_TYPE);

            if (!device) {
                return res.status(400).json({
                    error: `Grid device not found for the given thesis`
                });
            }

            const gridId = device.id;
            let optimalProfileAssignmentId = null;

            if (req.query.optimalProfileId !== undefined) {
                const optimalProfileId = Number(req.query.optimalProfileId);
                optimalProfileAssignmentId = await fieldService.setOptimalState(userId, gridId, validFrom, validTo, stopPercentage, optimalWetBound, optimalDryBound, optimalProfileId)
            }
            else if (req.query.thesisId !== undefined && req.query.imageTimestamp !== undefined) {
                const sourceThesisId = Number(req.query.thesisId);
                const imageTimestamp = Number(req.query.imageTimestamp);

                const interpolatedMatrix = await fieldService.getInterpolatedProfiles(sourceThesisId, imageTimestamp, imageTimestamp)

                if (!interpolatedMatrix || !(interpolatedMatrix.length > 0)) {
                    return res.status(400).json({ message: 'Invalid request, given timestamp not found' });
                }

                const optimalState = interpolatedMatrix.map(cell => ({
                    x: cell.x,
                    y: cell.y,
                    z: cell.z,
                    value: cell.value,
                    weight: 1
                }))

                const gridOptimalProfiles = new GridOptimalProfiles(gridId, validFrom, validTo, stopPercentage, optimalDryBound, optimalWetBound, optimalState)
                optimalProfileAssignmentId = await fieldService.createMatrixOptimalState(userId, gridOptimalProfiles)
            }
            else {
                const optimalState = req.body.optimalState
                if (optimalState.length === 0) {
                    return res.status(400).json({ message: 'optimalState must not be empty and must contain at least one element.' });
                }

                const thesisPoints = await fieldService.findThesisPoints(gridId)

                if (!checkOptState(thesisPoints, optimalState))
                    return res.status(400).json({ error: "Optimal state matrix does not match" })

                const gridOptimalProfiles = new GridOptimalProfiles(gridId, validFrom, validTo, stopPercentage, optimalDryBound, optimalWetBound, optimalState)
                optimalProfileAssignmentId = await fieldService.createMatrixOptimalState(userId, gridOptimalProfiles)
            }
            return res.status(200).json({ message: 'Optimal state set successfully' });
        } catch (error) {
            console.log(`Error while setting optimal state: ${error.message}`)
            return res.status(500).json({ error: "Error while setting optimal state" })
        }
    });

    /**
     * @swagger
     * /theses/{thesisId}/wateringParams:
     *   get:
     *     summary: Get information about watering algorithm parameters
     *     description: Get information about watering algorithm parameters for a given thesis
     *     tags: [Theses]
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of thesis in wich set the parameters
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: Timestamp in which find the information (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Watering params returned successfully.
     *         content:
     *           application/json:
     *              schema:
     *                $ref: '#/components/schemas/WateringParams'  
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
     *         description: Unauthorized request – user not allowed to read thesis watering params.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Watering parameters not found
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
    router.get('/:thesisId/wateringParams', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = req.params.thesisId;

        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'THESIS', thesisId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const timestamp = req.query.timestamp ?? Date.now() / 1000

            const result = await wateringAdviceService.getWateringAlgorithmParams(thesisId, timestamp)
            if (result) {
                return res.status(200).json(result)
            }
            return res.status(404).json({ message: `Watering Parameters not found` })
        } catch (error) {
            console.log(`Fail getting watering parameters caused by: ${error.message}`)
            return res.status(500).json({ error: "Error getting watering parameters" })
        }

    });

    /**
     * @swagger
     * /theses/{thesisId}/wateringParams:
     *   put:
     *     summary: Set information about watering algorithm parameters
     *     description: Set information about watering algorithm parameters
     *     tags: [Theses]
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of thesis in wich set the parameters
     *       - in: query
     *         name: validFrom
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating the start date of the new algorithm parameters validity, if not set take actual timestamp (Seconds elapsed since 1/1/1970).
     *       - in: query
     *         name: validTo
     *         schema:
     *           type: number
     *         description: Timestamp for the end date of the new algorithm parameters validity (Seconds elapsed since 1/1/1970).
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/WateringParams'
     *     responses:
     *       200:
     *         description: Watering params updated successfully.
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
     *         description: Unauthorized request – user not allowed to modify thesis watering params.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
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
    router.put('/:thesisId/wateringParams', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = req.params.thesisId;
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        try {
            const userId = requestUserData.userId
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.PLANNER, requestUserData.isAdmin, 'THESIS', thesisId, 'Watering Advice'))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const validFrom = req.query.validFrom ?? Date.now() / 1000
            const validTo = req.query.validTo

            const {
                maxWatering,
                minWatering,
                wateringBaseline,
                wateringFrequency,
                ki,
                kp,
                errorFunction,
                description
            } = req.body;

            const wateringParams = new WateringParams(
                maxWatering,
                minWatering,
                wateringBaseline,
                wateringFrequency,
                ki,
                kp,
                errorFunction,
                description
            );

            const algorithmId = await wateringAdviceService.setWateringAlgorithmParams(userId, thesisId, wateringParams, validFrom, validTo)
            return res.status(200).json({ message: `Watering Parameters updated with success` })
        } catch (error) {
            console.log(`Fail updating watering parameters caused by: ${error.message}`)
            return res.status(500).json({ error: "Error updating watering parameters" })
        }

    });

    /**
     * @swagger
     * /theses/{thesisId}/disable:
     *   post:
     *     summary: Disables a monitoring thesis by setting its validity end timestamp
     *     tags: [Theses]
     *     description: |
     *       Disables a thesis by:
     *       
     *       - Ending validity period of the signals associated with the thesis.
     *       - Ending optimal profile assignment.
     *       - Ending watering algorithm validity.
     *       - Ending thesis validity from sector.
     * 
     *       Requires Authentication and proper Authorization.
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of thesis to disable
     *       - in: query
     *         name: timestamp
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the thesis validity, if not set take actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Thesis succesfuly disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Thesis succesfuly disabled.
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
     *         description: Unauthorized request – user not allowed to end thesis validty.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Resource not found.
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
    router.post('/:thesisId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId;
        const thesisId = req.params.thesisId;
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'THESIS', thesisId))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }
            await fieldService.disableThesis(userId, thesisId, timestamp)
            return res.status(200).json({ message: `Thesis validity succesfully endend` })
        } catch (error) {
            console.log(`Failed disabling thesis: ${error.message}`)
            return res.status(500).json({ error: "Internal error disablingthesis" })
        }
    })

    /**
     * @swagger
     * /theses/{thesisId}/delete:
     *   delete:
     *     summary: Deletes a given thesis
     *     tags: [Theses]
     *     description: |
     *       Deletes a thesis including:
     *       - Deletion of device associations.
     *       - Deletion of advices and watering algorithm parameters.
     * 
     *       Requires Authentication and proper Authorization
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of thesis to delete
     *     responses:
     *       200:
     *         description: Thesis successfully deleted.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Thesis successfully deleted.
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
     *         description: Unauthorized request – user not allowed to delete this thesis.
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
    router.delete('/:thesisId/delete', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId
        const thesisId = req.params.thesisId;

        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'THESIS', thesisId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            await fieldService.deleteThesis(userId, thesisId)
            return res.status(200).json({ message: `Thesis successfully deleted` })
        } catch (error) {
            console.log(`Failed deleting thesis: ${error.message}`)
            return res.status(500).json({ error: "Internal error deleting thesis" })
        }
    })

    function checkOptState(thesisPoints, newOptimalPoints) {
        if (thesisPoints.length !== newOptimalPoints.length) return false;

        for (const point of thesisPoints) {
            const match = newOptimalPoints.find(optPoint => optPoint.x === point.x && optPoint.y === point.y && optPoint.z === point.z);
            if (!match) return false;
        }

        return true;
    }

    return router;
}
export default thesesRouter;