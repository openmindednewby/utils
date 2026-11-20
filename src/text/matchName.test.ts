import { matchName } from './matchName';

const NAMES = ['Acme Ltd', 'Acme Holdings', 'Beta Co'];

describe('matchName', () => {
  it('with a name equal ignoring case, returns that name', () => {
    const name = matchName(NAMES, ' acme ltd ');

    expect(name).toBe('Acme Ltd');
  });

  it('with text inside exactly one name, returns that name', () => {
    const name = matchName(NAMES, 'beta');

    expect(name).toBe('Beta Co');
  });

  it('with text inside several names, returns null', () => {
    const name = matchName(NAMES, 'acme');

    expect(name).toBeNull();
  });

  it('with text inside no name, returns null', () => {
    const name = matchName(NAMES, 'gamma');

    expect(name).toBeNull();
  });
});
