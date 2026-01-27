import { Router } from 'express';
import { Company } from '../dtos/companyDto.js';

const companiesRouter = ({ companyService, authenticationService, authorizationService }) => {
    const router = Router();

    /**
     * @swagger
     * /companies:
     *   get:
     *     summary: Retrieve all companies available for the user
     *     tags: [Companies]
     *     description: | 
     *       Retrieve all companies available for the user.
     *       Requires Authentication and proper authorization
     *     responses:
     *       200:
     *         description: List of companies for the user
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Company'
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
            const companies = await companyService.getCompanies(requestUserData.userId);
            return res.status(200).json(companies || []);
        } catch (error) {
            console.log(`Fail retrieving companies caused by: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving companies" });
        }
    });

    /**
     * @swagger
     * /companies/{companyId}:
     *   get:
     *     summary: Retrives data about a company.
     *     tags: [Companies]
     *     description: |
     *       Retrives data about a company including its fields.
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of company to retrieve
     *     responses:
     *       200:
     *         description: Detailed company information
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CompanyData'
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
     *         description: Unauthorized request – user not allowed view company data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: No company found
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
    router.get('/:companyId', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        //[TO DO]: Authorization

        const companyId = req.params.companyId;

        try {
            const result = await companyService.getCompanyDetails(companyId)
            if (!result) {
                return res.status(404).json({ error: "Company not found" })
            }
            return res.status(200).json(result)
        } catch (error) {
            console.log(`Failed retrieving company data: ${error.message}`)
            return res.status(500).json({ error: "Internal error retrieving company data" })
        }
    })

    /**
     * @swagger
     * /companies/create:
     *   post:
     *     summary: Creates a new company and associate it with an organization
     *     description: Endpoint to register a new company under a specified organization. Requires authentication and proper authorization.
     *     tags: [Companies]
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
     *                 id:
     *                   type: number
     *                   description: Id of the new Company           
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
     *         description: Unauthorized (user not allowed to create companies)
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
            // if (!(await authorizationService.isUserAuthorized(requestUserData.userId, 'create', 'companies')))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const organizationId = Number(req.body.organizationId)
            const companyName = req.body.companyName;
            const company = new Company(companyName, organizationId);

            const companyId = await companyService.createCompany(userId, company);
            return res.status(200).json({ message: `Company created with success`, id: companyId });
        } catch (error) {
            console.log(`Failed creating company caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating company" });
        }
    });

    return router;
};

export default companiesRouter;