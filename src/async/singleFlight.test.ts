import { singleFlight } from './singleFlight';

async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('singleFlight', () => {
  it('with a second call while the first runs, runs the action once', () => {
    const action = jest.fn(async () => new Promise<void>(() => undefined));
    const run = singleFlight(action);

    run('a');
    run('b');

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('after the first call finishes, runs the action again', async () => {
    const action = jest.fn(async () => Promise.resolve());
    const run = singleFlight(action);
    run('a');
    await settle();

    run('b');

    expect(action).toHaveBeenCalledTimes(2);
  });

  it('with an action that fails, runs again afterwards', async () => {
    const action = jest.fn(async () => Promise.reject(new Error('down')));
    const run = singleFlight(action);
    run('a');
    await settle();

    run('b');

    expect(action).toHaveBeenCalledTimes(2);
  });
});
