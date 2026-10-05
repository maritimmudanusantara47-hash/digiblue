'use client';

import React from 'react';

interface Props {
  content: string;
  className?: string;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

export default function MarkdownViewer({ content, className = '', fontSize = 'normal' }: Props) {
  if (!content) return null;

  const size = {
    normal: {
      h1: 'text-xl font-extrabold text-navy-dark mt-6 mb-3',
      h2: 'text-lg font-extrabold text-navy-dark mt-6 mb-2',
      h3: 'text-base font-extrabold text-navy-dark mt-5 mb-2 pb-1 border-b border-slate-100',
      h4: 'text-sm font-bold text-navy-dark mt-4 mb-1',
      p: 'text-sm text-slate-700 leading-relaxed my-2',
      list: 'text-sm text-slate-700 leading-relaxed my-2',
      quote: 'text-sm text-slate-700 italic my-2.5',
      code: 'text-xs',
    },
    large: {
      h1: 'text-2xl font-extrabold text-navy-dark mt-7 mb-3',
      h2: 'text-xl font-extrabold text-navy-dark mt-6 mb-2.5',
      h3: 'text-lg font-extrabold text-navy-dark mt-5 mb-2.5 pb-1 border-b border-slate-100',
      h4: 'text-base font-bold text-navy-dark mt-4 mb-1.5',
      p: 'text-base text-slate-700 leading-relaxed my-2.5',
      list: 'text-base text-slate-700 leading-relaxed my-2.5',
      quote: 'text-base text-slate-700 italic my-3',
      code: 'text-sm',
    },
    xlarge: {
      h1: 'text-3xl font-extrabold text-navy-dark mt-8 mb-4',
      h2: 'text-2xl font-extrabold text-navy-dark mt-7 mb-3',
      h3: 'text-xl font-extrabold text-navy-dark mt-6 mb-3 pb-1 border-b border-slate-100',
      h4: 'text-lg font-bold text-navy-dark mt-5 mb-2',
      p: 'text-lg text-slate-700 leading-relaxed my-3',
      list: 'text-lg text-slate-700 leading-relaxed my-3',
      quote: 'text-lg text-slate-700 italic my-3.5',
      code: 'text-base',
    },
  }[fontSize];

  // Simple, safe Markdown parser
  const renderFormattedText = (text: string) => {
    // Process markdown link [text](url)
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    // Process bold, italic, code
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-navy-dark">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-700">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className={`px-1.5 py-0.5 rounded bg-slate-100 text-navy font-mono ${size.code}`}>{part.slice(1, -1)}</code>;
      }
      const match = /^\[(.*?)\]\((.*?)\)$/.exec(part);
      if (match) {
        return (
          <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-navy-light underline font-medium">
            {match[1]}
          </a>
        );
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (listItems.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`list-${elements.length}`} className={`list-decimal list-outside ml-6 flex flex-col gap-1.5 ${size.list}`}>
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${elements.length}`} className={`list-disc list-outside ml-6 flex flex-col gap-1.5 ${size.list}`}>
            {listItems}
          </ul>
        );
      }
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      return;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={index} className={size.h4}>
          {renderFormattedText(trimmed.slice(5))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className={size.h3}>
          {renderFormattedText(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className={size.h2}>
          {renderFormattedText(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className={size.h1}>
          {renderFormattedText(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={index} className={`border-l-4 border-gold bg-amber-50/60 rounded-r-xl px-4 py-2 ${size.quote}`}>
          {renderFormattedText(trimmed.slice(2))}
        </blockquote>
      );
      return;
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList();
      elements.push(<hr key={index} className="my-6 border-slate-200" />);
      return;
    }

    // Image ![alt](url)
    const imgMatch = /^!\[(.*?)\]\((.*?)\)$/.exec(trimmed);
    if (imgMatch) {
      flushList();
      elements.push(
        <figure key={index} className="my-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgMatch[2]} alt={imgMatch[1]} className="rounded-xl border border-slate-200 max-w-full h-auto shadow-sm" />
          {imgMatch[1] && <figcaption className="text-xs text-slate-400 text-center mt-1.5">{imgMatch[1]}</figcaption>}
        </figure>
      );
      return;
    }

    // Unordered List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      listItems.push(
        <li key={`li-${index}`}>
          {renderFormattedText(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // Numbered List (e.g. 1. , 2. )
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      if (!isNumberedList) flushList();
      isNumberedList = true;
      listItems.push(
        <li key={`li-${index}`}>
          {renderFormattedText(numMatch[2])}
        </li>
      );
      return;
    }

    // Regular Paragraph
    flushList();
    elements.push(
      <p key={index} className={size.p}>
        {renderFormattedText(trimmed)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`max-w-none ${className}`}>
      {elements}
    </div>
  );
}
