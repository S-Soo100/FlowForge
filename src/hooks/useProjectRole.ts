import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProjectRole } from '../types';

export type EffectiveRole = 'owner' | 'admin' | ProjectRole;

export function useProjectRole(projectId: string, userId: string | undefined) {
  const [role, setRole] = useState<EffectiveRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function check() {
      setLoading(true);

      // admin 체크
      const { data: adminRow } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId!)
        .maybeSingle();

      if (adminRow) {
        setRole('admin');
        setLoading(false);
        return;
      }

      // owner 체크
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (project?.owner_id === userId) {
        setRole('owner');
        setLoading(false);
        return;
      }

      // member 체크
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId!)
        .maybeSingle();

      setRole((member?.role as ProjectRole) ?? 'viewer');
      setLoading(false);
    }

    check();
  }, [projectId, userId]);

  const canEdit = role === 'owner' || role === 'admin' || role === 'editor';

  return { role, canEdit, loading };
}
