import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

export function useProject(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    // admin 여부 확인
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    const admin = !!adminRow;
    setIsAdmin(admin);

    if (admin) {
      // 관리자: 모든 프로젝트 조회 (RLS가 허용)
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      setProjects(data ?? []);
    } else {
      // 일반 유저: owner이거나 member인 프로젝트
      const { data: owned } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });

      const { data: memberRows } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);

      let shared: Project[] = [];
      if (memberRows && memberRows.length > 0) {
        const ids = memberRows.map((r) => r.project_id);
        const { data } = await supabase
          .from('projects')
          .select('*')
          .in('id', ids)
          .order('updated_at', { ascending: false });
        shared = data ?? [];
      }

      const map = new Map<string, Project>();
      for (const p of [...(owned ?? []), ...shared]) {
        map.set(p.id, p);
      }
      setProjects(Array.from(map.values()));
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (name: string, description?: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, description, owner_id: userId })
      .select()
      .single();

    if (error) throw error;
    await fetchProjects();
    return data as Project;
  };

  const deleteProject = async (projectId: string) => {
    if (isAdmin) {
      // 관리자는 모든 프로젝트 삭제 가능
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('owner_id', userId!);
      if (error) throw error;
    }
    await fetchProjects();
  };

  return { projects, loading, isAdmin, createProject, deleteProject, refresh: fetchProjects };
}
