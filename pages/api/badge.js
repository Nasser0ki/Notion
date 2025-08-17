// pages/api/badge.js

export default async function handler(req, res) {
  try {
    const { project } = req.query; // Notion pageId
    const token = process.env.NOTION_TOKEN;

    if (!project) return res.status(400).send('Missing ?project');
    if (!token)   return res.status(500).send('NOTION_TOKEN missing');

    // 1) جيب خصائص الصفحة من Notion
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

    const page = await resp.json();
    const props = page.properties || {};

    // 2) استخرج progress + stage + mood (تأكد من أسماء الحقول عندك في Notion)
    const progressRaw = props['Progress %']?.number ?? props['Progress']?.number ?? 0;
    const progress    = Math.max(0, Math.min(100, Math.round(progressRaw)));
    const stage       = props['Stage']?.select?.name ?? 'Planning';
    const mood        = props['🔥']?.select?.name ?? '';

    // 3) حدّد الألوان/الإيموجيز
    const color = progress >= 80 ? '#22c55e'
                : progress >= 50 ? '#f59e0b'
                : '#ef4444';
    const emoji = stage === 'Push'       ? '⚔️'
                : stage === 'Cool-down' ? '💤'
                : '🚀';

    // 4) ارجع SVG
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.status(200).send(`
<svg width="560" height="68" xmlns="http://www.w3.org/2000/svg">
  <rect rx="12" ry="12" width="560" height="68" fill="#0b0f14"/>
  <text x="20" y="26" fill="#94a3b8" font-size="14" font-family="ui-sans-serif,system-ui">
    HQ — ${stage} ${emoji}
  </text>
  <rect x="20" y="36" width="520" height="14" fill="#1f2937" rx="7"/>
  <rect x="20" y="36" width="${Math.max(0, Math.min(520, 5.2*progress))}" height="14" fill="${color}" rx="7"/>
  <text x="500" y="26" fill="#cbd5e1" font-size="14" text-anchor="end" font-family="ui-sans-serif">
    Progress: ${progress}% ${mood}
  </text>
</svg>`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
}
