import { Router } from 'express';
import { Company } from '../dtos/companyDto.js';
import { ROLES } from "../commons/permissionRoles.js"

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
     *     parameters:
     *       - in: query
     *         name: timeFilterFrom
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp to filter companies with activity after it (Seconds elapsed since 1/1/1970).
     *       - in: query
     *         name: timeFilterTo
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp to filter companies with activity before it (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: List of companies for the user
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/CompanyBase'
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
            let userAvailableIds = await authorizationService.getAvailableEntityIds(requestUserData.userId, 'COMPANY', ROLES.VIEWER, requestUserData.isAdmin)
            if (Array.isArray(userAvailableIds) && userAvailableIds.length > 0)
            {
                if(userAvailableIds.includes('ALL')){
                    userAvailableIds = null
                }
                const timeFilterFrom = req.query.timeFilterFrom ?? Math.floor(Date.now()/1000);
                const timeFilterTo = req.query.timeFilterTo ?? Math.ceil(Date.now()/1000);
                const companies = await companyService.getCompanies(userAvailableIds, timeFilterFrom, timeFilterTo);
                return res.status(200).json(companies);
            }            
            return res.status(404).json({
                error: "User has no permission to view any company"
            });
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
     *       Retrives data about a company including its farms.
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of company to retrieve
     *       - in: query
     *         name: timeFilterFrom
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp to filter company relations after it (Seconds elapsed since 1/1/1970).
     *       - in: query
     *         name: timeFilterTo
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp to filter company relations before it (Seconds elapsed since 1/1/1970).
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
            return res.status(401).json({ message: 'Authentication failed' });
        }
        
        const companyId = req.params.companyId;
        const timeFilterFrom = req.query.timeFilterFrom ?? Math.floor(Date.now()/1000);
        const timeFilterTo = req.query.timeFilterTo ?? Math.ceil(Date.now()/1000);
        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'COMPANY', companyId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const result = await companyService.getCompanyDetails(companyId, timeFilterFrom, timeFilterTo, requestUserData.userId, requestUserData.isAdmin)
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
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ADMINISTRATOR, requestUserData.isAdmin))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }


            const companyName = req.body.name
            const address = req.body.address
            const organizationIds = req.body.organizationIds
            const createdAt = req.body.createdAt ?? Math.floor(Date.now() / 1000);
            const company = new Company(companyName, address, organizationIds, null, createdAt);

            const companyId = await companyService.createCompany(userId, company);
            return res.status(200).json({ message: `Company created with success`, id: companyId });
        } catch (error) {
            console.log(`Failed creating company caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating company" });
        }
    });

    /**
     * @swagger
     * /companies/{companyId}/update:
     *   put:
     *     summary: Update a company
     *     description: Updates one or more properties of an existing company (name, address, organizationIds). Requires authentication and proper authorization.
     *     tags:
     *       - Companies
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the company to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UpdateCompany'
     *     responses:
     *       200:
     *         description: Company updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
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
     *         description: Unauthorized (user not allowed to update company)
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
     *         description: Internal server error – unexpected error while updating the company
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */

    router.put('/:companyId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId;

        const companyId = Number(req.params.companyId);
        const exists = await companyService.companyExists(companyId);
        if (!exists) {
            return res.status(404).json({ message: 'Company not found' });
        }
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'COMPANY', companyId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const name = req.body.name;
        const address = req.body.address;
        const organizationIds = req.body.organizationIds;

        try {
            const companyUpdateData = new Company(name, address, organizationIds, companyId)
            await companyService.updateCompany(userId, companyUpdateData);
            return res.status(200).json({ message: 'Company successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating company caused by: ${error.message}`)
            return res.status(500).json({ error: "Error on updating company" })
        }
    });

    /**
     * @swagger
     * /companies/{companyId}/disable:
     *   post:
     *     summary: Disables a company.
     *     tags: [Companies]
     *     description: |
     *       Disables a company by:
     *       
     *       - Disabling all of the devices associated with the company.
     *       - Disabling all of the farms associated with the company.
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of company to disable
     *       - in: query
     *         name: validTo
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the company validity, if not set takes actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Company successfully disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Company successfully disabled.
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
     *         description: Unauthorized request – user not allowed to end farm validity.
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
     *         description: Internal server error – unexpected error during the process.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.post('/:companyId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId;

        const companyId = req.params.companyId;
        const exists = await companyService.companyExists(companyId);
        if (!exists) {
            return res.status(404).json({ message: 'Company not found' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const validTo = req.query.validTo ?? currentTimestamp;

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'COMPANY', companyId))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            if (validTo < currentTimestamp - (24 * 60 * 60)) {
                return res.status(400).json({ message: 'Invalid validTo timestamp provided. It must be a timestamp in the last 24 hours' })
            }
            await companyService.disableCompany(userId, requestUserData.isAdmin, companyId, validTo)
            return res.status(200).json({ message: `Company validity successfully ended` })
        } catch (error) {
            console.log(`Failed disabling company: ${error.message}`)
            return res.status(500).json({ error: "Internal error disabling company" })
        }
    })

    /**
     * @swagger
     * /companies/{companyId}/delete:
     *   delete:
     *     summary: Deletes a given company
     *     tags: [Companies]
     *     description: |
     *       Deletes a company including:
     *       - Deletion of all the device belonging to it with all signal data.
     *       - Deletion of all farms.
     * 
     *       Requires Authentication and proper Authorization
     *     parameters:
     *       - in: path
     *         name: companyId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of company to delete
     *     responses:
     *       200:
     *         description: Company successfully deleted.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Company successfully deleted.
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
     *         description: Unauthorized request – user not allowed to delete this company.
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
     *         description: Internal server error – unexpected error during the process.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.delete('/:companyId/delete', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId
        const companyId = req.params.companyId;

        const exists = await companyService.companyExists(companyId);
        if (!exists) {
            return res.status(404).json({ message: 'Company not found' });
        }

        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ADMINISTRATOR, requestUserData.isAdmin, 'COMPANY', companyId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            await companyService.deleteCompany(userId, companyId)
            return res.status(200).json({ message: `Company successfully deleted` })
        } catch (error) {
            console.log(`Failed deleting company: ${error.message}`)
            return res.status(500).json({ error: "Internal error deleting company" })
        }
    })

    return router;
};

export default companiesRouter;