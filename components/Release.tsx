import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Enables tables and GFM features

interface ReleaseProps {
  onGoHome: () => void;
}

export const Release: React.FC<ReleaseProps> = ({ onGoHome }) => {
  const [changelogContent, setChangelogContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/CHANGELOG.md');
        if (!response.ok) {
          throw new Error('Failed to load changelog');
        }
        const content = await response.text();
        setChangelogContent(content);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading changelog:', err);
        setError('Không thể tải nội dung changelog. Vui lòng thử lại sau.');
        setIsLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo onClick={onGoHome} />
          <button
            onClick={onGoHome}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại trang chủ
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-4xl mx-auto">
          {/* Custom Main Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-2 tracking-tight text-blue-700">
            MoodTrip – Release Notes
          </h1>
          {/* Render Markdown Content */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 py-10">
              <p className="text-lg font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="prose max-w-none dark:prose-invert markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  span: ({node, className, children}) => {
                    if (className === 'release-date') {
                      return <>{children}</>;
                    }
                    return <span>{children}</span>;
                  },
                  sub: ({children}) => <>{children}</>,
                  sup: ({children}) => <>{children}</>,
                }}
              >
                {changelogContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

document.addEventListener('DOMContentLoaded', function () {
  const style = document.createElement('style');
  style.innerHTML = `
    .markdown-body table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 1rem;
    }
    .markdown-body th, .markdown-body td {
      border: 1px solid #ddd;
      padding: 8px;
    }
    .markdown-body th {
      background-color: #f4f4f4;
      font-weight: bold;
      text-align: left;
    }
    /* Custom style for release headings */
    .markdown-body h1 {
      font-size: 2.5rem;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      color: #1d4ed8;
      text-align: left;
      font-weight: 900;
      background: linear-gradient(90deg, #38bdf8 0%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .markdown-body h2 {
      font-size: 2rem;
      margin-top: 2.5rem;
      margin-bottom: 0.5rem;
      color: #2563eb;
      text-align: left;
      font-weight: 800;
      border-left: 6px solid #38bdf8;
      padding-left: 0.75rem;
      background-color: #f0f9ff;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    .markdown-body h3 {
      font-size: 1.35rem;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: #0ea5e9;
      font-weight: 700;
      background-color: #f0f9ff;
      padding: 0.25rem 0.75rem;
      border-radius: 0.5rem;
      display: inline-block;
    }
    /* Custom style for release date */
    .markdown-body .release-date {
      display: block;
      color: #64748b;
      font-size: 1rem;
      margin-bottom: 1.5rem;
      margin-top: -1rem;
      text-align: left;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
});
