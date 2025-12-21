/**
 * 브라우저에서 자동으로 수집 가능한 디바이스/환경 정보
 */

export interface DeviceInfo {
  // 브라우저 정보
  browser: string;
  browserVersion: string;
  userAgent: string;

  // OS 정보
  os: string;
  platform: string;

  // 화면 정보
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  colorDepth: number;

  // 디바이스 특성
  deviceType: 'desktop' | 'tablet' | 'mobile';
  touchSupport: boolean;

  // 네트워크
  online: boolean;
  connectionType?: string;

  // 시간/로케일
  timezone: string;
  language: string;
  timestamp: string;

  // 앱 상태
  currentUrl: string;
}

/**
 * 브라우저/OS 정보 파싱
 */
function parseBrowserInfo(ua: string): { browser: string; version: string; os: string } {
  let browser = 'Unknown';
  let version = '';
  let os = 'Unknown';

  // OS 감지
  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows NT 11') || (ua.includes('Windows NT 10') && ua.includes('Win64'))) os = 'Windows 11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) {
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  }
  else if (ua.includes('Android')) {
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    os = match ? `Android ${match[1]}` : 'Android';
  }
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) {
    const match = ua.match(/OS (\d+[._]\d+)/);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  }
  else if (ua.includes('Linux')) os = 'Linux';

  // 브라우저 감지 (순서 중요 - 더 구체적인 것 먼저)
  if (ua.includes('Edg/')) {
    browser = 'Edge';
    const match = ua.match(/Edg\/(\d+(\.\d+)?)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Chrome/') && !ua.includes('Chromium')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+(\.\d+)?)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+(\.\d+)?)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    const match = ua.match(/Version\/(\d+(\.\d+)?)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    browser = 'Opera';
    const match = ua.match(/(?:Opera|OPR)\/(\d+(\.\d+)?)/);
    version = match ? match[1] : '';
  }

  return { browser, version, os };
}

/**
 * 디바이스 타입 감지
 */
function detectDeviceType(ua: string, screenWidth: number): 'desktop' | 'tablet' | 'mobile' {
  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(ua);

  if (isTabletUA || (screenWidth >= 768 && screenWidth < 1024 && isMobileUA)) {
    return 'tablet';
  }
  if (isMobileUA || screenWidth < 768) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * 네트워크 연결 타입 가져오기 (Chrome 전용)
 */
function getConnectionType(): string | undefined {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    return conn?.effectiveType;
  }
  return undefined;
}

/**
 * 현재 디바이스/환경 정보 수집
 */
export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    // SSR 환경
    return {
      browser: 'Unknown',
      browserVersion: '',
      userAgent: '',
      os: 'Unknown',
      platform: '',
      screenResolution: '',
      viewportSize: '',
      devicePixelRatio: 1,
      colorDepth: 24,
      deviceType: 'desktop',
      touchSupport: false,
      online: true,
      timezone: 'UTC',
      language: 'ko',
      timestamp: new Date().toISOString(),
      currentUrl: '',
    };
  }

  const ua = navigator.userAgent;
  const { browser, version, os } = parseBrowserInfo(ua);

  return {
    // 브라우저
    browser,
    browserVersion: version,
    userAgent: ua,

    // OS
    os,
    platform: navigator.platform || '',

    // 화면
    screenResolution: `${screen.width}x${screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio || 1,
    colorDepth: screen.colorDepth || 24,

    // 디바이스 특성
    deviceType: detectDeviceType(ua, screen.width),
    touchSupport: navigator.maxTouchPoints > 0 || 'ontouchstart' in window,

    // 네트워크
    online: navigator.onLine,
    connectionType: getConnectionType(),

    // 시간/로케일
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    timestamp: new Date().toISOString(),

    // 앱 상태
    currentUrl: window.location.href,
  };
}

/**
 * 환경 정보를 읽기 쉬운 문자열로 포맷팅
 */
export function formatDeviceInfoString(info: DeviceInfo): string {
  const lines = [
    `🖥️ ${info.browser} ${info.browserVersion} / ${info.os}`,
    `📱 ${info.deviceType === 'mobile' ? '모바일' : info.deviceType === 'tablet' ? '태블릿' : '데스크톱'}`,
    `📐 화면: ${info.screenResolution} (뷰포트: ${info.viewportSize})`,
    `🌐 ${info.online ? '온라인' : '오프라인'}${info.connectionType ? ` (${info.connectionType})` : ''}`,
    `⏰ ${info.timezone} / ${info.language}`,
  ];

  if (info.touchSupport) {
    lines.splice(2, 0, '👆 터치 지원');
  }

  return lines.join('\n');
}

/**
 * 환경 정보를 간략한 한 줄 요약으로
 */
export function formatDeviceInfoShort(info: DeviceInfo): string {
  const deviceIcon = info.deviceType === 'mobile' ? '📱' : info.deviceType === 'tablet' ? '📱' : '🖥️';
  return `${deviceIcon} ${info.browser} ${info.browserVersion} | ${info.os} | ${info.viewportSize}`;
}

/**
 * 자동 수집 가능한 항목 목록 (UI 표시용)
 */
export const AUTO_COLLECTIBLE_ITEMS = [
  { key: 'browser', label: '브라우저', icon: '🌐', description: '브라우저 이름 및 버전' },
  { key: 'os', label: '운영체제', icon: '💻', description: 'OS 종류 및 버전' },
  { key: 'deviceType', label: '디바이스 타입', icon: '📱', description: '데스크톱/태블릿/모바일' },
  { key: 'screenResolution', label: '화면 해상도', icon: '📐', description: '모니터 전체 해상도' },
  { key: 'viewportSize', label: '뷰포트 크기', icon: '🪟', description: '브라우저 창 크기' },
  { key: 'touchSupport', label: '터치 지원', icon: '👆', description: '터치스크린 여부' },
  { key: 'online', label: '네트워크 상태', icon: '📶', description: '온라인/오프라인' },
  { key: 'connectionType', label: '연결 타입', icon: '📡', description: '4G/WiFi 등 (Chrome)' },
  { key: 'timezone', label: '시간대', icon: '⏰', description: '사용자 타임존' },
  { key: 'language', label: '언어', icon: '🌍', description: '브라우저 언어 설정' },
  { key: 'timestamp', label: '발생 시각', icon: '📅', description: '이슈 등록 시점' },
  { key: 'currentUrl', label: '현재 URL', icon: '🔗', description: '이슈 발생 페이지' },
] as const;
