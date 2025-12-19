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

export interface WbsTask {
  id: string;
  name: string;
  detail: string;
  status: WbsStatus;
  assignee: string;
  startDate: string;
  endDate: string;
  originScreenId?: string; // Track which screen this belongs to
}

export type QAStatus =
  | 'Pending'      // 대기중
  | 'Reviewing'    // 확인중
  | 'DevDeployed'  // Dev 배포
  | 'DevError'     // Dev 오류
  | 'QADeployed'   // QA 배포
  | 'QAError'      // QA 오류
  | 'Done'         // 완료
  | 'Hold';        // 보류
export type QAPriority = 'High' | 'Medium' | 'Low';
export type QAPosition = 'Front-end' | 'Back-end' | 'Design' | 'PM';

export interface Comment {
  id: string;
  userName: string;
  timestamp: string;
  text: string;
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
  progress: number; // 0-100
  comments: Comment[];
  originScreenId?: string; // Track which screen this belongs to
}
