import { Router } from 'express';
import { CreateCompanyDto } from '../dtos/companyDto.js';

const companiesRouter = ({ companyService, userService, authenticationService, authorizationService }) => {
    const router = Router();

    /**
     * @swagger
     * /companies/createCompany:
     *   post:
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
     *               - companyName
     *               - organizationId
     *             properties:
     *               companyName:
     *                 type: string
     *               organizationId:
     *                 type: integer
     *     responses:
     *       '200':
     *         description: Company created successfully
     *       '400':
     *         description: Missing or invalid request data
     *       '401':
     *         description: Unauthorized request
     *       '403':
     *         description: Authentication failed
     *       '500':
     *         description: Internal server error
     */

    router.post('/createCompany', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }

        try {
            const user = await userService.findUser(requestUserData.userid);
            if (!(await authorizationService.isUserAuthorized(user.id, 'create', 'companies')))
                return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || req.body === '')
                throw new Error('Body is empty');

            const organizationRaw = req.body.organizationId;
            if (!organizationRaw || isNaN(parseInt(organizationRaw))) {
                return res.status(400).json({ message: 'organizationId is required and must be a number' });
            }

            const organizationId = parseInt(organizationRaw);
            const companyName = req.body.companyName;
            const company = new CreateCompanyDto(companyName,organizationId);

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