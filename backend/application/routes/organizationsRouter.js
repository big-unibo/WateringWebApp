import { Router } from 'express';

const organizationsRouter = ({organizationService, authenticationService, userService, authorizationService}) => {
    const router = Router();

    /**
     * @swagger
     * /organizations/create:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Create a new organization
     *     description: Endpoint to register a new organization with a given name. Requires authentication and proper authorization.
     *     tags: [Organizations]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - organizationName
     *             properties:
     *               organizationName:
     *                 type: string
     *                 description: Name of the organization to create
     *     responses:
     *       200:
     *         description: Organization created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the new Organization                      
     *       400:
     *         description: Bad request (missing or invalid organizationName)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized (user not allowed to create organization)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error while creating the organization
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */

    router.post('/create', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        
        try {
            const user = await userService.findUser(requestUserData.userid);

            if (!(await authorizationService.isUserAuthorized(user.id, 'create', 'organizations'))) 
                return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || !req.body.organizationName) {
                throw new Error('Body is empty or missing organizationName');
            }
            const organizationId = await organizationService.createOrganization(req.body.organizationName);
            return res.status(200).json({ message: 'Organization created successfully' , id: organizationId});
        } catch (error) {
            console.error(`Failed creating organization caused by: ${error.message}`);
            return res.status(500).json({ message: 'Error on creating organization' });
        }
    });

    return router;
};

export default organizationsRouter;