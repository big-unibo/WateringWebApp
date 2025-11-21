import { Router } from 'express';
import { HUMIDITY_DEVICE_TYPE } from '../commons/constants.js';
import { GridOptimalProfiles } from '../dtos/optStateDto.js';

const thesesRouter = ({ userService, authenticationService, authorizationService, fieldService, wateringAdviceService }) => {
    const router = Router();

    /**
     * @swagger
     * /theses/{thesisId}:
     *   get:
     *     security:
     *      - bearerAuth: []
     *     summary: Return detailed information for a thesis by its ID
     *     tags: [Theses]
     *     description: Return thesis information given its ID
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
     *         description: Timestamp in which find the information
     *     responses:
     *       200:
     *         description: Deteiled thesis information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               $ref: '#/components/schemas/ThesisData'
     *       400:
     *         description: Bad request (missing or invalid thesisId)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized request – user not allowed to get devices info for the thesis
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
            return res.status(403).json({ message: 'Authentication failed' });
        }

        //[TO DO]: Authorization

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const timestamp = req.query.timestamp || Date.now() / 1000

        try {
            const result = await fieldService.getThesisDetails(thesisId, timestamp);
            if (result) {
                return res.status(200).json(result)
            } else {
                return res.status(404).json({ message: "Thesis not found at given timestamp" })
            }

        } catch (error) {
            console.log(`Fail retrieving thesis data: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices data" });
        }
    });

    /**
     * @swagger
     * /theses/{thesisId}/devices:
     *   get:
     *     security:
     *      - bearerAuth: []
     *     summary: Gets all the devices info for a given thesis
     *     tags: [Theses]
     *     description: Endpoint to get all devices and signals info for a given thesis
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
     *     responses:
     *       200:
     *         description: Informations about devices and signals assigned to the given thesis
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                  $ref: '#/components/schemas/Device'
     *       400:
     *         description: Bad request (missing or invalid thesisId)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized request – user not allowed to get devices info for the thesis
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
            return res.status(403).json({ message: 'Authentication failed' });
        }

        if (!req.body || req.body === '')
            return res.status(400).json({ message: 'Invalid request' });

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        try {
            // TODO Authorization
            // if (!(await authorizationService.isUserAuthorizedInSector(user.id, 'update', thesisId)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const timestamp = req.query.timestamp || Date.now()/1000
            const results = await fieldService.getDevicesByThesis(thesisId, timestamp);
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
 *     security:
 *       - bearerAuth: []
 *     summary: Gets all signals data for a given thesis
 *     tags: [Theses]
 *     description: >
 *       Endpoint to retrieve all signal information related to a specific thesis at a given timestamp.
 *       Supports filtering by signal types through query parameters.
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
 *         description: Filte signal types to include.
 *       - in: query
 *         name: timestamp
 *         schema:
 *           type: number
 *           example: 1715529600
 *         description: Unix timestamp (in seconds) in which find available signal for the thesis
 *     responses:
 *       200:
 *         description: Successfully retrieved signals data for the specified thesis
 *         content:
 *           application/json:
 *             schema:
 *                 $ref: '#/components/schemas/SignalsDataBaseResponse'
 *       400:
 *         description: Bad request — missing or invalid parameters (thesisId or timestamp).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized request — user not allowed to access signals for the thesis.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Authentication failed — invalid or missing JWT token.
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
            return res.status(403).json({ message: 'Authentication failed' });
        }

        if (!req.body || req.body === '')
            return res.status(400).json({ message: 'Invalid request' });

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        let signalTypes = req.query.signalTypes || [];
        if (!Array.isArray(signalTypes)) signalTypes = [signalTypes];


        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        try {
            //[TO DO]: Authorization
            // if (!(await authorizationService.isUserAuthorizedInSector(requestUserData.userid, 'update', thesisId)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const results = await fieldService.getSignalsByThesis(thesisId, signalTypes, timestamp);
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
     *     security:
     *       - bearerAuth: []
     *     summary: Get last watering advice for a thesis
     *     description: Get last watering advice for a thesis
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
     *       400:
     *         description: Bad request — missing or invalid parameters (thesisId or timestamp).
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized request — user not allowed to access signals for the thesis.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Authentication failed — invalid or missing JWT token.
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
     *         description: Internal server error — unexpected error while retrieving signals data.
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
            return res.status(403).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        try {
            // TODO Authorization  
            // if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
            //     return res.status(401).json({message: 'Unauthorized request'});

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
     *     security:
     *       - bearerAuth: []
     *     summary: Simulate watering advice for a thesis
     *     description: SImulate the watering advice for a thesis in a given timestamp
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
     *         description: Invalid request.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error on computing advice.
     */
    router.get('/:thesisId/wateringAdvice', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const expectedWater = req.query.expectedWater ? req.query.expectedWater : 0;
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;


        try {
            // TODO authorization 
            //if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const result = await wateringAdviceService.getWateringAdvice(thesisId, expectedWater, timestamp)

            return res.status(200).json(result)
        } catch (error) {
            console.log(`Fail compute watering advice caused by: ${error.message}`)
            return res.status(500).json({ error: "Error computing watering advice" })
        }
    });


    /**
     * @swagger
     * /theses/{thesisId}/setOptimalState:
     *   put:
     *     security:
     *       - bearerAuth: []
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
     *
     *       - in: query
     *         name: validFrom
     *         required: false
     *         schema:
     *           type: integer
     *         description: Timestamp (Integer) indicating the start date of the new optimal state's validity (Seconds elapsed since 1/1/1970).
     *
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
     *           type: integer
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
     *               validTo:
     *                 type: integer
     *                 description: Timestamp (Integer) for the end date of the new optimal state's validity (Optional).
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
     *                     weight: { type: integer }
     *
     *     responses:
     *       200:
     *         description: Optimal state successfully associated or created.
     *
     *       400:
     *         description: Bad request (Missing/invalid parameters, grid not found, optimal state matrix not provided or dimensions mismatched).
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
     *       401:
     *         description: Authentication failed (Invalid or missing JWT).
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
     *       403:
     *         description: Unauthorized request – user not allowed to modify the thesis state.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
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

        if (!req.body || req.body === '')
            return res.status(400).json({ message: 'Invalid request' });

        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }


        let validFrom;

        if (req.query.validFrom === undefined) {
            validFrom = Math.floor(Date.now() / 1000); 
        } else {
            validFrom = Number(req.query.validFrom);
            if (isNaN(validFrom) || !Number.isInteger(validFrom)) {
                return res.status(400).json({ message: 'validFrom must be an integer timestamp' });
            }
        }

        const {
            validTo: validTo,
            stopPercentage: stopPercentage,
            optimalWetBound: optimalWetBound,
            optimalDryBound: optimalDryBound,
        } = req.body;

        try {
            // TODO authorization 
            //if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const devices = await fieldService.getDevicesByThesis(thesisId)
            const device = devices.find(d => d.deviceType === HUMIDITY_DEVICE_TYPE);

            if (!device) {
                return res.status(400).json({
                    error: `Grid device not found for the given thesis`
                });
            }
            const gridId = device.deviceId;


            if (req.query.optimalProfileId !== undefined) {
                const optimalProfileId = Number(req.query.optimalProfileId);

                if (isNaN(optimalProfileId) || !Number.isInteger(optimalProfileId)) {
                    return res.status(400).json({ message: 'optimalProfileId must be an integer number' });
                }

                await fieldService.setOptimalState(gridId, validFrom, validTo, stopPercentage, optimalWetBound , optimalDryBound, optimalProfileId)
                return res.status(200).json({ message: 'Optimal state set successfully' });
            }
            else if (req.query.thesisId !== undefined && req.query.imageTimestamp !== undefined) {
                const sourceThesisId = Number(req.query.thesisId);
                const imageTimestamp = Number(req.query.imageTimestamp);

                if (isNaN(sourceThesisId) || !Number.isInteger(sourceThesisId)) {
                    return res.status(400).json({ message: 'source thesisId must be an integer number' });
                }
                if (isNaN(imageTimestamp) || !Number.isInteger(imageTimestamp)) {
                    return res.status(400).json({ message: 'imageTimestamp must be an integer number' });
                }

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
                await fieldService.createMatrixOptimalState(gridOptimalProfiles)
                return res.status(200).json({ message: 'Optimal state set successfully' });

            }
            else {
                const optimalState = req.body.optimalState
                if (optimalState === undefined || !Array.isArray(optimalState)) {
                    return res.status(400).json({ message: 'optimalState is required and must be a vlaid array' });
                }

                if (optimalState.length === 0) {
                    return res.status(400).json({ message: 'optimalState must not be empty and must contain at least one element.' });
                }

                const thesisPoints = await fieldService.findThesisPoints(gridId)

                if (!checkOptState(thesisPoints, optimalState))
                    return res.status(400).json({ error: "Optimal state matrix does not match" })

                const gridOptimalProfiles = new GridOptimalProfiles(gridId, validFrom, validTo, stopPercentage, optimalDryBound, optimalWetBound, optimalState)
                await fieldService.createMatrixOptimalState(gridOptimalProfiles)
                return res.status(200).json({ message: 'Optimal state set successfully' });
            }
        } catch (error) {
            console.log(`Error while setting optimal state: ${error.message}`)
            return res.status(500).json({ error: "Error while setting optimal state" })
        }
    });


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