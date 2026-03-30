import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { loginUser, setupDb, table } from '../utils.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../const.js';
import { DeviceTargetType } from '../../src/dtos/deviceDto.js';

describe('Entity Cascading Deletion Integration Test', () => {
    let db;
    let container;
    let authToken;
    let app;

    // IDs for the hierarchy
    let companyId;
    let farmId;
    let sectorId;
    let thesisId;

    // Reference Data Constants
    const TEST_DELETE_COMPANY_ID = 2
    const TEST_DELETE_FARM_ID = 2
    const TEST_DELETE_SECTOR_ID = 2
    const TEST_DELETE_THESIS_ID = 3
    const TEST_DELETE_DEVICE_ASSOCIATED_ID = 5


    beforeAll(async () => {
        const setup = await setupDb();
        db = setup.db;
        container = setup.container;
        app = (await import('../../src/app.js')).app;

        authToken = await loginUser(app, ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    afterAll(async () => {
        if (db) await db.destroy();
        if (container) await container.stop();
    });

    /**
     * Disabling a Thesis and related entity
     */
     it('should disable a thesis and its associations', async () => {
        const validTo = Math.floor(Date.now() / 1000);
        await request(app)
            .post(`/theses/${TEST_DELETE_THESIS_ID}/disable`)
            .query({ validTo })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        await table(db, 'theses')
            .where('id', TEST_DELETE_THESIS_ID)
            .first()
            .then(record => {
                expect(record.disabled_at).toBe(validTo)
            })
        await table(db, 'theses_in_sectors')
            .where('thesis_id', TEST_DELETE_THESIS_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
        await table(db, 'theses_devices')
            .where('thesis_id', TEST_DELETE_THESIS_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
        await table(db, 'watering_algorithm_params')
            .where('thesis_id', TEST_DELETE_THESIS_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
     })

    /**
     * Deleting a Thesis and related entity
     */
    it('should delete a thesis without affecting parent entities', async () => {

        expect(await table(db, 'theses').where('id', TEST_DELETE_THESIS_ID).first()).toBeDefined();
        expect(await table(db, 'sectors').where('id', TEST_DELETE_SECTOR_ID).first()).toBeDefined();
        expect(await table(db, 'theses_devices').where('thesis_id', TEST_DELETE_THESIS_ID).first()).toBeDefined();
        expect(await table(db, 'advices').where('thesis_id', TEST_DELETE_THESIS_ID).first()).toBeDefined();
        expect(await table(db, 'watering_algorithm_params').where('thesis_id', TEST_DELETE_THESIS_ID).first()).toBeDefined();

        await request(app)
            .delete(`/theses/${TEST_DELETE_THESIS_ID}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const thesis = await table(db, 'theses').where('id', TEST_DELETE_THESIS_ID).first();
        expect(thesis).toBeUndefined();

        const thesisSector = await table(db, 'theses_in_sectors').where('thesis_id', TEST_DELETE_THESIS_ID).first();
        expect(thesisSector).toBeUndefined();

        const thesisDeviceAssociation = await table(db, 'theses_devices').where('thesis_id', TEST_DELETE_THESIS_ID).first();
        expect(thesisDeviceAssociation).toBeUndefined();

        const device = await table(db, 'devices').where('id', TEST_DELETE_DEVICE_ASSOCIATED_ID).first();
        expect(device).toBeDefined();

        const advice = await table(db, 'advices').where('thesis_id', TEST_DELETE_THESIS_ID).first();
        expect(advice).toBeUndefined();

        const wateringParams = await table(db, 'watering_algorithm_params').where('thesis_id', TEST_DELETE_THESIS_ID).first();
        expect(wateringParams).toBeUndefined();

        const sector = await table(db, 'sectors').where('id', TEST_DELETE_SECTOR_ID).first();
        expect(sector).toBeDefined();
    });

    /**
     * DIsabling a Sector and related entity
     */
     it('should disable a sector and its associations', async () => {
        const validTo = Math.floor(Date.now() / 1000);

        await request(app)
            .post(`/devices/${TEST_DELETE_DEVICE_ASSOCIATED_ID}/link`)
            .set('Authorization', `Bearer ${authToken}`)
             .send({ targetId: TEST_DELETE_SECTOR_ID, targetType: DeviceTargetType.SECTOR, validFrom: validTo - 1000 })
             .expect(200);

         expect(await table(db, 'theses_in_sectors').where('sector_id', TEST_DELETE_SECTOR_ID).andWhere(function () {
             this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')
         }).first()).toBeDefined();
         expect(await table(db, 'sectors_devices').where('sector_id', TEST_DELETE_SECTOR_ID).andWhere(function () {
             this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')
         }).first()).toBeDefined();
         expect(await table(db, 'sectors_services').where('sector_id', TEST_DELETE_SECTOR_ID).andWhere(function () {
             this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')
         }).first()).toBeDefined();
         expect(await table(db, 'watering_events').where('sector_id', TEST_DELETE_SECTOR_ID).andWhere('watering_start', '>', validTo + 1).first()).toBeDefined();

         await request(app)
             .post(`/sectors/${TEST_DELETE_SECTOR_ID}/disable`)
            .query({ validTo })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        await table(db, 'sectors')
            .where('id', TEST_DELETE_SECTOR_ID)
            .first()
            .then(record => {
                expect(record.disabled_at).toBe(validTo)
            })
        
        await table(db, 'theses_in_sectors')
            .where('sector_id', TEST_DELETE_SECTOR_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
        
        await table(db, 'sectors_devices')
            .where('sector_id', TEST_DELETE_SECTOR_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })

        await table(db, 'sectors_services')
            .where('sector_id', TEST_DELETE_SECTOR_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })

        await table(db, 'watering_events')
            .where('sector_id', TEST_DELETE_SECTOR_ID)
            .andWhere('watering_start', '>', validTo + 1)
            .then(records => {
                expect(records).toHaveLength(0)
            })
     })

    /**
     * Deleting a Sector and related entity
     */
    it('should delete a thesis without affecting parent entities', async () => {

        expect(await table(db, 'sectors').where('id', TEST_DELETE_SECTOR_ID).first()).toBeDefined();
        const thesisId = (await table(db, 'theses_in_sectors').where('sector_id', TEST_DELETE_SECTOR_ID).first())?.thesis_id
        expect(thesisId).toBeDefined();

        expect(await table(db, 'sectors_devices').where('sector_id', TEST_DELETE_SECTOR_ID).first()).toBeDefined();
        expect(await table(db, 'watering_events').where('sector_id', TEST_DELETE_SECTOR_ID).first()).toBeDefined();
        expect(await table(db, 'sectors_services').where('sector_id', TEST_DELETE_SECTOR_ID).first()).toBeDefined();

        await request(app)
            .delete(`/sectors/${TEST_DELETE_SECTOR_ID}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const sector = await table(db, 'sectors').where('id', TEST_DELETE_SECTOR_ID).first();
        expect(sector).toBeUndefined();

        const thesisSector = await table(db, 'theses_in_sectors').where('sector_id', TEST_DELETE_SECTOR_ID).first();
        expect(thesisSector).toBeUndefined();

        const thesis = await table(db, 'theses').where('id', thesisId).first();
        expect(thesis).toBeUndefined();

        const sectorDevice = await table(db, 'sectors_devices').where('sector_id', TEST_DELETE_SECTOR_ID).first();
        expect(sectorDevice).toBeUndefined();

        const device = await table(db, 'devices').where('id', TEST_DELETE_DEVICE_ASSOCIATED_ID).first();
        expect(device).toBeDefined();

        const wateringEvent = await table(db, 'watering_events').where('sector_id', TEST_DELETE_SECTOR_ID).first();
        expect(wateringEvent).toBeUndefined();

        const sectorService = await table(db, 'sectors_services').where('sector_id', TEST_DELETE_SECTOR_ID).first();
        expect(sectorService).toBeUndefined();

    });

    /**
     * Disabling a Farm and related entity
     */
     it('should disable a farm and its associations', async () => {
        const validTo = Math.floor(Date.now() / 1000);
        await request(app)
            .post(`/devices/${TEST_DELETE_DEVICE_ASSOCIATED_ID}/link`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetId: TEST_DELETE_FARM_ID, targetType: DeviceTargetType.FARM, validFrom: validTo - 1000 })
            .expect(200);

        expect(await table(db, 'sectors').where('farm_id', TEST_DELETE_FARM_ID).first()).toBeDefined();
        expect(await table(db, 'farms_devices').where('farm_id', TEST_DELETE_FARM_ID).andWhere(function () {
            this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')
        }).first()).toBeDefined();

        await request(app)
            .post(`/farms/${TEST_DELETE_FARM_ID}/disable`)
            .query({ validTo })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        await table(db, 'farms')
            .where('id', TEST_DELETE_FARM_ID)
            .first()
            .then(record => {
                expect(record.disabled_at).toBe(validTo)
            })
        expect(await table(db, 'sectors')
            .where('farm_id', TEST_DELETE_FARM_ID)
            .andWhere('disabled_at', '>', validTo)
            .first()).toBeUndefined()
        await table(db, 'farms_devices')
            .where('farm_id', TEST_DELETE_FARM_ID)
            .andWhere('valid_from', '<', validTo + 1)
            .andWhere(function () {
                this.where('valid_to', '>', validTo + 1).orWhereNull('valid_to')})
            .then(records => {
                expect(records).toHaveLength(0)
            })
     })

    /**
     * Deleting a Farm
     */
    it('should delete a farm and cascade deletion to its sectors and their theses', async () => {
        
        expect(await table(db, 'farms').where('id', TEST_DELETE_FARM_ID).first()).toBeDefined();
        const sectorId = (await table(db, 'sectors').where('farm_id', TEST_DELETE_FARM_ID).first())?.id
        expect(sectorId).toBeDefined();

        await request(app)
            .post(`/devices/${TEST_DELETE_DEVICE_ASSOCIATED_ID}/link`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ targetId: TEST_DELETE_FARM_ID, targetType: DeviceTargetType.FARM, validFrom: Math.floor(Date.now() / 1000) })
            .expect(200);

        expect(await table(db, 'farms_devices').where('farm_id', TEST_DELETE_FARM_ID).first()).toBeDefined();

        await request(app)
            .delete(`/farms/${TEST_DELETE_FARM_ID}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const farm = await table(db, 'farms').where('id', TEST_DELETE_FARM_ID).first();
        expect(farm).toBeUndefined();

        const sector = await table(db, 'sectors').where('id', sectorId).first();
        expect(sector).toBeUndefined();

        const farmDevice = await table(db, 'farms_devices').where('farm_id', TEST_DELETE_FARM_ID).first();
        expect(farmDevice).toBeUndefined();

        const device = await table(db, 'devices').where('id', TEST_DELETE_DEVICE_ASSOCIATED_ID).first();
        expect(device).toBeDefined();
    });

    /**
     * Disabling a Company and related entity
     */

    it('should disable a company and its associations', async () => {
        const validTo = Math.floor(Date.now() / 1000);
        await request(app).post(`/companies/${TEST_DELETE_COMPANY_ID}/disable`)
            .query({ validTo }).set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        await table(db, 'companies')
            .where('id', TEST_DELETE_COMPANY_ID)
            .first()
            .then(record => {
                expect(record.disabled_at).toBe(validTo)
            })

        expect(await table(db, 'farms').where('company_id', TEST_DELETE_COMPANY_ID).andWhere(function () {
            this.where('disabled_at', '>', validTo + 1).orWhereNull('disabled_at')
        }).first()).toBeUndefined()

        await table(db, 'devices').where('company_id', TEST_DELETE_COMPANY_ID).then(devices => {
            devices.forEach(device => {
                expect(device.disabled_at).toBeLessThanOrEqual(validTo)
            })
        })
    })

    /**
     * Deleting the Company
     */
    it('should delete a company and all its associated child entities', async () => {
        expect(await table(db, 'companies').where('id', TEST_DELETE_COMPANY_ID).first()).toBeDefined();
        const farmId = (await table(db, 'farms').where('company_id', TEST_DELETE_COMPANY_ID).first())?.id
        expect(farmId).toBeDefined();
        const sectorId = (await table(db, 'sectors').where('farm_id', farmId).first())?.id
        expect(sectorId).toBeDefined();
        const thesisId = (await table(db, 'theses_in_sectors').where('sector_id', sectorId).first())?.id
        expect(thesisId).toBeDefined();

        expect(await table(db, 'devices').where('company_id', TEST_DELETE_COMPANY_ID).first()).toBeDefined();

        await request(app)
            .delete(`/companies/${TEST_DELETE_COMPANY_ID}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        
        const company = await table(db, 'companies').where('id', TEST_DELETE_COMPANY_ID).first();
        expect(company).toBeUndefined();

        const farm = await table(db, 'farms').where('id', farmId).first();
        expect(farm).toBeUndefined();

        const sector = await table(db, 'sectors').where('id', sectorId).first();
        expect(sector).toBeUndefined();

        const thesis = await table(db, 'theses').where('id', thesisId).first();
        expect(thesis).toBeUndefined();

        const device = await table(db, 'devices').where('company_id', TEST_DELETE_COMPANY_ID).first();
        expect(device).toBeUndefined();
    });
});