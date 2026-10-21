import { fireAndForget } from './fireAndForget';

describe('fireAndForget', () => {
  it('with a rejecting promise, swallows the rejection', async () => {
    const rejecting = Promise.reject(new Error('boom'));

    fireAndForget(rejecting);

    await expect(rejecting.catch(() => 'handled')).resolves.toBe('handled');
  });

  it('with a resolving promise, returns undefined synchronously', () => {
    const resolving = Promise.resolve(1);

    const result = fireAndForget(resolving);

    expect(result).toBeUndefined();
  });
});
