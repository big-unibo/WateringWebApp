import { Router } from 'express';
import sequelize from '../configs/dbConfig.js';

import UserService from '../services/UserService.js';
import AuthenticationService from '../services/AuthenticationService.js';
import AuthorizationService from '../services/AuthorizationService.js';
import LogService from '../services/LogService.js';

const logsRouter = Router();
const userService = new UserService(sequelize);
const authenticationService = new AuthenticationService(userService);
const authorizationService = new AuthorizationService(sequelize)
const logService = new LogService(sequelize)

/**
 * @swagger
 * /logs/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{plantRow}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get logs about a thesis
 *     description:  Get logs about a thesis
 *     tags: [Logs Operations]
 *     parameters:
 *       - in: path
 *         name: refStructureName
 *         required: true
 *         schema:
 *           type: string
 *         description: The reference structure name
 *       - in: path
 *         name: companyName
 *         required: true
 *         schema:
 *           type: string
 *         description: The company name
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: The field name
 *       - in: path
 *         name: sectorName
 *         required: true
 *         schema:
 *           type: string
 *         description: The sector name
 *       - in: path
 *         name: plantRow
 *         required: true
 *         schema:
 *           type: string
 *         description: The plantRow
 *       - in: query
 *         name: timeFilterFrom
 *         schema:
 *           type: string
 *         description: The timestamp in which find the information
 *       - in: query
 *         name: timeFilterTo
 *         schema:
 *           type: string
 *         description: The timestamp in which find the information
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LogDto'
 *       '400':
 *         description: Invalid request or thesis not found.
 *       '401':
 *         description: Unauthorized request.
 *       '403':
 *         description: Authentication failed.
 *       '500':
 *         description: Error on retrieving data.
 */
logsRouter.get("/:refStructureName/:companyName/:fieldName/:sectorName/:plantRow/", async (req, res) => {
    const refStructureName = req.params.refStructureName;
    const companyName = req.params.companyName;
    const fieldName = req.params.fieldName;
    const sectorName = req.params.sectorName;
    const plantRow = req.params.plantRow;
    const timeFilterFrom = req.query.timeFilterFrom;
    const timeFilterTo = req.query.timeFilterTo;

    try {
        const user = await authenticationService.validateJwt(req.headers.authorization);
        if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, plantRow, 'MO', timeFilterFrom, timeFilterTo)))
            return res.status(401).json({ message: 'Unauthorized request' });
    } catch (error) {
        return res.status(403).json({ message: 'Authentication failed' });
    }

    try {

        const result = await logService.getLogs(refStructureName, companyName, fieldName, sectorName, plantRow, timeFilterFrom, timeFilterTo);
        res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

export default logsRouter;