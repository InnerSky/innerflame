import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Delete the user using admin privileges
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error in delete-user endpoint:', error);
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
} 