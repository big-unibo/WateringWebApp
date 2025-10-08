import { Router } from 'express';
import { Company } from '../dtos/companyDto.js';

const companiesRouter = ({ companyService, userService, authenticationService, authorizationService }) => {
    const router = Router();

    /**
     * @swagger
     * /companies/createCompany:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Create a new company and associate it with an organization
     *     description: Endpoint to register a new company under a specified organization. Requires authentication and proper authorization.
     *     tags: [Company route]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateCompany'
     *     responses:
     *       '200':
     *         description: Company created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '400':
     *         description: Bad Request – missing or invalid request data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '401':
     *         description: Unauthorized – user does not have permission to create a company
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Authentication failed – invalid or missing JWT
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '409':
     *         description: Conflict – company name already exists
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '500':
     *         description: Internal Server Error – error creating the company
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
     * components:
     *   securitySchemes:
     *     $ref: '#/components/schemas/securityScheme'
     */


    router.post('/createCompany', async (req, res) => {
        let requestUserData;
        // try {
        //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        // } catch (error) {
        //     return res.status(403).json({ message: 'Authentication failed' });
        // }

        try {
            // const user = await userService.findUser(requestUserData.userid);
            // if (!(await authorizationService.isUserAuthorized(user.id, 'create', 'companies')))
            if (!(await authorizationService.isUserAuthorized(1, 'create', 'companies')))
                return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || req.body === '')
                throw new Error('Body is empty');

            const organizationRaw = req.body.organizationId;
            if (!organizationRaw || isNaN(parseInt(organizationRaw))) {
                return res.status(400).json({ message: 'organizationId is required and must be a number' });
            }

            const organizationId = parseInt(organizationRaw);
            const companyName = req.body.companyName;
            const company = new Company(companyName,organizationId);

            await companyService.createCompany(company);
            return res.status(200).json({ message: `Company created with success` });
        } catch (error) {
            console.log(`Failed creating company caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating company" });
        }
    });

    return router;
};

export default companiesRouter;