import { loadHtml } from '../src/load/load';

describe('Test Load Html', () => {
  it('Test Get Html', async () => {
    const result = await loadHtml('http://localhost:3001', 'esbuild');
    expect(result.html).not.toBeUndefined();
  });
});
