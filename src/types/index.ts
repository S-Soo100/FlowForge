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

// ── 이벤트 데이터 (JSONB에 저장) ──
export interface EventData {
  trigger?: EventTrigger;
  content?: string;       // 대사, 연출 메모 등
  effects?: EventEffect[];
}

// ── 이벤트 노드 (DB row) ──
export interface GameEvent {
  id: string;
  project_id: string;
  name: string;
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
  name: string;
  description?: string;
  trigger?: EventTrigger;
  content?: string;
  effects?: EventEffect[];
  next: Array<{
    target: string;         // target event id
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
