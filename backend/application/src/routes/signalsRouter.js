import { Router } from 'express';
import { AddMeasurementsRequest, CreateSignal, SignalUpdate} from '../dtos/signalDto.js';
import { ROLES } from '../commons/permissionRoles.js';

const signalsRouter = ({ authenticationService, authorizationService, signalService }) => {
    const router = Router();

    /**
     * @swagger
     * /signals/providers:
     *   get:
     *     summary: Retrieve info about all of the known providers
     *     tags: 
     *       - Signals
     *     description: Retrieves all providers, requires authentication and proper authorization
     *     responses:
     *       '200':
     *         description: List of the known providers
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ProvidersData'
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
     *         description: Unauthorized (user not allowed to view providers)
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
    router.get('/providers', async (req, res) => {
        try {
            await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const providers = await signalService.getProviders();
            return res.status(200).json(providers)
        } catch (error) {
            console.log(`Failed retrieving providers caused by: ${error.message}`);
            return res.status(500).json({ message: "Error retrieving providers" });
        }
    })
    
    /**
     * @swagger
     * /signals/create:
     *   post:
     *     summary: Create a signal
     *     description: Create a new signal. Requires authentication and proper authorization.
     *     tags:
     *       - Signals
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *              $ref: '#/components/schemas/CreateSignal'
     *     responses:
     *       200:
     *         description: Signal create successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 id:
     *                   type: number
     *                   description: Id of the new signal
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
     *         description: Unauthorized (user not allowed to create signals)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while creating the signal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.post('/create', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization)
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' })
        }
        const userId = requestUserData.userId
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }
        try {
            const signal = new CreateSignal({ createdAt: Math.ceil(Date.now() / 1000), ...req.body })
            const signalId = await signalService.createSignal(userId, signal)
            return res.status(200).json({ message: 'Signal successfully created', id: signalId })
        }
        catch (error) {
            console.log(`Fail updating signal caused by: ${error.message}`)
            return res.status(500).json({ error: "Error while creating signal" })
        }
    });

    /**
     * @swagger
     * /signals/{signalId}/update:
     *   put:
     *     summary: Update a signal
     *     description: Updates one or more fields of an existing signal (description, idOnProvider, sensorTechnology). Requires authentication and proper authorization.
     *     tags:
     *       - Signals
     *     parameters:
     *       - in: path
     *         name: signalId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the signal to update
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *              $ref: '#/components/schemas/UpdateSignal'
     *     responses:
     *       200:
     *         description: Signal updated successfully
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
     *         description: Unauthorized (user not allowed to update signals)
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
     *         description: Internal server error – unexpected error while updating the signal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */

    router.put('/:signalId/update', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const userId = requestUserData.userId;

        const signalId = Number(req.params.signalId);
        const exists = await signalService.signalExists(signalId);
        if (!exists) {
            return res.status(404).json({ message: 'Signal not found' });
        }
        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'SIGNAL', signalId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const description = req.body.description;
        const idOnProvider = req.body.idOnProvider;
        const sensorTechnology = req.body.sensorTechnology;
        const scalingFactor = req.body.scalingFactor ?? 1;
        const scaledUnit = req.body.scaledUnit;

        try {
            const signalUpdateData = new SignalUpdate(signalId, description, idOnProvider, sensorTechnology, scalingFactor, scaledUnit)
            await signalService.updateSignal(userId, signalUpdateData);
            return res.status(200).json({ message: 'Signal successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating signal caused by: ${error.message}`)
            return res.status(500).json({ error: "Error on updating signal" })
        }
    });


    /**
     * @swagger
     * /signals/{signalId}/disable:
     *   post:
     *     summary: Disable a signal
     *     description: Disable a signal and the assignment of this signal in a device. Requires authentication and proper authorization.
     *     tags:
     *       - Signals
     *     parameters:
     *       - in: path
     *         name: signalId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the signal to update
     *       - in: query
     *         name: validTo
     *         schema:
     *           type: number
     *         description: The timestamp to use as end of validity for the signal. It must be a timestamp in last 24 hours.
     *     responses:
     *       200:
     *         description: Signal disabled successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized (user not allowed to update signals)
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
     *         description: Internal server error – unexpected error while updating the signal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */

    router.post('/:signalId/disable', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const userId = requestUserData.userId

        const signalId = Number(req.params.signalId);
        const exists = await signalService.signalExists(signalId);
        if (!exists) {
            return res.status(404).json({ message: 'Signal not found' });
        }

        if (!(await authorizationService.isUserAuthorized(userId, ROLES.ACCOUNTER, requestUserData.isAdmin, 'SIGNAL', signalId))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const validTo = req.query.validTo ?? currentTimestamp;
        try {
            if (validTo < currentTimestamp - (24*60*60)) {
                return res.status(400).json({ message: 'Invalid validTo timestamp provided. It must be a timestamp in the last 24 hours' })
            }
            await signalService.disableSignal(userId, signalId, validTo);
            return res.status(200).json({ message: 'Signal disabled successfully' });
        }
        catch (error) {
            console.log(`Fail disabling signal caused by: ${error.message}`)
            return res.status(500).json({ error: "Error on disabling signal" })
        }
    });

    /**
     * @swagger
     * /signals/{signalId}/addMeasurements:
     *   post:
     *     summary: Adds one or more measurments for a given Signal
     *     description: Adds one or more measurments for an existing signal. Requires authentication and proper authorization.
     *     tags:
     *       - Signals
     *     parameters:
     *       - in: path
     *         name: signalId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the signal the signals are associated to
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *              type: array
     *              items:
     *                   $ref: "#/components/schemas/Measurement"
     *     responses:
     *       200:
     *         description: Measurements updated successfully
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
     *         description: Unauthorized (user not allowed to create mesurments for the given signal)
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
     *         description: Internal server error – unexpected error while creating measurments
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Error creating measurements
     */
    router.post('/:signalId/addMeasurements', async (req, res) => {
        try {
            await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const signalId = Number(req.params.signalId);
        const exists = await signalService.signalExists(signalId);
        if (!exists) {
            return res.status(404).json({ message: 'Signal not found' });
        }

        const measurements = req.body;
        if (measurements.length === 0) {
            return res.status(400).json({ message: 'No measurements provided' });
        }

        try {
            const measurementsData = new AddMeasurementsRequest(signalId, measurements)

            await signalService.addMeasurements(measurementsData);
            return res.status(200).json({
                message: `Added ${measurements.length} measurement(s) to signal ${signalId}`
            });
        }
        catch (error) {
            console.error(`Fail adding measurements: ${error.message}`);
            return res.status(500).json({ error: "Error while adding measurements" });
        }
    });

    
    /**
     * @swagger
     * /signals/types:
     *   get:
     *     summary: Get all the possible signal types
     *     description: |
     *       Get the information about all the possible signal types
     *     tags:
     *       - Signals
     *     responses:
     *       200:
     *         description: Signal types successfully retrieved
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/SignalType'
     *       400:
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while getting signal information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/types', async (req, res) => {
        try {
            await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const signalTypes = await signalService.getSignalTypes()
            return res.status(200).json(signalTypes)
        } catch (error) {
            console.log(`Failed finding signal types caused by: ${error.message}`)
            return res.status(500).json({ message: "Error finding signal types" })
        }
    })

    /**
     * @swagger
     * /signals/{signalId}/:
     *   get:
     *     summary: Get all information about a signal including the reference to farm, sector or thesis where it is associated 
     *     description: |
     *       Get all information about a signal including the reference to farm, sector or thesis where it is associated
     *     tags:
     *       - Signals
     *     parameters:
     *       - in: path
     *         name: signalId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the signal
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: The timestamp in which find the information
     *     responses:
     *       200:
     *         description: Signal successfully associated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/SignalInfo'
     *       400:
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized (user not allowed to assign signals)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Signal not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while getting signal information
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/:signalId', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {

            const signalId = req.params.signalId
            const timestamp = req.query.timestamp ?? Date.now() / 1000

            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, requestUserData.isAdmin, 'SIGNAL', signalId))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const signalInfo = await signalService.getSignalInfo(signalId, timestamp)
            if (signalInfo) {
                const signalAssociations = await signalService.getSignalAssociations(signalId, timestamp, requestUserData.userId, requestUserData.isAdmin)
                return res.status(200).json({...signalInfo, ...signalAssociations})
            }
            return res.status(404).json({ message: 'Signal not found' })
        } catch (error) {
            console.log(`Failed finding signal info caused by: ${error.message}`)
            return res.status(500).json({ message: "Error finding signal info" })
        }
    })

    /**
     * @swagger
     * /signals:
     *   get:
     *     summary: Retrieve all signals available for the user
     *     tags: 
     *       - Signals
     *     description: Retrieve all signals available for the user, filtered by a time range if specified otherwise active now. Results are paginated
     *     parameters:
     *       - in: query
     *         name: timeFilterFrom
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
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
     *         name: typeIds
     *         schema:
     *           type: array
     *           items:
     *             type: number
     *         style: form
     *         explode: true
     *         description: Signal type ids to include
     *       - in: query
     *         name: companyIds
     *         schema:
     *           type: array
     *           items:
     *             type: integer
     *         description: Company IDs to include
     *       - in: query
     *         name: deviceIds
     *         schema:
     *           type: array
     *           items:
     *             type: integer
     *         description: Device IDs to include
     *       - in: query
     *         name: page
     *         schema:
     *           type: number
     *           minimum: 1
     *           default: 1
     *         description: Number of page for signals to return
     *       - in: query
     *         name: itemsPerPage
     *         schema:
     *           type: number
     *           minimum: 1
     *           maximum: 500
     *           default: 50
     *         description: Number of signals to include in a response. Max signal in a single request 500
     *     responses:
     *       200:
     *         description: List of signals for the user
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 data:
     *                   type: array
     *                   items:
     *                      $ref: '#/components/schemas/Signal'
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
     *         description: No signals found for the current user and time filter
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while retrieving signals
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

        const timeFilterFrom = req.query.timeFilterFrom ?? Math.floor(Date.now() / 1000)
        const timeFilterTo = req.query.timeFilterTo ?? Math.ceil(Date.now() / 1000)
        const providerIds = req.query.providerIds
        const typeIds = req.query.typeIds
        const companyIds = req.query.companyIds
        const deviceIds = req.query.deviceIds
        const page = req.query.page ?? 1
        const itemsPerPage = req.query.itemsPerPage ?? 50

        try {
            let userAvailableIds = await authorizationService.getAvailableEntityIds(requestUserData.userId, 'SIGNAL', ROLES.VIEWER, requestUserData.isAdmin)
            if (Array.isArray(userAvailableIds) && userAvailableIds.length > 0)
            {
                if (userAvailableIds.includes('ALL')) {
                    userAvailableIds = null
                }
                const signals = await signalService.getSignals(userAvailableIds, timeFilterFrom, timeFilterTo, providerIds, typeIds, companyIds, deviceIds, page, itemsPerPage);
                return res.status(200).json(signals);
            }
            return res.status(404).json({
                error: "User has no permission to view any signals"
            });

        } catch (error) {
            console.log(`Fail retrieving signals caused by: ${error.message}`);
            return res.status(500).json({ error: "Error while retrieving signals" });
        }
    });

    return router
}

export default signalsRouter