import { getSupabaseClient, getSupabaseAdminClient } from './supabase';

// Projekte
export async function getProjects(userId?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('projects')
    .select(`
      *,
      created_by:users(name, email),
      participants(id),
      project_hazards(id, selected)
    `)
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('created_by_user_id', userId);
  }

  const { data, error } = await query;
  
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getProject(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      created_by:users(name, email),
      participants(*),
      project_hazards(
        *,
        hazard:hazards(
          *,
          control_measures(*)
        )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createProject(projectData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProject(id: string, updates: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Gefährdungen
export async function getHazards() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('hazards')
    .select(`
      *,
      control_measures(*)
    `)
    .order('category', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createHazard(hazardData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('hazards')
    .insert(hazardData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Teilnehmer
export async function getParticipants(projectId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('project_id', projectId)
    .order('last_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createParticipant(participantData: any) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('participants')
    .insert(participantData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Benutzer (Admin-Funktionen)
export async function getUsers() {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createUser(userData: any) {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}