import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { supabase } from '../lib/supabase';
import { useEventGraph } from '../hooks/useEventGraph';
import { EventCanvas } from '../components/graph/EventCanvas';
import { EventDetailPanel } from '../components/detail/EventDetailPanel';
import { Toolbar } from '../components/graph/Toolbar';
import { AddEventModal } from '../components/graph/AddEventModal';
import { exportProject, downloadJson } from '../lib/exportProject';
import type { Project, EventType } from '../types';
import type { EventNodeData } from '../hooks/useEventGraph';

function EditorContent() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const graph = useEventGraph(projectId!);

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .eq('id', projectId!)
      .single()
      .then(({ data }) => setProject(data as Project));
  }, [projectId]);

  const handleAddEvent = useCallback(async (name: string, eventType: EventType) => {
    const x = 250 + Math.random() * 200;
    const y = 100 + graph.nodes.length * 120;
    await graph.addEvent(name, x, y, eventType);
    setShowAddModal(false);
  }, [graph]);

  const handleExport = useCallback(() => {
    if (!project) return;
    const data = exportProject(
      project.name,
      project.description,
      graph.nodes,
      graph.edges
    );
    downloadJson(data);
  }, [project, graph.nodes, graph.edges]);

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  const selectedNode = selectedNodeId
    ? graph.nodes.find((n) => n.id === selectedNodeId)
    : null;

  if (!project || graph.loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-400">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Toolbar
        projectName={project.name}
        onAddEvent={() => setShowAddModal(true)}
        onExport={handleExport}
        onBack={() => navigate('/')}
      />

      <div className="flex flex-1 min-h-0">
        <EventCanvas
          graph={graph}
          onNodeDoubleClick={handleNodeDoubleClick}
        />

        {selectedNode && (
          <EventDetailPanel
            nodeId={selectedNode.id}
            data={selectedNode.data as unknown as EventNodeData}
            onSave={graph.updateEvent}
            onDelete={graph.deleteEvent}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {showAddModal && (
        <AddEventModal
          onSubmit={handleAddEvent}
          onClose={() => setShowAddModal(false)}
        />
      )}
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
