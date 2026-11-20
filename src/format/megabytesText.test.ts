import { megabytesText } from './megabytesText';

describe('megabytesText', () => {
  it('with bytes, rounds to whole megabytes', () => {
    const text = megabytesText(289795065);

    expect(text).toBe('290 MB');
  });
});
