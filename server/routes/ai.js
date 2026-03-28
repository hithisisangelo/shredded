const express = require('express');
const { getDb } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function getAnthropicClient(apiKey) {
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey });
}

function getUserApiKey(userId) {
  const db = getDb();
  const row = db.prepare("SELECT value FROM user_settings WHERE user_id = ? AND key = 'anthropic_api_key'").get(userId);
  return (row && row.value) || process.env.ANTHROPIC_API_KEY || null;
}

router.post('/generate-program', async (req, res) => {
  try {
    const apiKey = getUserApiKey(req.userId);
    if (!apiKey) return res.status(400).json({ error: 'Anthropic API key not configured. Add it in Settings.' });

    const { goal, days_per_week, level, include_cardio, cardio_type, equipment } = req.body;

    const prompt = `You are an expert personal trainer. Generate a complete 4-week progressive workout program based on these parameters:
- Goal: ${goal || 'muscle gain'}
- Training days per week: ${days_per_week || 4}
- Fitness level: ${level || 'intermediate'}
- Include cardio: ${include_cardio ? 'Yes, type: ' + (cardio_type || 'moderate') : 'No'}
- Available equipment: ${equipment || 'full gym'}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "weeks": [
    {
      "week": 1,
      "theme": "Foundation",
      "days": [
        {
          "day": "Monday",
          "name": "Push Day - Chest/Shoulders/Triceps",
          "type": "strength",
          "exercises": [
            {
              "name": "Barbell Bench Press",
              "sets": 4,
              "reps": "8-10",
              "rest": "90s",
              "notes": "Focus on full range of motion"
            }
          ]
        },
        {
          "day": "Wednesday",
          "name": "Rest Day",
          "type": "rest",
          "exercises": []
        }
      ]
    }
  ]
}

Include all ${days_per_week} training days per week plus rest days. Make weeks progressively harder (increase sets/weight week over week). Week 1 is foundation, Week 2 adds volume, Week 3 is peak intensity, Week 4 is deload. Each training day should have 4-7 exercises with appropriate sets and reps for the goal. Include warm-up suggestions in notes where relevant.`;

    const client = getAnthropicClient(apiKey);
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    let programData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      programData = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    res.json({ program: programData });
  } catch (err) {
    console.error('AI generate-program error:', err);
    if (err.status === 401) return res.status(400).json({ error: 'Invalid Anthropic API key' });
    res.status(500).json({ error: 'Failed to generate program: ' + err.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const apiKey = getUserApiKey(req.userId);
    if (!apiKey) return res.status(400).json({ error: 'Anthropic API key not configured. Add it in Settings.' });

    const { messages, userContext } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array required' });

    const db = getDb();
    const settings = db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(req.userId);
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    const systemPrompt = `You are SHREDDED AI, a knowledgeable and motivating personal trainer and nutrition coach.
You help users achieve their fitness goals through evidence-based advice on training, nutrition, recovery, and mindset.
Be encouraging, specific, and practical. Keep responses concise but informative.

User context:
- Calorie goal: ${settingsMap.calorie_goal || 'not set'} kcal/day
- Protein goal: ${settingsMap.protein_goal || 'not set'}g/day
- Goal type: ${settingsMap.goal_type || 'general fitness'}
${userContext ? '- ' + userContext : ''}

Always prioritize safety and recommend consulting healthcare professionals for medical concerns.`;

    const client = getAnthropicClient(apiKey);
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    res.json({ reply: message.content[0].text });
  } catch (err) {
    console.error('AI chat error:', err);
    if (err.status === 401) return res.status(400).json({ error: 'Invalid Anthropic API key' });
    res.status(500).json({ error: 'AI chat failed: ' + err.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const apiKey = getUserApiKey(req.userId);
    if (!apiKey) return res.status(400).json({ error: 'Anthropic API key not configured.' });

    const db = getDb();
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const recentWorkouts = db.prepare(
      "SELECT date, day_name, completed, duration_minutes FROM workout_logs WHERE user_id = ? AND date >= ? ORDER BY date DESC"
    ).all(req.userId, weekAgo);

    const nutritionHistory = db.prepare(
      `SELECT date, SUM(calories * quantity) as calories, SUM(protein * quantity) as protein FROM food_logs WHERE user_id = ? AND date >= ? GROUP BY date`
    ).all(req.userId, weekAgo);

    const settings = db.prepare('SELECT key, value FROM user_settings WHERE user_id = ?').all(req.userId);
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));

    const latestWeight = db.prepare('SELECT weight_lbs FROM body_logs WHERE user_id = ? ORDER BY date DESC LIMIT 1').get(req.userId);

    const prompt = `Analyze this user's recent fitness data and provide a brief, encouraging progress report with 2-3 specific actionable recommendations.

User Goals:
- Calorie goal: ${settingsMap.calorie_goal || '2000'} kcal/day
- Protein goal: ${settingsMap.protein_goal || '150'}g/day
- Fitness goal: ${settingsMap.goal_type || 'general fitness'}
- Current weight: ${latestWeight ? latestWeight.weight_lbs + ' lbs' : 'not logged'}

Last 7 days workouts: ${JSON.stringify(recentWorkouts)}
Last 7 days nutrition: ${JSON.stringify(nutritionHistory)}

Be specific, motivating, and constructive. Format as plain text paragraphs, no bullet points.`;

    const client = getAnthropicClient(apiKey);
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ analysis: message.content[0].text });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

module.exports = router;
