import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { loginUser, setupDb, table } from '../utils.js'; 
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../const.js';

describe('Device and Signal Setup Integration Test', () => {
    let db;
    let container;
    let authToken;
    let app;

    // IDs to track newly created entities
    let deviceId;
    let tempSignalId;
    let humiditySignalId;
    let windSignalId;
    const timestamp = (new Date(2025, 1, 20, 9, 0, 0)).valueOf() / 1000

    // Reference Data Constants 
    // (Must match the IDs in your SQL schema file)
    const PROVIDER_ID = 1        // Provider A
    const SIGNAL_TYPE_TEMP = 4   // AIR_TEMPERATURE
    const SIGNAL_TYPE_HUM = 5    // AIR_HUMIDITY
    const SIGNAL_TYPE_WIND = 8   // WIND_SPEED
    const TEST_DELETE_DEVICE_ID = 4

    beforeAll(async () => {
        // 1. Initialize DB and Container (Loads schema + data)
        const setup = await setupDb()
        db = setup.db
        container = setup.container

        app = (await import('../../src/app.js')).app

        // 2. Login
        authToken = await loginUser(app, ADMIN_EMAIL, ADMIN_PASSWORD)
    })

    afterAll(async () => {
        if (db) await db.destroy();
        if (container) await container.stop();
    })

    /**
     * TEST 1: Create Device
     * Endpoint: POST /devices/create
     */
    it('should create a Device and persist it', async () => {
        const payload = {
            type: 'WEATHER_STATION',
            description: 'Main Field Station',
            companyId: 1,
            location: {
                type: 'Point',
                coordinates: [10.50, 45.50]
            },
            createdAt: Math.floor(Date.now()/1000),
        }

        const res = await request(app)
            .post('/devices/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)

        expect(res.body).toHaveProperty('id');
        deviceId = res.body.id

        // DB Persistence Check
        const record = await table(db, 'devices')
            .select('*', db.raw('public.ST_AsGeoJSON(location) as location_json'))
            .where({ id: deviceId })
            .first()

        expect(record).toBeDefined()
        expect(record.type).toBe(payload.type)
        expect(record.created_at).toBe(payload.createdAt)

        const storedGeo = JSON.parse(record.location_json)
        expect(storedGeo.type).toBe('Point')
        expect(storedGeo.coordinates).toEqual(payload.location.coordinates)
    })

    /**
     * TEST 2: Create Signal (Air Temperature)
     * Endpoint: POST /signals/create
     */
    it('should create an Air Temperature Signal', async () => {
        const payload = {
            typeId: SIGNAL_TYPE_TEMP,
            description: 'Sensor 1 - Air Temp',
            x: 0,
            y: 100,
            z: 0,
            virtual: false,
            unit: '°C',
            providerId: PROVIDER_ID,
            idOnProvider: 'SENS-001-T',
            sensorTechnology: 'Thermistors'
        }

        const res = await request(app)
            .post('/signals/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)

        expect(res.body).toHaveProperty('id')
        tempSignalId = res.body.id

        // DB Persistence Check
        const record = await table(db, 'signals').where({ id: tempSignalId }).first()
        expect(record).toBeDefined()
        expect(record.provider_id).toBe(PROVIDER_ID)
        expect(record.type_id).toBe(SIGNAL_TYPE_TEMP)
        expect(record.id_on_provider).toBe('SENS-001-T')
    })

    /**
     * TEST 3: Create other signals (Air Humidity, Wind Speed)
     * Endpoint: POST /signals/create
     */
    it('should create an Air Humidity and Wind Speed Signal', async () => {
        const payload = {
            typeId: SIGNAL_TYPE_HUM,
            description: 'Sensor 2 - Air Hum',
            virtual: false,
            unit: '%',
            providerId: PROVIDER_ID,
            idOnProvider: 'SENS-001-H',
            sensorTechnology: 'LoraWAN'
        }

        const res = await request(app)
            .post('/signals/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)

        expect(res.body).toHaveProperty('id')
        humiditySignalId = res.body.id

        const payloadBis = {
            typeId: SIGNAL_TYPE_WIND,
            description: 'Sensor 3 - Wind Speed',
            virtual: false,
            unit: 'm/s',
            scaling_factor: 3.6,
            scaled_unit: 'km/h',
            providerId: PROVIDER_ID,
            idOnProvider: 'SENS-001-W',
            sensorTechnology: 'LoraWAN'
        }

        const resBis = await request(app)
            .post('/signals/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payloadBis)
            .expect(200)

        expect(resBis.body).toHaveProperty('id')
        windSignalId = resBis.body.id
    })

    /**
     * TEST 4: Connect Signals to Device
     * Endpoint: POST /devices/{deviceId}/connectSignals
     */
    it('should connect the Signals to the Device', async () => {
        
        const payload = {
            signalIds: [tempSignalId, humiditySignalId],
            timestamp: timestamp
        }

        await request(app)
            .post(`/devices/${deviceId}/connectSignals`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)

        // DB Persistence Check
        // Verifying relationship via 'signals.device_id' column
        const signals = await table(db, 'signals')
            .join('devices_signals', 'signals.id', 'devices_signals.signal_id')
            .whereIn('signals.id', [tempSignalId, humiditySignalId])
            .andWhere('valid_from', '<', timestamp + 1)
            .whereNull('valid_to')
            .select('signal_id', 'device_id')

        expect(signals).toHaveLength(2)
        
        signals.forEach(signal => {
            expect(signal.device_id).toBe(deviceId)
        })
    })

    /**
     * TEST 5: Verify Full Device Info via API
     * Endpoint: GET /devices/{deviceId}
     */
    it('should retrieve the Device and see connected signals', async () => {
        const res = await request(app)
            .get(`/devices/${deviceId}`)
            .query({ timestamp: timestamp + 1 })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

        // Verify Device Data
        expect(res.body.id).toBe(deviceId)
        expect(res.body.type).toBe('WEATHER_STATION')

        // Verify Signals Array
        expect(res.body.signals).toBeDefined()
        
        // Extract IDs from response
        const signalIds = res.body.signals.map(s => s.id)
        
        // Assertions
        expect(signalIds).toContain(tempSignalId)
        expect(signalIds).toContain(humiditySignalId)
    });

    /**
     * TEST 6: Disconnect Signals from Device
     */
    it('should disconnect Signals from the Device', async () => {

        const validTo = timestamp + 3600
        const payload = {
            signalIds: [tempSignalId, humiditySignalId],
            timestamp: validTo
        }

        await request(app)
            .put(`/devices/${deviceId}/disconnectSignals`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)

        // DB Persistence Check
        // Verifying relationship via 'signals.device_id' column
        const signalsConnected = await table(db, 'signals')
            .join('devices_signals', 'signals.id', 'devices_signals.signal_id')
            .whereIn('signals.id', [tempSignalId, humiditySignalId])
            .andWhere('valid_from', '<', validTo - 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo - 1).orWhereNull('valid_to')})
            .select('signal_id', 'device_id')

        expect(signalsConnected).toHaveLength(2)

        const signals = await table(db, 'signals')
            .join('devices_signals', 'signals.id', 'devices_signals.signal_id')
            .whereIn('signals.id', [tempSignalId, humiditySignalId])
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .select('signal_id', 'device_id')

        expect(signals).toHaveLength(0)
    })

    /**
     *  TEST 7: Disable a Signal
     */
    it('should disable a Signal and check it is no more connected to the Device', async () => {
        const validTo = Date.now()/1000 + 7200
        const response = await request(app)
            .post(`/signals/${windSignalId}/disable`)
            .query({ validTo})
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

        await table(db, 'signals')
            .where('id', windSignalId)
            .first()
            .then(record => {
                expect(record.disabled_at).toBe(validTo)
            })
        
        await table(db, 'devices_signals').where('signal_id', windSignalId)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .select('signal_id', 'device_id')
            .then(records => {
                expect(records).toHaveLength(0)
            })
    })

    /**
     * TEST 8: Disable a Device and check all signals are disconnected
     */
    it('should disable a Device and check all signals are disconnected', async () => {

        const validTo = Date.now()/1000
        await request(app)
            .post(`/devices/${TEST_DELETE_DEVICE_ID}/disable`)
            .query({ validTo })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

        await table(db, 'devices')
            .where('id', TEST_DELETE_DEVICE_ID)
            .first()
            .then(record => {
                expect(record.disabled_at).toBe(validTo)
            })

        await table(db, 'devices_signals').where('device_id', TEST_DELETE_DEVICE_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .select('signal_id', 'device_id')
            .then(records => {
                expect(records).toHaveLength(0)
            })
        await table(db, 'grid_optimal_profile_assignment').where('grid_id', TEST_DELETE_DEVICE_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
        await table(db, 'theses_all_signals').where('device_id', TEST_DELETE_DEVICE_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
    })

    /**
     * TEST 9: Delete device and all related data
     */ 
    it('should delete a device and all related data', async () => {

        await request(app)
            .delete(`/devices/${TEST_DELETE_DEVICE_ID}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200)

        // DB Persistence Check
        // If no device found we can assume all related entity are correctly
        // deleted otherwise foreign key checks prevents deletion
        const devicePersistence = await table(db, 'devices')
            .where('id', TEST_DELETE_DEVICE_ID)

        expect(devicePersistence).toHaveLength(0)
    })


});