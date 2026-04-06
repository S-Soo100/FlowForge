// ── 노드 타입 ──
export type NodeType = 'event';

// ── 이벤트 진행 블럭 ──
export interface ProgressionBlock {
  type: 'system' | 'text' | 'background';
  content: string;
}

// ── 이벤트 선택지 ──
export interface ChoicesData {
  label?: string;
  items: string[];
}

// ── 이벤트 발생 조건 ──
export interface ConditionItem {
  variableKey: string;
  comparator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  value: string;
}

export interface ConditionGroup {
  operator: 'and' | 'or';
  items: ConditionItem[];
}

// ── 게임 노드 (DB row) ──
export interface GameNode {
  id: string;
  project_id: string;
  node_type: NodeType;
  display_id: string;   // E001
  name: string;
  summary?: string;     // 레거시 (더 이상 사용 안 함, 빈 문자열 유지)
  detail?: string;      // 레거시 (더 이상 사용 안 함, 빈 문자열 유지)
  node_data: Record<string, unknown>;
  position_x: number;
  position_y: number;
  created_at?: string;
  updated_at?: string;
}

// ── 게임 엣지 (DB row) ──
export interface GameEdge {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  label?: string;
  sort_order: number;
  bend_points?: unknown;  // ELK 엣지 라우팅 데이터 (jsonb)
  created_at?: string;
}

// ── React Flow 노드 data ──
export interface EventNodeData {
  label: string;               // 이벤트 이름
  displayId: string;           // E001
  declaration?: string;        // 이벤트 발생 선언 (레거시, 하위호환)
  conditions?: ConditionGroup | null;  // 이벤트 발생 조건
  progression?: ProgressionBlock[] | null;  // 이벤트 진행 블럭 배열
  choices?: ChoicesData | null;   // 이벤트 선택지
  nodeType: 'event';
  dbId: string;
  [key: string]: unknown;
}

export type FlowNodeData = EventNodeData;

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
export interface ExportedNode {
  id: string;
  displayId: string;
  nodeType: NodeType;
  name: string;
  declaration?: string;
  conditions?: ConditionGroup | null;
  progression?: ProgressionBlock[] | null;
  choices?: ChoicesData | null;
  next: Array<{
    target: string;
    targetDisplayId?: string;
    targetName?: string;
    label?: string;
  }>;
}

export interface ExportedVariable {
  category: VariableCategory;
  key: string;
  value_type?: VariableValueType;
  default_value?: string;
  file_name?: string;
}

export interface ExportedProject {
  project: {
    name: string;
    description?: string;
    exportedAt: string;
  };
  nodes: ExportedNode[];
  variables?: ExportedVariable[];
}

// ── 프로젝트 변수 ──
export type VariableCategory = 'variable' | 'background' | 'character';
export type VariableValueType = 'string' | 'number' | 'boolean';

export interface ProjectVariable {
  id: string;
  project_id: string;
  category: VariableCategory;
  key: string;
  value_type?: VariableValueType;  // variable만 사용
  default_value?: string;           // variable만 사용
  file_name?: string;              // background, character만 사용
  sort_order: number;
  created_at?: string;
}
