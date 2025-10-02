import { Router, request } from 'express';

import sequelize from '../configs/dbConfig.js';
import CompanyService from "../services/CompanyService.js";

const companyRouter = Router();
const companyService = new CompanyService(sequelize);

/**
 * @swagger
 * /companies/createCompany:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Creates a company and associates it with an organization.
 *     tags: [Company route]
 *     description: Endpoint to register a new company under a specified organization.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - organizationid
 *             properties:
 *               company_name:
 *                 type: string
 *                 description: Name of the company to be created
 *               organizationid:
 *                 type: integer
 *                 description: ID of the organization to associate the company with
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
 *         description: Missing or invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '401':
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '403':
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

companyRouter.put('/createCompany', async (req, res) => {
    let requestUserData
    try {
        requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    } catch (error) {
        return res.status(403).json({message: 'Authentication failed'});
    }

    try {
        const user = await userService.findUser(requestUserData.userid);
        const organizationRaw = await requestUserData.organizationid;

        if (!organizationRaw || isNaN(parseInt(organizationraw))) {
            return res.status(400).json({ message: 'organizationid is required and must be a number' });
        }
        const organization = parseInt(organizationRaw)

        if (!(await authorizationService.isUserAuthorized(user.userid, 'create', 'company')))
            return res.status(401).json({message: 'Unauthorized request'});

        if(!req.body && req.body === '')
            throw new Error('Body is empty');

        const company_name = req.body.company_name;
        const result = await companyService.createCompany(company_name,organization);
        return res.status(200).json({message: `Company created with success`})
    } catch (error) {
        console.log(`Failed creating company caused by: ${error.message}`)
        return res.status(500).json({message: "Error on creating company"})
    }
})

export default companyRouter;