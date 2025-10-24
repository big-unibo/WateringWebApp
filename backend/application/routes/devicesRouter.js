import { Router } from 'express';

import { CreateSignal, SignalAssociation, SignalTargetType, CreateDevice } from '../dtos/deviceDto.js'; 


const devicesRouter = ({authenticationService, authorizationService, userService, deviceService}) => {
    const router = Router();

    /**
     * @swagger
     * /devices/create:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Create a new device with its signals
     *     description: Receives a device object with a list of signals and creates the device along with its signals.
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
     *       400:
     *         description: Bad request – missing or invalid fields in the body
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized – user is authenticated but not allowed to create devices
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Forbidden – authentication failed due to invalid or missing JWT
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
            return res.status(403).json({ message: 'Authentication failed' });
        }
        try {
            const user = await userService.findUser(requestUserData.userid);
            if (!(await authorizationService.isUserAuthorized(user.id, 'create', 'devices')))
                return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || req.body === '')
                throw new Error('Body is empty');

            const signalsArray = Array.isArray(req.body.signals) 
                ? req.body.signals 
                : JSON.parse(req.body.signals || "[]");

            const device = new CreateDevice({
                type: req.body.type,
                providerId: req.body.providerId,
                description: req.body.description,
                location: req.body.location,
                binningId: req.body.binningId,
                signals: (signalsArray|| []).map(sig => new CreateSignal(sig))
            });

            const deviceId = await deviceService.createDevice(device);
            return res.status(200).json({ message: `Device created with success`, id:  deviceId});
        } catch (error) {
            console.log(`Failed creating Device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating device" });
        }
    });

    /**
     * @swagger
     * /devices/{deviceId}/assign:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Assigns all the signals of a device to a given field, sector, or thesis
     *     description: |
     *       Assigns all the signals of a device to a given field, sector, or thesis.
     *       
     *       **Required request parameters:**
     *       - **targetId** (`integer`): ID of the target entity (e.g., field, sector, or thesis)
     *       - **targetType** (`string`): One of the following values:
     *         - `field`
     *         - `sector`
     *         - `thesis`
     *       - **validFrom** (`number`, optional): Timestamp (in seconds since 01/01/1970) indicating when the association becomes valid
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
     *       400:
     *         description: Bad request – missing required fields or invalid targetType
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized – user is authenticated but not permitted to assign signals
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Forbidden – authentication failed due to invalid or missing JWT
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
            return res.status(403).json({ message: 'Authentication failed' });
        }

        try {
            // const user = await userService.findUser(requestUserData.userid);
            if (!req.body || req.body === '')
                throw new Error('Body is empty');
            
            //[TO DO]: Authorization

            const deviceIdRaw = req.params.deviceId;
            if (!deviceIdRaw|| isNaN(parseInt(deviceIdRaw ))) {
                return res.status(400).json({ message: 'deviceId is required and must be a number' });
            }
            const deviceIdParsed = parseInt(deviceIdRaw);

            const body = req.body;
            if (!Object.values(SignalTargetType).includes(body.targetType))
                return res.status(400).json({ message: "Invalid targetType" });
            const signalAssociation = new SignalAssociation({
                    deviceId: deviceIdParsed,
                    targetType: body.targetType,
                    targetId: body.targetId,
                    validFrom: body.validFrom
                });

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