import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider, useReactFlow } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useEventGraph } from '../hooks/useEventGraph';
import { useHistory } from '../hooks/useHistory';
import { useProjectRole } from '../hooks/useProjectRole';
import { useProjectVariables } from '../hooks/useProjectVariables';
import { EventCanvas } from '../components/graph/EventCanvas';
import { EventDetailPanel } from '../components/detail/EventDetailPanel';
import { ValidationPanel } from '../components/graph/ValidationPanel';
import { ProjectSettingsPanel } from '../components/project/ProjectSettingsPanel';
import { ProjectVariablesModal } from '../components/project/ProjectVariablesModal';
import { Toolbar } from '../components/graph/Toolbar';
import { AddEventModal } from '../components/graph/AddEventModal';
import { exportProject, downloadJson } from '../lib/exportProject';
import { importProject } from '../lib/importProject';
import { getAutoLayout } from '../lib/autoLayout';
import { validateGraph, type ValidationWarning } from '../lib/validate';
import type { Project, ExportedProject, EventNodeData } from '../types';

function EditorContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fitView, setNodes: rfSetNodes, screenToFlowPosition } = useReactFlow();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const graph = useEventGraph(projectId!);
  const history = useHistory();
  const { canEdit, loading: roleLoading } = useProjectRole(projectId!, user?.id);
  const projectVariables = useProjectVariables(projectId!);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId!)
      .single()
      .then(({ data }) => setProject(data as Project));
  }, [projectId]);

  // ── 노드 추가 ──
  const handleAddNode = useCallback(async (name: string) => {
    console.log('[DEBUG] handleAddNode called', { name, showAddModal });
    history.pushSnapshot(graph.nodes, graph.edges);
    const centerPos = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    const x = centerPos.x - 100 + Math.random() * 40 - 20;
    const y = centerPos.y - 50 + Math.random() * 40 - 20;
    await graph.addNode(name, 'event', x, y);
    setShowAddModal(false);
  }, [graph, history, screenToFlowPosition]);

  // ── Export ──
  const handleExport = useCallback(() => {
    if (!project) return;
    const data = exportProject(project.name, project.description, graph.nodes, graph.edges, projectVariables.variables);
    downloadJson(data);
  }, [project, graph.nodes, graph.edges, projectVariables.variables]);

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

      if (!json.nodes || !Array.isArray(json.nodes)) {
        alert('올바른 FlowForge JSON 파일이 아닙니다.');
        return;
      }

      const varCount = json.variables?.length ?? 0;
      const confirmMsg = varCount > 0
        ? `${json.nodes.length}개 노드 + ${varCount}개 데이터를 가져올까요? 기존 데이터는 삭제됩니다.`
        : `${json.nodes.length}개 노드를 가져올까요? 기존 데이터는 삭제됩니다.`;
      if (!confirm(confirmMsg)) return;

      const result = await importProject(projectId!, json);
      const parts = [`노드 ${result.nodeCount}개`, `연결 ${result.edgeCount}개`];
      if (result.variableCount > 0) parts.push(`데이터 ${result.variableCount}개`);
      alert(`가져오기 완료: ${parts.join(', ')}`);
      await graph.reload();
      await projectVariables.reload();
      setTimeout(() => fitView({ duration: 400 }), 100);
    } catch (err) {
      alert('파일 읽기 실패: ' + (err as Error).message);
    }

    e.target.value = '';
  }, [projectId, graph, fitView]);

  // ── 자동 정렬 ──
  const handleAutoLayout = useCallback(async () => {
    history.pushSnapshot(graph.nodes, graph.edges);
    const layoutNodes = await getAutoLayout(graph.nodes, graph.edges);
    await graph.applyAutoLayout(layoutNodes);
    setTimeout(() => fitView({ duration: 400 }), 50);
  }, [graph, history, fitView]);

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

  // ── 노드 삭제 (히스토리 포함) ──
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    history.pushSnapshot(graph.nodes, graph.edges);
    await graph.deleteNode(nodeId);
  }, [graph, history]);

  // ── 노드 수정 (히스토리 포함) ──
  const handleUpdateNode = useCallback(async (
    nodeId: string,
    updates: { name?: string; node_data?: Record<string, unknown> }
  ) => {
    history.pushSnapshot(graph.nodes, graph.edges);
    await graph.updateNode(nodeId, updates);
  }, [graph, history]);

  // ── 설정 패널 ──
  const handleSettings = useCallback(() => {
    setShowSettings(true);
    setSelectedNodeId(null);
    setValidationWarnings(null);
  }, []);

  // ── 변수 모달 ──
  const handleVariables = useCallback(() => {
    setShowVariables(true);
    setSelectedNodeId(null);
    setValidationWarnings(null);
    setShowSettings(false);
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
        setShowVariables(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  const selectedNodeData = selectedNode?.data as EventNodeData | undefined;

  if (!project || graph.loading || roleLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <img src="/forgi-thinking-t.png" alt="Loading" className="h-40 opacity-70 animate-pulse" />
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
        onAddEvent={() => { console.log('[DEBUG] +노드 clicked, opening AddEventModal'); setShowAddModal(true); }}
        onExport={handleExport}
        onImport={handleImport}
        onAutoLayout={handleAutoLayout}
        onValidate={handleValidate}
        onSettings={handleSettings}
        onVariables={handleVariables}
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
            deleteNode: handleDeleteNode,
          }}
          onNodeDoubleClick={handleNodeDoubleClick}
        />

        {selectedNode && selectedNodeData?.nodeType === 'event' && (
          <EventDetailPanel
            nodeId={selectedNode.id}
            data={selectedNodeData}
            variableKeys={projectVariables.getByCategory('variable').map((v) => v.key)}
            onSave={handleUpdateNode}
            onSyncChoices={graph.syncChoicesToEdges}
            onDelete={handleDeleteNode}
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
          onSubmit={handleAddNode}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showVariables && (
        <ProjectVariablesModal
          projectId={projectId!}
          variables={projectVariables}
          onClose={() => setShowVariables(false)}
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
