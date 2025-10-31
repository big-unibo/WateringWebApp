import { Router } from 'express';

import { Thesis } from '../dtos/thesisDto.js';

const thesesRouter = ({ userService, authenticationService, authorizationService, fieldService }) => {
    const router = Router();

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
     *         description: Unauthorized request – user not permitted to get devices info for the thesis
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
     *         description: Optional filter — one or more signal types to include.
     *       - in: query
     *         name: timestamp
     *         required: true
     *         schema:
     *           type: number
     *           example: 1715529600
     *         description: Unix timestamp (in seconds) representing the time to retrieve signals data for.
     *     responses:
     *       200:
     *         description: Successfully retrieved signals data for the specified thesis.
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
     *         description: Unauthorized request — user not permitted to access signals for the thesis.
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

    return router;
}
export default thesesRouter;