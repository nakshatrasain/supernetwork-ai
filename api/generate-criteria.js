export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ikigai, skills, intent, workingStyle, cvData } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Based on this person's profile, suggest ideal matching criteria for finding cofounders, teammates, or clients. Return ONLY valid JSON:
{
  "ideal_skills": ["skill1", "skill2"],
  "ideal_traits": ["trait1", "trait2"],
  "complementary_strengths": ["strength1", "strength2"],
  "matching_preferences": "brief description"
}

Profile:
Ikigai: ${JSON.stringify(ikigai)}
Skills: ${skills.join(', ')}
Intent: ${intent}
Working Style: ${workingStyle}
${cvData ? `CV Data: ${JSON.stringify(cvData)}` : ''}`
        }]
      })
    });

    const data = await response.json();
    const jsonMatch = data.content[0].text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const criteria = JSON.parse(jsonMatch[0]);
      return res.status(200).json({ success: true, data: criteria });
    } else {
      return res.status(200).json({ success: false, error: 'Could not generate criteria' });
    }
  } catch (error) {
    console.error('Criteria generation error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
