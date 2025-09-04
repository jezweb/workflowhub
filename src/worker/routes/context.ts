import { Hono } from 'hono';
import type { Env } from '../types';
import { variableService } from '../services/variables';

const app = new Hono<{ Bindings: Env }>();

// Get organization context
app.get('/organization', async (c) => {
  try {
    const org = await c.env.DB
      .prepare('SELECT * FROM organization_context LIMIT 1')
      .first();

    if (org && org.social_links) {
      try {
        org.social_links = JSON.parse(org.social_links as string);
      } catch (e) {
        console.error('Failed to parse social_links:', e);
        org.social_links = {};
      }
    }

    if (org && org.custom_fields) {
      try {
        org.custom_fields = JSON.parse(org.custom_fields as string);
      } catch (e) {
        console.error('Failed to parse custom_fields:', e);
        org.custom_fields = {};
      }
    }

    return c.json({ success: true, organization: org || null });
  } catch (error) {
    console.error('Error fetching organization:', error);
    return c.json({ success: false, error: 'Failed to fetch organization' }, 500);
  }
});

// Create or update organization context
app.put('/organization', async (c) => {
  try {
    const body = await c.req.json();
    // const userId = c.get('jwtPayload').sub; // For future role-based access

    // Check if organization context exists
    const existing = await c.env.DB
      .prepare('SELECT id FROM organization_context LIMIT 1')
      .first();

    const social_links = JSON.stringify(body.social_links || {});
    const custom_fields = JSON.stringify(body.custom_fields || {});

    if (existing) {
      // Update existing
      await c.env.DB
        .prepare(`
          UPDATE organization_context 
          SET name = ?, description = ?, website = ?, email = ?, phone = ?, 
              address = ?, logo_url = ?, social_links = ?, context_text = ?, 
              custom_fields = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `)
        .bind(
          body.name,
          body.description || null,
          body.website || null,
          body.email || null,
          body.phone || null,
          body.address || null,
          body.logo_url || null,
          social_links,
          body.context_text || null,
          custom_fields,
          existing.id
        )
        .run();
    } else {
      // Create new
      const id = crypto.randomUUID();
      await c.env.DB
        .prepare(`
          INSERT INTO organization_context (
            id, name, description, website, email, phone, address, 
            logo_url, social_links, context_text, custom_fields
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          id,
          body.name,
          body.description || null,
          body.website || null,
          body.email || null,
          body.phone || null,
          body.address || null,
          body.logo_url || null,
          social_links,
          body.context_text || null,
          custom_fields
        )
        .run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating organization:', error);
    return c.json({ success: false, error: 'Failed to update organization' }, 500);
  }
});

// Get all team profiles
app.get('/team', async (c) => {
  const profiles = await c.env.DB
    .prepare(`
      SELECT tp.*, u.username, u.email as user_email 
      FROM team_profiles tp
      JOIN users u ON tp.user_id = u.id
      ORDER BY tp.full_name
    `)
    .all();

  // Parse JSON fields
  const parsedProfiles = profiles.results.map((profile: any) => {
    if (profile.skills) {
      try {
        profile.skills = JSON.parse(profile.skills);
      } catch (e) {
        profile.skills = [];
      }
    }
    if (profile.custom_fields) {
      try {
        profile.custom_fields = JSON.parse(profile.custom_fields);
      } catch (e) {
        profile.custom_fields = {};
      }
    }
    return profile;
  });

  return c.json({ success: true, profiles: parsedProfiles });
});

// Get current user's team profile
app.get('/team/me', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const profile = await c.env.DB
    .prepare(`
      SELECT tp.*, u.username, u.email as user_email 
      FROM team_profiles tp
      JOIN users u ON tp.user_id = u.id
      WHERE tp.user_id = ?
    `)
    .bind(userId)
    .first();

  if (profile) {
    if (profile.skills) {
      try {
        profile.skills = JSON.parse(profile.skills as string);
      } catch (e) {
        profile.skills = [];
      }
    }
    if (profile.custom_fields) {
      try {
        profile.custom_fields = JSON.parse(profile.custom_fields as string);
      } catch (e) {
        profile.custom_fields = {};
      }
    }
  }

  return c.json({ success: true, profile: profile || null });
});

// Create or update team profile
app.put('/team/:userId', async (c) => {
  const targetUserId = c.req.param('userId');
  const currentUserId = c.get('jwtPayload').sub;
  const body = await c.req.json();

  // Users can only edit their own profile (unless we add admin roles later)
  if (targetUserId !== currentUserId && targetUserId !== 'me') {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const userIdToUpdate = targetUserId === 'me' ? currentUserId : targetUserId;

  // Check if profile exists
  const existing = await c.env.DB
    .prepare('SELECT id FROM team_profiles WHERE user_id = ?')
    .bind(userIdToUpdate)
    .first();

  const skills = JSON.stringify(body.skills || []);
  const custom_fields = JSON.stringify(body.custom_fields || {});

  if (existing) {
    // Update existing
    await c.env.DB
      .prepare(`
        UPDATE team_profiles 
        SET full_name = ?, title = ?, department = ?, phone = ?, mobile = ?,
            email = ?, photo_url = ?, bio = ?, skills = ?, custom_fields = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        body.full_name || null,
        body.title || null,
        body.department || null,
        body.phone || null,
        body.mobile || null,
        body.email || null,
        body.photo_url || null,
        body.bio || null,
        skills,
        custom_fields,
        existing.id
      )
      .run();
  } else {
    // Create new
    const id = crypto.randomUUID();
    await c.env.DB
      .prepare(`
        INSERT INTO team_profiles (
          id, user_id, full_name, title, department, phone, mobile,
          email, photo_url, bio, skills, custom_fields
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        userIdToUpdate,
        body.full_name || null,
        body.title || null,
        body.department || null,
        body.phone || null,
        body.mobile || null,
        body.email || null,
        body.photo_url || null,
        body.bio || null,
        skills,
        custom_fields
      )
      .run();
  }

  return c.json({ success: true });
});

// Get custom variables
app.get('/variables', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const category = c.req.query('category'); // 'global', 'user', or null for all

  let query = 'SELECT * FROM custom_variables WHERE 1=1';
  const bindings: any[] = [];

  if (category === 'global') {
    query += ' AND category = ? AND user_id IS NULL';
    bindings.push('global');
  } else if (category === 'user') {
    query += ' AND category = ? AND user_id = ?';
    bindings.push('user', userId);
  } else {
    // Get both global and user variables
    query += ' AND (category = ? AND user_id IS NULL OR category = ? AND user_id = ?)';
    bindings.push('global', 'user', userId);
  }

  query += ' ORDER BY category, key';

  const stmt = c.env.DB.prepare(query);
  const variables = await stmt.bind(...bindings).all();

  // Mask sensitive values in the response
  const maskedVariables = variables.results.map((v: any) => ({
    ...v,
    value: v.is_sensitive ? '••••••••' : v.value,
    display_value: v.is_sensitive ? '••••••••' : v.value
  }));

  return c.json({ success: true, variables: maskedVariables });
});

// Create or update custom variable
app.put('/variables', async (c) => {
  const userId = c.get('jwtPayload').sub;
  const body = await c.req.json();

  // Validate category
  if (!['global', 'user'].includes(body.category)) {
    return c.json({ error: 'Invalid category' }, 400);
  }

  // Set user_id based on category
  const variableUserId = body.category === 'user' ? userId : null;

  // Check if variable exists
  const existing = await c.env.DB
    .prepare(`
      SELECT id FROM custom_variables 
      WHERE category = ? AND key = ? AND (user_id = ? OR user_id IS NULL)
    `)
    .bind(body.category, body.key, variableUserId)
    .first();

  if (existing) {
    // Update existing
    await c.env.DB
      .prepare(`
        UPDATE custom_variables 
        SET value = ?, description = ?, data_type = ?, is_sensitive = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind(
        body.value,
        body.description || null,
        body.data_type || 'string',
        body.is_sensitive ? 1 : 0,
        existing.id
      )
      .run();
  } else {
    // Create new
    const id = crypto.randomUUID();
    await c.env.DB
      .prepare(`
        INSERT INTO custom_variables (
          id, category, key, value, description, data_type, is_sensitive, 
          user_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        body.category,
        body.key,
        body.value,
        body.description || null,
        body.data_type || 'string',
        body.is_sensitive ? 1 : 0,
        variableUserId,
        userId
      )
      .run();
  }

  return c.json({ success: true });
});

// Delete custom variable
app.delete('/variables/:id', async (c) => {
  const variableId = c.req.param('id');
  const userId = c.get('jwtPayload').sub;

  // Check ownership or if it's a global variable
  const variable = await c.env.DB
    .prepare('SELECT user_id, created_by FROM custom_variables WHERE id = ?')
    .bind(variableId)
    .first();

  if (!variable) {
    return c.json({ error: 'Variable not found' }, 404);
  }

  // User can delete their own variables or global variables they created
  if (variable.user_id !== userId && variable.created_by !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  await c.env.DB
    .prepare('DELETE FROM custom_variables WHERE id = ?')
    .bind(variableId)
    .run();

  return c.json({ success: true });
});

// Get all available variables for the current user
app.get('/variables/available', async (c) => {
  const userId = c.get('jwtPayload').sub;
  
  const variables = await variableService.getAllVariables({
    userId,
    db: c.env.DB
  });

  // Group variables by category for better UI display
  const grouped: Record<string, Record<string, string>> = {
    user: {},
    organization: {},
    team: {},
    custom: {},
    my: {},
    time: {},
    system: {}
  };

  Object.entries(variables).forEach(([key, value]) => {
    if (key.startsWith('{{user.')) {
      grouped.user[key] = value;
    } else if (key.startsWith('{{org.')) {
      grouped.organization[key] = value;
    } else if (key.startsWith('{{team.')) {
      grouped.team[key] = value;
    } else if (key.startsWith('{{custom.')) {
      grouped.custom[key] = value;
    } else if (key.startsWith('{{my.')) {
      grouped.my[key] = value;
    } else if (key.startsWith('{{time.') || key.includes('timestamp') || key.includes('date')) {
      grouped.time[key] = value;
    } else if (key.startsWith('{{system.') || key.includes('random')) {
      grouped.system[key] = value;
    }
  });

  return c.json({ 
    success: true, 
    variables,
    grouped,
    total: Object.keys(variables).length
  });
});

export default app;