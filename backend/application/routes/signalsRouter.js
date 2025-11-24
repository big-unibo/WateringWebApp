import {Router} from 'express';
import { AddMeasurementsDto,SignalUpdate } from '../dtos/deviceDto.js';


const signalsRouter = ({authenticationService, authorizationService, signalService}) => {
    const router = Router();

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
            const measurementsData = new AddMeasurementsDto(signalId, measurements)

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