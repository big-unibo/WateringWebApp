import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';

import cors from 'cors';

import dotenv from 'dotenv'
import initModels from './persistency/model/initModels.js';
import sequelize from './configs/dbConfig.js';
import ThesesAllSignalsRepository from './persistency/repository/ThesesAllSignalsRepository.js';
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
import devicesRouter from './routes/devicesRouter.js';
import DeviceService from './services/DeviceService.js';
import DeviceRepository from './persistency/repository/DeviceRepository.js';
import SignalRepository from './persistency/repository/SignalRepository.js';
import signalsRouter from './routes/signalsRouter.js';
import SignalService from './services/SignalService.js';
import sectorsRouter from './routes/sectorsRouter.js';
import fieldChartRouter from './routes/fieldChartsRouter.js';
import InterpolatedProfileRepository from './persistency/repository/InterpolatedProfileRepository.js';
import HumidityBinsRepository from './persistency/repository/HumidityBinsRepository.js';
import thesesRouter from './routes/thesesRouter.js';

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
const deviceRepository = new DeviceRepository(models,sequelize);
const signalRepository = new SignalRepository(models,sequelize);
const thesesAllSignalsRepository = new ThesesAllSignalsRepository(models,sequelize);
const interpolatedProfilerepository = new InterpolatedProfileRepository(models,sequelize);
const humidityBinsRepository = new HumidityBinsRepository(models,sequelize)

const organizationService = new OrganizationService(organizationRepository);
const userService = new UserService(userRepository);
const authenticationService = new AuthenticationService(userService);
const companyService = new CompanyService(companyRepository);
const fieldService = new FieldService(fieldRepository,companyRepository, thesesAllSignalsRepository, interpolatedProfilerepository, humidityBinsRepository);
const authorizationService = new AuthorizationService(userService, fieldService);
const deviceService = new DeviceService(deviceRepository,signalRepository);
const signalService = new SignalService(signalRepository)
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
  '/sectors',
  sectorsRouter({ userService, authenticationService, authorizationService, fieldService })
);

app.use(
  '/theses',
  thesesRouter({ userService, authenticationService, authorizationService, fieldService })
);

app.use(
  '/organizations',
  organizationsRouter({ organizationService, authenticationService, userService, authorizationService })
);

app.use(
  '/companies',
  companiesRouter({ companyService, userService, authenticationService, authorizationService })
);

app.use(
	'/devices',
	devicesRouter({authenticationService,authorizationService, userService, deviceService})
)

app.use(
  '/signals',
  signalsRouter({authenticationService,authorizationService,signalService})
)

app.use(
  '/fieldCharts',
  fieldChartRouter({authenticationService,authorizationService,fieldService})
)

app.use('/api-docs', serve, setup(swaggerSpec));
//app.use('/fieldCharts', fieldChartRouter);
// app.use('/wateringSchedule', wateringScheduleRouter);
// app.use('/logs', logsRouter)