import { Router } from 'express';

import { CreateDevice, DeviceAssociation } from '../dtos/deviceDto.js';
import { ROLES } from '../commons/permissionRoles.js';

const devicesRouter = ({ authenticationService, authorizationService, userService, deviceService }) => {
    const router = Router();

    /**
     * @swagger
     * /devices:
     *   get:
     *     summary: Retrieve all devices available for the user
     *     tags: 
     *       - Devices
     *     description: Retrieve all devicess available for the user, filtered by a time range. Results are paginated
     *     parameters:
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: providerIds
     *         schema:
     *           type: array
     *           items:
     *             type: integer
     *         style: form
     *         explode: true
     *         description: Providers to include
     *       - in: query
     *         name: types
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         style: form
     *         explode: true
     *         description: Device types to include
     *       - in: query
     *         name: page
     *         schema:
     *           type: number
     *           minimum: 1
     *           default: 1
     *         description: Number of page for devices to return
     *       - in: query
     *         name: itemsPerPage
     *         schema:
     *           type: number
     *           minimum: 1
     *           maximum: 500
     *           default: 50
     *         description: Number of devices to include in a response. Max device in a single request 500
     *     responses:
     *       200:
     *         description: List of devices for the user
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                      $ref: '#/components/schemas/Device'
     *                 pagination:
     *                   type: object
     *                   $ref: '#/components/schemas/PaginationMetadata'
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
     *       404:
     *         description: No devices found for the current user and time filter
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while retrieving devices
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
            console.log(error)
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)
        const providerIds = req.query.providerIds
        const types = req.query.types
        const page = req.query.page ?? 1
        const itemsPerPage = req.query.itemsPerPage ?? 50

        try {
            let userAvailableIds = await authorizationService.getAvailableEntityIds(requestUserData.userId, 'DEVICE', ROLES.VIEWER, requestUserData.isAdmin)
            if (Array.isArray(userAvailableIds) && userAvailableIds.length > 0)
            {
                if (userAvailableIds.includes('ALL')) {
                    userAvailableIds = null
                }
                const devices = await deviceService.getDevices(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, types, page, itemsPerPage);
                return res.status(200).json(devices);
            }
            return res.status(404).json({
                error: "User has no permission to view any devices"
            });

        } catch (error) {
            console.log(`Fail retrieving devices caused by: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices" });
        }
    });

    /**
     * @swagger
     * /devices/create:
     *   post:
     *     summary: Create a new device
     *     description: Creates a new device.  Requires authentication and proper authorization.
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
            const userId = requestUserData.userId
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const device = new CreateDevice(req.body.type, req.body.description, req.body.companyId, req.body.location, req.body.binningId);

            const deviceId = await deviceService.createDevice(userId, device);
            return res.status(200).json({ message: `Device created with success`, id: deviceId });
        } catch (error) {
            console.log(`Failed creating Device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on creating device" });
        }
    });

    /**
     * @swagger
     * /devices/{deviceId}/signals:
     *   post:
     *     summary: Attach signals to a device
     *     description: Attaches signals to a device.  Requires authentication and proper authorization.
     *     tags:
     *       - Devices
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - signalIds
     *             properties:
     *               signalIds:
     *                 description: List of signal IDs to attach to the device
     *                 type: array
     *                 items:
     *                   type: integer
     *               timestamp:
     *                 type: number
     *                 description: Timestamp indicating when the attachment is made (in seconds since 01/01/1970)
     *     responses:
     *       200:
     *         description: Signals attached successfully
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
     *         description: Unauthorized (user not allowed to attach signals to devices)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while attaching signals to the device
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
     */
    router.post('/:deviceId/signals', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        try {
            const userId = requestUserData.userId
            if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'DEVICE', req.params.deviceId))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const validFrom = req.body.timestamp ?? Date.now() / 1000;

            await deviceService.attachSignalsToDevice(userId, req.params.deviceId, req.body.signalIds, validFrom);
            return res.status(200).json({ message: `Signals attached to device with success` });
        } catch (error) {
            console.log(`Failed attaching signals to Device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error on attaching signals to device" });
        }
    });

    /**
     * @swagger
     * /devices/{deviceId}/assign:
     *   post:
     *     summary: Assigns device to a given farm, sector, or thesis
     *     description: |
     *       Assigns a device with its signals to a given farm, sector, or thesis.
     *       
     *       **Required request parameters:**
     *       - **targetId** (*integer*): ID of the target entity
     *       - **targetType** (*string*): One of the following values:
     *         - `farm`
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
     *         description: Unauthorized (user not allowed to assign device)
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
     *         description: Internal server error – unexpected error while assigning signals
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

        const userId = requestUserData.userId
        const deviceId = req.params.deviceId
        
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'DEVICE', deviceId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const exists = await deviceService.deviceExists(deviceId);
            if (!exists) {
                return res.status(404).json({ message: 'Device not found' });
            }

            const targetType = req.body.targetType
            const targetId = req.body.targetId
            const validFrom = req.body.validFrom ?? Date.now() / 1000;

            const deviceAssociation = new DeviceAssociation(deviceId, targetType, targetId, validFrom);

            await deviceService.assignDevice(userId, deviceAssociation);
            return res.status(200).json({ message: 'Device successfully associated' });
        } catch (error) {
            console.log(`Failed assigning device caused by: ${error.message}`);
            return res.status(500).json({ message: "Error assigning device" });
        }
    });

    /**
     * @swagger
     * /devices/{deviceId}/disable:
     *   post:
     *     summary: Disables all of the signals for a given device
     *     tags: [Devices]
     *     description: |
     *       Disables a device by:
     *       
     *       - Ending the validity period of device in farm associations.
     *       - Ending validity period of the signals associated with the device.
     *       - Ending optimal profile assignment.
     * 
     *       Requires Authentication and proper Authorization
     *  
     * 
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of device to disable
     *       - in: query
     *         name: timestamp
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the device validity, if not set takes actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: Device succesfuly disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Device succesfuly disabled.
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
     *         description: Unauthorized request – user not allowed to end thesis validty.
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
    router.post('/:deviceId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId
        const deviceId = req.params.deviceId;

        const exists = await deviceService.deviceExists(deviceId);
        if (!exists) {
            return res.status(404).json({ message: 'Device not found' });
        }

        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'DEVICE', deviceId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            await deviceService.disableDevice(userId, deviceId, timestamp)
            return res.status(200).json({ message: `Device validity succesfully endend` })
        } catch (error) {
            console.log(`Failed disabling device: ${error.message}`)
            return res.status(500).json({ error: "Internal error disabling device and its signals" })
        }
    })


    /**
     * @swagger
     * /devices/{deviceId}:
     *   get:
     *     summary: Retrieve data about a specific device and its signals at a specific timestamp
     *     tags: 
     *       - Devices
     *     description: Retrieve data about a specific device and its signals at a specific timestamp, include also the association for the device. Rquires authentication and proper Authorization
     *     parameters:
     *       - in: path
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: number
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *     responses:
     *       200:
     *         description: Device and its signals data
     *         content:
     *           application/json:
     *             schema:
     *                $ref: '#/components/schemas/DeviceInfo'
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
     *       403:
     *         description: Unauthorized request – user not allowed to view this device data.
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
     *         description: Internal server error – unexpected error while retrieving devices
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.get('/:deviceId', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const deviceId = req.params.deviceId
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'DEVICE', deviceId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const device = await deviceService.getDevice(deviceId, timestamp);
            if (!device) {
                return res.status(404).json({
                    error: "Information not found for the device at the given timestamp"
                });
            }

            const deviceAssociations = await deviceService.getDeviceAssociations(deviceId, timestamp)

            return res.status(200).json({...device, ...deviceAssociations});
        } catch (error) {
            console.log(`Fail retrieving devices caused by: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving devices" });
        }
    });


    return router;
}

export default devicesRouter;