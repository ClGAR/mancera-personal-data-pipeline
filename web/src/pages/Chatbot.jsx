import { ArrowRight, Calendar, ChevronRight, Code2, Copy, Flame, Lightbulb, Send, Sparkles, Star, ThumbsDown, ThumbsUp, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { languageBreakdown, suggestedPrompts } from '../data/mockData.js';

const promptIcons = [TrendingUp, Code2, Flame, Users, Calendar, Star];

function Chatbot() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'user-1',
      role: 'user',
      time: '09:15 AM',
      content: 'Which repo had the most commits this month?'
    },
    {
      id: 'ai-1',
      role: 'ai',
      time: '09:15 AM',
      content: 'Your repository "alexjohnson/portfolio" had the most commits this month (May 2025) with 48 commits.',
      list: ['2nd: alexjohnson/data-pipeline - 36 commits', '3rd: alexjohnson/cli-tools - 22 commits', '4th: alexjohnson/supabase-starter - 10 commits']
    },
    {
      id: 'user-2',
      role: 'user',
      time: '09:17 AM',
      content: 'What are my top coding languages by commits?'
    },
    {
      id: 'ai-2',
      role: 'ai',
      time: '09:17 AM',
      content: 'Here are your top coding languages by commits over the last 30 days:',
      languages: languageBreakdown
    }
  ]);

  function addMockResponse(question) {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        time: '09:21 AM',
        content: cleanQuestion
      },
      {
        id: `ai-${Date.now()}`,
        role: 'ai',
        time: '09:21 AM',
        content: 'Mock insight ready: alexjohnson/portfolio is still leading activity, and TypeScript is your strongest language signal this month.'
      }
    ]);
    setInput('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    addMockResponse(input);
  }

  return (
    <section className="assistant-layout">
      <aside className="card prompt-card">
        <div className="card-header">
          <div>
            <h2>
              <Lightbulb size={20} aria-hidden="true" />
              Suggested prompts
            </h2>
            <p>Try asking about your GitHub data</p>
          </div>
        </div>

        <div className="prompt-list">
          {suggestedPrompts.map((prompt, index) => {
            const Icon = promptIcons[index] || Sparkles;

            return (
              <button className="prompt-button" type="button" key={prompt} onClick={() => addMockResponse(prompt)}>
                <Icon size={22} aria-hidden="true" />
                <span>{prompt}</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <button className="outline-button prompt-more" type="button">
          View all examples
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </aside>

      <article className="card assistant-card">
        <div className="chat-day-divider">
          <span>Today</span>
        </div>

        <div className="assistant-thread">
          {messages.map((message) => (
            <div className={`message-row ${message.role === 'user' ? 'user-message' : 'assistant-message'}`} key={message.id}>
              {message.role === 'ai' ? <span className="ai-avatar">AI</span> : null}
              <div className="message-stack">
                <div className="message-bubble">
                  <p>{message.content}</p>
                  {message.list ? (
                    <ul className="answer-list">
                      {message.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {message.languages ? (
                    <div className="language-breakdown">
                      {message.languages.map((language) => (
                        <div className="language-row" key={language.language}>
                          <span className="language-key">
                            <i style={{ backgroundColor: language.color }} />
                            {language.language}
                          </span>
                          <span className="language-meter">
                            <span style={{ width: `${language.percent}%` }} />
                          </span>
                          <em>
                            {language.percent}% ({language.commits} commits)
                          </em>
                        </div>
                      ))}
                      <strong>Total commits: 575</strong>
                    </div>
                  ) : null}
                  <span>{message.time}</span>
                </div>
                {message.role === 'ai' ? (
                  <div className="feedback-actions">
                    <button type="button" aria-label="Copy response">
                      <Copy size={16} aria-hidden="true" />
                    </button>
                    <button type="button" aria-label="Like response">
                      <ThumbsUp size={16} aria-hidden="true" />
                    </button>
                    <button type="button" aria-label="Dislike response">
                      <ThumbsDown size={16} aria-hidden="true" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything about your GitHub data..."
            aria-label="Ask anything about your GitHub data"
          />
          <button className="primary-icon-button" type="submit" aria-label="Send question">
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        <p className="chat-disclaimer">Responses are generated by Claude and grounded in your data.</p>
      </article>
    </section>
  );
}

export default Chatbot;
