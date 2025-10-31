 import { Router } from 'express';

 const profileBinsRouter = ({authenticationService, authorizationService, fieldService}) => {
     const router = Router();
 
    /**
     * @swagger
     * /profileBins/{profileId}:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Retrieves binning information for a given binning profile
     *     tags: [Profile bins]
     *     description: retrieves binning information for a given binning profile
     *     parameters:
     *       - in: path
     *         name: profileId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the binning profile
     *     responses:
     *       200:
     *         description: Successfully retrieved heatmap data
     *         content:
     *           application/json:
     *             schema:
     *              type: object
     *              properties:
     *                bins:
     *                  type: array
     *                  items:
     *                    $ref: "#/components/schemas/BinInfoData"
     *       400:
     *         description: Invalid or missing query parameters
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized (user not allowed to view heatmaps)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/:profileId', async (req, res) => {
        const profileId = parseInt(req.params.profileId);
        
        if (isNaN(profileId)) {
            return res.status(400).json({ message: 'Invalid profile id' });
        }

        // [TO DO]: Authorization/Authentication.....

        try {
            const results = await fieldService.getBinningInfo(profileId);

            if (!results || (Array.isArray(results) && results.length === 0)) {
                return res.status(404).json({ message: 'No data found for this profile' });
            }

            return res.status(200).json({ bins: results });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });

    return router;
}

export default profileBinsRouter;

