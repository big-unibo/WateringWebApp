import { Router } from 'express';
import { ROLES } from '../commons/permissionRoles.js';
const fieldChartRouter = ({ authenticationService, authorizationService, fieldService }) => {
    const router = Router();

    /**
     * @swagger
     * /fieldCharts/{thesisId}/signals:
     *   get:
     *     summary: Retrieves data for one or more given types of signals for a given thesis, optionally filtered by time
     *     tags: [Field Chart Data]
     *     description: |
     *       Retrieves data for one or more given types of signals for a given thesis,
     *       optionally filtered by time. Requires authentication and proper authorization.
     *       
     *       **Query parameters:**
     *       - **signalTypes** (*array of string*): Types of signals to retrieve.
     *       - **timeFilterFrom** (*number*): Start timestamp (seconds since 01/01/1970) to filter measurements.
     *       - **timeFilterTo** (*number*): End timestamp (seconds since 01/01/1970) to filter measurements.
     *       - **aggregationPeriod** (*number*, optional): Granularity period (seconds) for aggregating the requested measurements, default will be set based on time filter window.
     *       - **aggregationType** (*string*, optional): Aggregation method to use within each aggregation period, default will be `AVG`. Possible values:
     *         - `SUM`: Sum of the measurements
     *         - `AVG`: Average of the measurements
     *         - `MIN`: Minimum value
     *         - `MAX`: Maximum value
     *         - `MED`: Median value
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the Thesis
     *       - in: query
     *         name: signalTypes
     *         required: true
     *         style: form
     *         explode: true
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *         description: Array of Signal Types 
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: aggregationPeriod
     *         schema:
     *           type: number
     *         description: Granularity period for aggregation of the requested measurements (in seconds)
     *       - in: query
     *         name: aggregationType
     *         schema:
     *           $ref: "#/components/schemas/AggregationType"
     *         description: Defines the kind of aggregation requested for the returned measurements in the aggregation period
     *     responses:
     *       200:
     *         description: Successfully retrieved signal data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/SignalsDataResponse"
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
     *         description: Unauthorized (user not allowed to retrieve signals data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/signals', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Monitoring'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        const signalTypes = req.query.signalTypes
        const aggregationType = req.query.aggregationType;
        const aggregationPeriod = req.query.aggregationPeriod ? Number(req.query.aggregationPeriod) : undefined;

        try {
            const results = await fieldService.getMeasurementsByThesis(
                thesisId,
                signalTypes,
                timeFilterFrom,
                timeFilterTo,
                aggregationType,
                aggregationPeriod
            );
            return res.status(200).json(results);
        } catch (error) {
            console.error(`Failed retrieving thesis heatmap caused by: ${error}`);
            return res.status(500).json({ message: error.message });
        }
    });


    /**
     * @swagger
     * /fieldCharts/{thesisId}/heatmap:
     *   get:
     *     summary: Retrieves the heatmap for a given thesis in a time interval
     *     tags: [Field Chart Data]
     *     description: Retrieves the heatmap for a given thesis in a time interval. Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the Thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (in seconds since 01/01/1970)
     *     responses:
     *       200:
     *         description: Successfully retrieved heatmap data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/InterpolatedDataResponse"
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
     *         description: Unauthorized (user not allowed to retrieve heatmap data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/heatmap', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Monitoring'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        try {
            const results = await fieldService.getHeatmapByThesis(
                thesisId,
                timeFilterFrom,
                timeFilterTo,
            );

            if (!results) {
                return res.status(404).json({ message: "Couldn't find heatmap data" });
            }

            return res.status(200).json(results);
        } catch (error) {
            console.error(`Failed retrieving thesis heatmap caused by: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    })

    /**
     * @swagger
     * /fieldCharts/{thesisId}/humidityBins:
     *   get:
     *     summary: Retrieves humidity bins data for a given thesis in a time interval
     *     tags: [Field Chart Data]
     *     description: Retrieves humidity bins data for a given thesis in a time interval. Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the Thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
     *     responses:
     *       200:
     *         description: Successfully retrieved humidity bins data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/HumidityBinsDataResponse"
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
     *         description: Unauthorized (user not allowed to retrieve humidty bins data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/humidityBins', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Monitoring'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        try {
            const results = await fieldService.getHumidityBinsByThesis(
                thesisId,
                timeFilterFrom,
                timeFilterTo,
            );

            if (!results) {
                return res.status(404).json({ message: "Couldn't find humidty bins data" });
            }
            return res.status(200).json(results);
        } catch (error) {
            console.error(`Failed retrieving humidty heatmap caused by: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    })


    /**
     * @swagger
     * /fieldCharts/{thesisId}/waterAggregate:
     *   get:
     *     summary: Retrieves daily aggregates of a thesis' signals, expected water and advice data. (Requires proper authorization and authentication).
     *     tags: [Field Chart Data]
     *     description: Retrieves daily aggregates of a thesis' signals, expected water and advice data. (Requires proper authorization and authentication).
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the Thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
     *     responses:
     *       200:
     *         description: Successfully retrieved heatmap data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/SignalsDataResponse"
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
     *         description: Unauthorized (user not allowed to retrieve water aggregate data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/waterAggregate', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Monitoring'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        try {
            const results = await fieldService.getWaterAggregateByThesis(
                thesisId,
                timeFilterFrom,
                timeFilterTo,
            );
            return res.status(200).json(results);
        } catch (error) {
            console.error(`Failed retrieving humidty humidty bins caused by: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    })

    /**
     * @swagger
     * /fieldCharts/{thesisId}/distanceProfileToOptimal:
     *   get:
     *     summary: Get the profile of distances between actual ond optimal one
     *     description: Get the profile of distances between actual ond optimal one. Requires authentication and proper validation.
     *     tags: [Field Chart Data]
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: The id of the thesis
     *       - in: query
     *         name: timestamp
     *         schema:
     *           type: number
     *         description: The timestamp in which find the information
     *     responses:
     *       '200':
     *         description: Successfully retrieve profile of distances
     *         content:
     *           application/json:
     *             schema:
     *                     $ref: '#/components/schemas/DistanceProfile'
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
     *         description: Unauthorized (user not allowed to retrieve distance to optimal data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/distanceProfileToOptimal', async (req, res) => {
        try {
            const user = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Watering Advice'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }
        const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000;

        try {
            const result = await fieldService.getPunctualDistance(thesisId, timestamp);
            res.status(200).json(result);
        } catch (error) {
            console.error(`Failed retrieving distnace profile to optimal caused by: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    });

    /**
    * @swagger
    * /fieldCharts/{thesisId}/optimalState:
    *   get:
    *     summary: Gets the thesis optimal state for a given timestamp
    *     description: Gets the thesis optimal state for a given timestamp, requires auhtentication ad proper authorization.
    *     tags: [Field Chart Data]
    *     parameters:
    *       - in: path
    *         name: thesisId
    *         required: true
    *         schema:
    *           type: integer
    *         description: The id of the thesis
    *       - in: query
    *         name: timestamp
    *         schema:
    *           type: number
    *         description: The timestamp in which find the information
    *     responses:
    *       '200':
    *         description: Successfully retrieve profile of distances
    *         content:
    *           application/json:
    *             schema:
    *                     $ref: '#/components/schemas/OptimalStateData'
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
     *         description: Unauthorized (user not allowed to retrieve optimal state data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/optimalState', async (req, res) => {
        try {
            const user = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Watering Advice'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }
        const timestamp = req.query.timestamp ? Number(req.query.timestamp) : Date.now() / 1000;

        try {
            const result = await fieldService.getOptimalState(thesisId, timestamp);
            res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    /**
     * @swagger
     * /fieldCharts/{thesisId}/optimalDistance:
     *   get:
     *     summary: Retrieves optimal distance data (Requires proper authorization and authentication).
     *     tags: [Field Chart Data]
     *     description: Retrieves optimal distance data, with values of actual and optimal level, wet and dry bounds for comparison reference (Requires proper authorization and authentication).
     *     parameters:
     *       - in: path
     *         name: thesisId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the Thesis
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds since 01/01/1970)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds since 01/01/1970)
     *     responses:
     *       200:
     *         description: Successfully retrieved optimal distance data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OptimalDistanceData'
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
     *         description: Unauthorized (user not allowed to retrieve optimal distance data for the given thesis)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '404':
     *         description: Resource not found
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
    router.get('/:thesisId/optimalDistance', async (req, res) => {
        try {
            const user = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Watering Advice'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        try {
            const result = await fieldService.getOptimalDistanceData(thesisId, timeFilterFrom, timeFilterTo);
            res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    /**
 * @swagger
 * /fieldCharts/{thesisId}/profileStatistics:
 *   get:
 *     summary: Retrieves statistics data of profile, specifically the mean and std for each chell. (Requires proper authorization and authentication).
 *     tags: [Field Chart Data]
 *     description: Retrieves statistics data of profile, specifically the mean and std for each chell. (Requires proper authorization and authentication).
 *     parameters:
 *       - in: path
 *         name: thesisId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Id of the Thesis
 *       - in: query
 *         name: timeFilterFrom
 *         required: true
 *         schema:
 *           type: number
 *         description: Time filter start (timestamp in seconds since 01/01/1970)
 *       - in: query
 *         name: timeFilterTo
 *         required: true
 *         schema:
 *           type: number
 *         description: Time filter end (timestamp in seconds since 01/01/1970)
 *     responses:
 *       200:
 *         description: Successfully retrieved profile statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InterpolatedMeansDataResponse'
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
 *         description: Unauthorized (user not allowed to retrieve profile statistics for the given thesis)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       '404':
 *         description: Resource not found
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
    router.get('/:thesisId/profileStatistics', async (req, res) => {
        try {
            const user = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const thesisId = Number(req.params.thesisId)
        const exists = await fieldService.thesisExists(thesisId);
        if (!exists) {
            return res.status(404).json({ message: 'Thesis not found' });
        }

        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.VIEWER, 'THESIS', thesisId, 'Monitoring'))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }
        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        try {
            const result = await fieldService.getInterpolatedMeans(thesisId, timeFilterFrom, timeFilterTo);
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    return router;
}

export default fieldChartRouter;


