import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { loginUser, setupDb, table } from '../utils'
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../const'

describe('Device Assignment Integration Test', () => {
    let db, container, app, authToken
    
    const validFrom = (new Date(2025, 1, 25, 9, 0, 0)).valueOf() / 1000

    const TEST_WEATHER_STATION_ID = 1
    const TEST_FLOW_METER_ID = 2
    const TEST_SOIL_MOISTURE_GRID_ID = 3

    const TEST_FARM_ID = 1
    const TEST_SECTOR_ID = 1
    const TEST_THESIS_ID = 1

    beforeAll(async () => {
        const setup = await setupDb()
        db = setup.db
        container = setup.container
        app = (await import('../../src/app.js')).app
        authToken = await loginUser(app, ADMIN_EMAIL, ADMIN_PASSWORD)
    })

    afterAll(async () => {
        if (db) await db.destroy()
        if (container) await container.stop()
    })

    it('should assign WEATHER_STATION to the Farm', async () => {
        await request(app)
            .post(`/devices/${TEST_WEATHER_STATION_ID}/assign`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetId: TEST_FARM_ID, targetType: 'FARM', validFrom: validFrom })
            .expect(200)

        const record = await table(db, 'farms_devices')
            .where({ device_id: TEST_WEATHER_STATION_ID, farm_id: TEST_FARM_ID }).first()
        expect(record).toBeDefined()
    })

    it('should assign FLOW_METER to the Sector', async () => {
        await request(app)
            .post(`/devices/${TEST_FLOW_METER_ID}/assign`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetId: TEST_SECTOR_ID, targetType: 'SECTOR', validFrom: validFrom })
            .expect(200)

        const record = await table(db, 'sectors_devices')
            .where({ device_id: TEST_FLOW_METER_ID, sector_id: TEST_SECTOR_ID }).first()
        expect(record).toBeDefined()
    })

    it('should assign SOIL_MOISTURE_GRID to the Thesis', async () => {
        await request(app)
            .post(`/devices/${TEST_SOIL_MOISTURE_GRID_ID}/assign`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetId: TEST_THESIS_ID, targetType: 'THESIS', validFrom: validFrom })
            .expect(200)

        const record = await table(db, 'theses_devices')
            .where({ device_id: TEST_SOIL_MOISTURE_GRID_ID, thesis_id: TEST_THESIS_ID }).first()
        expect(record).toBeDefined()
    })

    /**
     * STEP 5: Integrity / Conflict Check
     * Ensure we can't assign to a non-existent target
     */
    it('should fail when assigning to a non-existent entity or assigning a non-existent device', async () => {
        const invalidId = 999999
        const payload = {
            targetId: invalidId,
            targetType: 'FARM',
            validFrom: validFrom
        }

        await request(app)
            .post(`/devices/${TEST_WEATHER_STATION_ID}/assign`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(500)
        
        await request(app)
            .post(`/devices/${invalidId}/assign`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(404)
    })

    it('should retrieve ALL associated devices when querying the Thesis endpoint', async () => {
        const queryTimestamp = validFrom + 1

        const res = await request(app)
            .get(`/theses/${TEST_THESIS_ID}/devices`)
            .query({ 
                timestamp: queryTimestamp,
                includeAnchestors: true
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(res.body).toBeDefined();
        expect(Array.isArray(res.body)).toBe(true);

        const returnedDeviceIds = res.body.map(d => d.id);
        expect(returnedDeviceIds).toHaveLength(3);
        expect(returnedDeviceIds).toContain(TEST_WEATHER_STATION_ID);
        expect(returnedDeviceIds).toContain(TEST_FLOW_METER_ID); 
        expect(returnedDeviceIds).toContain(TEST_SOIL_MOISTURE_GRID_ID);

        const weatherStation = res.body.find(d => d.id === TEST_SOIL_MOISTURE_GRID_ID);
        expect(weatherStation.signals).toHaveLength(4);
    });
})