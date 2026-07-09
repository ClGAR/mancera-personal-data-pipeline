import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import { env, flags } from '../config/env.js';
import {
  buildChatMemoryContext,
  ensureChatSession,
  extractAndStoreMemories,
  formatMemoryContextForPrompt,
  hasLongTermMemory,
  isBackendChatSessionId,
  saveChatMessage
} from './chatMemory.service.js';
import { getChatbotContext } from './stats.service.js';

const validChatbotModes = new Set(['auto', 'github', 'general']);

export async function answerChatbotQuestion(user, question, requestedMode = 'auto', options = {}) {
  const normalizedMode = normalizeChatbotMode(requestedMode);
  const { session, memoryContext, userMessage, persistenceWarning } = await prepareChatPersistence(user, question, normalizedMode, options);
  const timeIntent = detectSimpleDateTimeIntent(question);
  const calculation = calculateSimpleArithmeticExpression(question);
  const knownGeneralAnswer = answerKnownGeneralQuestion(question, memoryContext);
  let result;

  if (timeIntent) {
    result = answerServerTimeQuestion(timeIntent);
  } else if (calculation) {
    result = answerServerCalculationQuestion(calculation);
  } else if (knownGeneralAnswer) {
    result = knownGeneralAnswer;
  } else {
    const selectedMode = normalizedMode === 'auto' ? detectChatbotMode(question) : normalizedMode;

    if (selectedMode === 'server-time') {
      result = answerServerTimeQuestion(timeIntent || detectSimpleDateTimeIntent(question));
    } else if (selectedMode === 'general') {
      result = await answerGeneralQuestion(question, memoryContext);
    } else if (!isAuthenticatedGitHubUser(user)) {
      result = buildGitHubAuthRequiredResponse();
    } else {
      result = await answerGitHubQuestion(user, question, memoryContext);
      result = {
        ...result,
        memoryUsed: hasLongTermMemory(memoryContext)
      };
    }
  }

  const response = {
    ...result,
    warning: result.warning || persistenceWarning || undefined,
    sessionId: session?.id || null,
    memoryUsed: Boolean(result.memoryUsed)
  };

  const assistantMessage = await saveAssistantMessageSafely(user, session, response);

  if (session && userMessage) {
    try {
      await extractAndStoreMemories(user, {
        userMessage: question,
        assistantAnswer: response.answer,
        sourceMessageId: userMessage.id,
        memoryContext
      });
    } catch (error) {
      console.warn('Chatbot memory extraction failed.', {
        message: sanitizeLogMessage(error.message || 'Unknown memory extraction error')
      });
    }
  }

  return {
    ...response,
    messageId: assistantMessage?.id || null
  };
}

async function saveAssistantMessageSafely(user, session, response) {
  if (!session) return null;

  try {
    return await saveChatMessage(user, session.id, {
      role: 'assistant',
      content: response.answer,
      mode: response.mode,
      source: response.source,
      metadata: {
        usedLiveData: response.usedLiveData,
        warning: response.warning || null,
        memoryUsed: response.memoryUsed
      }
    });
  } catch (error) {
    console.warn('Chat assistant message save failed.', {
      message: sanitizeLogMessage(error.message || 'Unknown message save error')
    });
    return null;
  }
}

export async function answerGitHubQuestion(user, question, memoryContext = null) {
  const context = await getSafeChatbotContext(user);
  const groundedPrompt = buildGroundedPrompt(question, context, memoryContext);
  const fallbackAnswer = buildFallbackAnswer(question, context);

  if (env.aiProvider === 'ollama') {
    return addGithubModeMetadata(await answerWithOllama(groundedPrompt, fallbackAnswer, context));
  }

  if (!flags.hasAnthropic) {
    return {
      answer: fallbackAnswer,
      mode: 'github',
      source: 'supabase-fallback',
      usedLiveData: true,
      warning: 'Anthropic is not configured',
      context
    };
  }

  return addGithubModeMetadata(await answerWithAnthropic(groundedPrompt, fallbackAnswer, context));
}

async function prepareChatPersistence(user, question, normalizedMode, options) {
  const requestedSessionId = String(options.sessionId || '').trim();
  const shouldUseSavedSession = isBackendChatSessionId(requestedSessionId);

  try {
    const session = shouldUseSavedSession ? await ensureChatSession(user, requestedSessionId, question) : null;
    const memoryContext = await buildChatMemoryContext(user, session?.id, options.memoryEnabled);
    const userMessage = session
      ? await saveChatMessage(user, session.id, {
          role: 'user',
          content: question,
          mode: normalizedMode,
          source: 'user'
        })
      : null;

    return { session, memoryContext, userMessage };
  } catch (error) {
    console.warn('Chat persistence setup failed; answering without saved memory.', {
      message: sanitizeLogMessage(error.message || 'Unknown chat persistence error')
    });

    return {
      session: null,
      userMessage: null,
      memoryContext: {
        persistenceEnabled: false,
        memoryEnabled: false,
        preferences: null,
        memories: [],
        recentMessages: []
      },
      persistenceWarning: shouldUseSavedSession ? 'Chat history could not be saved, but the answer is still available.' : null
    };
  }
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
      source: 'ollama-grounded',
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

async function answerGeneralQuestion(question, memoryContext = null) {
  console.info('Ollama general assistant configuration.', buildOllamaLogContext());
  const timeContext = buildCurrentTimeContext();

  if (!flags.hasOllama) {
    console.warn('Ollama general assistant is not configured.', buildOllamaLogContext());
    return buildGeneralOllamaUnavailableResponse();
  }

  try {
    const response = await axios.post(
      `${env.ollama.baseUrl}/api/chat`,
      {
        model: env.ollama.model,
        messages: [
          {
            role: 'system',
            content: buildGeneralAssistantPrompt(timeContext, memoryContext)
          },
          ...buildRecentMessagesForModel(memoryContext),
          {
            role: 'user',
            content: question
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
    console.info('Ollama general assistant response received.', {
      ...buildOllamaLogContext(),
      ollamaResponseStatus: response.status
    });

    const text = String(response.data?.message?.content || '').trim();
    if (!text) {
      console.warn('Ollama general assistant response did not include message content.');
      return {
        ...buildGeneralOllamaUnavailableResponse(),
        warning: 'Ollama returned an empty response.'
      };
    }

    return {
      answer: text,
      mode: 'general',
      source: 'ollama-general',
      usedLiveData: false,
      memoryUsed: hasLongTermMemory(memoryContext)
    };
  } catch (error) {
    logOllamaError(error, 'general');
    return buildGeneralOllamaUnavailableResponse();
  }
}

function answerServerTimeQuestion(intent = 'date') {
  const timeContext = buildCurrentTimeContext();
  let answer;

  if (intent === 'time') {
    answer = `It is currently ${timeContext.time} in ${timeContext.timezone}.`;
  } else if (intent === 'datetime') {
    answer = `Today is ${timeContext.date}, and it is currently ${timeContext.time} in ${timeContext.timezone}.`;
  } else {
    answer = `Today is ${timeContext.date}.`;
  }

  return {
    answer,
    mode: 'general',
    source: 'server-time',
    usedLiveData: false
  };
}

function answerServerCalculationQuestion(calculation) {
  return {
    answer: `${formatNumberForAnswer(calculation.left)} ${calculation.operatorLabel} ${formatNumberForAnswer(calculation.right)} = ${formatNumberForAnswer(calculation.result)}.`,
    mode: 'general',
    source: 'server-calculation',
    usedLiveData: false
  };
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

function buildGroundedPrompt(question, context, memoryContext = null) {
  return [
    `Question: ${question}`,
    '',
    'Use this synced GitHub data:',
    JSON.stringify(summarizeContext(context), null, 2),
    '',
    'Assistant memory and recent conversation context:',
    formatMemoryContextForPrompt(memoryContext),
    '',
    'Answer in 2-4 sentences. If the question asks for a top repository, name the repository and cite its commit count.'
  ].join('\n');
}

function normalizeChatbotMode(mode) {
  const normalized = String(mode || 'auto').trim().toLowerCase();
  return validChatbotModes.has(normalized) ? normalized : 'auto';
}

function detectChatbotMode(question) {
  if (detectSimpleDateTimeIntent(question)) {
    return 'server-time';
  }

  if (calculateSimpleArithmeticExpression(question)) {
    return 'general';
  }

  return detectGitHubDataIntent(question) ? 'github' : 'general';
}

function detectGitHubDataIntent(question) {
  const normalizedQuestion = normalizeIntentText(question);
  if (!normalizedQuestion) return false;

  const githubDataPatterns = [
    /\bmy github\b/,
    /\bmy (repos?|repositories|commits?|sync|sync history|weekly stats|coding activity|dashboard data|github data)\b/,
    /\bgithub (activity|data|dashboard data|dashboard stats|repos?|repositories|commits?|sync history|stats)\b/,
    /\bsynced (github|data|activity|repos?|repositories|commits?)\b/,
    /\bbased on my github data\b/,
    /\bwhat did i sync from github\b/,
    /\bwhich (repo|repository|repositories|repos).*\b(most commits|had the most commits|top|active|activity)\b/,
    /\b(repo|repository|repositories|repos).*\b(most commits|had the most commits|active recently|low activity|lowest activity|repo activity)\b/,
    /\bsummarize my github activity\b/,
    /\bactivity this week\b.*\b(github|repos?|repositories|commits?|coding)\b/,
    /\bweekly (github |coding )?(stats|commits|activity)\b/,
    /\b(coding streak|current coding streak|my current streak)\b/,
    /\bmost active coding day\b/,
    /\blatest sync\b/,
    /\bmy latest sync\b/,
    /\bsync history\b/,
    /\bsync runs?\b/,
    /\bhow many commits were imported\b/,
    /\bcommits? imported\b/,
    /\bshow my top (repos?|repositories)\b/,
    /\btop (repos?|repositories)\b/
  ];

  return githubDataPatterns.some((pattern) => pattern.test(normalizedQuestion));
}

function detectSimpleDateTimeIntent(question) {
  const normalizedQuestion = normalizeIntentText(question);
  if (!normalizedQuestion) return null;

  const githubDataTerms = [
    'github',
    'repo',
    'repos',
    'repository',
    'repositories',
    'commit',
    'commits',
    'sync',
    'synced',
    'streak',
    'coding activity',
    'weekly stats',
    'dashboard stats'
  ];

  if (githubDataTerms.some((term) => normalizedQuestion.includes(term))) {
    return null;
  }

  const asksForTime = [
    /\bwhat time is it\b/,
    /\bwhat is the time\b/,
    /\bwhats the time\b/,
    /\bcurrent time\b/,
    /\bcurrent date and time\b/,
    /\bdate and time\b/,
    /\btime now\b/,
    /\bwhat time now\b/
  ].some((pattern) => pattern.test(normalizedQuestion));

  const asksForDate = [
    /\bwhat day is it today\b/,
    /\bwhat day is it\b/,
    /\bwhat day is today\b/,
    /\bwhat day today\b/,
    /\bwhat date is today\b/,
    /\bwhat is todays date\b/,
    /\bwhats todays date\b/,
    /\btodays date\b/,
    /\bdate today\b/,
    /\bcurrent date\b/,
    /\bcurrent day\b/
  ].some((pattern) => pattern.test(normalizedQuestion));

  if (asksForDate && asksForTime) return 'datetime';
  if (asksForTime) return 'time';
  if (asksForDate) return 'date';

  return null;
}

function normalizeIntentText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/today's/g, 'todays')
    .replace(/what's/g, 'whats')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function answerKnownGeneralQuestion(question, memoryContext = null) {
  const normalizedQuestion = normalizeIntentText(question);
  if (!normalizedQuestion) return null;

  if (/\b(what is|whats|explain|define)?\s*(ghl|gohighlevel)\b/.test(normalizedQuestion)) {
    const rememberedGhl = memoryContext?.memories?.find((memory) => /ghl|gohighlevel/i.test(memory.content));
    if (rememberedGhl && /\bagain\b|\bmean again\b|\bremember\b/.test(normalizedQuestion)) {
      return {
        answer:
          'GHL means GoHighLevel in your AI automation context. It is a CRM and automation platform used for funnels, bookings, follow-ups, SMS/email automation, and client management.',
        mode: 'general',
        source: 'ollama-general',
        usedLiveData: false,
        memoryUsed: true
      };
    }

    return {
      answer:
        'GHL can mean different things, but in AI automation it usually means GoHighLevel. It is a CRM and automation platform used for funnels, bookings, follow-ups, SMS/email automation, and client management.',
      mode: 'general',
      source: 'ollama-general',
      usedLiveData: false,
      memoryUsed: Boolean(rememberedGhl)
    };
  }

  return null;
}

function calculateSimpleArithmeticExpression(question) {
  const text = String(question || '')
    .toLowerCase()
    .replace(/what is/g, '')
    .replace(/whats/g, '')
    .replace(/calculate/g, '')
    .replace(/please/g, '')
    .replace(/[=?]/g, '')
    .trim();

  const percentMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*(?:percent|%)\s+of\s+(-?\d+(?:\.\d+)?)$/);
  if (percentMatch) {
    const percent = Number(percentMatch[1]);
    const value = Number(percentMatch[2]);
    if (!Number.isFinite(percent) || !Number.isFinite(value)) return null;

    return {
      left: percent,
      right: value,
      operatorLabel: 'percent of',
      result: (percent / 100) * value
    };
  }

  const match = text.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*/x])\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const left = Number(match[1]);
  const right = Number(match[3]);
  const operator = match[2];

  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;

  if (operator === '/' && right === 0) {
    return {
      left,
      right,
      operatorLabel: '/',
      result: 'undefined'
    };
  }

  const resultByOperator = {
    '+': left + right,
    '-': left - right,
    '*': left * right,
    x: left * right,
    '/': left / right
  };

  const operatorLabelByOperator = {
    '+': '+',
    '-': '-',
    '*': 'x',
    x: 'x',
    '/': '/'
  };

  return {
    left,
    right,
    operatorLabel: operatorLabelByOperator[operator],
    result: resultByOperator[operator]
  };
}

function calculateSimpleArithmetic(question) {
  const text = String(question || '')
    .toLowerCase()
    .replace(/what is/g, '')
    .replace(/whats/g, '')
    .replace(/calculate/g, '')
    .replace(/please/g, '')
    .replace(/[=?]/g, '')
    .trim();
  const match = text.match(/^(-?\d+(?:\.\d+)?)\s*([+\-*/x×÷])\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const left = Number(match[1]);
  const right = Number(match[3]);
  const operator = match[2];

  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;

  if ((operator === '/' || operator === '÷') && right === 0) {
    return {
      left,
      right,
      operatorLabel: '÷',
      result: 'undefined'
    };
  }

  const resultByOperator = {
    '+': left + right,
    '-': left - right,
    '*': left * right,
    x: left * right,
    '×': left * right,
    '/': left / right,
    '÷': left / right
  };

  const operatorLabelByOperator = {
    '+': '+',
    '-': '-',
    '*': '×',
    x: '×',
    '×': '×',
    '/': '÷',
    '÷': '÷'
  };

  return {
    left,
    right,
    operatorLabel: operatorLabelByOperator[operator],
    result: resultByOperator[operator]
  };
}

function formatNumberForAnswer(value) {
  if (typeof value === 'string') return value;
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(6)));
}

function buildGeneralAssistantPrompt(timeContext, memoryContext = null) {
  return [
    'You are a general AI assistant inside a developer analytics dashboard. Answer clearly and simply.',
    'Assistant voice: warm, calm, concise, thoughtful, helpful, practical, beginner-friendly, and honest when unsure.',
    'Directly answer first. Add context only when useful. Avoid long disclaimers.',
    'Not every question is about GitHub.',
    "Only mention the user's GitHub data if the user explicitly asks about their synced repositories, commits, sync history, or dashboard stats.",
    'If the user asks about general software, automation, career, learning, or technical concepts, answer normally as a general assistant.',
    'You have been provided the current date/time by the application when available.',
    'Do not claim you lack access to the current date/time if it is provided in the prompt.',
    'You do not have live web access. For broad questions asking for current, best, latest, or 2026 rankings, avoid pretending to know live rankings; say you do not have live web access and frame the answer as general knowledge unless app data was provided.',
    'For ambiguous acronyms like GHL, do not assume a GitHub-related meaning. In AI automation or business automation, GHL usually means GoHighLevel.',
    'If the user corrects an acronym meaning, acknowledge the correction and update the answer.',
    'Use saved memories and recent conversation only when relevant. Do not dump memory back to the user.',
    'If the user asks about their synced GitHub data, tell the system to use GitHub Data Mode instead.',
    '',
    'Assistant memory and recent conversation context:',
    formatMemoryContextForPrompt(memoryContext),
    '',
    'Current date and time:',
    timeContext.currentDateTime,
    'Timezone:',
    timeContext.timezone
  ].join('\n');
}

function buildRecentMessagesForModel(memoryContext) {
  return (memoryContext?.recentMessages || [])
    .slice(-8)
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
}

function buildCurrentTimeContext() {
  const configuredTimezone = env.appTimezone || 'Asia/Manila';
  const now = new Date();
  const dateResult = formatDatePart(now, configuredTimezone);
  const timeResult = formatTimePart(now, configuredTimezone);
  const timezone = dateResult.timezone;

  return {
    date: dateResult.value,
    time: timeResult.value,
    timezone,
    currentDateTime: `${dateResult.value} at ${timeResult.value} in ${timezone}`
  };
}

function formatDatePart(date, timezone) {
  return formatDateTimePart(date, timezone, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatTimePart(date, timezone) {
  return formatDateTimePart(date, timezone, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatDateTimePart(date, timezone, options) {
  try {
    return {
      value: new Intl.DateTimeFormat('en-US', {
        ...options,
        timeZone: timezone
      }).format(date),
      timezone
    };
  } catch (error) {
    console.warn('App timezone formatting failed; using server local time.', {
      timezone: sanitizeLogMessage(timezone),
      message: sanitizeLogMessage(error.message)
    });

    return {
      value: new Intl.DateTimeFormat('en-US', options).format(date),
      timezone: getServerTimezoneLabel()
    };
  }
}

function getServerTimezoneLabel() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'server local time';
  } catch {
    return 'server local time';
  }
}

function addGithubModeMetadata(result) {
  return {
    ...result,
    mode: 'github',
    usedLiveData: true
  };
}

function isAuthenticatedGitHubUser(user) {
  return Boolean(user?.userId || user?.id || user?.githubId || user?.github_id || user?.isDemo);
}

function buildGitHubAuthRequiredResponse() {
  return {
    answer: 'Connect GitHub first so I can answer questions about your repositories, commits, and sync history.',
    mode: 'github',
    source: 'auth-required',
    usedLiveData: false
  };
}

function buildGeneralOllamaUnavailableResponse() {
  return {
    answer: 'The local AI model is not available right now. Please make sure Ollama is running.',
    mode: 'general',
    source: 'ollama-general',
    usedLiveData: false,
    warning: 'Ollama is not running or the selected model is unavailable.'
  };
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

function logOllamaError(error, mode = 'github') {
  const status = error.response?.status || error.status || error.statusCode || error.code || 'unknown';
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    'Ollama is not running or the selected model is unavailable.';

  console.warn('Ollama chatbot request failed.', {
    ...buildOllamaLogContext(),
    mode,
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
