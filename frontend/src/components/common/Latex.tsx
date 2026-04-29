import React from 'react';
import katex from 'katex';

interface LatexProps {
  text: string;
  className?: string;
}

export const Latex: React.FC<LatexProps> = ({ text, className }) => {
  if (!text) return null;

  // Regex to find $...$ and $$...$$
  // $$...$$ (display mode) or $...$ (inline mode)
  const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const content = part.slice(2, -2);
          try {
            const html = katex.renderToString(content, { displayMode: true, throwOnError: false });
            return <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />;
          } catch (e) {
            return <span key={index}>{part}</span>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const content = part.slice(1, -1);
          try {
            const html = katex.renderToString(content, { displayMode: false, throwOnError: false });
            return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
          } catch (e) {
            return <span key={index}>{part}</span>;
          }
        }
        return <span key={index}>{part}</span>;
      })}
    </div>
  );
};
