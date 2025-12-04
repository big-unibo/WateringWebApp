import {Router} from 'express';
import { AddMeasurementsRequest,CreateSignal,SignalUpdate, SignalAssociation } from '../dtos/deviceDto.js';


const signalsRouter = ({authenticationService, authorizationService, signalService}) => {
    const router = Router();

    /**
     * @swagger
     * /signals/create:
     *   post:
     *     summary: Create a signal
     *     description: Create a new signal in a specified device. Requires authentication and proper authorization.
     *     tags:
     *       - Signals
     *     parameters:
     *       - in: query
     *         name: deviceId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the device in which create signal
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
    router.post('/create', async(req, res) => {
        let requestUserData;
        try{
            requestUserData = await authenticationService.validateJwt(req.headers.authorization)
        } catch (error) {
            return res.status(401).json({message: 'Authentication failed'})
        }
        //[TO DO]: Authorization
        try{
            const signal = new CreateSignal(req.body)
            const deviceId = req.query.deviceId
            const signalId = await signalService.createSignal(deviceId, signal)
            return res.status(200).json({ message: 'Signal successfully updated' , id: signalId })
        }
        catch (error) {
            console.log(`Fail updating signal caused by: ${error.message}`)
            return res.status(500).json({error: "Error on updating signal"})
        }
    });

    /**
     * @swagger
     * /signals/{signalId}/assign:
     *   post:
     *     summary: Assigns signal to a given field, sector, or thesis
     *     description: |
     *       Assigns signal to a given field, sector, or thesis.
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
     *       - Signals
     *     parameters:
     *       - in: path
     *         name: signalId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the signal
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
     *         description: Unauthorized (user not allowed to assign signals)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while assigning signal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.post('/:signalId/assign', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        //[TO DO]: Authorization

        try {

            const signalId = req.params.signalId
            const targetType = req.body.targetType
            const targetId = req.body.targetId
            const validFrom = req.body.validFrom

            const signalAssociation = new SignalAssociation(signalId, targetType, targetId, validFrom);

            await signalService.assignSignal(signalAssociation);
            return res.status(200).json({ message: 'Signals successfully associated' });
        } catch (error) {
            console.log(`Failed assigning signals caused by: ${error.message}`);
            return res.status(500).json({ message: "Error assigning signals" });
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

    router.put('/:signalId/update', async(req, res) => {
        let requestUserData;
        try{
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({message: 'Authentication failed'});
        }

        //[TO DO]: Authorization
        const signalId = Number(req.params.signalId);

        const description = req.body.description;
        const idOnProvider = req.body.idOnProvider;
        const sensorTechnology = req.body.sensorTechnology;

        try{
            const signalUpdateData = new SignalUpdate(signalId, description, idOnProvider, sensorTechnology)

            await signalService.updateSignal(signalUpdateData);
            return res.status(200).json({ message: 'Signal successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating signal caused by: ${error.message}`)
            return res.status(500).json({error: "Error on updating signal"})
        }
    });

    
    /**
     * @swagger
     * /signals/{signalId}/disable:
     *   post:
     *     summary: Disable a signal
     *     description: Disable the assignment of a signal considering it no longer available. Requires authentication and proper authorization.
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
     *         description: The timestamp to use as end of validity for the signal. It must be a future timestamp.
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

    router.post('/:signalId/disable', async(req, res) => {
        let requestUserData;
        try{
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({message: 'Authentication failed'});
        }

        //[TO DO]: Authorization
        const signalId = Number(req.params.signalId);

        const currentTimestamp = Date.now()/1000
        const validTo = req.query.validTo ?? currentTimestamp;
        try{
            if (validTo < currentTimestamp){
                return res.status(400).json({message: 'Invalid validTo timestamp provided. It must be a future timestamp'})
            }
            await signalService.disableSignal(signalId, validTo);
            return res.status(200).json({ message: 'Signal disabled successfully' });
        }
        catch (error) {
            console.log(`Fail disabling signal caused by: ${error.message}`)
            return res.status(500).json({error: "Error on disabling signal"})
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
    router.post('/:signalId/addMeasurements', async(req, res) => {
        let requestUserData;
        try{
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({message: 'Authentication failed'});
        }
        //[TO DO]: Authorization

        const signalId = Number(req.params.signalId);

        const measurements = req.body;
        if (measurements.length === 0){
            return res.status(400).json({ message: 'No measurements provided' });
        }

        try{
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
    return router;
}

export default signalsRouter;