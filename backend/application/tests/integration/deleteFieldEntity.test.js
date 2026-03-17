import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { loginUser, setupDb, table } from '../utils';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../const';

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
     * SETUP: Create a full hierarchy
     */
    it('should setup a full hierarchy for cascading tests', async () => {
        // Create Company
        const compRes = await request(app)
            .post('/companies/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Cascade Parent Corp' });
        companyId = compRes.body.id;

        // Create Farm
        const farmRes = await request(app)
            .post('/farms/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Cascade Farm', companyId });
        farmId = farmRes.body.id;

        // Create Sector
        const sectorRes = await request(app)
            .post(`/farms/${farmId}/createSector`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Cascade Sector', culture: 'Wheat' });
        sectorId = sectorRes.body.id;

        // Create Thesis
        const thesisRes = await request(app)
            .post(`/sectors/${sectorId}/createThesis`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Cascade Thesis'});
        thesisId = thesisRes.body.id;

        expect(thesisId).toBeDefined();
    });

    /**
     * TEST: Deleting a leaf node (Thesis)
     */
    it('should delete a thesis without affecting parent entities', async () => {
        await request(app)
            .delete(`/theses/${thesisId}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        // Thesis should be gone
        const thesis = await table(db, 'theses').where('id', thesisId).first();
        expect(thesis).toBeUndefined();

        // Sector should still exist
        const sector = await table(db, 'sectors').where('id', sectorId).first();
        expect(sector).toBeDefined();
    });

    /**
     * TEST: Cascading Effect (Deleting a Farm)
     */
    it('should delete a farm and cascade deletion to its sectors and their theses', async () => {
        // Re-create a thesis for the sector first since we deleted it above
        const thesisRes = await request(app)
            .post(`/sectors/${sectorId}/createThesis`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'New Cascade Thesis'});
        const newThesisId = thesisRes.body.id;

        // Delete the Farm
        await request(app)
            .delete(`/farms/${farmId}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        // CHECK CASCADE: Farm, Sector, and Thesis should all be gone
        const farm = await table(db, 'farms').where('id', farmId).first();
        const sector = await table(db, 'sectors').where('id', sectorId).first();
        const thesis = await table(db, 'theses').where('id', newThesisId).first();

        expect(farm).toBeUndefined();
        expect(sector).toBeUndefined();
        expect(thesis).toBeUndefined();
    });

    /**
     * TEST: Deleting the top-level Company
     */
    it('should delete a company and all its associated child entities', async () => {
        // Setup new chain for company test
        const compRes = await request(app).post('/companies/create').set('Authorization', `Bearer ${authToken}`).send({ name: 'Final Corp' });
        const cId = compRes.body.id;
        const fRes = await request(app).post('/farms/create').set('Authorization', `Bearer ${authToken}`).send({ name: 'Final Farm', companyId: cId });
        const fId = fRes.body.id;

        // Delete Company
        await request(app)
            .delete(`/companies/${cId}/delete`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        // Verify company and farm are gone
        const companyRecord = await table(db, 'companies').where('id', cId).first();
        const farmRecord = await table(db, 'farms').where('id', fId).first();

        expect(companyRecord).toBeUndefined();
        expect(farmRecord).toBeUndefined();
    });
});