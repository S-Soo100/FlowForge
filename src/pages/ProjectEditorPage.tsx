import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useEventGraph } from '../hooks/useEventGraph';
import { useHistory } from '../hooks/useHistory';
import { useProjectRole } from '../hooks/useProjectRole';
import { EventCanvas } from '../components/graph/EventCanvas';
import { EventDetailPanel } from '../components/detail/EventDetailPanel';
import { ValidationPanel } from '../components/graph/ValidationPanel';
import { ProjectSettingsPanel } from '../components/project/ProjectSettingsPanel';
import { Toolbar } from '../components/graph/Toolbar';
import { AddEventModal } from '../components/graph/AddEventModal';
import { exportProject, downloadJson } from '../lib/exportProject';
import { importProject } from '../lib/importProject';
import { getAutoLayout } from '../lib/autoLayout';
import { validateGraph, type ValidationWarning } from '../lib/validate';
import type { Project, EventType, ExportedProject } from '../types';
import type { EventNodeData } from '../hooks/useEventGraph';

function EditorContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fitView, setNodes: rfSetNodes } = useReactFlow();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const graph = useEventGraph(projectId!);
  const history = useHistory();
  const { canEdit, loading: roleLoading } = useProjectRole(projectId!, user?.id);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId!)
      .single()
      .then(({ data }) => setProject(data as Project));
  }, [projectId]);

  // ── 이벤트 추가 ──
  const handleAddEvent = useCallback(async (name: string, eventType: EventType) => {
    history.pushSnapshot(graph.nodes, graph.edges);
    const x = 250 + Math.random() * 200;
    const y = 100 + graph.nodes.length * 120;
    await graph.addEvent(name, x, y, eventType);
    setShowAddModal(false);
  }, [graph, history]);

  // ── Export ──
  const handleExport = useCallback(() => {
    if (!project) return;
    const data = exportProject(project.name, project.description, graph.nodes, graph.edges);
    downloadJson(data);
  }, [project, graph.nodes, graph.edges]);

  // ── Import ──
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text) as ExportedProject;

      if (!json.events || !Array.isArray(json.events)) {
        alert('올바른 FlowForge JSON 파일이 아닙니다.');
        return;
      }

      if (!confirm(`${json.events.length}개 이벤트를 가져올까요? 기존 데이터는 삭제됩니다.`)) return;

      const result = await importProject(projectId!, json);
      alert(`가져오기 완료: 이벤트 ${result.eventCount}개, 연결 ${result.edgeCount}개`);
      await graph.reload();
      setTimeout(() => fitView({ duration: 400 }), 100);
    } catch (err) {
      alert('파일 읽기 실패: ' + (err as Error).message);
    }

    e.target.value = '';
  }, [projectId, graph, fitView]);

  // ── 자동 정렬 ──
  const handleAutoLayout = useCallback(() => {
    history.pushSnapshot(graph.nodes, graph.edges);
    const laid = getAutoLayout(graph.nodes, graph.edges);
    rfSetNodes(laid);
    for (const node of laid) {
      graph.updateNodePosition(node.id, node.position.x, node.position.y);
    }
    setTimeout(() => fitView({ duration: 400 }), 50);
  }, [graph, history, rfSetNodes, fitView]);

  // ── 검증 ──
  const handleValidate = useCallback(() => {
    const warnings = validateGraph(graph.nodes, graph.edges);
    setValidationWarnings(warnings);
    setSelectedNodeId(null);
    setShowSettings(false);
  }, [graph.nodes, graph.edges]);

  // ── Undo/Redo ──
  const handleUndo = useCallback(() => {
    const snapshot = history.undo(graph.nodes, graph.edges);
    if (snapshot) {
      rfSetNodes(snapshot.nodes);
      graph.reload();
    }
  }, [graph, history, rfSetNodes]);

  const handleRedo = useCallback(() => {
    const snapshot = history.redo(graph.nodes, graph.edges);
    if (snapshot) {
      rfSetNodes(snapshot.nodes);
      graph.reload();
    }
  }, [graph, history, rfSetNodes]);

  // ── 노드 더블클릭 ──
  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setValidationWarnings(null);
    setShowSettings(false);
  }, []);

  // ── 이벤트 삭제 (히스토리 포함) ──
  const handleDeleteEvent = useCallback(async (nodeId: string) => {
    history.pushSnapshot(graph.nodes, graph.edges);
    await graph.deleteEvent(nodeId);
  }, [graph, history]);

  // ── 이벤트 수정 (히스토리 포함) ──
  const handleUpdateEvent: typeof graph.updateEvent = useCallback(async (nodeId, updates) => {
    history.pushSnapshot(graph.nodes, graph.edges);
    await graph.updateEvent(nodeId, updates);
  }, [graph, history]);

  // ── 설정 패널 ──
  const handleSettings = useCallback(() => {
    setShowSettings(true);
    setSelectedNodeId(null);
    setValidationWarnings(null);
  }, []);

  // ── 키보드 단축키 ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setValidationWarnings(null);
        setShowSettings(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  if (!project || graph.loading || roleLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-400">로딩중...</p>
      </div>
    );
  }

  const isReadOnly = !canEdit;

  return (
    <div className="h-screen flex flex-col">
      {/* Viewer 배너 */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-1.5 text-xs text-yellow-700 text-center">
          읽기 전용 — 편집 권한이 없습니다
        </div>
      )}

      <Toolbar
        projectName={project.name}
        onAddEvent={() => setShowAddModal(true)}
        onExport={handleExport}
        onImport={handleImport}
        onAutoLayout={handleAutoLayout}
        onValidate={handleValidate}
        onSettings={handleSettings}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo && canEdit}
        canRedo={history.canRedo && canEdit}
        isReadOnly={isReadOnly}
        onBack={() => navigate('/')}
      />

      <div className="flex flex-1 min-h-0">
        <EventCanvas
          graph={{
            ...graph,
            deleteEvent: handleDeleteEvent,
          }}
          onNodeDoubleClick={handleNodeDoubleClick}
        />

        {selectedNode && (
          <EventDetailPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as unknown as EventNodeData}
            onSave={handleUpdateEvent}
            onDelete={handleDeleteEvent}
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        {validationWarnings !== null && (
          <ValidationPanel
            warnings={validationWarnings}
            onClose={() => setValidationWarnings(null)}
          />
        )}

        {showSettings && project && user && (
          <ProjectSettingsPanel
            project={project}
            currentUserId={user.id}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>

      {showAddModal && canEdit && (
        <AddEventModal
          onSubmit={handleAddEvent}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export function ProjectEditorPage() {
  return (
    <ReactFlowProvider>
      <EditorContent />
    </ReactFlowProvider>
  );
}
