import { Router } from 'express';
import sequelize from '../configs/dbConfig.js';

import { OptStateDto } from '../dtos/optStateDto.js';

import UserService from '../services/UserService.js';
import AuthenticationService from '../services/AuthenticationService.js';
import AuthorizationService from '../services/AuthorizationService.js';
import FieldService from '../services/FieldService.js';

const fieldsRouter = Router();
const userService = new UserService(sequelize);
const authenticationService = new AuthenticationService(userService);
const authorizationService = new AuthorizationService(sequelize)
const fieldService = new FieldService(sequelize)

import { CreateFieldDto } from '../dtos/createFieldDto.js';
import WateringBaseline from '../dtos/wateringBaselineDto.js';


/**
 * @swagger
 * /fields/setOptState:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Set optimal state for a field
 *     description: Set the optimal state for a field.
 *     tags: [Field Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OptStateDto'
 *     responses:
 *       '200':
 *         description: Matrix opt state created successfully.
 *       '400':
 *         description: Invalid request or opt state matrix does not match.
 *       '401':
 *         description: Unauthorized request.
 *       '403':
 *         description: Authentication failed.
 *       '500':
 *         description: Error on creating field opt matrix.
 */
fieldsRouter.put('/setOptState', async (req, res) => {
  let requestUserData
  try {
    requestUserData = await authenticationService.validateJwt(req.headers.authorization);
  } catch (error) {
    return res.status(403).json({message: 'Authentication failed'});
  }

  if(!req.body && req.body === '')
    throw new Error('Body is empty');

  const refStructureName = req.params.refStructureName;
  const companyName = req.params.companyName;
  const fieldName = req.params.fieldName;
  const sectorName = req.params.sectorName;
  const plantRow = req.params.plantRow;
  
  try {
    if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, plantRow, 'WA')))
      return res.status(401).json({message: 'Unauthorized request'});

    if(!req.body.validFrom || !req.body.optimalState)
      return res.status(400).json({message: 'Invalid request'});

    const bodyRequest = new OptStateDto(refStructureName, companyName, fieldName, sectorName, plantRow, req.body.validFrom, req.body.validTo, req.body.optimalState)

    const thesisPoints = await fieldService.findThesisPoints(refStructureName, companyName, fieldName, sectorName, plantRow)

    if(!checkOptState(thesisPoints, req.body.optimalState))
      return res.status(400).json({error: "Opt state matrix does not match"})

    await fieldService.createMatrixOptState(bodyRequest)

    return res.status(200).json({message: `Matrix opt state created with success`})
  } catch (error) {
    console.log(`Fail creating opt state caused by: ${error.message}`)
    return res.status(500).json({error: "Error on creating field opt matrix"})
  }

});

/**
 * @swagger
 * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{plantRow}/setOptState:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Set optimal state for all field of the sector as the interpolation at given timestamp in the indicated thesis
 *     description: Set optimal state for all field of the sector as the interpolation at given timestamp in the indicated thesis
 *     tags: [Field Operations]
 *     parameters:
 *      - in: path
 *        name: refStructureName
 *        required: true
 *        schema:
 *          type: string
 *        description: The reference structure name
 *      - in: path
 *        name: companyName
 *        required: true
 *        schema:
 *          type: string
 *        description: The company name
 *      - in: path
 *        name: fieldName
 *        required: true
 *        schema:
 *          type: string
 *        description: The field name
 *      - in: path
 *        name: sectorName
 *        required: true
 *        schema:
 *          type: string
 *        description: The sector name
 *      - in: path
 *        name: plantRow
 *        required: true
 *        schema:
 *          type: string
 *        description: The plantRow
 *      - in: query
 *        name: timestamp
 *        required: true
 *        type: number
 *     responses:
 *       '200':
 *         description: Matrix opt state created successfully.
 *       '400':
 *         description: Invalid request or given timestamp not found.
 *       '401':
 *         description: Unauthorized request.
 *       '403':
 *         description: Authentication failed.
 *       '500':
 *         description: Error on creating field opt matrix.
 */
fieldsRouter.put('/:refStructureName/:companyName/:fieldName/:sectorName/:plantRow/setOptState', async (req, res) => {
  let requestUserData
  try {
    requestUserData = await authenticationService.validateJwt(req.headers.authorization);
  } catch (error) {
    return res.status(403).json({message: 'Authentication failed'});
  }

  const refStructureName = req.params.refStructureName;
  const companyName = req.params.companyName;
  const fieldName = req.params.fieldName;
  const sectorName = req.params.sectorName;
  const plantRow = req.params.plantRow;

  try {
    if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, plantRow, 'WA')))
      return res.status(401).json({message: 'Unauthorized request'});

    if(!req.query.timestamp)
      return res.status(400).json({message: 'Invalid request'});

    const interpolatedMatrix = await fieldService.getDataInterpolated(refStructureName, companyName, fieldName, sectorName, plantRow, req.query.timestamp)

    if(!interpolatedMatrix || !(interpolatedMatrix.values.length > 0)){
      return res.status(400).json({message: 'Invalid request, given timestamp not found'});
    }

    const selectedOptimal = new OptStateDto(refStructureName, companyName, fieldName, sectorName, plantRow, Date.now()/1000, null, interpolatedMatrix.values[0].measures[0].image)

    await fieldService.createMatrixOptState(selectedOptimal)

    return res.status(200).json({message: `Matrix opt state created with success`})
  } catch (error) {
    console.log(`Fail creating opt state caused by: ${error.message}`)
    return res.status(500).json({error: "Error on creating field opt matrix"})
  }

});

/**
 * @swagger
 * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{plantRow}/wateringAdvice:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get watering advice for a field
 *     description: Get watering advice for a field
  *     parameters:
 *      - in: path
 *        name: refStructureName
 *        required: true
 *        schema:
 *          type: string
 *        description: The reference structure name
 *      - in: path
 *        name: companyName
 *        required: true
 *        schema:
 *          type: string
 *        description: The company name
 *      - in: path
 *        name: fieldName
 *        required: true
 *        schema:
 *          type: string
 *        description: The field name
 *      - in: path
 *        name: sectorName
 *        required: true
 *        schema:
 *          type: string
 *        description: The sector name
 *      - in: path
 *        name: plantRow
 *        required: true
 *        schema:
 *          type: string
 *        description: The plantRow
 *      - in: query
 *        name: timestamp
 *        type: number
 *     tags: [Field Operations]
 *     responses:
 *       '200':
 *         description: Matrix opt state created successfully.
 *       '400':
 *         description: Invalid request or opt state matrix does not match.
 *       '401':
 *         description: Unauthorized request.
 *       '403':
 *         description: Authentication failed.
 *       '500':
 *         description: Error on creating field opt matrix.
 */
fieldsRouter.get('/:refStructureName/:companyName/:fieldName/:sectorName/:plantRow/wateringAdvice', async (req, res) => {
  let requestUserData
  try {
    requestUserData = await authenticationService.validateJwt(req.headers.authorization);
  } catch (error) {
    return res.status(403).json({message: 'Authentication failed'});
  }

  const refStructureName = req.params.refStructureName;
  const companyName = req.params.companyName;
  const fieldName = req.params.fieldName;
  const sectorName = req.params.sectorName;
  const plantRow = req.params.plantRow;
  const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

  try {
    if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, 'WA')))
      return res.status(401).json({message: 'Unauthorized request'});

    const result = await fieldService.getLastWateringAdvice(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp)

    return res.status(200).json(result)
  } catch (error) {
    console.log(`Fail get watering advice caused by: ${error.message}`)
    return res.status(500).json({error: "Error get watering advice"})
  }
});

/**
 * @swagger
 * /fields/createFields:
 *     put:
 *       security:
 *       - bearerAuth: []
 *       summary: Create fields
 *       description: Create fields based on the provided data
 *       tags: [Field Operations]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateFieldDto'
 *       responses:
 *         '200':
 *           description: Fields created successfully
 *         '400':
 *           description: Invalid request body
 *         '401':
 *           description: Unauthorized request
 *         '403':
 *           description: Authentication failed
 *         '500':
 *           description: Error during fields creation
 */
fieldsRouter.put('/createFields', async (req, res) => {
  let requestUserData = { userid: -1, partner: '' }
  try {
    requestUserData = await authenticationService.validateJwt(req.headers.authorization);
  } catch (error) {
    return res.status(403).json({message: 'Authentication failed'});
  }

  try {
    if(!req.body && req.body === '')
      throw new Error('Body is empty');

    if (!(await authorizationService.isUserAuthorized(requestUserData.userid, 'partner')))
      return res.status(401).json({message: 'Unauthorized request'});

    const body = req.body

    const requestDto = new CreateFieldDto(body.structures)

    await fieldService.createTranscodingFields(requestUserData.affiliation, requestDto)

    return res.status(200).json()
  } catch (error) {
    console.log(`Error during fields creation caused by: ${error.message}`)
    return res.status(500).json({error: "Error during fields creation"})
  }
});


/**
 * @swagger
 * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{plantRow}/dripperInfo:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get information on dripper for a thesis
 *     description:  Get information on dripper for a thesis
 *     tags: [Field Operations]
 *     parameters:
 *       - in: path
 *         name: refStructureName
 *         required: true
 *         schema:
 *           type: string
 *         description: The reference structure name
 *       - in: path
 *         name: companyName
 *         required: true
 *         schema:
 *           type: string
 *         description: The company name
 *       - in: path
 *         name: fieldName
 *         required: true
 *         schema:
 *           type: string
 *         description: The field name
 *       - in: path
 *         name: sectorName
 *         required: true
 *         schema:
 *           type: string
 *         description: The sector name
 *       - in: path
 *         name: plantRow
 *         required: true
 *         schema:
 *           type: string
 *         description: The plantRow
 *       - in: query
 *         name: timestamp
 *         schema:
 *           type: string
 *         description: The timestamp in which find the information
 *     responses:
 *       '200':
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SensorDto'
 *       '400':
 *         description: Invalid request or thesis not found.
 *       '401':
 *         description: Unauthorized request.
 *       '403':
 *         description: Authentication failed.
 *       '500':
 *         description: Error on retrieving data.
 */
fieldsRouter.get("/:refStructureName/:companyName/:fieldName/:sectorName/:plantRow/dripperInfo", async (req, res) => {
  const refStructureName = req.params.refStructureName;
  const companyName = req.params.companyName;
  const fieldName = req.params.fieldName;
  const sectorName = req.params.sectorName;
  const plantRow = req.params.plantRow;
  const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

  try {
    const user = await authenticationService.validateJwt(req.headers.authorization);
    if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, plantRow, 'MO', timestamp, timestamp)))
      return res.status(401).json({ message: 'Unauthorized request' });
  } catch (error) {
    return res.status(403).json({ message: 'Authentication failed' });
  }

  try {
    const result = await fieldService.getDripperInfo(refStructureName, companyName, fieldName, sectorName, plantRow, timestamp);
    res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
})

function checkOptState(thesisPoints, newOptimalPoints) {
  if (thesisPoints.points.length !== newOptimalPoints.length) return false;

  for (const point of thesisPoints.points) {
    const match = newOptimalPoints.find(optPoint => optPoint.xx === point.xx && optPoint.yy === point.yy && optPoint.zz === point.zz);
    if (!match) return false;
  }

  return true;
}


/**
 * @swagger
 * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/setBaseline:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Set information about baseline irrigation for sector
 *     description: Set information about baseline irrigation for sector
 *     tags: [Field Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WateringBaseline'
 *     responses:
 *       '200':
 *         description: Baseline updated successfully.
 *       '400':
 *         description: Invalid request.
 *       '401':
 *         description: Unauthorized request.
 *       '403':
 *         description: Authentication failed.
 *       '500':
 *         description: Error on update baseline.
 */
fieldsRouter.put('/:refStructureName/:companyName/:fieldName/:sectorName/setBaseline', async (req, res) => {
  let requestUserData
  try {
    requestUserData = await authenticationService.validateJwt(req.headers.authorization);
  } catch (error) {
    return res.status(403).json({message: 'Authentication failed'});
  }

  const { refStructureName, companyName, fieldName, sectorName } = req.params;

  try {
    if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, null, 'WA')))
      return res.status(401).json({message: 'Unauthorized request'});

    if(!req.body && req.body === '')
      return res.status(400).json({message: 'Invalid request'});

    console.log(req.body)

    const {
        maxIrrigation,
        irrigationBaseline,
        wateringCapacity,
        valveId,
        irrigation_master_thesis: irrigationMasterThesis,
        watering_hour: wateringHour,
        sprinkler_capacity: sprinklerCapacity
    } = req.body;

    const baselineData = {
        refStructureName,
        companyName,
        fieldName,
        sectorName,
        maxIrrigation,
        irrigationBaseline,
        wateringCapacity,
        valveId,
        irrigationMasterThesis,
        wateringHour,
        sprinklerCapacity
    };

    const baseline = new WateringBaseline(baselineData);

    await fieldService.setWateringBaseline(baseline)

    return res.status(200).json({message: `Watering Baseline update with success`})
  } catch (error) {
    console.log(`Fail update watering baseline caused by: ${error.message}`)
    return res.status(500).json({error: "Error on update watering baseline"})
  }

});

export default fieldsRouter;