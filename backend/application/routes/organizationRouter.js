import { Router, request } from 'express';

import sequelize from '../configs/dbConfig.js';
import OrganizationService from "../services/OrganizationService.js";

const organizationRouter = Router();
const organizationService = new OrganizationService(sequelize);

/**
 * @swagger
 * /organizations/createOrganization:
 *   put:
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

organizationRouter.put('/createOrganization', async (req, res) => {
    let requestUserData
    // try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    // } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    // }

    try {
        const user = await userService.findUser(requestUserData.userid)
        if (!(await authorizationService.isUserAuthorized(user.userid, 'create', 'organization')))
            return res.status(401).json({message: 'Unauthorized request'});

        if(!req.body || req.body === '')
            throw new Error('Body is empty');

        const organization_name = req.body.organization_name;
        const result = await organizationService.createOrganization(organization_name);
        return res.status(200).json({message: `Organization created with success`})
    } catch (error) {
        console.log(`Failed creating organization caused by: ${error.message}`)
        return res.status(500).json({message: "Error on creating organization"})
    }
})

export default organizationRouter;