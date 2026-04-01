import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { loginUser, setupDb, table } from '../utils';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../const';

describe('Field Setup Creation Integration Test', () => {
    let db
    let container
    let authToken

    let app

    beforeAll(async () => {
        // 1. Initialize DB and Container
        const setup = await setupDb()
        db = setup.db
        container = setup.container

        console.log('Database and container setup complete.')

        app = (await import('../../src/app.js')).app;

        // 2. Login
        authToken = await loginUser(app, ADMIN_EMAIL, ADMIN_PASSWORD)
    })

    afterAll(async () => {
        // console.log('Postgres running. Press Ctrl+C to stop.');
        // await new Promise(async () => {
        //     process.stdin.setRawMode(true);
        //     console.log('Press any key to continue...');
        //     await new Promise(resolve => {
        //     process.stdin.once('data', () => {
        //             resolve();
        //             process.stdin.setRawMode(false);
        //         });
        //     });
        // });
        if (db) await db.destroy()
        if (container) await container.stop()
    })

    // IDs to track across the hierarchy chain
    let organizationId
    let companyId
    let farmId
    let sectorId
    let thesisId

    /**
     * TEST 1: Organization
     */
    it('should create an Organization and persist it to DB', async () => {
        const payload = { name: 'Global Agro Op' }

        const res = await request(app)
        .post('/organizations/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200)

        expect(res.body).toHaveProperty('id')
        organizationId = res.body.id

        // DB Persistence Check
        const record = await table(db, 'organizations').where({ id: organizationId }).first()
        expect(record).toBeDefined()
        expect(record.organization_name).toBe(payload.name)
    })

    /**
     * TEST 2: Company
     */
    it('should create a Company linked to the Organization', async () => {
        const payload = {
            name: 'Mario Rossi Agro Company',
            address: 'via Roma, 1588 Bologna (BO)',
            organizationIds: [organizationId],
            createdAt: Math.floor(Date.now() / 1000)
        }

        const res = await request(app)
        .post('/companies/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200)

        expect(res.body).toHaveProperty('id');
        companyId = res.body.id

        // DB Persistence Check
        const record = await table(db, 'companies').where({ id: companyId }).first()
        expect(record).toBeDefined()
        expect(record.company_name).toBe(payload.name)
        expect(record.address).toBe(payload.address)
        expect(record.created_at).toBe(payload.createdAt)
        
        const organizations = await table(db, 'companies_organizations').where({company_id: companyId})
        const ids = organizations.map(o => o.organization_id)
        expect(ids).toHaveLength(payload.organizationIds.length)
        expect(ids).toEqual(expect.arrayContaining(payload.organizationIds))

    })

    /**
     * TEST 3: Farm
     */
    it('should create a Farm linked to the Company with GeoJSON', async () => {
        const payload = {
        name: 'Farm North 01',
        companyId: companyId,
        location: {
            type: 'Polygon',
            coordinates: [[
                [10.1, 45.1], [10.2, 45.1], [10.2, 45.2], [10.1, 45.2], [10.1, 45.1]
            ]]
        }
        }

        const res = await request(app)
            .post('/farms/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload)
            .expect(200)

        expect(res.body).toHaveProperty('id')
        farmId = res.body.id

        // DB Persistence Check
        // We use ST_AsGeoJSON to ensure PostGIS data is readable
        const record = await table(db,'farms')
            .select('*', db.raw('public.ST_AsGeoJSON(location) as location_json'))
            .where({ id: farmId })
            .first()

        expect(record).toBeDefined()
        expect(record.farm_name).toBe(payload.name)
        expect(record.company_id).toBe(companyId)

        // Verify Geometry
        const storedGeo = JSON.parse(record.location_json)
        expect(storedGeo.type).toBe('Polygon')
        expect(storedGeo.coordinates).toEqual(payload.location.coordinates)
    })

    /**
     * TEST 4: Sector
     */
    it('should create a Sector linked to the Farm', async () => {
        const payload = {
        name: 'Sector T1',
        culture: 'Kiwi',
        cultureType: 'G3',
        dripperCapacity: 2.5,
        doubleWing: false,
        location: {
            type: 'Polygon',
            coordinates: [[
                [10.15, 45.15], [10.2, 45.15], [10.2, 45.25], [10.15, 45.25], [10.15, 45.15]
            ]]
        }
        };

        const res = await request(app)
        .post(`/farms/${farmId}/createSector`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200)

        expect(res.body).toHaveProperty('id')
        sectorId = res.body.id

        // DB Persistence Check
        const record = await table(db, 'sectors').where({ id: sectorId }).first()
        expect(record).toBeDefined()
        expect(record.sector_name).toBe(payload.name)
        expect(record.farm_id).toBe(farmId)
        expect(record.culture).toBe('Kiwi')
    })

    /**
     * TEST 5: Thesis
     */
    it('should create a Thesis linked to the Sector', async () => {
        const startTimestamp = Math.floor(Date.now() / 1000);
        const payload = {
            name: 'T1 high',
            validFrom: startTimestamp
        }

        const res = await request(app)
        .post(`/sectors/${sectorId}/createThesis`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(payload)
        .expect(200)

        expect(res.body).toHaveProperty('id')
        thesisId = res.body.id

        // DB Persistence Check
        const record = await table(db,'theses')
            .join('theses_in_sectors', 'theses.id', 'theses_in_sectors.thesis_id')
            .where('theses.id', thesisId)
            .andWhere('valid_from', '<', startTimestamp + 1)
            .whereNull('valid_to')
            .first()
        expect(record).toBeDefined()
        expect(record.thesis_name).toBe(payload.name)
        expect(record.sector_id).toBe(sectorId)
        expect(record.valid_from).toBeCloseTo(startTimestamp, 1)
    });

    /**
     * FINAL CHECK: Hierarchy Integrity
     */
    it('should verify the full hierarchy chain via SQL JOIN', async () => {
        const result = await table(db, 'theses')
        .join('theses_in_sectors', 'theses.id', 'theses_in_sectors.thesis_id')
        .join('sectors', 'theses_in_sectors.sector_id', 'sectors.id')
        .join('farms', 'sectors.farm_id', 'farms.id')
        .join('companies', 'farms.company_id', 'companies.id')
        .select(
            'theses.thesis_name',
            'sectors.sector_name',
            'farms.farm_name',
            'companies.company_name'
        )
        .where('theses.id', thesisId)
        .first()

        expect(result).toBeDefined()
        expect(result.thesis_name).toBe('T1 high')
        expect(result.sector_name).toBe('Sector T1')
        expect(result.farm_name).toBe('Farm North 01')
        expect(result.company_name).toBe('Mario Rossi Agro Company')
    })
})