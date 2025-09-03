import { parseM3UContent, parseM3UFromUrl } from '../utils/m3uParser';

describe('m3uParser.parseM3UContent', () => {
  it('parses a valid minimal M3U with logo and group', () => {
    const content = `#EXTM3U\n#EXTINF:-1 tvg-logo="http://logo/img.png" group-title="News",Channel One\nhttp://example.com/stream1.m3u8`;
    const { channels, errors } = parseM3UContent(content);

    expect(errors).toHaveLength(0);
    expect(channels).toHaveLength(1);
    expect(channels[0]).toEqual(
      expect.objectContaining({
        name: 'Channel One',
        url: 'http://example.com/stream1.m3u8',
        logo: 'http://logo/img.png',
        category: 'News',
      })
    );
  });

  it('returns an error for missing #EXTM3U header', () => {
    const content = `#NOTM3U\n#EXTINF:-1,Channel\nhttp://example.com/stream.m3u8`;
    const { channels, errors } = parseM3UContent(content);
    expect(channels).toHaveLength(0);
    expect(errors.some(e => e.includes('Missing #EXTM3U'))).toBe(true);
  });

  it('reports error when URL appears without prior EXTINF', () => {
    const content = `#EXTM3U\nhttp://example.com/stream.m3u8`;
    const { channels, errors } = parseM3UContent(content);
    expect(channels).toHaveLength(0);
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});

describe('m3uParser.parseM3UFromUrl', () => {
  const g: any = global;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches and parses content on success', async () => {
    const sample = `#EXTM3U\n#EXTINF:-1,Test\nhttp://e/1.m3u8`;
    g.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(sample) });

    const res = await parseM3UFromUrl('http://example.com/list.m3u');
    expect(g.fetch).toHaveBeenCalled();
    expect(res.channels).toHaveLength(1);
    expect(res.errors).toHaveLength(0);
  });

  it('returns error array on non-OK response', async () => {
    g.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
    const res = await parseM3UFromUrl('http://example.com/missing.m3u');
    expect(res.channels).toHaveLength(0);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});

