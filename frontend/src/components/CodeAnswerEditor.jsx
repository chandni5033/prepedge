import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp }        from '@codemirror/lang-cpp';
import { python }     from '@codemirror/lang-python';
import { java }       from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import api from '../services/api';

const LANGUAGES = {
  cpp:        { label: 'C++',        extension: cpp() },
  python:     { label: 'Python',     extension: python() },
  java:       { label: 'Java',       extension: java() },
  javascript: { label: 'JavaScript', extension: javascript() },
};

const STATUS_STYLE = {
  3:  { label: '✅ Accepted',               color: 'text-green-600 bg-green-50 border-green-200' },
  4:  { label: '❌ Wrong Answer',           color: 'text-red-600 bg-red-50 border-red-200' },
  5:  { label: '⏱ Time Limit Exceeded',    color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  6:  { label: '🔴 Compilation Error',      color: 'text-red-600 bg-red-50 border-red-200' },
  7:  { label: '💥 Runtime Error',          color: 'text-orange-600 bg-orange-50 border-orange-200' },
  8:  { label: '💥 Runtime Error',          color: 'text-orange-600 bg-orange-50 border-orange-200' },
  9:  { label: '💥 Runtime Error',          color: 'text-orange-600 bg-orange-50 border-orange-200' },
  10: { label: '💥 Runtime Error',          color: 'text-orange-600 bg-orange-50 border-orange-200' },
  11: { label: '💥 Runtime Error',          color: 'text-orange-600 bg-orange-50 border-orange-200' },
  12: { label: '💥 Runtime Error (Other)',  color: 'text-orange-600 bg-orange-50 border-orange-200' },
};

export default function CodeAnswerEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  expectedOutput = '',
}) {
  const [lang,     setLang    ] = useState(language || 'cpp');
  const [stdin,    setStdin   ] = useState('');
  const [result,   setResult  ] = useState(null);
  const [running,  setRunning ] = useState(false);
  const [runError, setRunError] = useState('');

  const handleLangChange = (e) => {
    const next = e.target.value;
    setLang(next);
    onLanguageChange?.(next);
  };

  const handleRun = async () => {
    if (!value.trim()) return;
    setRunning(true);
    setResult(null);
    setRunError('');
    try {
      const { data } = await api.post('/code/run', {
        source_code:     value,
        language:        lang,
        stdin,
        expected_output: expectedOutput,
      });
      setResult(data);
    } catch (err) {
      setRunError(
        err.response?.data?.message || 'Failed to run code. Check your network or try again.'
      );
    } finally {
      setRunning(false);
    }
  };

  const statusStyle = result
    ? (STATUS_STYLE[result.status?.id] || { label: result.status?.description, color: 'text-gray-600 bg-gray-50 border-gray-200' })
    : null;

  return (
    <div className="flex flex-col gap-3">

      {/* ── Editor ── */}
      <div className="border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-300">
        <div className="flex items-center justify-between bg-gray-50 border-b px-3 py-2">
          <span className="text-xs font-medium text-gray-500">Code editor</span>
          <select
            value={lang}
            onChange={handleLangChange}
            className="text-xs border rounded-md px-2 py-1 bg-white focus:outline-none"
          >
            {Object.entries(LANGUAGES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <CodeMirror
          value={value}
          height="280px"
          extensions={[LANGUAGES[lang].extension]}
          onChange={onChange}
          basicSetup={{ lineNumbers: true, foldGutter: true }}
          placeholder="Write your code here…"
        />
      </div>

      {/* ── Stdin ── */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Custom Input (stdin)
        </label>
        <textarea
          value={stdin}
          onChange={e => setStdin(e.target.value)}
          rows={2}
          placeholder="Optional — leave blank if the problem takes no input"
          className="w-full border rounded-lg p-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* ── Run button ── */}
      <button
        onClick={handleRun}
        disabled={running || !value.trim()}
        className="self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {running ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Running…
          </>
        ) : '▶ Run Code'}
      </button>

      {/* ── Error ── */}
      {runError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {runError}
        </p>
      )}

      {/* ── Result panel ── */}
      {result && (
        <div className="border rounded-xl overflow-hidden text-sm">

          {/* Status bar */}
          <div className={`flex items-center justify-between px-3 py-2 border-b font-medium ${statusStyle.color}`}>
            <span>{statusStyle.label}</span>
            {result.time && (
              <span className="text-xs font-normal text-gray-500">
                {result.time}s · {result.memory ? `${(result.memory / 1024).toFixed(1)} MB` : '—'}
              </span>
            )}
          </div>

          {/* Compilation error */}
          {result.compile_output && (
            <div className="px-3 py-2 bg-red-50 border-b">
              <p className="text-xs font-semibold text-red-700 mb-1">Compilation Error</p>
              <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">{result.compile_output}</pre>
            </div>
          )}

          {/* stdout */}
          {result.stdout && (
            <div className="px-3 py-2 bg-gray-50 border-b">
              <p className="text-xs font-semibold text-gray-600 mb-1">Output</p>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">{result.stdout}</pre>
            </div>
          )}

          {/* stderr */}
          {result.stderr && (
            <div className="px-3 py-2 bg-orange-50">
              <p className="text-xs font-semibold text-orange-700 mb-1">Runtime Error</p>
              <pre className="text-xs text-orange-700 whitespace-pre-wrap font-mono">{result.stderr}</pre>
            </div>
          )}

          {/* No output */}
          {!result.stdout && !result.stderr && !result.compile_output && (
            <div className="px-3 py-2 bg-gray-50">
              <p className="text-xs text-gray-400 italic">No output</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}