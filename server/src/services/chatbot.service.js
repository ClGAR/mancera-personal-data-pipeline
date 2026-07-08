import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { env, flags } from '../config/env.js';
import { getChatbotContext } from './stats.service.js';

export async function answerGitHubQuestion(user, question) {
  const context = await getSafeChatbotContext(user);
  const groundedPrompt = buildGroundedPrompt(question, context);
  const fallbackAnswer = buildFallbackAnswer(question, context);

  if (env.aiProvider === 'ollama') {
    return answerWithOllama(groundedPrompt, fallbackAnswer, context);
  }

  if (!flags.hasAnthropic) {
    return {
      answer: fallbackAnswer,
      source: 'supabase-fallback',
      warning: 'Anthropic is not configured',
      context
    };
  }

  return answerWithAnthropic(groundedPrompt, fallbackAnswer, context);
}

async function getSafeChatbotContext(user) {
  try {
    return await getChatbotContext(user);
  } catch (error) {
    console.warn('Chatbot Supabase context lookup failed.', {
      message: sanitizeLogMessage(error.message || 'Unknown Supabase context error')
    });
    throw error;
  }
}

async function answerWithOllama(groundedPrompt, fallbackAnswer, context) {
  console.info('Ollama chatbot configuration.', buildOllamaLogContext());

  if (!flags.hasOllama) {
    console.warn('Ollama chatbot is not configured.', buildOllamaLogContext());

    return {
      answer: fallbackAnswer,
      source: 'supabase-fallback',
      warning: 'Ollama is not running or the selected model is unavailable.',
      context
    };
  }

  try {
    const response = await axios.post(
      `${env.ollama.baseUrl}/api/chat`,
      {
        model: env.ollama.model,
        messages: [
          {
            role: 'system',
            content: "You are a helpful GitHub activity assistant. Answer only using the user's synced GitHub data."
          },
          {
            role: 'user',
            content: groundedPrompt
          }
        ],
        stream: false
      },
      {
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.info('Ollama chatbot response received.', {
      ...buildOllamaLogContext(),
      ollamaResponseStatus: response.status
    });

    const text = String(response.data?.message?.content || '').trim();
    if (!text) {
      console.warn('Ollama chatbot response did not include message content.');
      return {
        answer: fallbackAnswer,
        source: 'supabase-fallback',
        warning: 'Ollama returned an empty response.',
        context
      };
    }

    return {
      answer: text,
      source: 'ollama',
      context
    };
  } catch (error) {
    logOllamaError(error);

    return {
      answer: fallbackAnswer,
      source: 'supabase-fallback',
      warning: 'Ollama is not running or the selected model is unavailable.',
      context
    };
  }
}

async function answerWithAnthropic(groundedPrompt, fallbackAnswer, context) {
  const anthropic = new Anthropic({
    apiKey: env.anthropic.apiKey
  });

  try {
    const message = await anthropic.messages.create({
      model: env.anthropic.model,
      max_tokens: 350,
      system:
        'You are a concise engineering analytics assistant. Answer only from the provided GitHub activity context. If the data does not answer the question, say what is missing. Never invent repositories, commit counts, or sync status.',
      messages: [
        {
          role: 'user',
          content: groundedPrompt
        }
      ]
    });

    const text = extractText(message);

    if (!text) {
      console.warn('Anthropic chatbot response did not include text content.');
      return {
        answer: fallbackAnswer,
        source: 'supabase-fallback',
        warning: 'Anthropic returned an empty response',
        context
      };
    }

    return {
      answer: text,
      source: 'anthropic',
      context
    };
  } catch (error) {
    logAnthropicError(error);

    return {
      answer: fallbackAnswer,
      source: 'supabase-fallback',
      warning: 'Anthropic request failed',
      context
    };
  }
}

function buildGroundedPrompt(question, context) {
  return [
    `Question: ${question}`,
    '',
    'Use this synced GitHub data:',
    JSON.stringify(summarizeContext(context), null, 2),
    '',
    'Answer in 2-4 sentences. If the question asks for a top repository, name the repository and cite its commit count.'
  ].join('\n');
}

function summarizeContext(context) {
  const weeklyCards = context.weekly?.cards || {};

  return {
    topRepositories: (context.topRepos || []).map((repo) => ({
      name: repo.repoName || repo.name,
      commits: repo.commits,
      lastCommitAt: repo.lastCommitAt || repo.last_commit_at || null
    })),
    weekly: {
      commits: weeklyCards.weeklyCommits ?? 0,
      activeRepositories: weeklyCards.activeRepositories ?? 0,
      currentStreak: weeklyCards.currentStreak ?? 0,
      lastSyncStatus: weeklyCards.lastSyncStatus || 'unknown',
      chart: context.weekly?.chart || []
    },
    recentSyncRuns: (context.recentSyncRuns || []).map((run) => ({
      status: run.status,
      repositories: run.repos_synced ?? run.reposSynced ?? 0,
      commits: run.commits_synced ?? run.commitsSynced ?? 0,
      finishedAt: run.finished_at || run.finishedAt || run.created_at || run.createdAt || null
    }))
  };
}

function extractText(message) {
  return (message.content || [])
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();
}

function buildFallbackAnswer(question, context) {
  const topRepo = context.topRepos?.[0];
  const weeklyCommits = context.weekly?.cards?.weeklyCommits ?? 0;
  const streak = context.weekly?.cards?.currentStreak ?? 0;
  const recentSync = context.recentSyncRuns?.[0];
  const repoName = topRepo?.repoName || topRepo?.name;
  const repoCommits = topRepo?.commits ?? 0;
  const fallbackIntro =
    env.aiProvider === 'ollama'
      ? 'I could not reach the local AI model, but here is an answer based on your synced GitHub data.'
      : 'I could not reach the AI provider, but I can still answer from your synced Supabase data.';

  return [
    fallbackIntro,
    repoName ? `${repoName} has the most commits with ${repoCommits} commits.` : 'No top repository is available yet.',
    `Your weekly stats show ${weeklyCommits} commits and a ${streak}-day current streak.`,
    recentSync ? `The latest sync status is ${recentSync.status}.` : null
  ]
    .filter(Boolean)
    .join(' ');
}

function logAnthropicError(error) {
  const status = error.status || error.statusCode || error.response?.status;
  const message = extractAnthropicErrorMessage(error);

  console.warn('Anthropic chatbot request failed.', {
    status: status || 'unknown',
    message: sanitizeLogMessage(message)
  });
}

function logOllamaError(error) {
  const status = error.response?.status || error.status || error.statusCode || error.code || 'unknown';
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    'Ollama is not running or the selected model is unavailable.';

  console.warn('Ollama chatbot request failed.', {
    ...buildOllamaLogContext(),
    ollamaResponseStatus: status,
    message: sanitizeLogMessage(message)
  });
}

function buildOllamaLogContext() {
  return {
    AI_PROVIDER: env.aiProvider,
    OLLAMA_BASE_URL: sanitizeUrlForLog(env.ollama.baseUrl),
    OLLAMA_MODEL: env.ollama.model || '[not configured]'
  };
}

function extractAnthropicErrorMessage(error) {
  const directMessage = error.error?.message || error.response?.data?.error?.message || error.response?.data?.message;
  if (directMessage) return directMessage;

  const rawMessage = error.message || '';
  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart));
      return parsed.error?.message || parsed.message || rawMessage;
    } catch {
      return rawMessage;
    }
  }

  return rawMessage || 'Unknown Anthropic error';
}

function sanitizeLogMessage(message) {
  let safeMessage = String(message || '');

  const configuredSecrets = [
    env.anthropic.apiKey,
    env.github.clientSecret,
    env.supabase.serviceRoleKey,
    env.supabase.anonKey,
    env.sessionSecret
  ].filter(Boolean);

  for (const secret of configuredSecrets) {
    safeMessage = safeMessage.replaceAll(secret, '[redacted]');
  }

  if (env.ollama.baseUrl) {
    safeMessage = safeMessage.replaceAll(env.ollama.baseUrl, sanitizeUrlForLog(env.ollama.baseUrl));
  }

  return safeMessage
    .replace(/sk-ant-[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, '[redacted]');
}

function sanitizeUrlForLog(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) return '[not configured]';

  try {
    const url = new URL(rawValue);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return rawValue.replace(/\/\/[^/@\s]+@/g, '//[redacted]@');
  }
}
