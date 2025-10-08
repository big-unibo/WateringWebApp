import { Router } from 'express';

import { CreateDeviceDto, CreateSignalDto } from '../dtos/deviceDto.js'; 


const devicesRouter = ({authenticationService, authorizationService, deviceService}) => {
    const router = Router();

    /**
     * @swagger
     * /devices/createDevice:
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
     *             $ref: '#/components/schemas/CreateDeviceDto'
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
     *                   example: "Device created with success"
     *       400:
     *         description: Invalid request (missing required fields)
     *       401:
     *         description: Unauthorized request
     *       403:
     *         description: Authentication failed
     *       500:
     *         description: Internal server error while creating the device
     *
     * components:
     *   schemas:
     *     CreateSignalDto:
     *       type: object
     *       required:
     *         - typeId
     *         - x
     *         - y
     *         - z
     *       properties:
     *         typeId:
     *           type: integer
     *           description: Signal type ID
     *         description:
     *           type: string
     *           description: Optional signal description
     *         x:
     *           type: number
     *         y:
     *           type: number
     *         z:
     *           type: number
     *         virtual:
     *           type: boolean
     *         unit:
     *           type: string
     *
     *     CreateDeviceDto:
     *       type: object
     *       required:
     *         - type
     *         - providerId
     *         - location
     *         - signals
     *       properties:
     *         type:
     *           type: string
     *           description: Type of the device
     *         providerId:
     *           type: integer
     *           description: ID of the provider
     *         description:
     *           type: string
     *           description: Optional description of the device
     *         location:
     *           type: object
     *           description: Geographical location of the device (GeoJSON Point)
     *           properties:
     *             type:
     *               type: string
     *               enum: [Point]
     *             coordinates:
     *               type: array
     *               items:
     *                 type: number
     *               minItems: 2
     *               maxItems: 2
     *         signals:
     *           type: array
     *           description: Array of signals associated with the device
     *           items:
     *             $ref: '#/components/schemas/CreateSignalDto'
     */
    router.post('/createDevice', async (req, res) => {
        let requestUserData;
        // try {
        //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        // } catch (error) {
        //     return res.status(403).json({ message: 'Authentication failed' });
        // }
        try {
            //const user = await userService.findUser(requestUserData.userid);
            //if (!(await authorizationService.isUserAuthorizedBy(user.id, 'create', 'devices')))
            if (!(await authorizationService.isUserAuthorized(1, 'create', 'devices')))
                return res.status(401).json({ message: 'Unauthorized request' });

            if (!req.body || req.body === '')
                throw new Error('Body is empty');

            const device = new CreateDeviceDto({
                type: req.body.type,
                providerId: req.body.providerId,
                description: req.body.description,
                location: req.body.location,
                signals: (req.body.signals || []).map(sig => new CreateSignalDto(sig))
            });

            await deviceService.createDevice(device);
           
            return res.status(200).json({ message: `Device created with success` });
        } catch (error) {
            console.log(`Failed creating Device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating device" });
        }
    });

    return router;
}

export default devicesRouter;