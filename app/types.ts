export interface FigmaAuth {
  personalAccessToken: string;
  fileKey: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string; // For TEXT nodes
}

export interface TextStyleData {
  characters: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  textAlign: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CoverData {
  backgroundColor: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  width: number;
  height: number;
  textNodes: TextStyleData[];
}

export interface ScreenData {
  id: string;
  figmaId: string;
  name: string;
  thumbnailUrl?: string;
  description: string;
  screenInformation?: string; // Enhanced field for screen information
  baseId: string;
  suffix?: string;
  isParent: boolean;
  pageName: string;
  sectionName?: string;
  createdDate?: string;
  coverData?: CoverData; // Cover page rendering data
}

export interface ScreenGroup {
  parent: ScreenData;
  children: ScreenData[];
  pageName: string;
}

export interface PrefixGroup {
  prefix: string; // AUTO, PSET, LINK, etc.
  baseIds: {
    [baseId: string]: ScreenData[];  // AUTO_0002 -> [AUTO_0002_1, AUTO_0002_ㅅ, AUTO_0002_3, AUTO_0002_4]
  };
  pageName: string;
  coverData?: CoverData;
}

export interface ParsedState {
  pages: Record<string, Record<string, ScreenGroup>>;
  loading: boolean;
  error: string | null;
}

export type WbsStatus = 'Planning' | 'In Progress' | 'Done';
export type WbsCategory = 'ui' | 'feature' | 'bugfix' | 'planning' | 'optimization';
export type WbsDifficulty = 'easy' | 'medium' | 'hard';

export interface WbsSubTask {
  id: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  completed: boolean;
}

export interface WbsTask {
  id: string;
  name: string;
  detail: string;
  status: WbsStatus;
  assignee: string;
  startDate: string;
  endDate: string;
  originScreenId?: string;
  // 확장 필드
  category?: WbsCategory;
  difficulty?: WbsDifficulty;
  relatedTcIds?: string[];  // 연결된 TC
  subtasks?: WbsSubTask[];  // 하위 작업
}

// TC 자체의 상태
export type QAStatus =
  | 'Reviewing'    // 검토중
  | 'DevError'     // Dev 오류
  | 'ProdError'    // Prod 오류
  | 'DevDone'      // Dev 완료
  | 'ProdDone'     // Prod 완료
  | 'Hold'         // 보류
  | 'Rejected'     // 반려
  | 'Duplicate';   // 중복

// 담당자 진행도
export type QAProgress =
  | 'Waiting'      // 대기
  | 'Checking'     // 확인
  | 'Working'      // 작업 중
  | 'DevDeployed'  // Dev 배포
  | 'ProdDeployed'; // Prod 배포

export type QAPriority = 'High' | 'Medium' | 'Low';
export type QAPosition = 'Front-end' | 'Back-end' | 'Design' | 'PM';
export type IssueType = 'bug' | 'improvement' | 'question' | 'task';
export type RejectReason = 'not_reproducible' | 'working_as_designed' | 'duplicate' | 'insufficient_info' | 'out_of_scope';
export type DeployEnv = 'dev' | 'staging' | 'prod';

export interface Comment {
  id: string;
  userName: string;
  timestamp: string;
  text: string;
}

export interface VerificationItem {
  id: string;
  text: string;
  checked: boolean;
}

// 활동 로그 (타임라인용)
export interface ActivityLog {
  id: string;
  tcId: string;
  action: 'created' | 'status_changed' | 'assigned' | 'commented' | 'verified' | 'rejected' | 'deployed';
  actor: string;
  actorRole: 'qa' | 'developer';
  timestamp: string;
  details?: {
    fromStatus?: QAStatus;
    toStatus?: QAStatus;
    fromProgress?: QAProgress;
    toProgress?: QAProgress;
    comment?: string;
    deployEnv?: DeployEnv;
    rejectReason?: RejectReason;
  };
}

export interface TestCase {
  id: string;
  checkpoint?: string; // 체크포인트 (탭 내 위치)
  scenario: string; // Summary
  issueContent: string; // Detailed content
  referenceLink?: string; // 참조 링크
  date: string;
  status: QAStatus;
  reporter: string;
  priority: QAPriority;
  position: QAPosition;
  assignee: string;
  progress: QAProgress; // 담당자 진행도
  comments: Comment[];
  originScreenId?: string;
  // 확장 필드
  issueType?: IssueType;           // 이슈 유형
  reproductionSteps?: string;      // 재현 방법
  expectedResult?: string;         // 기대 결과
  environment?: string;            // 테스트 환경
  relatedWbsId?: string;           // 연결된 WBS
  verificationChecklist?: VerificationItem[];  // 검증 체크리스트
  rejectReason?: RejectReason;     // 반려 사유
  deployedEnvs?: DeployEnv[];      // 배포된 환경
  activityLog?: ActivityLog[];     // 활동 로그
}
