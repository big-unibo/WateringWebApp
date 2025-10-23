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

    return router;
}
export default thesesRouter;