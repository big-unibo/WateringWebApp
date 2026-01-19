import { Router } from 'express';
import { ORGANIZATIONS_LOG_TABLE } from '../commons/constants.js';

const organizationsRouter = ({ organizationService, authenticationService, authorizationService, userActionService }) => {
    const router = Router();

    /**
     * @swagger
     * /organizations:
     *   get:
     *     summary: Retrieve all organizations available for the user
     *     tags: [Organizations]
     *     description: | 
     *       Retrieve all organizations available for the user.
     *       Requires Authentication and proper authorization
     *     responses:
     *       200:
     *         description: List of organizations for the user
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Organization'
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
     *       500:
     *         description: Internal server error – unexpected error while retrieving sectors
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.get('/', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const organizations = await organizationService.getOrganizations(requestUserData.userId);
            return res.status(200).json(organizations || []);
        } catch (error) {
            console.log(`Fail retrieving organizations caused by: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving organizations" });
        }
    });

    /**
     * @swagger
     * /organizations/{organizationId}:
     *   get:
     *     summary: Retrives data about an organization.
     *     tags: [Organizations]
     *     description: |
     *       Retrives data about an organization including names and ids of its companies
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: organizationId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of organization to retrieve
     *     responses:
     *       200:
     *         description: Detailed organization information
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrganizationData'
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
     *         description: Unauthorized request – user not allowed view organization data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: No organization found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
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
    router.get('/:organizationId', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        //[TO DO]: Authorization

        const organizationId = req.params.organizationId;

        try {
            const result = await organizationService.getOrganizationDetails(organizationId)
            if (!result) {
                return res.status(404).json({ error: "Organization not found" })
            }
            return res.status(200).json(result)
        } catch (error) {
            console.log(`Failed retrieving organization data: ${error.message}`)
            return res.status(500).json({ error: "Internal error retrieving organization data" })
        }
    })

    /**
     * @swagger
     * /organizations/create:
     *   post:
     *     summary: Create a new organization
     *     description: |
     *        Endpoint to register a new organization with a given name. 
     * 
     *        Requires authentication and proper authorization.
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
            const userId = requestUserData.userId;
            //const rule = PERMISSIONS.CREATE_ORGANIZATION.checks[0];
            
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userId, 'create', 'organizations')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const organizationName = req.body.organizationName;

            const organizationId = await organizationService.createOrganization(userId, organizationName);
            return res.status(200).json({ message: 'Organization created successfully', id: organizationId });
        } catch (error) {
            console.error(`Failed creating organization caused by: ${error.message}`);
            return res.status(500).json({ message: 'Error on creating organization' });
        }
    });

    return router;
};

export default organizationsRouter;