'use client';

import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export default function MarkdownViewer({ content, className = '' }: Props) {
  if (!content) return null;

  // Simple, safe Markdown parser
  const renderFormattedText = (text: string) => {
    // Process bold, italic, code
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-navy-dark">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-slate-700">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-navy font-mono text-xs">{part.slice(1, -1)}</code>;
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
          <ol key={`list-${elements.length}`} className="list-decimal list-outside ml-6 flex flex-col gap-1.5 my-2 text-sm text-slate-700 leading-relaxed">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-outside ml-6 flex flex-col gap-1.5 my-2 text-sm text-slate-700 leading-relaxed">
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
        <h4 key={index} className="text-sm font-bold text-navy-dark mt-4 mb-1">
          {renderFormattedText(trimmed.slice(5))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-base font-extrabold text-navy-dark mt-5 mb-2 pb-1 border-b border-slate-100">
          {renderFormattedText(trimmed.slice(4))}
        </h3>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-lg font-extrabold text-navy-dark mt-6 mb-2">
          {renderFormattedText(trimmed.slice(3))}
        </h2>
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-xl font-extrabold text-navy-dark mt-6 mb-3">
          {renderFormattedText(trimmed.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={index} className="border-l-4 border-gold bg-amber-50/60 rounded-r-xl px-4 py-2 my-2 text-sm text-slate-700 italic">
          {renderFormattedText(trimmed.slice(2))}
        </blockquote>
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
      <p key={index} className="text-sm text-slate-700 leading-relaxed my-1.5">
        {renderFormattedText(trimmed)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`prose-sm max-w-none ${className}`}>
      {elements}
    </div>
  );
}
