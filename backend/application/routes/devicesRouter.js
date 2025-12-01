import { Router } from 'express';

import { CreateSignal, SignalAssociation, CreateDevice } from '../dtos/deviceDto.js';


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
			return res.status(401).json({ message: 'Authentication failed' });
		}

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)
        const providerIds = req.query.providerIds
        const types = req.query.types
        const page = req.query.page ?? 1
        const itemsPerPage = req.query.itemsPerPage ?? 50

		try {
			const devices = await deviceService.getDevices(requestUserData.userId, timeFilterFrom, timeFilterTo, providerIds, types, page, itemsPerPage);
			if (!devices?.pagination?.totalItems) {
				return res.status(404).json({ 
					error: "User has no permission to view any devices in the given period" 
				});
			}

			return res.status(200).json(devices);
		} catch (error) {
			console.log(`Fail retrieving devices caused by: ${error.message}`);
			return res.status(500).json({ error: "Error while retrieving devices" });
		}
	});

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
            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, 'create', 'devices')))
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
     *         description: Unauthorized (user not allowed to assign device)
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