// api/badge.js
export default async function handler(req, res) {
  try {
    const { project } = req.query; // Notion pageId
    const token = process.env.NOTION_TOKEN;

    if (!project) return res.status(400).send('Missing ?project');
    if (!token)   return res.status(500).send('NOTION_TOKEN missing');

    const resp = await fetch(`https://api.notion.com/v1/pages/${project}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': '2022-06-28'
      }
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).send(`Notion error ${resp.status}:\n${text}`);
    }

    const page  = await resp.json();
    const props = page.properties || {};

    const progressRaw = props['Progress %']?.number ?? props['Progress']?.number ?? 0;
    const progress    = Math.max(0, Math.min(100, Math.round(progressRaw)));
    const stage       = props['Stage']?.select?.name ?? 'Planning';
    const mood        = props['🔥']?.select?.name ?? '';

    const color = progress >= 80 ? '#22c55e'
                : progress >= 50 ? '#f59e0b'
                : '#ef4444';
    const emoji = stage === 'Push'       ? '⚔️'
                : stage === 'Cool-down' ? '💤'
                : '🚀';

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.status(200).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="220" height="40" role="img" aria-label="Progress Badge">
        <rect width="220" height="40" rx="6" fill="#1f2937"/>
        <text x="20" y="25" font-size="14" fill="#fff" font-family="sans-serif">
          ${emoji} ${stage} (${progress}%)
        </text>
        <rect x="10" y="28" width="200" height="6" rx="3" fill="#374151"/>
        <rect x="10" y="28" width="${2 * progress}" height="6" rx="3" fill="${color}"/>
        <text x="210" y="25" font-size="14" fill="#fff" text-anchor="end" font-family="sans-serif">
          ${mood}
        </text>
      </svg>
    `);
  } catch (err) {
    res.status(500).send('Server error: ' + err.message);
  }
}
