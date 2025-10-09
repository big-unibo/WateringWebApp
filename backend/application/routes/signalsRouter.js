import {Router} from 'express';
import { CreateMeasurment, CreateMeasurmentDto, SignalUpdate } from '../dtos/deviceDto.js';


const signalsRouter = ({authenticationService, authorizationService, signalService}) => {
    const router = Router();

    /**
     * @swagger
     * /signals/{signalId}/update:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Update a signal
     *     description: Updates one or more fields of an existing signal (description, idOnProvider).
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
     *                   example: Signal successfully updated
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
     *         description: Unauthorized – user is authenticated but not allowed to update signals
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
     *         description: Internal server error – unexpected error while updating the signal
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Error on updating signal
     */

    router.put('/:signalId/update', async(req, res) => {
        let requestUserData;
        try{
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

        const signalId = req.params.signalId;
        if(!signalId)
            return res.status(400).json({message: 'Bad request, signalId not specified'});

        const description = req.body.description;
        const idOnProvider = req.body.idOnProvider;

        try{
            //[TO DO]: Authorization
            const signalUpdateData = new SignalUpdate({
                id : signalId,
                description : description,
                idOnProvider : idOnProvider
            })

            await signalService.updateSignal(signalUpdateData);
            return res.status(200).json({ message: 'Signal successfully updated' });
        }
        catch (error) {
            console.log(`Fail updating signal caused by: ${error.message}`)
            return res.status(500).json({error: "Error on updating signal"})
        }
    });


    router.post('/:signalId/addMeasurements', async(req, res) => {
        let requestUserData;
        // try{
        //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        // } catch (error) {
        //     return res.status(403).json({message: 'Authentication failed'});
        // }

        const signalId = req.params.signalId;
        if(!signalId)
            return res.status(400).json({message: 'Bad request, signalId not specified'});

        const measurements = req.body;
        const measurementsList = Array.isArray(measurements) ? measurements : [measurements];

        if (!measurementsList.length) {
            return res.status(400).json({ message: 'No measurements provided' });
        }


        try{
            //[TO DO]: Authorization
            const measurementsData = new CreateMeasurmentDto({
                id : signalId,
                measurements : measurementsList,
            })

            await signalService.addMeasurements(measurementsData);
            return res.status(200).json({  
                message: `Added ${measurementList.length} measurement(s) to signal ${signalId}`  
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