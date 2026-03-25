// ── 노드 타입 ──
export type NodeType = 'event' | 'switch' | 'setter';

// ── 게임 노드 (DB row) ──
export interface GameNode {
  id: string;
  project_id: string;
  node_type: NodeType;
  display_id: string;   // E001, S001
  name: string;
  summary?: string;     // event only
  detail?: string;      // event only
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
  created_at?: string;
}

// ── React Flow 노드 data ──
export interface EventNodeData {
  label: string;
  displayId: string;
  summary?: string;
  detail?: string;
  nodeType: 'event';
  dbId: string;
  [key: string]: unknown;
}

export interface SwitchNodeData {
  label: string;
  displayId: string;
  nodeType: 'switch';
  dbId: string;
  [key: string]: unknown;
}

export interface SetterNodeData {
  label: string;
  displayId: string;
  targetDisplayId: string;
  targetValue: string;
  nodeType: 'setter';
  dbId: string;
  [key: string]: unknown;
}

export type FlowNodeData = EventNodeData | SwitchNodeData | SetterNodeData;

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
  summary?: string;
  detail?: string;
  nodeData?: Record<string, unknown>;
  next: Array<{
    target: string;
    targetDisplayId?: string;
    targetName?: string;
    label?: string;
  }>;
}

export interface ExportedProject {
  project: {
    name: string;
    description?: string;
    exportedAt: string;
  };
  nodes: ExportedNode[];
}
