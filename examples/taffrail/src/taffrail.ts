import axios from 'axios';

const TAFFRAIL_API_KEY = process.env.TAFFRAIL_API_KEY;

const TAFFRAIL_API_URL = 'https://engine.taffrail.com/api/rules';
const TAFFRAIL_ADVICE_API_URL = 'https://engine.taffrail.com/api/advice';

export async function getTaffrailRules(keyword: string, limit = 1, page = 0): Promise<{ url: string | null, headlines: string[] }> {
  const response = await axios.get(TAFFRAIL_API_URL, {
    params: { keyword, limit, page },
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${TAFFRAIL_API_KEY}`,
    },
  });
  // Logging for troubleshooting
  const apiKeySuffix = TAFFRAIL_API_KEY ? TAFFRAIL_API_KEY.slice(-6) : 'undefined';
  console.error(`[Taffrail] Response status: ${response.status}, API key (last 6): ...${apiKeySuffix}`);
  const rules = response.data?.data?.rules || [];
  console.error(`[Taffrail] Number of rules returned: ${rules.length}`);
  if (!rules.length) {
    return { url: null, headlines: [] };
  }
  const firstRule = rules[0];
  const adviceSetId = firstRule.adviceset?.id;
  const shareUrl = firstRule.links?.share || null;
  if (!adviceSetId) {
    return { url: shareUrl, headlines: [] };
  }
  console.error(`[Taffrail] Using adviceSetId: ${adviceSetId}`);
  // Call the Advice API for this adviceSetId
  const adviceResp = await axios.get(`${TAFFRAIL_ADVICE_API_URL}/${adviceSetId}`, {
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${TAFFRAIL_API_KEY}`,
      'Taffrail-Version': 2,
    },
  });
  console.error(`[Taffrail] Advice API response for adviceSetId ${adviceSetId}:`, JSON.stringify(adviceResp.data, null, 2));
  const adviceArr = adviceResp.data?.data?.advice || [];
  const headlines = adviceArr.map((a: any) => a.headline).filter((h: any) => h != null);
  // now shorten the share URL
  const shortUrlApiResp = await axios.post(`https://www.advice.taffrail.com/api/shorten`, {
    long_url: shareUrl,
    title: firstRule.opengraph?.title,
  });
  // this URL shortener API returns `advice.link`, but we are migrating to `taffrail.link`
  // so we need to change the value in the response manually. for now.
  const shortUrl = shortUrlApiResp.data.link.replace("advice.link", "taffrail.link");
  return { url: shortUrl, headlines };
} 