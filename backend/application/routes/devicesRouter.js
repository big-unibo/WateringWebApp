import { Router } from 'express';

import { CreateSignal, SignalAssociation, CreateDevice } from '../dtos/deviceDto.js';


const devicesRouter = ({ authenticationService, authorizationService, userService, deviceService }) => {
    const router = Router();

    /**
     * @swagger
     * /devices/create:
     *   post:
     *     summary: Create a new device with its signals
     *     description: Receives a device object with a list of signals and creates the device along with its signals.  Requires authentication and proper authorization.
     *     tags:
     *       - Devices
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateDevice'
     *     responses:
     *       200:
     *         description: Device created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: The created device id
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
     *         description: Unauthorized (user not allowed to create devices)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while creating the device
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
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'create', 'devices')))
                return res.status(403).json({ message: 'Unauthorized request' });

            const signalsArray = req.body.signals
            
            const device = new CreateDevice(req.body.type, Number(req.body.providerId), req.body.description,
                req.body.location, req.body.binningId, (signalsArray || []).map(sig => new CreateSignal(sig)));

            const deviceId = await deviceService.createDevice(device);
            return res.status(200).json({ message: `Device created with success`, id: deviceId });
        } catch (error) {
            console.log(`Failed creating Device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating device" });
        }
    });

    /**
     * @swagger
     * /devices/{deviceId}/assign:
     *   post:
     *     summary: Assigns all the signals of a device to a given field, sector, or thesis
     *     description: |
     *       Assigns all the signals of a device to a given field, sector, or thesis.
     *       
     *       **Required request parameters:**
     *       - **targetId** (*integer*): ID of the target entity
     *       - **targetType** (*string*): One of the following values:
     *         - `field`
     *         - `sector`
     *         - `thesis`
     *       - **validFrom** (*number*, optional): Timestamp (in seconds since 01/01/1970) indicating when the association becomes valid
     *       
     *       Requires authentication and appropriate authorization.
     *     tags:
     *       - Devices
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the device
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SignalAssociation'
     *     responses:
     *       200:
     *         description: Signal successfully associated
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
     *         description: Unauthorized (user not allowed to create companies)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while assigning sginals
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.post('/:deviceId/assign', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        //[TO DO]: Authorization

        try {

            const deviceId = req.params.deviceId
            const targetType = req.body.targetType
            const targetId = req.body.targetId
            const validFrom = req.body.validFrom

            const signalAssociation = new SignalAssociation(deviceId, targetType, targetId, validFrom);

            await deviceService.assignSignals(signalAssociation);
            return res.status(200).json({ message: 'Signals successfully associated' });
        } catch (error) {
            console.log(`Failed assigning signals caused by: ${error.message}`);
            return res.status(500).json({ message: "Error assigning signals" });
        }
    });

    return router;
}

export default devicesRouter;