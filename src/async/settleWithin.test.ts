import { rejectWithin, settleWithin } from './settleWithin';

describe('settleWithin', () => {
  it('with work that settles in time, resolves with its result', async () => {
    const work = Promise.resolve('done');

    const result = await settleWithin(work, 50, 'fallback');

    expect(result).toBe('done');
  });

  it('with work that never settles, resolves with the fallback', async () => {
    const work = new Promise<string>(() => undefined);

    const result = await settleWithin(work, 10, 'fallback');

    expect(result).toBe('fallback');
  });

  it('with work that rejects in time, rejects with its error', async () => {
    const work = Promise.reject(new Error('boom'));

    const outcome = settleWithin(work, 50, 'fallback');

    await expect(outcome).rejects.toThrow('boom');
  });
});

describe('rejectWithin', () => {
  it('with work that settles in time, resolves with its result', async () => {
    const work = Promise.resolve('done');

    const result = await rejectWithin(work, 50, () => new Error('late'));

    expect(result).toBe('done');
  });

  it('with work that never settles, rejects with the made error', async () => {
    const work = new Promise<string>(() => undefined);

    const outcome = rejectWithin(work, 10, () => new Error('late'));

    await expect(outcome).rejects.toThrow('late');
  });

  it('with work that rejects in time, rejects with its error', async () => {
    const work = Promise.reject(new Error('boom'));

    const outcome = rejectWithin(work, 50, () => new Error('late'));

    await expect(outcome).rejects.toThrow('boom');
  });
});
