import { Router } from 'express';

import { Device, Signal, SignalAssociation, SignalTargetType } from '../dtos/deviceDto.js'; 


const devicesRouter = ({authenticationService, authorizationService, deviceService}) => {
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
        // let requestUserData;
        // try {
        //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        // } catch (error) {
        //     return res.status(403).json({ message: 'Authentication failed' });
        // }
        try {
            // const user = await userService.findUser(requestUserData.userid);
            if (!(await authorizationService.isUserAuthorized(1, 'create', 'devices')))
                return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || req.body === '')
                throw new Error('Body is empty');

            const device = new Device({
                type: req.body.type,
                providerId: req.body.providerId,
                description: req.body.description,
                location: req.body.location,
                signals: (req.body.signals || []).map(sig => new Signal(sig))
            });

            await deviceService.createDevice(device);
           
            return res.status(200).json({ message: `Device created with success` });
        } catch (error) {
            console.log(`Failed creating Device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating device" });
        }
    });

    /**
 * @swagger
 * /devices/assign:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Assigns all the signals of a device to a given field, sector, or thesis
 *     description: Receives a signal association object and assigns the devices's signals to the specified target. Requires authentication and proper authorization.
 *     tags:
 *       - Devices
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
    router.post('/assign', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }

        try {
            const user = await userService.findUser(requestUserData.userid);

            if (!req.body || req.body === '')
                throw new Error('Body is empty');
            
            if (!Object.values(SignalTargetType).includes(body.targetType))
                return res.status(400).json({ message: "Invalid targetType" });

            //[TO DO]: Authorization
            const body = req.body;
            const signalAssociation = new SignalAssociation({
                    deviceId: body.deviceId,
                    targetType: body.targetType,
                    targetId: body.targetId,
                    validFrom: body.validFrom
                });

            await deviceService.associateSignal(signalAssociation);
            return res.status(200).json({ message: 'Signal successfully associated' });
        } catch (error) {
            console.log(`Failed assigning signal caused by: ${error.message}`);
            return res.status(500).json({ message: "Error assigning signal" });
        }
    });


    return router;
}

export default devicesRouter;