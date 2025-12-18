'use client';

import React, { useState } from 'react';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

type ApiType = 'auto' | 'file' | 'nodes' | 'project' | 'team-projects' | 'images';

interface ParsedUrl {
  type: ApiType;
  fileKey?: string;
  nodeIds?: string[];
  projectId?: string;
  teamId?: string;
}

function parseUrl(input: string): ParsedUrl {
  const trimmed = input.trim();

  // Extract file key from URL patterns
  const fileMatch = trimmed.match(/(?:file|design)\/([a-zA-Z0-9]{22,128})/);

  // Extract project ID from URL pattern
  const projectMatch = trimmed.match(/files\/project\/(\d+)/);

  // Extract team ID from URL pattern
  const teamMatch = trimmed.match(/files\/team\/(\d+)/);

  // Extract node-id from URL query params
  const urlParams = trimmed.includes('?')
    ? new URLSearchParams(trimmed.split('?')[1])
    : null;
  let nodeId = urlParams?.get('node-id');

  if (projectMatch) {
    return { type: 'project', projectId: projectMatch[1] };
  }

  if (teamMatch) {
    return { type: 'team-projects', teamId: teamMatch[1] };
  }

  if (fileMatch) {
    const fileKey = fileMatch[1];
    if (nodeId) {
      // Convert node-id format: 123-456 -> 123:456
      nodeId = nodeId.replace(/-/g, ':');
      return { type: 'nodes', fileKey, nodeIds: [nodeId] };
    }
    return { type: 'file', fileKey };
  }

  // If no URL pattern matched, treat as raw file key or node ID
  if (trimmed.includes(':') || trimmed.includes('-')) {
    // Looks like a node ID format
    const parts = trimmed.split(',').map(p => p.trim().replace(/-/g, ':'));
    return { type: 'nodes', nodeIds: parts };
  }

  // Assume it's a file key
  return { type: 'file', fileKey: trimmed };
}

function buildApiUrl(parsed: ParsedUrl, fileKeyOverride?: string): string {
  switch (parsed.type) {
    case 'file':
      return `${FIGMA_API_BASE}/files/${parsed.fileKey || fileKeyOverride}`;
    case 'nodes':
      const fk = parsed.fileKey || fileKeyOverride;
      const ids = parsed.nodeIds?.join(',') || '';
      return `${FIGMA_API_BASE}/files/${fk}/nodes?ids=${encodeURIComponent(ids)}`;
    case 'project':
      return `${FIGMA_API_BASE}/projects/${parsed.projectId}/files`;
    case 'team-projects':
      return `${FIGMA_API_BASE}/teams/${parsed.teamId}/projects`;
    case 'images':
      return `${FIGMA_API_BASE}/images/${parsed.fileKey || fileKeyOverride}`;
    default:
      return '';
  }
}

export default function FigmaTestPage() {
  const [token, setToken] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileKeyInput, setFileKeyInput] = useState('');
  const [apiType, setApiType] = useState<ApiType>('auto');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('');

  const handleFetch = async () => {
    if (!token) {
      setError('Personal Access Token이 필요합니다.');
      return;
    }

    if (!urlInput && !fileKeyInput) {
      setError('Figma URL 또는 File Key를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let parsed = parseUrl(urlInput || fileKeyInput);

      // Override type if manually selected
      if (apiType !== 'auto') {
        parsed = { ...parsed, type: apiType };
      }

      // For nodes API, need file key
      if (parsed.type === 'nodes' && !parsed.fileKey && fileKeyInput) {
        parsed.fileKey = fileKeyInput;
      }

      const url = buildApiUrl(parsed, fileKeyInput);

      if (!url) {
        throw new Error('유효한 API URL을 생성할 수 없습니다.');
      }

      setApiUrl(url);

      const res = await fetch(url, {
        headers: { 'X-Figma-Token': token }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(`API Error ${res.status}: ${data.err || data.message || res.statusText}`);
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Header */}
      <header className="bg-[#0F172A] border-b border-slate-800 h-16 flex items-center px-8 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <a href="/" className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 font-black text-sm">E</a>
          <div>
            <h1 className="text-lg font-black tracking-tight">Figma API <span className="text-yellow-400">Test</span></h1>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">API Response Viewer</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        {/* Input Section */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 mb-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Configuration</h2>

          <div className="space-y-4">
            {/* Token Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Figma URL / Path
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.figma.com/design/xxxxx... or project/file/section path"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 outline-none transition-all placeholder:text-slate-600"
              />
              <p className="text-[10px] text-slate-600 mt-1.5">
                프로젝트: /files/project/123... | 파일: /design/xxxxx... | 섹션: ?node-id=xxx
              </p>
            </div>

            {/* File Key Override */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                File Key (Optional - for node queries)
              </label>
              <input
                type="text"
                value={fileKeyInput}
                onChange={(e) => setFileKeyInput(e.target.value)}
                placeholder="File key if querying specific nodes"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 outline-none transition-all placeholder:text-slate-600"
              />
            </div>

            {/* API Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                API Type
              </label>
              <div className="flex flex-wrap gap-2">
                {(['auto', 'file', 'nodes', 'project', 'team-projects', 'images'] as ApiType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setApiType(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      apiType === type
                        ? 'bg-yellow-400 text-slate-900'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Fetch Button */}
            <button
              onClick={handleFetch}
              disabled={loading}
              className="w-full py-4 bg-yellow-400 text-slate-900 font-black text-sm uppercase tracking-widest rounded-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Fetching...' : 'Fetch API Response'}
            </button>
          </div>
        </div>

        {/* API URL Display */}
        {apiUrl && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">API Endpoint</span>
              <button
                onClick={() => copyToClipboard(apiUrl)}
                className="text-xs font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-wider"
              >
                Copy
              </button>
            </div>
            <code className="text-sm text-green-400 font-mono break-all">{apiUrl}</code>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-red-400 uppercase tracking-wider">Error</span>
            </div>
            <p className="text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Response Display */}
        {response && (
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response JSON</span>
              <button
                onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                className="text-xs font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-wider"
              >
                Copy JSON
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-auto">
              <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Usage Guide */}
        {!response && !error && !loading && (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Usage Guide</h3>
            <div className="space-y-4 text-sm text-slate-500">
              <div>
                <h4 className="font-bold text-slate-400 mb-1">Supported URL Formats:</h4>
                <ul className="list-disc list-inside space-y-1 font-mono text-xs">
                  <li>File: https://www.figma.com/design/FILE_KEY/...</li>
                  <li>Node: https://www.figma.com/design/FILE_KEY/...?node-id=123-456</li>
                  <li>Project: https://www.figma.com/files/project/PROJECT_ID/...</li>
                  <li>Team: https://www.figma.com/files/team/TEAM_ID/...</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-400 mb-1">API Types:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><span className="font-mono">auto</span> - URL에서 자동으로 API 타입 감지</li>
                  <li><span className="font-mono">file</span> - GET /files/:file_key</li>
                  <li><span className="font-mono">nodes</span> - GET /files/:file_key/nodes?ids=...</li>
                  <li><span className="font-mono">project</span> - GET /projects/:project_id/files</li>
                  <li><span className="font-mono">team-projects</span> - GET /teams/:team_id/projects</li>
                  <li><span className="font-mono">images</span> - GET /images/:file_key</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
