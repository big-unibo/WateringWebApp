import { Router } from 'express';
import { UserTokenRequest, UserTokenResponse } from '../dtos/authenticationDto.js';
import { User, Users } from '../dtos/userDto.js';

const usersRouter = ({ userService, authenticationService, authorizationService }) => {
    const router = Router();
    /**
     * @swagger
     * /users/login:
     *   post:
     *     security: []
     *     summary: Authenticate user and generate token
     *     tags: [User route]
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

            //[TO DO]: Improve log if no user is found
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
     *     summary: Register one or more new users
     *     tags: [User route]
     *     description: |
     *       Creates one or more new users in the system.  
     *       Requires a valid JWT token and appropriate permissions to create users.
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterUsersRequest'
     *     responses:
     *       '200':
     *         description: Users successfully created.
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

            if (!(await authorizationService.isUserAuthorized(userId, 'create', 'users')))
            return res.status(403).json({ message: 'Unauthorized request' });

            if (req.body.users.length === 0)
                return res.status(400).json({ message: 'Insert at  least onew user' });

            const request = new Users(
            req.body.users.map(
                user =>
                new User(
                    user.email,
                    user.password,
                    user.name,
                    user.role
                )
            )
            );

            await userService.createUsers(request);
            return res.status(200).json({ message: 'Users created successfully' });
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
     *     tags: [User route]
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
            const userData = await userService.getUserData(userId);
            return res.status(200).json(userData);
        } catch (error) {
            console.error(`Fail while retrieving user data caused by: ${error.message}`);
            return res.status(500).json({ error: 'Error while retrieving user data' });
        }
    });

    return router;
}

export default usersRouter;