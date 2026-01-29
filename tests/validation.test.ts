
import { test } from 'node:test';
import assert from 'node:assert';
import { CreateTripSchema } from '../src/lib/schemas';

test('CreateTripSchema validation', async (t) => {
  await t.test('validates correct data', () => {
    const data = {
      destination: 'Paris',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      budget: 1000,
      pax: 2,
      interests: 'Food, Art',
      travelStyle: 'Relaxed'
    };
    const result = CreateTripSchema.safeParse(data);
    assert.ok(result.success);
    if (result.success) {
        assert.strictEqual(result.data.pax, 2);
    }
  });

  await t.test('uses default pax if missing', () => {
    const data = {
      destination: 'Paris',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      interests: 'Food'
    };
    const result = CreateTripSchema.safeParse(data);
    assert.ok(result.success);
    if (result.success) {
      assert.strictEqual(result.data.pax, 1);
    }
  });

  await t.test('validates pax range (min 1)', () => {
    const data = {
      destination: 'Paris',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      interests: 'Food',
      pax: 0
    };
    const result = CreateTripSchema.safeParse(data);
    assert.ok(!result.success);
    const errors = result.error.flatten().fieldErrors;
    assert.ok(errors.pax);
  });

  await t.test('validates pax range (max 99)', () => {
    const data = {
      destination: 'Paris',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      interests: 'Food',
      pax: 100
    };
    const result = CreateTripSchema.safeParse(data);
    assert.ok(!result.success);
    const errors = result.error.flatten().fieldErrors;
    assert.ok(errors.pax);
  });

  await t.test('validates positive budget', () => {
    const data = {
      destination: 'Paris',
      startDate: '2024-01-01',
      endDate: '2024-01-05',
      interests: 'Food',
      budget: -100
    };
    const result = CreateTripSchema.safeParse(data);
    assert.ok(!result.success);
    const errors = result.error.flatten().fieldErrors;
    assert.ok(errors.budget);
  });
});
