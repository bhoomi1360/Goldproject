import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { db } from '../src/db/database.js';

describe('Gold Loan API Integration Tests', () => {
  beforeEach(() => {
    // Reset test database leads between tests if needed, or use unique phone numbers
  });

  describe('GET /api/v1/loan-schemes', () => {
    it('returns seeded active plans with max LTV capped at 75%', async () => {
      const res = await request(app).get('/api/v1/loan-schemes');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const emiPlan = res.body.data.find((p: any) => p.id === 'PLAN_EMI_01');
      const bulletPlan = res.body.data.find((p: any) => p.id === 'PLAN_BULLET_01');

      expect(emiPlan).toBeDefined();
      expect(emiPlan.maxLtv).toBe(0.75);
      expect(emiPlan.annualInterestRate).toBe(0.105);

      expect(bulletPlan).toBeDefined();
      expect(bulletPlan.maxLtv).toBe(0.70);
      expect(bulletPlan.annualInterestRate).toBe(0.12);

      // Verify no plan exceeds 0.75 maxLtv
      res.body.data.forEach((p: any) => {
        expect(p.maxLtv).toBeLessThanOrEqual(0.75);
      });
    });
  });

  describe('POST /api/v1/quotes (Pure Calculation, No DB Write)', () => {
    it('Test Case 1 & 2: 45 g net, 22K jewellery produces exact quotes for EMI and Bullet', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
        });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.pureGoldGrams).toBe(41.25);
      expect(data.goldValueRupees).toBe(288750);

      const emiQuote = data.quotes.find((q: any) => q.planId === 'PLAN_EMI_01');
      expect(emiQuote.eligibleLoanRupees).toBe(216562);

      const bulletQuote = data.quotes.find((q: any) => q.planId === 'PLAN_BULLET_01');
      expect(bulletQuote.eligibleLoanRupees).toBe(202125);
    });

    it('Test Case 3: 10 g net, 18K jewellery produces pure 7.5g, value ₹52,500, loan ₹39,375', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          grossWeightGrams: 10,
          netWeightGrams: 10,
          karat: 18,
        });

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.pureGoldGrams).toBe(7.5);
      expect(data.goldValueRupees).toBe(52500);

      const emiQuote = data.quotes.find((q: any) => q.planId === 'PLAN_EMI_01');
      expect(emiQuote.eligibleLoanRupees).toBe(39375);
    });

    it('Test Case 4: net 52g > gross 50g returns 400 with field error on netWeightGrams', async () => {
      const res = await request(app)
        .post('/api/v1/quotes')
        .send({
          grossWeightGrams: 50,
          netWeightGrams: 52,
          karat: 22,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.fields)).toBe(true);
      const fieldError = res.body.error.fields.find((f: any) => f.field === 'netWeightGrams');
      expect(fieldError).toBeDefined();
    });
  });

  describe('POST /api/v1/leads (Lead Submission & Validation)', () => {
    it('Test Case 5a: Invalid mobile starting with 5 (e.g. 5876543210) returns 400', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          fullName: 'Ramesh Kumar',
          mobileNumber: '5876543210',
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const fieldError = res.body.error.fields.find((f: any) => f.field === 'mobileNumber');
      expect(fieldError).toBeDefined();
    });

    it('Test Case 5b: Invalid short mobile (98765) returns 400 with field error on mobileNumber', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          fullName: 'Ramesh Kumar',
          mobileNumber: '98765',
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      const fieldError = res.body.error.fields.find((f: any) => f.field === 'mobileNumber');
      expect(fieldError).toBeDefined();
    });

    it('Test Case 1 (Lead Filing): Valid submission returns 201 with applicationId and masked mobile', async () => {
      const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          fullName: 'Ananya Sharma',
          mobileNumber: mobile,
          grossWeightGrams: 45,
          netWeightGrams: 45,
          karat: 22,
          planId: 'PLAN_EMI_01',
        });

      expect(res.status).toBe(201);
      expect(res.body.applicationId).toBeDefined();
      expect(res.body.applicationId).toMatch(/^GL-\d+$/);
      expect(res.body.data.eligibleLoanRupees).toBe(216562);
      expect(res.body.data.mobileNumber).toMatch(/^98\d\dXXXX\d\d$/);
    });

    it('Test Case 6: Same mobile again within 7 days returns 409 Conflict with existing applicationId', async () => {
      const mobile = `99${Math.floor(10000000 + Math.random() * 90000000)}`;

      // First application -> 201
      const firstRes = await request(app)
        .post('/api/v1/leads')
        .send({
          fullName: 'Vikram Singh',
          mobileNumber: mobile,
          grossWeightGrams: 20,
          netWeightGrams: 20,
          karat: 22,
          planId: 'PLAN_BULLET_01',
        });
      expect(firstRes.status).toBe(201);
      const existingId = firstRes.body.applicationId;

      // Second application with same mobile -> 409
      const secondRes = await request(app)
        .post('/api/v1/leads')
        .send({
          fullName: 'Vikram Singh',
          mobileNumber: mobile,
          grossWeightGrams: 30,
          netWeightGrams: 30,
          karat: 24,
          planId: 'PLAN_EMI_01',
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.error).toBeDefined();
      expect(secondRes.body.error.code).toBe('DUPLICATE_APPLICATION');
      expect(secondRes.body.error.existingApplicationId).toBe(existingId);
    });

    it('Plan id must exist, else returns 404', async () => {
      const mobile = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
      const res = await request(app)
        .post('/api/v1/leads')
        .send({
          fullName: 'Sneha Patel',
          mobileNumber: mobile,
          grossWeightGrams: 20,
          netWeightGrams: 20,
          karat: 22,
          planId: 'NON_EXISTENT_PLAN',
        });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('PLAN_NOT_FOUND');
    });

    it('Test Case 7 (BONUS): Same request with same Idempotency-Key returns original 201 replayed', async () => {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random()}`;
      const mobile = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
      const payload = {
        fullName: 'Rajesh Verma',
        mobileNumber: mobile,
        grossWeightGrams: 25,
        netWeightGrams: 25,
        karat: 22,
        planId: 'PLAN_EMI_01',
      };

      // Initial request
      const res1 = await request(app)
        .post('/api/v1/leads')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res1.status).toBe(201);
      const appId1 = res1.body.applicationId;

      // Replay identical request with same key
      const res2 = await request(app)
        .post('/api/v1/leads')
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res2.status).toBe(201);
      expect(res2.body.applicationId).toBe(appId1);
      expect(res2.headers['x-cache-lookup']).toBe('HIT');
    });

    it('Test Case 8 (BONUS): 2 parallel requests with same new mobile -> Exactly one 201 and one 409', async () => {
      const mobile = `96${Math.floor(10000000 + Math.random() * 90000000)}`;
      const payload = {
        fullName: 'Parallel Tester',
        mobileNumber: mobile,
        grossWeightGrams: 15,
        netWeightGrams: 15,
        karat: 22,
        planId: 'PLAN_BULLET_01',
      };

      const [p1, p2] = await Promise.all([
        request(app).post('/api/v1/leads').send(payload),
        request(app).post('/api/v1/leads').send(payload),
      ]);

      const statuses = [p1.status, p2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });
  });

  describe('GET /api/v1/leads (Admin Listing & Masking)', () => {
    it('returns leads list with masked mobile numbers (9876XXXX10) and newest first', async () => {
      const res = await request(app).get('/api/v1/leads');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      if (res.body.data.length > 0) {
        const lead = res.body.data[0];
        expect(lead.mobileNumber).toMatch(/^[6-9]\d{2,3}X+.*\d{2}$/);
      }
    });
  });
});
