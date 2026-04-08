import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import { serve, setup } from 'swagger-ui-express';
import OpenApiValidator from 'express-openapi-validator'

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
import FarmRepository from './persistency/repository/FarmRepository.js';
import FieldService from './services/FieldService.js';
import farmsRouter from './routes/farmsRouter.js';
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
import profileBinsRouter from './routes/profileBinsRouter.js';
import WateringAdviceService from './services/WateringAdviceService.js';
import WateringAdviceRepository from './persistency/repository/WateringAdviceRepository.js';
import WateringScheduleRepository2 from './persistency/repository/WateringScheduleRepository.js';
import WateringScheduleService from './services/WateringScheduleService.js';
import wateringScheduleRouter from './routes/wateringScheduleRouter.js';
import OptimalDistanceRepository from './persistency/repository/OptimalDistanceRepository.js';
import OptimalStateRepository from './persistency/repository/OptimalStateRepository.js';
import logsRouter from './routes/logsRouter.js';
import LogService from './services/LogService.js';
import LogRepository from './persistency/repository/LogRepository.js';
import UserActionRepository from './persistency/repository/UserActionRepository.js';
import UserActionService from './services/UserActionService.js';
import SectorRepository from './persistency/repository/SectorRepository.js';
import ThesisRepository from './persistency/repository/ThesisRepository.js';
import AuthorizationRepository from './persistency/repository/AuthorizationRepository.js'
import SectorServicesService from './services/SectorServicesService.js';
import SectorServiceRepository from './persistency/repository/SectorServiceRepository.js';
import sectorServicesRouter from './routes/servicesRouter.js';

dotenv.config()

export const app = express()

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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authorization token',
        },
      },
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./doc/*.yaml', './src/routes/*.js'], // path to your route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions)

const models = initModels(sequelize)

const userRepository = new UserRepository(models, sequelize)
const organizationRepository = new OrganizationRepository(models, sequelize)
const companyRepository = new CompanyRepository(models, sequelize)
const farmRepository = new FarmRepository(models, sequelize)
const sectorRepository = new SectorRepository(models,sequelize)
const thesisRepository = new ThesisRepository(models, sequelize)
const deviceRepository = new DeviceRepository(models, sequelize)
const signalRepository = new SignalRepository(models, sequelize)
const thesesAllSignalsRepository = new ThesesAllSignalsRepository(models, sequelize)
const interpolatedProfileRepository = new InterpolatedProfileRepository(models, sequelize)
const humidityBinsRepository = new HumidityBinsRepository(models, sequelize)
const wateringAdviceRepository = new WateringAdviceRepository(models, sequelize)
const wateringScheduleRepository = new WateringScheduleRepository2(models, sequelize)
const optimalDistanceRepository = new OptimalDistanceRepository(models, sequelize)
const optimalStateRepository = new OptimalStateRepository(models, sequelize)
const logRepository = new LogRepository(models, sequelize)
const userActionRepository = new UserActionRepository(models, sequelize)
const authorizationRepository = new AuthorizationRepository(models, sequelize)
const serviceRepository = new SectorServiceRepository(models, sequelize)

const userActionService = new UserActionService(userActionRepository)
const organizationService = new OrganizationService(organizationRepository, userActionService)
const userService = new UserService(userRepository, userActionService)
const authenticationService = new AuthenticationService(userService)
const sectorServicesService = new SectorServicesService(serviceRepository, userActionService)
const fieldService = new FieldService(companyRepository, farmRepository, sectorRepository, thesisRepository, thesesAllSignalsRepository, interpolatedProfileRepository, humidityBinsRepository, optimalDistanceRepository, wateringAdviceRepository, deviceRepository, wateringScheduleRepository, optimalStateRepository, serviceRepository, sectorServicesService, userActionService)
const authorizationService = new AuthorizationService(userService, authorizationRepository, userActionService)
const deviceService = new DeviceService(deviceRepository, signalRepository, thesisRepository, interpolatedProfileRepository, optimalStateRepository, userActionService)
const signalService = new SignalService(signalRepository, userActionService)
const companyService = new CompanyService(companyRepository, farmRepository, deviceRepository, deviceService, fieldService, userActionService)
const wateringScheduleService = new WateringScheduleService(wateringScheduleRepository, wateringAdviceRepository, userActionService)
const wateringAdviceService = new WateringAdviceService(wateringAdviceRepository, sectorRepository, thesisRepository, interpolatedProfileRepository, optimalDistanceRepository, thesesAllSignalsRepository, userActionService)
const logService = new LogService(logRepository, userActionService)


import fs from 'fs'

fs.writeFileSync(
  './swagger.json',
  JSON.stringify(swaggerSpec, null, 2),
  'utf8'
)

app.use(express.json());
app.use(cors());

app.use('/api-docs', serve, setup(swaggerSpec));

app.use(
  OpenApiValidator.middleware({
    apiSpec: swaggerSpec,
    validateRequests: true,
  }),
);

app.use(
  '/users',
  usersRouter({ userService, authenticationService, authorizationService})
);

app.use(
  '/farms',
  farmsRouter({ userService, authenticationService, authorizationService, fieldService })
);

app.use(
  '/sectors',
  sectorsRouter({ userService, authenticationService, authorizationService, fieldService, sectorServicesService })
);

app.use(
  '/theses',
  thesesRouter({ authenticationService, authorizationService, fieldService, wateringAdviceService })
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
  devicesRouter({ authenticationService, authorizationService, userService, deviceService  })
)

app.use(
  '/signals',
  signalsRouter({ authenticationService, authorizationService, signalService })
)

app.use(
  '/fieldCharts',
  fieldChartRouter({ authenticationService, authorizationService, fieldService })
)

app.use(
  '/profileBins',
  profileBinsRouter({ authenticationService, authorizationService, fieldService })
)

app.use(
  '/wateringSchedule',
  wateringScheduleRouter({ authenticationService, authorizationService, wateringScheduleService, fieldService })
)

app.use(
  '/logs',
  logsRouter({ authenticationService, authorizationService, logService, fieldService })
)

app.use(
  '/services',
  sectorServicesRouter({ authenticationService, authorizationService, sectorServicesService })
)

app.use((err, req, res, next) => {
  if (err.status && err.errors) {
    if (err.status == 401) {
      return res.status(err.status).json({
        message: 'Authentication failed',
      });
    }
    const simplifiedErrors = err.errors.map(e => ({
      path: e.path,
      message: e.message
    }));

    return res.status(err.status).json({
      message: 'Input validation failed against request schema',
      errors: simplifiedErrors
    });
  }
  next(err);
});

app.use('/api-docs', serve, setup(swaggerSpec));