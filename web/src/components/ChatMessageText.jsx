import { Fragment } from 'react';

function ChatMessageText({ content }) {
  const blocks = String(content || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!blocks.length) return null;

  return (
    <div className="message-content">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(block, index) {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.every((line) => /^[-*]\s+/.test(line))) {
    return (
      <ul key={index}>
        {lines.map((line, lineIndex) => (
          <li key={`${line}-${lineIndex}`}>{renderInline(line.replace(/^[-*]\s+/, ''))}</li>
        ))}
      </ul>
    );
  }

  if (lines.every((line) => /^\d+[.)]\s+/.test(line))) {
    return (
      <ol key={index}>
        {lines.map((line, lineIndex) => (
          <li key={`${line}-${lineIndex}`}>{renderInline(line.replace(/^\d+[.)]\s+/, ''))}</li>
        ))}
      </ol>
    );
  }

  return (
    <p key={index}>
      {lines.map((line, lineIndex) => (
        <Fragment key={`${line}-${lineIndex}`}>
          {lineIndex > 0 ? <br /> : null}
          {renderInline(line)}
        </Fragment>
      ))}
    </p>
  );
}

function renderInline(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
      }

      return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    });
}

export default ChatMessageText;
