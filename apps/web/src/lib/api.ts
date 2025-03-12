import { supabase } from './supabase';
import type { Database } from '@/types/supabase';

export type Article = Database['public']['Tables']['articles']['Row'];

export async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }

  return data;
}

export async function getArticleBySlug(slug: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    throw error;
  }

  return data;
}