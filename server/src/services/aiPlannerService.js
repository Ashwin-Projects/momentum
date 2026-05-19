const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

const getApiKey = () => process.env.GROQ_API_KEY || '';

const getModelName = () => process.env.GROQ_MODEL || DEFAULT_MODEL;

const MOMENTUM_SYSTEM_PROMPT = `You are Momentum's AI productivity coach. You help users optimize daily performance across study, fitness, nutrition, and sleep.

You are NOT a general chatbot. Ground every recommendation in the user's actual logged data and goals provided in CURRENT USER DATA.

When the user asks for a plan or guidance:
- Analyze progress toward today's goals and recent activity
- Identify gaps and realistic next steps
- Balance domains (do not sacrifice sleep for study, etc.)
- Be encouraging but honest

Always respond with valid JSON only (no markdown fences) using this exact shape:
{
  "message": "Friendly conversational reply shown in chat",
  "planSections": {
    "study": {
      "title": "Study",
      "summary": "Brief assessment of study progress and focus",
      "recommendations": ["actionable item 1", "actionable item 2"]
    },
    "workout": {
      "title": "Workout",
      "summary": "Brief assessment of fitness activity",
      "recommendations": ["actionable item 1"]
    },
    "nutrition": {
      "title": "Nutrition",
      "summary": "Brief assessment of meals and calories",
      "recommendations": ["actionable item 1"]
    },
    "sleep": {
      "title": "Sleep",
      "summary": "Brief assessment of sleep vs goal",
      "recommendations": ["actionable item 1"]
    }
  }
}

For short greetings or simple questions, still return all four planSections with brief, relevant content.`;

const emptyPlanSection = (title) => ({
  title,
  summary: '',
  recommendations: [],
});

const defaultPlanSections = () => ({
  study: emptyPlanSection('Study'),
  workout: emptyPlanSection('Workout'),
  nutrition: emptyPlanSection('Nutrition'),
  sleep: emptyPlanSection('Sleep'),
});

const buildLocalPlan = (userContext, userMessage) => {
  const progress = userContext?.todayProgress || {};
  const message = (userMessage || '').trim().toLowerCase();

  const isStudyIntent = /study|exam|revision|learn|subject/.test(message);
  const isWorkoutIntent = /workout|gym|run|cardio|exercise|fitness/.test(message);
  const isNutritionIntent = /food|meal|calorie|nutrition|protein|diet/.test(message);
  const isSleepIntent = /sleep|rest|bed|night/.test(message);

  return {
    message:
      'Great prompt — I built a practical plan from your current Momentum data so you can continue right away.',
    planSections: {
      study: {
        title: 'Study',
        summary: `Progress: ${progress.studyMinutes || 0}/${progress.studyGoal || 0} minutes.`,
        recommendations: [
          isStudyIntent
            ? 'Do one 60-minute high-focus block on your top-priority topic next.'
            : 'Schedule one focused 45-60 minute study block for your highest-impact topic.',
          'End with a 10-minute recall review to lock retention.',
        ],
      },
      workout: {
        title: 'Workout',
        summary: `Progress: ${progress.workoutsCompleted || 0}/${progress.workoutGoal || 0} sessions.`,
        recommendations: [
          isWorkoutIntent
            ? 'Complete today’s planned workout with a clear start time.'
            : 'Add one short movement block (20-30 min) to protect energy and focus.',
          'Keep intensity moderate if your study load is heavy.',
        ],
      },
      nutrition: {
        title: 'Nutrition',
        summary: `Progress: ${progress.caloriesConsumed || 0}/${progress.calorieGoal || 0} kcal.`,
        recommendations: [
          isNutritionIntent
            ? 'Make your next meal protein-forward with whole-food carbs.'
            : 'Plan your next meal now to avoid reactive snacking later.',
          'Hydrate consistently through the next study/work block.',
        ],
      },
      sleep: {
        title: 'Sleep',
        summary: `Progress: ${progress.sleepHoursActual || 0}/${progress.sleepHoursGoal || 0} hours.`,
        recommendations: [
          isSleepIntent
            ? 'Set a fixed bedtime tonight and protect it.'
            : 'Set a screen-off cutoff 30-45 minutes before sleep.',
          'Aim for a full recovery window to sustain tomorrow’s focus quality.',
        ],
      },
    },
  };
};

const formatUserContext = (userContext) => {
  const { todayProgress, targets, recentSessions, recentWorkouts, mealsToday, recentSleep } =
    userContext;

  const progress = todayProgress || {};
  const targetLines = (targets || [])
    .map(
      (t) =>
        `- ${new Date(t.date).toISOString().slice(0, 10)}: study ${t.studyMinutesActual}/${t.studyMinutesGoal} min, workouts ${t.workoutsCompleted}/${t.workoutGoal}, calories ${t.caloriesActual}/${t.caloriesGoal}, sleep ${t.sleepHoursActual}/${t.sleepHoursGoal} h`
    )
    .join('\n');

  const studyLines = (recentSessions || [])
    .map((s) => `- ${s.subject}: ${s.duration} min${s.startedAt ? ` at ${s.startedAt}` : ''}`)
    .join('\n');

  const workoutLines = (recentWorkouts || [])
    .map((w) => `- ${w.type}: ${w.duration} min${w.caloriesBurned != null ? `, ${w.caloriesBurned} kcal` : ''}`)
    .join('\n');

  const mealLines = (mealsToday || [])
    .map((m) => `- ${m.type}: ${m.food} (${m.calories} kcal)`)
    .join('\n');

  const sleepLines = (recentSleep || [])
    .map(
      (s) =>
        `- ${new Date(s.date).toISOString().slice(0, 10)}: ${s.actual}h actual / ${s.goal}h goal`
    )
    .join('\n');

  return `TODAY'S PROGRESS:
- Study: ${progress.studyMinutes ?? 0}/${progress.studyGoal ?? 0} minutes
- Workouts: ${progress.workoutsCompleted ?? 0}/${progress.workoutGoal ?? 0} sessions
- Calories: ${progress.caloriesConsumed ?? 0}/${progress.calorieGoal ?? 0} kcal
- Sleep: ${progress.sleepHoursActual ?? 0}/${progress.sleepHoursGoal ?? 0} hours

RECENT DAILY TARGETS (up to 7 days):
${targetLines || '(none logged)'}

TODAY'S STUDY SESSIONS:
${studyLines || '(none logged)'}

TODAY'S WORKOUTS:
${workoutLines || '(none logged)'}

TODAY'S MEALS:
${mealLines || '(none logged)'}

RECENT SLEEP (DailyTarget):
${sleepLines || '(none logged)'}`;
};

const mapChatHistory = (conversationHistory = []) => {
  const history = [];

  conversationHistory.forEach((msg) => {
    const text = (msg.text || msg.content || '').trim();
    if (!text) return;

    if (msg.sender === 'user' || msg.role === 'user') {
      history.push({ role: 'user', content: text });
    } else if (msg.sender === 'ai' || msg.role === 'assistant') {
      history.push({ role: 'assistant', content: text });
    }
  });

  return history;
};

const parseStructuredResponse = (rawText) => {
  const trimmed = rawText.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    const parsed = JSON.parse(jsonString);
    const planSections = { ...defaultPlanSections(), ...(parsed.planSections || {}) };

    return {
      message: parsed.message || trimmed,
      planSections,
    };
  } catch {
    return {
      message: trimmed,
      planSections: defaultPlanSections(),
    };
  }
};

const generatePlan = async (userContext, userMessage, conversationHistory = []) => {
  const apiKey = getApiKey();
  const trimmedMessage = (userMessage || '').trim();
  if (!trimmedMessage) {
    throw new Error('Message is required');
  }

  if (!apiKey) {
    return buildLocalPlan(userContext, trimmedMessage);
  }

  const systemInstruction = `${MOMENTUM_SYSTEM_PROMPT}\n\nCURRENT USER DATA:\n${formatUserContext(userContext)}`;
  const history = mapChatHistory(conversationHistory);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getModelName(),
        messages: [
          { role: 'system', content: systemInstruction },
          ...history,
          { role: 'user', content: trimmedMessage },
        ],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      const errorMessage = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
      throw new Error(`Groq request failed: ${errorMessage}`);
    }

    const content = payload?.choices?.[0]?.message?.content;
    const rawText = Array.isArray(content)
      ? content.map((item) => item?.text || '').join('\n').trim()
      : String(content || '').trim();
    if (!rawText) {
      throw new Error('Groq response did not include message content');
    }

    return parseStructuredResponse(rawText);
  } catch (error) {
    console.error('Error calling Groq API:', error.message);
    return buildLocalPlan(userContext, trimmedMessage);
  }
};

module.exports = { generatePlan, formatUserContext };
