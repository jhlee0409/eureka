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

export interface ScreenData {
  id: string;
  figmaId: string;
  name: string;
  thumbnailUrl?: string;
  description: string;
  baseId: string;
  suffix?: string;
  isParent: boolean;
  pageName: string;
  sectionName?: string;
  createdDate?: string;
}

export interface ScreenGroup {
  parent: ScreenData;
  children: ScreenData[];
  pageName: string;
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

export type QAStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
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
  scenario: string; // Summary
  issueContent: string; // Detailed content
  referenceImage?: string;
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
