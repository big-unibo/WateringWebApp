import { Router } from 'express';

import { OptStateDto } from '../dtos/optStateDto.js';
import { Thesis } from '../dtos/thesisDto.js';
import { Field } from '../dtos/fieldDto.js';
import { Sector } from '../dtos/sectorDto.js';

const fieldsRouter = ({ userService, authenticationService, authorizationService, fieldService }) => {
    const router = Router();


    /**
     * @swagger
     * /fields/create:
     *   post:
     *     summary: Create a new field
     *     description: Creates a new field associated with a company. Requires authentication and proper authorization.
     *     tags:
     *       - Fields
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateField'
     *     responses:
     *       200:
     *         description: Field created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Field created with success"
     *       400:
     *         description: Bad Request (missing or invalid companyId)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "companyId is required and must be a number"
     *       401:
     *         description: Unauthorized (user not allowed to create field)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Unauthorized request"
     *       403:
     *         description: Authentication failed
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Authentication failed"
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: "Error on creating field"
     *
    */
    router.post('/create', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

        try {
            if(!req.body || req.body === '')
                throw new Error('Body is empty');
            
            const companyRaw = await req.body.companyId;
            if (!companyRaw || isNaN(parseInt(companyRaw ))) {
                return res.status(400).json({ message: 'companyId is required and must be a number' });
            }
            const companyId = parseInt(companyRaw)

            const user = await userService.findUser(requestUserData.userid);
            if (!(await authorizationService.isUserAuthorizedById(user.id, 'update', 'companies', companyId)))
                return res.status(401).json({message: 'Unauthorized request'});

            const field = new Field(req.body.fieldName, companyId, req.body.location);
            const result = await fieldService.createField(field);

            return res.status(200).json({message: `Field created with success`})
        } catch (error) {
            console.log(`Failed creating field caused by: ${error.message}`)
            return res.status(500).json({message: "Error on creating field"})
        }
    })

    /**
     * @swagger
     * /fields/{fieldId}/createSector:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Create a new sector
     *     description: Creates a new sector associated with a field. Requires authentication and proper authorization.
     *     tags:
     *       - Fields
     *     parameters:
     *       - in: path
     *         name: fieldId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of the field to associate the sector with
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateSector'
     *     responses:
     *       200:
     *         description: Sector created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       400:
     *         description: Bad request (missing or invalid fieldId, sectorName, or culture)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       401:
     *         description: Unauthorized request – user not permitted to create a sector
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
     *         description: Internal server error – unexpected error while creating the sector
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *
    */
    router.post('/:fieldId/createSector', async( req, res) => {
        let requestUserData
        try {
          requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({message: 'Authentication failed'});
        }

      try {
          if(!req.body || req.body === '')
              throw new Error('Body is empty');
          
          const fieldRaw = await req.params.fieldId;;
          if (!fieldRaw || isNaN(parseInt(fieldRaw ))) {
              return res.status(400).json({ message: 'fieldId is required and must be a number' });
          }
          const fieldIdParsed = parseInt(fieldRaw)

          const user = await userService.findUser(requestUserData.userid);
			    if (!(await authorizationService.isUserAuthorizedInField(user.id, 'update', fieldIdParsed)))
              return res.status(401).json({message: 'Unauthorized request'});

          const {
              sectorName,
              culture,
              cultureType,
              location,
              prescriptive,
              advice,
              dripperCapacity,
              sprinklerCapacity,
              doubleWing
          } = req.body;

          const sector = new Sector(
              sectorName,
              fieldIdParsed,
              culture,
              cultureType,
              location,
              prescriptive,
              advice,
              dripperCapacity,
              sprinklerCapacity,
              doubleWing
          );

          const result = await fieldService.createSector(sector);
          return res.status(200).json({message: `Sector created with success`})
      } catch (error) {
          console.log(`Failed creating sector caused by: ${error.message}`)
          return res.status(500).json({message: "Error on creating sector"})
      }
    })

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/disableMonitoring:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Set the end of validity for a monitoring thesis
     *     description: Set the end of validity for a monitoring thesis
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
     *         name: thesisName
     *         required: true
     *         schema:
     *           type: string
     *         description: The thesisName
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: The timestamp to set as the end of validity for the thesis
     *     responses:
     *       '200':
     *         description: Monitoring thesis disabled successfully.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error on disabling monitoring thesis.
     */
    router.post('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/disableMonitoring', async (req, res) => {
      let requestUserData
      try {
        requestUserData = await authenticationService.validateJwt(req.headers.authorization);
      } catch (error) {
        return res.status(403).json({message: 'Authentication failed'});
      }

      const { refStructureName, companyName, fieldName, sectorName, thesisName } = req.params;

      try {
        if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, '*')))
          return res.status(401).json({message: 'Unauthorized request'});

        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

        await fieldService.disableMonitoringThesis(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp)
        //TODO disable all nodes related to this thesis

        return res.status(200).json({message: `Monitoring thesis disabled successfully`})
      } catch (error) {
        console.log(`Fail disabling monitoring thesis caused by: ${error.message}`)
        return res.status(500).json({error: "Error on disabling monitoring thesis"})
      }
    });

      /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/setWateringDetails:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Define watering sector details
     *     description: Define watering sector details
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
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/WateringSectorDetails'
     *     responses:
     *       '200':
     *         description: Watering sector details updated successfully.
     *       '400':
     *         description: Invalid request.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error updating watering sector details.
     */
    // router.put('/:refStructureName/:companyName/:fieldName/:sectorName/setWateringDetails', async (req, res) => {
    //     let requestUserData
    //     try {
    //       requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //     } catch (error) {
    //       return res.status(403).json({message: 'Authentication failed'});
    //     }
    
    //     const refStructureName = req.params.refStructureName;
    //     const companyName = req.params.companyName;
    //     const fieldName = req.params.fieldName;
    //     const sectorName = req.params.sectorName;
        
    //     try {
    //         if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, null, '*')))
    //             return res.status(401).json({message: 'Unauthorized request'});

    //         if(!req.body && req.body === '')
    //             return res.status(400).json({message: 'Invalid request'});

    //         const {
    //             advice: advice,
    //             prescriptive: prescriptive,
    //             dripperCapacity: dripperCapacity,
    //             dripperScalingFactor: dripperScalingFactor,
    //             sprinklerCapacity: sprinklerCapacity,
    //             valveId: valveId,
    //             prescriptiveThesis: prescriptiveThesis,
    //             timestampFrom: timestampFrom
    //         } = req.body;
    //         const sectorDetails = new WateringSectorDto('iFarming', refStructureName, companyName, fieldName, sectorName, advice, prescriptive, valveId, dripperCapacity, dripperScalingFactor, sprinklerCapacity)
    //         await fieldService.updateWateringSectorDetails(sectorDetails, timestampFrom)
    //         if(prescriptiveThesis && prescriptiveThesis !== ''){
    //           await fieldService.setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, prescriptiveThesis, timestampFrom)
    //         }
    //         return res.status(200).json({message: 'Sector watering details created with success'})
    //     } catch (error) {
    //       console.log(`Fail creating monitoring thesis caused by: ${error.message}`)
    //       return res.status(500).json({error: "Error on creating monitoring thesis"})
    //     }
      
    //   });

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/expireSector:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Set the end of validity for a watering sector and its thesis
     *     description: Set the end of validity for a watering sector and its thesis
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
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: The timestamp to set as the end of validity for the sector
     *     responses:
     *       '200':
     *         description: Monitoring sector disabled successfully.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error on disabling sector.
     */
    // router.post('/:refStructureName/:companyName/:fieldName/:sectorName/expireSector', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }

    //   const { refStructureName, companyName, fieldName, sectorName } = req.params;

    //   try {
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, null, '*')))
    //       return res.status(401).json({message: 'Unauthorized request'});

    //     const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

    //     await fieldService.disableSector(refStructureName, companyName, fieldName, sectorName, timestamp)

    //     return res.status(200).json({message: `Sector disabled successfully`})
    //   } catch (error) {
    //     console.log(`Fail disabling sector caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error on disabling sector"})
    //   }
    // });

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
    router.put('/setOptState', async (req, res) => {
      let requestUserData
      try {
        requestUserData = await authenticationService.validateJwt(req.headers.authorization);
      } catch (error) {
        return res.status(403).json({message: 'Authentication failed'});
      }

      if(!req.body && req.body === '')
        throw new Error('Body is empty');

      const refStructureName = req.body.refStructureName;
      const companyName = req.body.companyName;
      const fieldName = req.body.fieldName;
      const sectorName = req.body.sectorName;
      const thesisName = req.body.thesisName;
      
      try {
        if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA')))
          return res.status(401).json({message: 'Unauthorized request'});

        if(!req.body.validFrom || !req.body.optimalState)
          return res.status(400).json({message: 'Invalid request'});

        const bodyRequest = new OptStateDto(refStructureName, companyName, fieldName, sectorName, thesisName, req.body.validFrom, req.body.validTo, undefined, req.body.optimalState)

        const thesisPoints = await fieldService.findThesisPoints(refStructureName, companyName, fieldName, sectorName, thesisName)

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
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/setOptState:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Set optimal state for thesis as the interpolation at given timestamp of specified thesis
     *     description: Set optimal state for thesis as the interpolation at given timestamp of thesis specified in body or for the same defined in path
     *     tags: [Field Operations]
     *     requestBody:
     *       description: If specified, the optimal state will be set as the interpolation at given timestamp in the indicated thesis
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ThesisIdentifier'
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
     *        name: thesisName
     *        required: true
     *        schema:
     *          type: string
     *        description: The thesisName
     *      - in: query
     *        name: imageTimestamp
     *        type: number
     *      - in: query
     *        name: matrixId
     *        description: The id of already existing matrix to use as optimal state
     *        type: string
     *      - in: query
     *        name: timestampFrom
     *        description: The timestamp from which the optimal state is valid
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
    // router.put('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/setOptState', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }
      
    //   const dst_refStructureName = req.params.refStructureName;
    //   const dst_companyName = req.params.companyName;
    //   const dst_fieldName = req.params.fieldName;
    //   const dst_sectorName = req.params.sectorName;
    //   const dst_thesisName = req.params.thesisName;

    //   try {
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, dst_refStructureName, dst_companyName, dst_fieldName, dst_sectorName, dst_thesisName, 'WA')))
    //       return res.status(401).json({message: 'Unauthorized request'});

    //   if(req.query.imageTimestamp){
    //     const src_refStructureName = req.body.refStructureName || req.params.refStructureName;
    //     const src_companyName = req.body.companyName || req.params.companyName;
    //     const src_fieldName = req.body.fieldName || req.params.fieldName;
    //     const src_sectorName = req.body.sectorName || req.params.sectorName;
    //     const src_thesisName = req.body.thesisName || req.params.thesisName;
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, src_refStructureName, src_companyName, src_fieldName, src_sectorName, src_thesisName, 'MO'))){
    //           return res.status(401).json({message: 'Unauthorized request'});
    //     }
    //     const interpolatedMatrix = await fieldService.getDataInterpolated(src_refStructureName, src_companyName, src_fieldName, src_sectorName, src_thesisName, req.query.imageTimestamp)

    //     if(!interpolatedMatrix || !(interpolatedMatrix.values.length > 0)){
    //       return res.status(400).json({message: 'Invalid request, given timestamp not found'});
    //     }
    //     const selectedOptimal = new OptStateDto(dst_refStructureName, dst_companyName, dst_fieldName, dst_sectorName, dst_thesisName, req.query.timestampFrom || Date.now()/1000, undefined, undefined, interpolatedMatrix.values[0].measures[0].image)
    //     await fieldService.createMatrixOptState(selectedOptimal)
    //   } else if(req.query.matrixId){
    //     await fieldService.setOptimalState(dst_refStructureName, dst_companyName, dst_fieldName, dst_sectorName, dst_thesisName, req.query.matrixId, req.query.timestampFrom || Date.now()/1000)

    //   } else {
    //     return res.status(400).json({message: 'Invalid request, specify either imageTimestamp or matrixId'});
    //   }

    //     return res.status(200).json({message: `Matrix opt state created with success`})
    //   } catch (error) {
    //     console.log(`Fail creating opt state caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error on creating field opt matrix"})
    //   }

    // });

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/lastWateringAdvice:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Get last watering advice for a field
     *     description: Get last watering advice for a field
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
    *        name: thesisName
    *        required: true
    *        schema:
    *          type: string
    *        description: The thesisName
    *      - in: query
    *        name: timestamp
    *        type: number
    *     tags: [Field Operations]
    *     responses:
    *       '200':
    *         description: Last advice returned successfully.
    *         content:
    *           application/json:
    *             schema:
    *                $ref: '#/components/schemas/WateringAdviceDto'
    *       '400':
    *         description: Invalid request.
    *       '401':
    *         description: Unauthorized request.
    *       '403':
    *         description: Authentication failed.
    *       '500':
    *         description: Error on retrieving advice.
    */
    // router.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/lastWateringAdvice', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }

    //   const refStructureName = req.params.refStructureName;
    //   const companyName = req.params.companyName;
    //   const fieldName = req.params.fieldName;
    //   const sectorName = req.params.sectorName;
    //   const thesisName = req.params.thesisName;
    //   const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

    //   try {
    //       if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
    //         return res.status(401).json({message: 'Unauthorized request'});

    //     const result = await wateringAdviceService.getLastWateringAdvice(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp)

    //     return res.status(200).json(result)
    //   } catch (error) {
    //     console.log(`Fail get watering advice caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error get watering advice"})
    //   }
    // });

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/wateringAdvice:
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
     *        name: thesisName
     *        required: true
     *        schema:
     *          type: string
     *        description: The thesisName
     *      - in: query
     *        name: expectedWater
     *        type: number
     *      - in: query
     *        name: timestamp
     *        type: number
     *     tags: [Field Operations]
     *     responses:
     *       '200':
     *         description: Advice returned successfully.
     *         content:
     *           application/json:
     *             schema:
     *                $ref: '#/components/schemas/WateringAdviceDto'
     *       '400':
     *         description: Invalid request.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error on computing advice.
     */
    // router.get('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/wateringAdvice', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }

    //   const refStructureName = req.params.refStructureName;
    //   const companyName = req.params.companyName;
    //   const fieldName = req.params.fieldName;
    //   const sectorName = req.params.sectorName;
    //   const thesisName = req.params.thesisName;
    //   const expectedWater = req.query.expectedWater ? req.query.expectedWater : 0;
    //   const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

    //   try {
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'WA', timestamp, timestamp)))
    //       return res.status(401).json({message: 'Unauthorized request'});

    //     const result = await wateringAdviceService.getWateringAdvice(refStructureName, companyName, fieldName, sectorName, thesisName, expectedWater, timestamp)

    //     return res.status(200).json(result)
    //   } catch (error) {
    //     console.log(`Fail compute watering advice caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error computing watering advice"})
    //   }
    // });

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/dripperInfo:
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
     *         name: thesisName
     *         required: true
     *         schema:
     *           type: string
     *         description: The thesisName
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
    // router.get("/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/dripperInfo", async (req, res) => {
    //   const refStructureName = req.params.refStructureName;
    //   const companyName = req.params.companyName;
    //   const fieldName = req.params.fieldName;
    //   const sectorName = req.params.sectorName;
    //   const thesisName = req.params.thesisName;
    //   const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

    //   try {
    //     const user = await authenticationService.validateJwt(req.headers.authorization);
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
    //       return res.status(401).json({ message: 'Unauthorized request' });
    //   } catch (error) {
    //     return res.status(403).json({ message: 'Authentication failed' });
    //   }

    //   try {
    //     const result = await fieldService.getDripperInfo(refStructureName, companyName, fieldName, sectorName, thesisName, timestamp);
    //     res.status(200).json(result);
    //   } catch (error) {
    //     return res.status(500).json({ message: error.message });
    //   }
    // })

    // function checkOptState(thesisPoints, newOptimalPoints) {
    //   if (thesisPoints.points.length !== newOptimalPoints.length) return false;

    //   for (const point of thesisPoints.points) {
    //     const match = newOptimalPoints.find(optPoint => optPoint.xx === point.xx && optPoint.yy === point.yy && optPoint.zz === point.zz);
    //     if (!match) return false;
    //   }

    //   return true;
    // }


    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/setBaseline:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Set information about baseline irrigation for sector
     *     description: Set information about baseline irrigation for sector
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
    // router.put('/:refStructureName/:companyName/:fieldName/:sectorName/setBaseline', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }

    //   const { refStructureName, companyName, fieldName, sectorName } = req.params;

    //   try {
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, null, 'WA')))
    //       return res.status(401).json({message: 'Unauthorized request'});

    //     if(!req.body && req.body === '')
    //       return res.status(400).json({message: 'Invalid request'});

    //     const {
    //         maxIrrigation: maxIrrigation,
    //         irrigationBaseline: irrigationBaseline,
    //         wateringHour: wateringHour,
    //     irrigationFrequency: irrigationFrequency,
    //         ki: ki,
    //         kp: kp,
    //         timestampFrom: timestampFrom
    //     } = req.body;

    //     const baselineData = {
    //         refStructureName,
    //         companyName,
    //         fieldName,
    //         sectorName,
    //         maxIrrigation,
    //         irrigationBaseline,
    //         wateringHour,
    //     irrigationFrequency,
    //         ki,
    //         kp
    //     };

    //     const baseline = new WateringBaseline(baselineData);

    //     await fieldService.setWateringBaseline(baseline, timestampFrom)

    //     return res.status(200).json({message: `Watering Baseline update with success`})
    //   } catch (error) {
    //     console.log(`Fail update watering baseline caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error on update watering baseline"})
    //   }

    // });

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/setPrescriptiveThesis:
     *   put:
     *     security:
     *       - bearerAuth: []
     *     summary: Set the thesis to use for prescriptive irrigation in a sector
     *     description: Set the thesis to use for prescriptive irrigation in a sector
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
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/SetPrescriptiveThesisRequest'
     *     responses:
     *       '200':
     *         description: Prescriptive thesis updated successfully.
     *       '400':
     *         description: Invalid request.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error on update prescriptive thesis.
     */
    // router.put('/:refStructureName/:companyName/:fieldName/:sectorName/setPrescriptiveThesis', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }

    //   const { refStructureName, companyName, fieldName, sectorName } = req.params;

    //   try {
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, null, 'WA')))
    //       return res.status(401).json({message: 'Unauthorized request'});

    //     if(!req.body && req.body === '')
    //       return res.status(400).json({message: 'Invalid request'});

    //     await fieldService.setPrescriptiveThesis(refStructureName, companyName, fieldName, sectorName, req.body.prescriptiveThesis)

    //     return res.status(200).json({message: `Prescriptive thesis update with success`})
    //   } catch (error) {
    //     console.log(`Fail update prescriptive thesis caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error on update watering baseline"})
    //   }

    // });

    /**
     * @swagger
     * /fields/{refStructureName}/{companyName}/{fieldName}/{sectorName}/{thesisName}/{nodeId}/disable:
     *   post:
     *     security:
     *       - bearerAuth: []
     *     summary: Set the end of validity for a node of a thesis
     *     description: Set the end of validity for a node of a thesis
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
     *         name: thesisName
     *         required: true
     *         schema:
     *           type: string
     *         description: The thesisName
     *       - in: path
     *         name: nodeId
     *         required: true
     *         schema:
     *           type: string
     *         description: The node id to disable
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: The timestamp to set as the end of validity for the node
     *     responses:
     *       '200':
     *         description: Node disabled successfully.
     *       '401':
     *         description: Unauthorized request.
     *       '403':
     *         description: Authentication failed.
     *       '500':
     *         description: Error on disabling monitoring thesis.
     */
    // router.post('/:refStructureName/:companyName/:fieldName/:sectorName/:thesisName/:nodeId/disable', async (req, res) => {
    //   let requestUserData
    //   try {
    //     requestUserData = await authenticationService.validateJwt(req.headers.authorization);
    //   } catch (error) {
    //     return res.status(403).json({message: 'Authentication failed'});
    //   }

    //   const { refStructureName, companyName, fieldName, sectorName, thesisName, nodeId } = req.params;

    //   try {
    //     if (!(await authorizationService.isUserAuthorizedByFieldAndId(requestUserData.userid, refStructureName, companyName, fieldName, sectorName, thesisName, '*')))
    //       return res.status(401).json({message: 'Unauthorized request'});

    //     const timestamp = req.query.timestamp ? req.query.timestamp : Date.now()/1000;

    //     await fieldService.disableNode(refStructureName, companyName, fieldName, sectorName, thesisName, nodeId, timestamp)

    //     return res.status(200).json({message: `Node disabled successfully`})
    //   } catch (error) {
    //     console.log(`Fail disabling node caused by: ${error.message}`)
    //     return res.status(500).json({error: "Error on disabling node"})
    //   }
    // });
	return router;
}
export default fieldsRouter;