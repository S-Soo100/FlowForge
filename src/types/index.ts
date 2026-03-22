// ── 이벤트 트리거 ──
export interface EventTrigger {
  type: string;   // "quest_complete", "state_check", "manual" 등
  value: string;  // 자유 텍스트 — Phase 2에서 구조화 가능
}

// ── 이벤트 효과 ──
export interface EventEffect {
  type: 'set_state' | 'call_event' | string; // 확장 가능
  key?: string;
  value?: string | number | boolean;
  targetEventId?: string;
}

// ── 이벤트 타입 ──
export const EVENT_TYPES = ['dialogue', 'combat', 'cutscene', 'system', 'other'] as const;
export type EventType = typeof EVENT_TYPES[number];

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; border: string }> = {
  dialogue: { label: '대화', color: 'bg-green-100 text-green-700', border: 'border-green-400' },
  combat:   { label: '전투', color: 'bg-red-100 text-red-700', border: 'border-red-400' },
  cutscene: { label: '컷씬', color: 'bg-purple-100 text-purple-700', border: 'border-purple-400' },
  system:   { label: '시스템', color: 'bg-blue-100 text-blue-700', border: 'border-blue-400' },
  other:    { label: '기타', color: 'bg-gray-100 text-gray-600', border: 'border-gray-300' },
};

// ── 이벤트 데이터 (JSONB에 저장) ──
export interface EventData {
  trigger?: EventTrigger;
  content?: string;       // 대사, 연출 메모 등
  effects?: EventEffect[];
  eventType?: EventType;
}

// ── 이벤트 노드 (DB row) ──
export interface GameEvent {
  id: string;
  project_id: string;
  name: string;
  display_id: string;   // EVT-001 형식의 자동 ID
  description?: string;
  position_x: number;
  position_y: number;
  event_data: EventData;
  created_at?: string;
  updated_at?: string;
}

// ── 이벤트 엣지 (DB row) ──
export interface GameEventEdge {
  id: string;
  project_id: string;
  source_event_id: string;
  target_event_id: string;
  condition_label?: string;
  sort_order: number;
  created_at?: string;
}

// ── 프로젝트 ──
export type ProjectRole = 'editor' | 'viewer';

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at?: string;
}

// ── JSON Export 포맷 ──
export interface ExportedEvent {
  id: string;
  displayId: string;
  name: string;
  type?: EventType;
  description?: string;
  trigger?: EventTrigger;
  content?: string;
  effects?: EventEffect[];
  next: Array<{
    target: string;         // target event id (uuid)
    targetDisplayId?: string; // EVT-002
    targetName?: string;    // 읽기 편하도록 이름도 포함
    condition?: string;
  }>;
}

export interface ExportedProject {
  project: {
    name: string;
    description?: string;
    exportedAt: string;
  };
  events: ExportedEvent[];
}
