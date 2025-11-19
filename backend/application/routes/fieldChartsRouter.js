import { Router } from 'express';
const fieldChartRouter = ({ authenticationService, authorizationService, fieldService }) => {
    const router = Router();

    /**
     * @swagger
     * /fieldCharts/{thesisId}/signals:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Retrieves data for one or more given types of signals for a given thesis, optionally filtered by time
     *     tags: [Field Chart Data]
     *     description: |
     *       Retrieves data for one or more given types of signals for a given thesis,
     *       optionally filtered by time.
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
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *           collectionFormat: multi
     *         description: Array of Signal Types 
     *       - in: query
     *         name: timeFilterFrom
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
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
     *         description: Unauthorized (user not allowed to view signals)
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
    router.get('/:thesisId/signals', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        // [TO DO]: Authorization
        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        let signalTypes = req.query.signalTypes || []
        if (!Array.isArray(signalTypes)) signalTypes = [signalTypes]

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

        const aggregationType = req.query.aggregationType;
        const aggregationPeriod = req.query.aggregationPeriod;

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
            return res.status(500).json({ message: error.message });
        }
    });


    /**
     * @swagger
     * /fieldCharts/{thesisId}/heatmap:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Retrieves the heatmap for a given thesis in a time interval
     *     tags: [Field Chart Data]
     *     description: Retrieves the heatmap for a given thesis in a time interval
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
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
     *     responses:
     *       200:
     *         description: Successfully retrieved heatmap data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/InterpolatedDataResponse"
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
    router.get('/:thesisId/heatmap', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }

        // [TO DO]: Authorization
        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

        try {
            const results = await fieldService.getHeatmapByThesis(
                thesisId,
                timeFilterFrom,
                timeFilterTo,
            );
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    /**
     * @swagger
     * /fieldCharts/{thesisId}/humidityBins:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Retrieves humidity bins data for a given thesis in a time interval
     *     tags: [Field Chart Data]
     *     description: Retrieves humidity bins data for a given thesis in a time interval
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
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
     *     responses:
     *       200:
     *         description: Successfully retrieved humidity bins data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/HumidityBinsDataResponse"
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
     *         description: Unauthorized (user not allowed to see humidity bins data)
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
    router.get('/:thesisId/humidityBins', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        // [TO DO]: Authorization
        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

        try {
            const results = await fieldService.getHumidityBinsByThesis(
                thesisId,
                timeFilterFrom,
                timeFilterTo,
            );
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })


    /**
     * @swagger
     * /fieldCharts/{thesisId}/waterAggregate:
     *   get:
     *     security:
     *       - bearerAuth: []
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
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
     *     responses:
     *       200:
     *         description: Successfully retrieved heatmap data
     *         content:
     *           application/json:
     *             schema:
     *               $ref: "#/components/schemas/SignalsDataResponse"
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
    router.get('/:thesisId/waterAggregate', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(403).json({ message: 'Authentication failed' });
        }
        // [TO DO]: Authorization
        const thesisId = Number(req.params.thesisId)
        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }

        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

        try {
            const results = await fieldService.getWaterAggregateByThesis(
                thesisId,
                timeFilterFrom,
                timeFilterTo,
            );
            return res.status(200).json(results);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    /**
     * @swagger
     * /fieldCharts/{thesisId}/distanceProfileToOptimal:
     *   get:
     *     security:
     *       - bearerAuth: []
     *     summary: Get the profile of distances between actual ond optimal one
     *     description: Get the profile of distances between actual ond optimal one
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized (user not allowed to view heatmaps)
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

        // TODO authorization
        // if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
        //     return res.status(403).json({ message: 'Unauthorized request' });

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

        try {
            const result = await fieldService.getPunctualDistance(thesisId, timestamp);
            res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    });

    /**
    * @swagger
    * /fieldCharts/{thesisId}/optimalState:
    *   get:
    *     security:
    *       - bearerAuth: []
    *     summary: Gets the thesis optimal state for a given timestamp
    *     description: Gets the thesis optimal state for a given timestamp, requires proper authorization ad authentication.
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
    *         description: Authentication failed (invalid or missing JWT)
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 message:
    *                   type: string
    *       403:
    *         description: Unauthorized (user not allowed to view heatmaps)
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

        // TODO authorization
        // if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
        //     return res.status(403).json({ message: 'Unauthorized request' });

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }
        const timestamp = req.query.timestamp ? req.query.timestamp : Date.now() / 1000;

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
     *     security:
     *       - bearerAuth: []
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
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
     *     responses:
     *       200:
    *         description: Successfully retrieved optimal distance data
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/OptimalDistanceData'
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized (user not allowed to view optimal distance data)
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

        // TODO authorization
        // if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
        //     return res.status(403).json({ message: 'Unauthorized request' });

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }
        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

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
     *     security:
     *       - bearerAuth: []
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
     *         description: Time filter start (timestamp in seconds)
     *       - in: query
     *         name: timeFilterTo
     *         required: true
     *         schema:
     *           type: number
     *         description: Time filter end (timestamp in seconds)
     *     responses:
     *       200:
    *         description: Successfully retrieved profile statistics
    *         content:
    *           application/json:
    *             schema:
    *               $ref: '#/components/schemas/InterpolatedMeansDataResponse'
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
     *         description: Authentication failed (invalid or missing JWT)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized (user not allowed to view profile statistics)
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

        // TODO authorization
        // if (!(await authorizationService.isUserAuthorizedByFieldAndId(user.userid, refStructureName, companyName, fieldName, sectorName, thesisName, 'MO', timestamp, timestamp)))
        //     return res.status(403).json({ message: 'Unauthorized request' });

        const thesisId = Number(req.params.thesisId)

        if (isNaN(thesisId) || !Number.isInteger(thesisId)) {
            return res.status(400).json({ message: 'thesis ID is required and must be a number' });
        }
        const timeFilterFrom = Number(req.query.timeFilterFrom)
        const timeFilterTo = Number(req.query.timeFilterTo)

        if (isNaN(timeFilterFrom)) {
            return res.status(400).json({ message: 'timeFilterFrom is required and must be a valid timestamp' });
        }
        if (isNaN(timeFilterTo)) {
            return res.status(400).json({ message: 'timeFilterTo is required and must be a valid timestamp' });
        }

        try {
            const result = await fieldService.getInterpolatedMeans(thesisId, timeFilterFrom, timeFilterTo);
            res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    })

    return router;
}

export default fieldChartRouter;


