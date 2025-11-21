 import { Router } from 'express';

 const profileBinsRouter = ({authenticationService, authorizationService, fieldService}) => {
     const router = Router();
 
    /**
     * @swagger
     * /profileBins/{profileId}:
     *   get:
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
     *         description: Unauthorized (user not allowed to retrieve binning profile information)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       404:
     *         description: Binning profile information not found
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
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        // [TO DO]: Authorization

        const profileId = Number(req.params.profileId);
        
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

