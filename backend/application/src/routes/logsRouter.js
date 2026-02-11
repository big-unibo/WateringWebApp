import { Router } from 'express';
import { ROLES } from '../commons/permissionRoles.js';


const logsRouter = ({ authenticationService, authorizationService, logService, fieldService }) => {
    const router = Router()

    /**
     * @swagger
     * /logs/{thesisId}/anomalies:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Get anomalies logs about a thesis
     *     description:  Get anomalies logs about a thesis
     *     tags: [Logs]
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
     *     responses:
     *       '200':
     *         description: Success
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Log'
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
     *         description: Unauthorized (user not allowed to retrieve optimal distance data for the given thesis)
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
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get("/:thesisId/anomalies", async (req, res) => {
        let user
        try {
            user = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = req.params.thesisId;
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        if (!(await authorizationService.isUserAuthorized(user.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Monitoring'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }
        const timeFilterFrom = req.query.timeFilterFrom;
        const timeFilterTo = req.query.timeFilterTo;

        try {
            const result = await logService.getThesisLogs(thesisId, timeFilterFrom, timeFilterTo);
            res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    return router
}

export default logsRouter;