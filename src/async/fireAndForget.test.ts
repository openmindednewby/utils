import { fireAndForget } from './fireAndForget';

describe('fireAndForget', () => {
  it('with a rejecting promise, attaches one catch handler that swallows the rejection', () => {
    const catchSpy = jest.fn();
    const stub = { catch: catchSpy } as unknown as Promise<unknown>;
    const expectedCalls = 1;
    const expectedHandlerResult = undefined;

    fireAndForget(stub);

    expect(catchSpy).toHaveBeenCalledTimes(expectedCalls);
    const handler = catchSpy.mock.calls[0][0] as (reason: unknown) => unknown;
    expect(handler(new Error('boom'))).toBe(expectedHandlerResult);
  });

  it('with a resolving promise, returns undefined synchronously', () => {
    const resolving = Promise.resolve(1);

    const result = fireAndForget(resolving);

    expect(result).toBeUndefined();
  });
});
