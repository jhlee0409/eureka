
import React, { useState } from 'react';
import { FigmaAuth } from '../types';

interface SetupFormProps {
  onSync: (auth: FigmaAuth) => void;
  loading: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ onSync, loading }) => {
  const [auth, setAuth] = useState<FigmaAuth>({
    personalAccessToken: localStorage.getItem('figma_pat') || '',
    fileKey: localStorage.getItem('figma_file_key') || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.personalAccessToken && auth.fileKey) {
      localStorage.setItem('figma_pat', auth.personalAccessToken);
      localStorage.setItem('figma_file_key', auth.fileKey);
      onSync(auth);
    }
  };

  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-md w-full mx-auto animate-in fade-in zoom-in duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">EUREKA <span className="text-yellow-500">유레카</span></h2>
        <p className="text-sm text-slate-500 mt-2 font-bold leading-snug">디자인 파일을 연결하여<br/>기획 및 품질 관리를 시작하세요.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">피그마 개인용 액세스 토큰</label>
          <input
            type="password"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-500 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
            placeholder="figd_..."
            value={auth.personalAccessToken}
            onChange={(e) => setAuth(prev => ({ ...prev, personalAccessToken: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">파일 URL 또는 키</label>
          <input
            type="text"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-500 outline-none transition-all text-slate-900 font-bold placeholder:text-slate-300"
            placeholder="https://figma.com/file/..."
            value={auth.fileKey}
            onChange={(e) => setAuth(prev => ({ ...prev, fileKey: e.target.value }))}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              동기화 중...
            </>
          ) : '작업 공간 동기화'}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-4 text-[10px] text-slate-500 font-bold leading-relaxed">
        <div className="w-5 h-5 shrink-0 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-700">!</div>
        <p>자동 그룹화를 위해 피그마 프레임 이름을 <span className="text-slate-900 font-black">AUTO_0001</span> 형식으로 지정해 주세요.</p>
      </div>
    </div>
  );
};

export default SetupForm;
