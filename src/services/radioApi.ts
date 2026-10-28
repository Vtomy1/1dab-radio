import { Station } from '../types/radio';

// Radio Browser API has multiple mirrors
const API_MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
];

export async function searchGlobalStations(query: string, limit = 24): Promise<Station[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  for (const mirror of API_MIRRORS) {
    try {
      const url = `${mirror}/json/stations/search?name=${encodeURIComponent(
        cleanQuery
      )}&limit=${limit}&hidebroken=true&order=clickcount&reverse=true`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AetherDABRadio/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      if (!Array.isArray(data)) continue;

      return data.map((item: any): Station => {
        const codecRaw = (item.codec || 'MP3').toUpperCase();
        let codec: Station['codec'] = 'MP3';
        if (codecRaw.includes('AAC')) codec = 'AAC+';
        else if (codecRaw.includes('MP2')) codec = 'MP2';

        // Derive simulated DAB ensemble and block from country and tags
        const countryCode = (item.countrycode || 'WW').toUpperCase();
        const block = getBlockForCountry(countryCode);
        const ensembleName = item.state ? `${item.state} DAB+ Mux` : `${item.country || 'Global'} Digital DAB+`;

        return {
          id: `rb-${item.stationuuid || Math.random().toString(36).substring(2, 9)}`,
          name: item.name || 'Unnamed Radio',
          streamUrl: item.url_resolved || item.url,
          ensemble: ensembleName,
          block: block,
          frequency: getFrequencyForBlock(block),
          bitrate: item.bitrate || 128,
          codec: codec,
          country: countryCode,
          countryName: item.country || 'Worldwide',
          genre: (item.tags || 'General Radio').split(',').slice(0, 3).join(' · '),
          homepage: item.homepage,
          logo: item.favicon || undefined,
        };
      });
    } catch {
      // Try next mirror
      continue;
    }
  }

  return [];
}

function getBlockForCountry(country: string): string {
  const blocks: Record<string, string> = {
    GB: '12B',
    DE: '5C',
    FR: '7C',
    CH: '12C',
    IT: '12D',
    NO: '13F',
    DK: '11C',
    AU: '9B',
    NL: '11C',
    BE: '12A',
  };
  return blocks[country] || '11A';
}

function getFrequencyForBlock(block: string): string {
  const freqMap: Record<string, string> = {
    '5C': '178.352 MHz',
    '7C': '192.352 MHz',
    '9B': '204.640 MHz',
    '10B': '211.648 MHz',
    '11A': '216.928 MHz',
    '11C': '220.352 MHz',
    '11D': '222.064 MHz',
    '12A': '223.936 MHz',
    '12B': '225.648 MHz',
    '12C': '227.360 MHz',
    '12D': '229.072 MHz',
  };
  return freqMap[block] || '225.648 MHz';
}
