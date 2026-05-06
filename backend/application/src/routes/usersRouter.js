import { Router } from 'express';
import { UserTokenRequest, UserTokenResponse } from '../dtos/authenticationDto.js';
import { User, Users } from '../dtos/userDto.js';
import { ROLES } from '../commons/permissionRoles.js';

const usersRouter = ({ userService, authenticationService, authorizationService }) => {
    const router = Router();

    /**
     * @swagger
     * /users:
     *   get:
     *     summary: Finds user searching by params
     *     tags: [Users]
     *     description: |
     *       Return data about the user filtered by param (e.g. email)
     *     parameters:
     *       - in: query
     *         name: email
     *         required: true
     *         schema:
     *           type: string
     *           format: email
     *         description: Email of the user searching data for
     *     responses:
     *       '200':
     *         description: Users successfully found.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserData'
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to add user permissions.
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
     *       '500':
     *         description: Internal Server Error – unexpected error while retrieving user data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.get('/', async (req, res) => {
        let requestUserData;

        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const email = req.query.email
            const userData = await userService.findUserByEmail(email);
            if (userData){
                return res.status(200).json(userData);
            }
            return res.status(404).json({message:"User not found"});
        } catch (error) {
            console.error(`Fail while retrieving user data caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while retrieving user data' });
        }
    })

    /**
     * @swagger
     * /users/login:
     *   post:
     *     security: []
     *     summary: Authenticate user and generate token
     *     tags: [Users]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserTokenRequest'
     *     responses:
     *       '200':
     *         description: Successful login
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserTokenResponse'
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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

     *       '500':
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
    */
    router.post("/login", async  (req, res) => {
        try {
            if(!req.body && req.body === '')
                throw new Error('Body is empty');

            const request = new UserTokenRequest(req.body.email, req.body.password);
            const token = await authenticationService.generateJwt(request);

            const responseDto = new UserTokenResponse(token);
            res.json(responseDto);
        } catch (error) {
            return res.status(500).json({error:error.toString()});
        }
    });

    /**
     * @swagger
     * /users/register:
     *   post:
     *     summary: Register a new user
     *     tags: [Users]
     *     description: |
     *       Create new user in the system.  
     *       Requires a valid JWT token and appropriate permissions to create users.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterUserRequest'
     *     responses:
     *       '200':
     *         description: User successfully created.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to create users.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '500':
     *         description: Internal Server Error – unexpected error while creating users.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.post('/register', async (req, res) => {
        let requestUserData;

        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId;

            if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin))) {
                return res.status(403).json({ message: 'Unauthorized request' });
            }

            const newUser = new User(
                    null,
                    req.body.email,
                    req.body.name,
                    req.body.password ?? ''
                );

            const newUserId = await userService.createUser(userId, newUser);
            return res.status(200).json({ message: 'User created successfully', id: newUserId});
        } catch (error) {
            console.error(`Fail creating user caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while creating user' });
        }
    });

    /**
     * @swagger
     * /users/me:
     *   get:
     *     summary: Finds info about the logged user
     *     tags: [Users]
     *     description: |
     *       Return data about the user currenlty logged by using the token
     *     responses:
     *       '200':
     *         description: Users successfully created.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserData'
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '500':
     *         description: Internal Server Error – unexpected error while retrieving user data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.get('/me', async (req, res) => {
        let requestUserData;

        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        try {
            const userId = requestUserData.userId;
            const userData = await userService.findUser(userId);
            return res.status(200).json(userData);
        } catch (error) {
            console.error(`Fail while retrieving user data caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while retrieving user data' });
        }
    })

    /**
     * @swagger
     * /users/{userId}/disable:
     *   post:
     *     summary: Disables a user.
     *     tags: [Users]
     *     description: |
     *       Disables a user.
     *       Requires authentication and proper authorization.
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of user to disable
     *       - in: query
     *         name: validTo
     *         required: false
     *         schema:
     *           type: number
     *         description: Timestamp indicating end date of the user validity, if not set takes actual timestamp (Seconds elapsed since 1/1/1970).
     *     responses:
     *       200:
     *         description: User successfully disabled.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                   example: User successfully disabled.
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
     *       401:
     *         description: Authentication failed (Invalid or missing JWT).
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       403:
     *         description: Unauthorized request – user not allowed to end farm validity.
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
     *         description: Internal server error – unexpected error during the process.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     */
    router.post('/:userId/disable', async (req, res) => {
        let requestUserData
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization);
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const targetUserId = req.params.userId;
        const exists = await userService.findUser(targetUserId);
        if (!exists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const validTo = req.query.validTo ?? currentTimestamp;

        if(!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ADMINISTRATOR, requestUserData.isAdmin))){
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            if (validTo < currentTimestamp - (24 * 60 * 60)) {
                return res.status(400).json({ message: 'Invalid validTo timestamp provided. It must be a timestamp in the last 24 hours' })
            }
            await userService.disableUser(requestUserData.userId, targetUserId, validTo)
            return res.status(200).json({ message: `User validity successfully ended` })
        } catch (error) {
            console.log(`Failed disabling user: ${error.message}`)
            return res.status(500).json({ error: "Internal error disabling user" })
        }
    })


    /**
     * @swagger
     * /users/isAuthorized:
     *   get:
     *     summary: Checks if a user has certain authorizations
     *     tags: [Users]
     *     description: |
     *       Checks if a user has an authorization on an entity grater or equal to specified *role* on the specified entity if specified, otherwise it checks if user as at least *role* on some entity
     *     parameters:
     *       - in: query
     *         name: role
     *         required: true
     *         schema:
     *           type: string
     *           enum: [VIEWER, PLANNER, ACCOUNTER, ADMINISTRATOR]
     *         description: Minimum required role on the entity
     *       - in: query
     *         name: entityType
     *         schema:
     *           type: string
     *           enum: [COMPANY, FARM, SECTOR, THESIS, DEVICE]
     *         description: Type of the entity on which is requested the authorization
     *       - in: query
     *         name: id
     *         schema:
     *           type: integer
     *         description: Id of the entity
     *       - in: query
     *         name: service
     *         schema:
     *           type: string
     *           enum: [Monitoring, Watering Advice, Prescriptive Watering Advice]
     *         description: Name of the service that has to be enabled on the requested resource         
     *     responses:
     *       '200':
     *         description: Validation Result
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                  isValid:
     *                    type: boolean
     *               required:
     *                - isValid
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '500':
     *         description: Internal Server Error – unexpected error while retrieving user authorization data
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.get('/isAuthorized', async (req, res) => {
        let requestUserData;

        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization)
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' })
        }

        try {
            const userId = requestUserData.userId
            const minRole = req.query.role.toLowerCase()
            const entity = req.query.entityType
            const id = req.query.id
            const service = req.query.service
            
            const isValid = await authorizationService.isUserAuthorized(userId, minRole, requestUserData.isAdmin, entity, id, service)

            return res.status(200).json({isValid:isValid})
        } catch (error) {
            console.error(`Fail while retrieving user authorization data caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while retrieving user authorization' });
        }
    })

    /**
     * @swagger
     * /users/{userId}/permission:
     *   post:
     *     summary: Grant a permission to a user on a resource
     *     tags: [Users]
     *     description: |
     *       Creates a new permission associating a user with a *role* on a specific resource.
     *       This action overwrites previous permits on related entities. 
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of user to add permission
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/GrantPermissionRequest'      
     *     responses:
     *       '200':
     *         description: Permission granted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to add user permissions.
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
     *       '500':
     *         description: Internal Server Error – unexpected error while adding user permission
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.post('/:userId/permission', async (req, res) => {
        let requestUserData;

        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization)
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' })
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const userId = requestUserData.userId
            const targetUserId = req.params.userId
            const role = req.body.role.toLowerCase()
            const entityType = req.body.entityType
            const entityId = req.body.entityId
            const extraAttributes = req.body.extraAttributes

            if (! await userService.findUser(targetUserId)) {
                return res.status(404).json({ message: "User not found" })
            }

            await authorizationService.grantUser(userId, targetUserId, role, entityType, entityId, extraAttributes)

            return res.status(200).json({ message: 'Permission granted successfully!' })
        } catch (error) {
            console.error(`Fail while creating user permission caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while creating user permission' });
        }
    })

    /**
     * @swagger
     * /users/{userId}/permission:
     *   delete:
     *     summary: Delete a permission of a user on a resource
     *     tags: [Users]
     *     description: |
     *       Delete a permission of a user on a resource. 
     *     parameters:
     *       - in: path
     *         name: userId
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID of user to delete permission
     *       - in: query
     *         name: entityType
     *         required: true
     *         schema:
     *           type: string
     *           enum: [COMPANY, SECTOR]
     *         description: Type of the entity on which is requested the authorization
     *       - in: query
     *         name: entityId
     *         required: true
     *         schema:
     *           type: integer
     *         description: Id of the entity
     *     responses:
     *       '200':
     *         description: Permission deleted successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '400':
     *         description: Input validation error (Bad Request)
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               required:
     *                 - message
     *                 - errors
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
     *         description: Authentication failed – invalid or missing JWT token.
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *       '403':
     *         description: Unauthorized – user does not have permission to delete user permissions.
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
     *       '500':
     *         description: Internal Server Error – unexpected error while deleting user permission
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     */
    router.delete('/:userId/permission', async (req, res) => {
        let requestUserData;
        try {
            requestUserData = await authenticationService.validateJwt(req.headers.authorization)
        } catch (error) {
            return res.status(401).json({ message: 'Authentication failed' })
        }
        if (!(await authorizationService.isUserAuthorized(requestUserData.userId, ROLES.ACCOUNTER, requestUserData.isAdmin))) {
            return res.status(403).json({ message: 'Unauthorized request' });
        }

        try {
            const userId = requestUserData.userId
            const targetUserId = req.params.userId
            const entityType = req.query.entityType
            const entityId = req.query.entityId

            if (! await userService.findUser(targetUserId)) {
                return res.status(404).json({ message: "User not found" })
            }

            await authorizationService.deleteUserPermission(userId, targetUserId, entityType, entityId)

            return res.status(200).json({ message: 'Permission deleted successfully!' })
        } catch (error) {
            console.error(`Fail while deleting user permission caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while deleting user permission' });
        }
    })
    return router;
}

export default usersRouter;