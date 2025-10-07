import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';

import cors from 'cors';

import dotenv from 'dotenv'
import initModels from './persistency/model/initModels.js';
import sequelize from './configs/dbConfig.js';
import OrganizationRepository from './persistency/repository/OrganizationRepository.js';
import OrganizationService from './services/OrganizationService.js';
import UserRepository from './persistency/repository/UserRepository.js';
import UserService from './services/UserService.js';
import AuthenticationService from './services/AuthenticationService.js';
import CompanyRepository from './persistency/repository/CompanyRepository.js';
import CompanyService from './services/CompanyService.js';
import AuthorizationService from './services/AuthorizationService.js';
import usersRouter from './routes/usersRouter.js';
import companiesRouter from './routes/companiesRouter.js';
import organizationsRouter from './routes/organizationsRouter.js';
import FieldRepository from './persistency/repository/FieldRepository.js';
import FieldService from './services/FieldService.js';
import fieldsRouter from './routes/fieldsRouter.js';

dotenv.config();

const app = express();
const port = 8081;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Watering platform',
      version: '1.0.0',
      description: 'API for accessing field data',
    },
    servers: [
      {
        url: process.env.BACKEND_ADDRESS,
        description: 'Local server',
      },
    ],
    security: {
      bearerAuth: []
    }
  },
  apis: ['./doc/*.yaml','./routes/*.js'], // path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.listen(port, () => {
  console.log(`Server is running at ${process.env.BACKEND_ADDRESS}`);
});

const models = initModels(sequelize);

const userRepository = new UserRepository(models,sequelize);
const organizationRepository = new OrganizationRepository(models,sequelize);
const companyRepository = new CompanyRepository(models,sequelize);
const fieldRepository = new FieldRepository(models,sequelize);

const organizationService = new OrganizationService(organizationRepository);
const userService = new UserService(userRepository);
const authenticationService = new AuthenticationService(userService);
const companyService = new CompanyService(companyRepository);
const fieldService = new FieldService(fieldRepository,companyRepository);
const authorizationService = new AuthorizationService(userService, fieldService);

app.use(express.json());
app.use(cors());
app.use(
  '/', 
  usersRouter({ userService, authenticationService, authorizationService })
);

app.use(
  '/fields',
  fieldsRouter({ userService, authenticationService, authorizationService, fieldService })
);

app.use(
  '/organizations',
  organizationsRouter({ organizationService, authenticationService, userService, authorizationService })
);

app.use(
  '/companies',
  companiesRouter({ companyService, userService, authenticationService, authorizationService })
);

app.use('/api-docs', serve, setup(swaggerSpec));
// app.use('/fieldCharts', fieldChartRouter);
// app.use('/wateringSchedule', wateringScheduleRouter);
// app.use('/logs', logsRouter)