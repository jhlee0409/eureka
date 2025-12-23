import { QAStatus, QAProgress, WbsStatus } from '../../../types';

// Team Members - 실제 환경에서는 API에서 가져오거나 환경변수로 관리
export const TEAM_MEMBERS = ['테스', '잭', '멜러리', '이리나', '미쉘', '션', '키요'] as const;
export type TeamMember = typeof TEAM_MEMBERS[number];

// QA Status Configuration
export const STATUS_CONFIG: Record<QAStatus, { label: string; color: string; bgColor: string }> = {
  'Reviewing': { label: '검토중', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-200' },
  'DevError': { label: 'Dev 오류', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'ProdError': { label: 'Prod 오류', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
  'DevDone': { label: 'Dev 완료', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  'ProdDone': { label: 'Prod 완료', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  'Hold': { label: '보류', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
  'Rejected': { label: '반려', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' },
  'Duplicate': { label: '중복', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
};

// Status display order for QA views
export const STATUS_ORDER: QAStatus[] = [
  'DevError', 'ProdError', 'Reviewing', 'Rejected', 'Hold', 'Duplicate', 'DevDone', 'ProdDone'
];

// WBS Status Configuration
export const WBS_STATUS_CONFIG: Record<WbsStatus, { label: string; color: string; bgColor: string }> = {
  'Planning': { label: '대기', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  'In Progress': { label: '진행중', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  'Done': { label: '완료', color: 'text-green-700', bgColor: 'bg-green-100' },
};

// Progress Steps for Developer View
export const PROGRESS_STEPS: { key: QAProgress; label: string }[] = [
  { key: 'Waiting', label: '대기' },
  { key: 'Checking', label: '확인' },
  { key: 'Working', label: '작업중' },
  { key: 'DevDeployed', label: 'Dev배포' },
  { key: 'ProdDeployed', label: 'Prod배포' },
];

// Unified Tab Types (replaces separate ViewMode and TabType)
export const UNIFIED_TABS = ['wbs', 'qa'] as const;
export type UnifiedTab = typeof UNIFIED_TABS[number];

export const UNIFIED_TAB_CONFIG: Record<UnifiedTab, { label: string; icon: string }> = {
  'wbs': { label: '기능', icon: '📋' },
  'qa': { label: 'TC', icon: '🧪' },
};

// Legacy types (for backward compatibility during migration)
export const VIEW_MODES = ['standard', 'developer', 'qa'] as const;
export type ViewMode = typeof VIEW_MODES[number];
export const TAB_TYPES = ['wbs', 'qa'] as const;
export type TabType = typeof TAB_TYPES[number];

// Validation helpers
export function isValidUnifiedTab(value: string | null): value is UnifiedTab {
  return value !== null && UNIFIED_TABS.includes(value as UnifiedTab);
}

export function isValidViewMode(value: string | null): value is ViewMode {
  return value !== null && VIEW_MODES.includes(value as ViewMode);
}

export function isValidTabType(value: string | null): value is TabType {
  return value !== null && TAB_TYPES.includes(value as TabType);
}
