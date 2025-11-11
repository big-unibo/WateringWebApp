import {Router} from 'express';
import { AddMeasurementsDto,SignalUpdate } from '../dtos/deviceDto.js';


const signalsRouter = ({authenticationService, authorizationService, signalService}) => {
    const router = Router();

    /**
     * @swagger
     * /signals/{signalId}/update:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Update a signal
     *     description: Updates one or more fields of an existing signal (description, idOnProvider, sensorTechnology).
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
     *       400:
     *         description: Bad request – missing or invalid fields
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized – user is authenticated but not allowed to update signals
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
            return res.status(403).json({message: 'Authentication failed'});
        }

        //[TO DO]: Authorization
        const signalId = req.params.signalId;
        if(!signalId)
            return res.status(400).json({message: 'Bad request, signalId not specified'});

        const description = req.body.description;
        const idOnProvider = req.body.idOnProvider;
        const sensorTechnology = req.body.sensorTechnology;

        try{
            const signalUpdateData = new SignalUpdate({
                id : signalId,
                description : description,
                idOnProvider : idOnProvider,
                sensorTechnology : sensorTechnology
            })

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
     *     security:
     *       - bearerAuth: []
     *     summary: Adds one or more measurments for a given Signal
     *     description: Adds one or more measurments for an existing signal.
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
     *       400:
     *         description: Bad request – missing or invalid fields
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Bad request, signalId not specified
     *       401:
     *         description: Unauthorized – user is authenticated but not allowed to create measurements for the given signal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Unauthorized
     *       403:
     *         description: Forbidden – authentication failed due to invalid or missing JWT
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: Authentication failed
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
            return res.status(403).json({message: 'Authentication failed'});
        }
        //[TO DO]: Authorization

        const signalId = req.params.signalId;
        if(!signalId)
            return res.status(400).json({message: 'Bad request, signalId not specified'});

        const measurements = req.body;
        const measurementsList = Array.isArray(measurements) ? measurements : [];

        if (measurementsList.length === 0){
            return res.status(400).json({ message: 'No measurements provided' });
        }

        try{
            const measurementsData = new AddMeasurementsDto({
                id : signalId,
                measurements : measurementsList,
            })

            await signalService.addMeasurements(measurementsData);
            return res.status(200).json({  
                message: `Added ${measurementsList.length} measurement(s) to signal ${signalId}`  
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