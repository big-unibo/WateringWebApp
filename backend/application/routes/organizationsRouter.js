import { Router } from 'express';

const organizationsRouter = ({ organizationService, authenticationService, authorizationService }) => {
    const router = Router();

    /**
     * @swagger
     * /organizations/create:
     *   post:
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
     *       '200':
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
     *         description: Unauthorized (user not allowed to create organizations)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '500':
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
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'organizations')))
                return res.status(403).json({ message: 'Unauthorized request' });

            const organizationId = await organizationService.createOrganization(req.body.organizationName);
            return res.status(200).json({ message: 'Organization created successfully', id: organizationId });
        } catch (error) {
            console.error(`Failed creating organization caused by: ${error.message}`);
            return res.status(500).json({ message: 'Error on creating organization' });
        }
    });

    return router;
};

export default organizationsRouter;