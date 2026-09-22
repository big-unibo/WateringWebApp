import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { loginUser, setupDb, table } from '../utils.js';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../const.js';

describe('Optimal State Assignment Integration Test', () => {
    let db: Awaited<ReturnType<typeof setupDb>>['db'];
    let container: Awaited<ReturnType<typeof setupDb>>['container'];
    let app: Awaited<typeof import('../../src/app.js')>['app'];
    let authToken: string;

    const validFrom =
        new Date(2025, 1, 25, 9, 0, 0).valueOf() / 1000;

    const validTo =
        new Date(2025, 1, 26, 9, 0, 0).valueOf() / 1000;

    const TEST_THESIS_ID = 1;
    const TEST_IMAGE_THESIS_ID = 3;
    const TEST_IMAGE_TIMESTAMP = 1737550800;
    const TEST_EXISTING_OPTIMAL_STATE = 2;

    const STOP_THRESHOLD = 15;
    const WET_BOUND = 40;
    const DRY_BOUND = 10;
    const OPTIMAL_TOLERANCE = 2

    const OPTIMAL_PROFILE = [
        {
            x: 0,
            y: 20,
            z: 0,
            value: 31,
            weight: 1,
        },
        {
            x: 40,
            y: 60,
            z: 0,
            value: 36,
            weight: 1,
        },
    ];

    beforeAll(async () => {
        const setup = await setupDb();

        db = setup.db;
        container = setup.container;

        app = (await import('../../src/app.js')).app;

        authToken = await loginUser(
            app,
            ADMIN_EMAIL,
            ADMIN_PASSWORD,
        );
    });

    afterAll(async () => {
        if (db) {
            await db.destroy();
        }

        if (container) {
            await container.stop();
        }
    });

    it('should assign an existing optimal to a thesis', async () => {
        await request(app)
            .put(`/theses/${TEST_THESIS_ID}/setOptimalState`)
            .set('Authorization', `Bearer ${authToken}`)
            .query({
                optimalProfileId: TEST_EXISTING_OPTIMAL_STATE,
                validFrom,
            })
            .send({
                stopThreshold: STOP_THRESHOLD,
                optimalWetBound: WET_BOUND,
                optimalDryBound: DRY_BOUND,
                optimalTolerance: OPTIMAL_TOLERANCE,
            })
            .expect(200);

        const thesisGrid = await table<{ device_id: number }>(db, 'theses_all_signals')
            .where('thesis_id', TEST_THESIS_ID)
            .andWhere('device_type', 'SOIL_MOISTURE_GRID')
            .andWhere(function () {
                this.where('valid_to', '>', validFrom)
                    .orWhereNull('valid_to');
            })
            .andWhere('valid_from', '<', validFrom)
            .select('device_id')
            .first();

        expect(thesisGrid?.device_id).toBeDefined();

        const record = await table<{ optimal_profile_id: number, optimal_tolerance: number, optimal_wet_bound: number, optimal_dry_bound: number }>(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(
                'optimal_profile_id',
                TEST_EXISTING_OPTIMAL_STATE,
            )
            .andWhere(function () {
                this.where('valid_to', '>', validFrom)
                    .orWhereNull('valid_to');
            })
            .andWhere('valid_from', validFrom)
            .first();

        expect(record).toBeDefined();
        expect(record?.optimal_tolerance).toBeCloseTo(OPTIMAL_TOLERANCE)
        expect(record?.optimal_wet_bound).toBeCloseTo(WET_BOUND)
        expect(record?.optimal_dry_bound).toBeCloseTo(DRY_BOUND)


        const oldAssignments = await table(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where('valid_to', '>', validFrom + 1)
                    .orWhereNull('valid_to');
            })
            .andWhere('valid_from', '<', validFrom + 1);

        expect(oldAssignments).toHaveLength(1);
    });

    it('should assign an existing interpolated profile to a thesis', async () => {
        const profileValidFrom = validFrom + 86400;

        await request(app)
            .put(`/theses/${TEST_THESIS_ID}/setOptimalState`)
            .set('Authorization', `Bearer ${authToken}`)
            .query({
                thesisId: TEST_IMAGE_THESIS_ID,
                imageTimestamp: TEST_IMAGE_TIMESTAMP,
                validFrom: profileValidFrom,
            })
            .send({
                stopThreshold: STOP_THRESHOLD,
                optimalWetBound: WET_BOUND,
                optimalDryBound: DRY_BOUND,
                optimalTolerance: OPTIMAL_TOLERANCE,
            })
            .expect(200);

        const thesisGrid = await table<{ device_id: number }>(db, 'theses_all_signals')
            .where('thesis_id', TEST_THESIS_ID)
            .andWhere('device_type', 'SOIL_MOISTURE_GRID')
            .andWhere(function () {
                this.where('valid_to', '>', profileValidFrom)
                    .orWhereNull('valid_to');
            })
            .andWhere('valid_from', '<', profileValidFrom)
            .select('device_id')
            .first();

        expect(thesisGrid?.device_id).toBeDefined();

        const undefinedOptimal = await table(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where(
                    'valid_to',
                    '>',
                    profileValidFrom - 1,
                ).orWhereNull('valid_to');
            })
            .andWhere(
                'valid_from',
                profileValidFrom - 1,
            )
            .first();

        expect(undefinedOptimal).toBeUndefined();

        const record = await table<{ optimal_profile_id: number, optimal_tolerance: number, optimal_wet_bound: number, optimal_dry_bound: number }>(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where(
                    'valid_to',
                    '>',
                    profileValidFrom,
                ).orWhereNull('valid_to');
            })
            .andWhere('valid_from', profileValidFrom)
            .first();

        expect(record).toBeDefined();
        expect(record?.optimal_tolerance).toBeCloseTo(OPTIMAL_TOLERANCE)
        expect(record?.optimal_wet_bound).toBeCloseTo(WET_BOUND)
        expect(record?.optimal_dry_bound).toBeCloseTo(DRY_BOUND)

        const optimalProfile = await table(db, 'optimal_profiles')
            .where('profile_id', record!.optimal_profile_id);

        expect(optimalProfile).toBeDefined();

        const oldAssignments = await table(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where(
                    'valid_to',
                    '>',
                    profileValidFrom + 1,
                ).orWhereNull('valid_to');
            })
            .andWhere(
                'valid_from',
                '<',
                profileValidFrom + 1,
            );

        expect(oldAssignments).toHaveLength(1);
    });

    it('should assign a custom profile to a thesis', async () => {
        const profileValidFrom = validFrom + 2 * 86400;

        await request(app)
            .put(`/theses/${TEST_THESIS_ID}/setOptimalState`)
            .set('Authorization', `Bearer ${authToken}`)
            .query({
                validFrom: profileValidFrom,
            })
            .send({
                stopThreshold: STOP_THRESHOLD,
                optimalWetBound: WET_BOUND,
                optimalDryBound: DRY_BOUND,
                optimalTolerance: OPTIMAL_TOLERANCE,
                optimalProfile: OPTIMAL_PROFILE,
            })
            .expect(200);

        const thesisGrid = await table<{ device_id: number }>(db, 'theses_all_signals')
            .where('thesis_id', TEST_THESIS_ID)
            .andWhere('device_type', 'SOIL_MOISTURE_GRID')
            .andWhere(function () {
                this.where('valid_to', '>', profileValidFrom)
                    .orWhereNull('valid_to');
            })
            .andWhere('valid_from', '<', profileValidFrom)
            .select('device_id')
            .first();

        expect(thesisGrid?.device_id).toBeDefined();

        const undefinedOptimal = await table(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where(
                    'valid_to',
                    '>',
                    profileValidFrom - 1,
                ).orWhereNull('valid_to');
            })
            .andWhere(
                'valid_from',
                profileValidFrom - 1,
            )
            .first();

        expect(undefinedOptimal).toBeUndefined();

        const record = await table<{ optimal_profile_id: number, optimal_tolerance: number, optimal_wet_bound: number, optimal_dry_bound: number }>(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where(
                    'valid_to',
                    '>',
                    profileValidFrom,
                ).orWhereNull('valid_to');
            })
            .andWhere('valid_from', profileValidFrom)
            .first();

        expect(record).toBeDefined();
        expect(record?.optimal_tolerance).toBeCloseTo(OPTIMAL_TOLERANCE)
        expect(record?.optimal_wet_bound).toBeCloseTo(WET_BOUND)
        expect(record?.optimal_dry_bound).toBeCloseTo(DRY_BOUND)


        const optimalProfile = await table(db, 'optimal_profiles')
            .where('profile_id', record!.optimal_profile_id);

        expect(optimalProfile).toBeDefined();

        const oldAssignments = await table(
            db,
            'grid_optimal_profile_assignment',
        )
            .where('grid_id', thesisGrid!.device_id)
            .andWhere(function () {
                this.where(
                    'valid_to',
                    '>',
                    profileValidFrom + 1,
                ).orWhereNull('valid_to');
            })
            .andWhere(
                'valid_from',
                '<',
                profileValidFrom + 1,
            );

        expect(oldAssignments).toHaveLength(1);
    });
});