import { Router } from 'express';

import { Field } from '../dtos/fieldDto.js';
import { Sector } from '../dtos/sectorDto.js';

const fieldsRouter = ({ authenticationService, authorizationService, fieldService }) => {
    const router = Router();


    /**
     * @swagger
     * /fields/{fieldId}:
     *   get:
     *     summary: Retrives data about a field.
     *     tags: [Fields]
     *     description: |
     *       Retrives data about a field including:
     *       
     *       - Info about the company owning it
     *       - Info about the organization owning it
     *       - Names and ids of its sectors
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: fieldId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of field to disable
     *     responses:
     *       200:
     *         description: Detailed sector information
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/FieldData'
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
     *         description: Unauthorized request – user not allowed view filed data
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
    router.get('/:fieldId', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        //[TO DO]: Authorization

        const fieldId = req.params.fieldId;

        try {
            const result = await fieldService.getFieldDetails(fieldId)
            return res.status(200).json(result)
        } catch (error) {
            console.log(`Failed retrieving field data: ${error.message}`)
            return res.status(500).json({ error: "Internal error retrieving field data" })
        }
    })


    /**
     * @swagger
     * /fields/create:
     *   post:
     *     summary: Creates a new field
     *     description: Creates a new field within a company. Requires authentication and proper authorization.
     *     tags:
     *       - Fields
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateField'
     *     responses:
     *       200:
     *         description: Field created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the new Field           
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
     *         description: Unauthorized (user not allowed to create fields)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
    */
    router.post('/create', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId;
            const companyId = Number(req.body.companyId)

            if (!(await authorizationService.isUserAuthorizedById(userId, 'update', 'companies', companyId)))
                return res.status(403).json({ message: 'Unauthorized request' });

            const fieldLocation = req.body.location
            const fieldName = req.body.fieldName
            const field = new Field(fieldName, companyId, fieldLocation);

            const fieldId = await fieldService.createField(userId, field);
            return res.status(200).json({ message: `Field created with success`, id: fieldId })
        } catch (error) {
            console.log(`Failed creating field caused by: ${error.message}`)
            return res.status(500).json({ message: "Error on creating field" })
        }
    })


    /**
     * @swagger
     * /fields/{fieldId}/disable:
     *   post:
     *     summary: Disables a field.
     *     tags: [Fields]
     *     description: |
     *       Disables a field by:
     *       
     *       - Ending validity period of the devices associated with the field.
     *       - Disabling all of the sectors associated with the field.
     * 
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: fieldId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of field to disable
     *       - in: query
     *         name: timestamp
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the field validity, if not set takes actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Field succesfuly disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Field succesfuly disabled.
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
     *         description: Unauthorized request – user not allowed to end field validity.
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
    router.post('/:fieldId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId;

        const fieldId = req.params.fieldId;
        const exists = await fieldService.fieldExists(fieldId);
        if (!exists) {
            return res.status(404).json({ message: 'Field not found' });
        }

        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        //[TO DO]: Authorization

        try {
            await fieldService.disableField(userId, fieldId, timestamp)
            return res.status(200).json({ message: `Field validity succesfully endend` })
        } catch (error) {
            console.log(`Failed disabling field: ${error.message}`)
            return res.status(500).json({ error: "Internal error disabling thesis" })
        }
    })

    /**
     * @swagger
     * /fields/{fieldId}/createSector:
     *   post:
     *     summary: Creates a new sector
     *     description: Creates a new sector within a field. Requires authentication and proper authorization.
     *     tags:
     *       - Fields
     *     parameters:
     *       - in: path
     *         name: fieldId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the field the sector belongs to
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateSector'
     *     responses:
     *       200:
     *         description: Sector created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the new Sector          
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
     *         description: Unauthorized (user not allowed to create sectors for the given field)
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
     *         description: Internal server error – unexpected error while creating the sector
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
    */
    router.post('/:fieldId/createSector', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const userId = requestUserData.userId
            const fieldId = Number(req.params.fieldId)


            const exists = await fieldService.fieldExists(fieldId);
            if (!exists) {
                return res.status(404).json({ message: 'Field not found' });
            }

            // if (!(await authorizationService.isUserAuthorizedInField(userId, 'update', fieldId)))
            //     return res.status(403).json({ message: 'Unauthorized request' });

            const {
                sectorName,
                culture,
                cultureType,
                location,
                prescriptive,
                advice,
                dripperCapacity,
                sprinklerCapacity,
                doubleWing
            } = req.body;

            const sector = new Sector(
                sectorName,
                fieldId,
                culture,
                cultureType,
                location,
                prescriptive,
                advice,
                dripperCapacity,
                sprinklerCapacity,
                doubleWing
            );

            const sectorId = await fieldService.createSector(userId, sector);
            return res.status(200).json({ message: `Sector created with success`, id: sectorId })
        } catch (error) {
            console.log(`Failed creating sector caused by: ${error.message}`)
            return res.status(500).json({ message: "Error on creating sector" })
        }
    })

    return router;
}
export default fieldsRouter;