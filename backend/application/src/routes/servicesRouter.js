 import { Router } from 'express';

 const sectorServicesRouter = ({authenticationService, authorizationService, sectorServicesService}) => {
     const router = Router();

    /**
     * @swagger
     * /services:
     *   get:
     *     summary: Retrieves alle the possible services
     *     tags: [Services]
     *     description: Retrieves alle the possible services available for sectors
     *     responses:
     *       200:
     *         description: Successfully retrieved services
     *         content:
     *           application/json:
     *             schema:
     *              type: array
     *              items:
     *                $ref: "#/components/schemas/Service"
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
     *         description: Unauthorized (user not allowed to retrieve sectors services information)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '500':
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.get('/', async (req, res) => {
        try {
            await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        
        try {
            const results = await sectorServicesService.getServices();
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });


    return router;
}

export default sectorServicesRouter;

