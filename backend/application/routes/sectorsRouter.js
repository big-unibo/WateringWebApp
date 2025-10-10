import { Router } from 'express';

import { Thesis } from '../dtos/thesisDto.js';

const sectorsRouter = ({ userService, authenticationService, authorizationService, fieldService }) => {
    const router = Router();

    /**
     * @swagger
     * /sectors/{sectorId}/createThesis:
     *   post:
     *     security:
     *      - bearerAuth: []
     *     summary: Create a thesis and associate it with a sector
     *     tags: [Sectors]
     *     description: Endpoint to create a new thesis and link it to a sector.
     *     parameters:
     *       - in: path
     *         name: sectorId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the sector to associate the thesis with
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateThesis'
     *     responses:
     *       200:
     *         description: Thesis created with success
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
     *         description: Bad request (missing or invalid sectorId or thesisName)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized request – user not permitted to create a thesis for the given sector
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Authentication failed – invalid or missing JWT
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       500:
     *         description: Internal server error – unexpected error while creating the thesis
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
    */
    router.post('/createThesis', async (req,res) => {
      let requestUserData;
      try {
        requestUserData = await authenticationService.validateJwt(req.headers.authorization);
      } catch (error) {
        return res.status(403).json({message: 'Authentication failed'});
      }

      if(!req.body || req.body === '')
        return res.status(400).json({message: 'Invalid request'});

      const { sectorId, thesisName, validFrom } = req.params.sectorId;
      if (!sectorId || isNaN(parseInt(sectorId))) {
        return res.status(400).json({ message: 'sectorId is required and must be a number' });
      }
      const sectorIdParsed = parseInt(sectorId);
      const thesis = new Thesis(thesisName, sectorIdParsed, validFrom);

      try {
        const user = await userService.findUser(requestUserData.userid);
        if (!(await authorizationService.isUserAuthorizedInSector(user.id, 'update', sectorIdParsed)))
          return res.status(401).json({message: 'Unauthorized request'});

        await fieldService.createThesis(thesis);
        return res.status(200).json({message: 'Thesis created with success'});
      } catch (error) {
        console.log(`Fail creating thesis caused by: ${error.message}`);
        return res.status(500).json({error: "Error on creating thesis"});
      }
    });

  
    return router;
}
export default sectorsRouter;