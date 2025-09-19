import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.error('Profile error or not admin:', profileError, profile);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { operation, data } = await req.json();

    switch (operation) {
      case 'getUserById': {
        const { userId } = data;
        
        // Get user data from auth.users via admin API
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError) {
          console.error('Error fetching user:', userError);
          return new Response(JSON.stringify({ error: 'Failed to fetch user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          user: userData.user ? {
            id: userData.user.id,
            email: userData.user.email,
            created_at: userData.user.created_at
          } : null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getAdminProfiles': {
        // Get all admin profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .eq('role', 'admin');

        if (profilesError) {
          console.error('Error fetching admin profiles:', profilesError);
          return new Response(JSON.stringify({ error: 'Failed to fetch admin profiles' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get email addresses for each admin
        const adminData: Record<string, { email: string; display_name: string }> = {};
        
        for (const profile of profiles || []) {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
          if (!authError && authUser.user) {
            adminData[profile.user_id] = {
              email: authUser.user.email || '',
              display_name: profile.display_name || authUser.user.email || ''
            };
          }
        }

        return new Response(JSON.stringify({ adminProfiles: adminData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getAllUsers': {
        // Get all user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch email addresses for each user
        const usersWithEmails = [];
        for (const profile of profiles || []) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
            usersWithEmails.push({
              ...profile,
              email: authUser.user?.email || 'Unknown'
            });
          } catch (error) {
            console.error('Error fetching user email:', error);
            usersWithEmails.push({
              ...profile,
              email: 'Unknown'
            });
          }
        }

        return new Response(JSON.stringify({ users: usersWithEmails }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error in admin-operations function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});