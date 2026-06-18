import { useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp }        from '@codemirror/lang-cpp';
import { python }     from '@codemirror/lang-python';
import { java }       from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';

const LANGUAGES = {
  cpp:        { label: 'C++',        extension: cpp() },
  python:     { label: 'Python',     extension: python() },
  java:       { label: 'Java',       extension: java() },
  javascript: { label: 'JavaScript', extension: javascript() },
};

/**
 * Code editor for DSA-style answers. Lets the user pick a language and
 * write code with syntax highlighting, instead of a plain textarea.
 *
 * `onChange` receives the raw code (no language prefix attached) — the
 * caller decides whether/how to combine it with the selected language
 * before sending it to the backend.
 */
export default function CodeAnswerEditor({ value, onChange, language, onLanguageChange }) {
  const [lang, setLang] = useState(language || 'cpp');

  const handleLangChange = (e) => {
    const next = e.target.value;
    setLang(next);
    onLanguageChange?.(next);
  };

  return (
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
  );
}