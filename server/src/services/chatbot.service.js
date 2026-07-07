import Anthropic from '@anthropic-ai/sdk';
import { env, flags } from '../config/env.js';
import { getChatbotContext } from './stats.service.js';

export async function answerGitHubQuestion(user, question) {
  const context = await getChatbotContext(user);

  if (!flags.hasAnthropic) {
    return {
      answer: buildFallbackAnswer(question, context),
      source: 'demo',
      context
    };
  }

  const anthropic = new Anthropic({
    apiKey: env.anthropic.apiKey
  });

  const message = await anthropic.messages.create({
    model: env.anthropic.model,
    max_tokens: 350,
    system:
      'You are a concise engineering analytics assistant. Answer only from the provided GitHub activity context. If the data does not answer the question, say what is missing.',
    messages: [
      {
        role: 'user',
        content: `Question: ${question}\n\nGitHub activity context:\n${JSON.stringify(context, null, 2)}`
      }
    ]
  });

  const text = message.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();

  return {
    answer: text,
    source: 'anthropic',
    context
  };
}

function buildFallbackAnswer(question, context) {
  const topRepo = context.topRepos?.[0];
  const weeklyCommits = context.weekly?.cards?.weeklyCommits ?? 0;
  const streak = context.weekly?.cards?.currentStreak ?? 0;

  return [
    `Demo answer for: "${question}"`,
    `Your current sample data shows ${weeklyCommits} commits this week and a ${streak}-day streak.`,
    topRepo ? `${topRepo.repoName} is currently the most active repository with ${topRepo.commits} commits.` : null,
    'Add ANTHROPIC_API_KEY to receive model-generated answers grounded in live Supabase data.'
  ]
    .filter(Boolean)
    .join(' ');
}
