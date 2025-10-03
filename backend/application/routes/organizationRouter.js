import { Router } from 'express';

const organizationRouter = (organizationService, authenticationService, userService, authorizationService) => {
    const router = Router();

    /**
     * @swagger
     * /organizations/createOrganization:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Creates an organization with a given name.
     *     tags: [Organization route]
     *     description: Endpoint to register organizations
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               organization_name:
     *                 type: string
     *     responses:
     *       '200':
     *         description: Successful operation
     *       '401':
     *         description: Unauthorized request
     *       '403':
     *         description: Authentication failed
     *       '500':
     *         description: Internal server error
     */

    router.post('/createOrganization', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }

        try {
            const user = await userService.findUser(requestUserData.userid);

            const authorized = await authorizationService.isUserAuthorized(user.userid, 'create', 'organizations');
            if (!authorized) return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || !req.body.organization_name) {
                throw new Error('Body is empty or missing organization_name');
            }

            await organizationService.createOrganization(req.body.organization_name);
            return res.status(200).json({ message: 'Organization created successfully' });
        } catch (error) {
            console.error(`Failed creating organization caused by: ${error.message}`);
            return res.status(500).json({ message: 'Error on creating organization' });
        }
    });

    return router;
};

export default organizationRouter;