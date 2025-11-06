import { Router } from 'express';

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
    router.get('/:thesisId', async (req,res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const timestamp = req.query.timestamp || Date.now()/1000

        try {
            // if (!(await authorizationService.isUserAuthorizedInSector(requestUserData.userid, 'update', thesisIdParsed)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const result = await fieldService.getThesisDetails(thesisId, timestamp);
            if (result){
                return res.status(200).json(result)
            } else {
                return res.status(404).json({message: "Thesis not found at given timestamp"})
            }

        } catch (error) {
            console.log(`Fail retrieving thesis data: ${error.message}`);
            return res.status(500).json({error: "Error while retrieving devices data"});
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
    router.get('/:thesisId/devices', async (req,res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

        if(!req.body || req.body === '')
        return res.status(400).json({message: 'Invalid request'});

        const { thesisId } = req.params;

        if (!thesisId || isNaN(parseInt(thesisId))) {
            return res.status(400).json({ message: 'thesisId is required and must be a number' });
        }
        const thesisIdParsed = parseInt(thesisId);

        try {
            const user = await userService.findUser(requestUserData.userid);
            // if (!(await authorizationService.isUserAuthorizedInSector(user.id, 'update', thesisIdParsed)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const results = await fieldService.getDevicesByThesis(thesisIdParsed);
            return res.status(200).json(results)
        } catch (error) {
            console.log(`Fail retrieving devices data: ${error.message}`);
            return res.status(500).json({error: "Error while retrieving devices data"});
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
    router.get('/:thesisId/signals', async(req,res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

        if(!req.body || req.body === '')
        return res.status(400).json({message: 'Invalid request'});

        const { thesisId } = req.params;
        if (!thesisId || isNaN(parseInt(thesisId))) {
            return res.status(400).json({ message: 'thesisId is required and must be a number' });
        }
        const thesisIdParsed = parseInt(thesisId);

        let signalTypes = req.query.signalTypes || [];
        if (!Array.isArray(signalTypes)) signalTypes = [signalTypes];


        const timestamp = req.query.timestamp
            ? Number(req.query.timestamp)
            : null;
        
        if (timestamp === null || isNaN(timestamp)) {
            return res.status(400).json({ message: 'timestamp is required and must be a valid date' });
        }

        try {
            const user = await userService.findUser(requestUserData.userid);
            //[TO DO]: Authorization
            // if (!(await authorizationService.isUserAuthorizedInSector(user.id, 'update', thesisIdParsed)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const results = await fieldService.getSignalsByThesis(thesisIdParsed, signalTypes, timestamp);
            return res.status(200).json(results)
        } catch (error) {
            console.log(`Fail retrieving devices data: ${error.message}`);
            return res.status(500).json({error: "Error while retrieving devices data"});
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
        return res.status(403).json({message: 'Authentication failed'});
      }

        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

      const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

      try {
        // TODO Authorization  
        // if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
        //     return res.status(401).json({message: 'Unauthorized request'});

        const result = await wateringAdviceService.getThesisLastWateringAdvice(thesisId, timestamp)
        if(result){
            return res.status(200).json(result)
        } else {
            return res.status(404).json({ message: 'No advice found for specified thesis' });
        }
      } catch (error) {
        console.log(`Failed getting watering advice caused by: ${error.message}`)
        return res.status(500).json({error: "Error getting watering advice"})
      }
    });

    /**
     * @swagger
     * /theses/{thesisId}/wateringAdvice:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Get watering advice for a thesis
     *     description: Get watering advice for a thesis
     *     parameters:
     *      - in: path
     *        name: thesisId
     *        required: true
     *        schema:
     *           type: integer
     *        description: The thesis identifier
     *      - in: query
     *        name: expectedWater
     *        type: number
     *      - in: query
     *        name: timestamp
     *        type: number
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
            return res.status(403).json({message: 'Authentication failed'});
        }

        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const expectedWater = req.query.expectedWater ? req.query.expectedWater : 0;
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;


        try {
            // TODO authorization 
            //if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
            //     return res.status(401).json({message: 'Unauthorized request'});

            const result = await wateringAdviceService.getWateringAdvice(thesisId, expectedWater, timestamp)

            return res.status(200).json(result)
        } catch (error) {
            console.log(`Fail compute watering advice caused by: ${error.message}`)
            return res.status(500).json({error: "Error computing watering advice"})
        }
    });

    return router;
}
export default thesesRouter;