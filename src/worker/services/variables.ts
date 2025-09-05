import type { D1Database } from '@cloudflare/workers-types';

export interface VariableContext {
  userId: string;
  db: D1Database;
}

export class VariableService {
  /**
   * Get all available variables for a user
   */
  async getAllVariables(context: VariableContext): Promise<Record<string, string>> {
    const [user, org, team, custom, userCustom] = await Promise.all([
      this.getUserVariables(context),
      this.getOrgVariables(context.db),
      this.getTeamVariables(context),
      this.getCustomVariables(context.db),
      this.getUserCustomVariables(context)
    ]);

    const system = this.getSystemVariables();
    
    return {
      ...system,
      ...org,
      ...team,
      ...custom,
      ...userCustom,
      ...user
    };
  }

  /**
   * Get current user variables
   */
  private async getUserVariables(context: VariableContext): Promise<Record<string, string>> {
    const user = await context.db
      .prepare('SELECT id, username, email FROM users WHERE id = ?')
      .bind(context.userId)
      .first();

    if (!user) return {};

    return {
      '{{user.id}}': user.id as string,
      '{{user.username}}': user.username as string,
      '{{user.email}}': user.email as string || ''
    };
  }

  /**
   * Get organization variables
   */
  private async getOrgVariables(db: D1Database): Promise<Record<string, string>> {
    const org = await db
      .prepare('SELECT * FROM organization_context LIMIT 1')
      .first();

    if (!org) return {};

    const variables: Record<string, string> = {
      '{{org.name}}': org.name as string || '',
      '{{org.description}}': org.description as string || '',
      '{{org.website}}': org.website as string || '',
      '{{org.email}}': org.email as string || '',
      '{{org.phone}}': org.phone as string || '',
      '{{org.address}}': org.address as string || '',
      '{{org.context}}': org.context_text as string || ''
    };

    // Parse social links if they exist
    if (org.social_links) {
      try {
        const social = JSON.parse(org.social_links as string);
        Object.entries(social).forEach(([key, value]) => {
          variables[`{{org.social.${key}}}`] = value as string;
        });
      } catch (e) {
        // Invalid JSON, skip social links
      }
    }

    // Parse keywords if they exist
    if (org.keywords) {
      try {
        const keywords = JSON.parse(org.keywords as string);
        if (Array.isArray(keywords)) {
          variables['{{org.keywords}}'] = keywords.join(', ');
          // Add individual keyword access
          keywords.forEach((keyword: string, index: number) => {
            variables[`{{org.keyword.${index}}}`] = keyword;
          });
        }
      } catch (e) {
        variables['{{org.keywords}}'] = '';
      }
    } else {
      variables['{{org.keywords}}'] = '';
    }

    // Parse products if they exist
    if (org.products) {
      try {
        const products = JSON.parse(org.products as string);
        if (Array.isArray(products)) {
          variables['{{org.products}}'] = products.join(', ');
          // Add individual product access
          products.forEach((product: string, index: number) => {
            variables[`{{org.product.${index}}}`] = product;
          });
        }
      } catch (e) {
        variables['{{org.products}}'] = '';
      }
    } else {
      variables['{{org.products}}'] = '';
    }

    // Parse services if they exist
    if (org.services) {
      try {
        const services = JSON.parse(org.services as string);
        if (Array.isArray(services)) {
          variables['{{org.services}}'] = services.join(', ');
          // Add individual service access
          services.forEach((service: string, index: number) => {
            variables[`{{org.service.${index}}}`] = service;
          });
        }
      } catch (e) {
        variables['{{org.services}}'] = '';
      }
    } else {
      variables['{{org.services}}'] = '';
    }

    return variables;
  }

  /**
   * Get team member variables
   */
  private async getTeamVariables(context: VariableContext): Promise<Record<string, string>> {
    // Get current user's team profile
    const currentProfile = await context.db
      .prepare('SELECT * FROM team_profiles WHERE user_id = ?')
      .bind(context.userId)
      .first();

    const variables: Record<string, string> = {};

    if (currentProfile) {
      variables['{{team.current.name}}'] = currentProfile.full_name as string || '';
      variables['{{team.current.title}}'] = currentProfile.title as string || '';
      variables['{{team.current.department}}'] = currentProfile.department as string || '';
      variables['{{team.current.phone}}'] = currentProfile.phone as string || '';
      variables['{{team.current.mobile}}'] = currentProfile.mobile as string || '';
      variables['{{team.current.email}}'] = currentProfile.email as string || '';
      variables['{{team.current.bio}}'] = currentProfile.bio as string || '';
      
      // Add skills as variables
      if (currentProfile.skills) {
        try {
          const skills = JSON.parse(currentProfile.skills as string);
          if (Array.isArray(skills)) {
            // Add all skills as comma-separated list
            variables['{{team.current.skills}}'] = skills.join(', ');
            // Add individual skill access
            skills.forEach((skill: string, index: number) => {
              variables[`{{team.current.skill.${index}}}`] = skill;
            });
          }
        } catch (e) {
          // Invalid JSON or not an array, skip skills
          variables['{{team.current.skills}}'] = '';
        }
      } else {
        variables['{{team.current.skills}}'] = '';
      }
    }

    // Get all team members for reference (limited to avoid too many variables)
    const teamMembers = await context.db
      .prepare(`
        SELECT tp.*, u.username 
        FROM team_profiles tp
        JOIN users u ON tp.user_id = u.id
        LIMIT 20
      `)
      .all();

    if (teamMembers.results) {
      teamMembers.results.forEach((member: any) => {
        const username = member.username;
        variables[`{{team.${username}.name}}`] = member.full_name || '';
        variables[`{{team.${username}.email}}`] = member.email || '';
        variables[`{{team.${username}.phone}}`] = member.phone || '';
        variables[`{{team.${username}.title}}`] = member.title || '';
      });
    }

    return variables;
  }

  /**
   * Get global custom variables
   */
  private async getCustomVariables(db: D1Database): Promise<Record<string, string>> {
    const customVars = await db
      .prepare(`
        SELECT key, value 
        FROM custom_variables 
        WHERE category = 'global' AND user_id IS NULL
      `)
      .all();

    const variables: Record<string, string> = {};

    if (customVars.results) {
      customVars.results.forEach((v: any) => {
        variables[`{{custom.${v.key}}}`] = v.value;
      });
    }

    return variables;
  }

  /**
   * Get user-specific custom variables
   */
  private async getUserCustomVariables(context: VariableContext): Promise<Record<string, string>> {
    const userVars = await context.db
      .prepare(`
        SELECT key, value 
        FROM custom_variables 
        WHERE category = 'user' AND user_id = ?
      `)
      .bind(context.userId)
      .all();

    const variables: Record<string, string> = {};

    if (userVars.results) {
      userVars.results.forEach((v: any) => {
        variables[`{{my.${v.key}}}`] = v.value;
      });
    }

    return variables;
  }

  /**
   * Get system variables (time, random, etc)
   */
  private getSystemVariables(): Record<string, string> {
    const now = new Date();
    
    return {
      '{{time.timestamp}}': Math.floor(now.getTime() / 1000).toString(),
      '{{time.date}}': now.toISOString().split('T')[0],
      '{{time.datetime}}': now.toISOString(),
      '{{time.year}}': now.getFullYear().toString(),
      '{{time.month}}': String(now.getMonth() + 1).padStart(2, '0'),
      '{{time.day}}': String(now.getDate()).padStart(2, '0'),
      '{{system.random}}': Math.random().toString(36).substring(7),
      '{{system.uuid}}': crypto.randomUUID(),
      // Legacy support for existing action variables
      '{{timestamp}}': Math.floor(now.getTime() / 1000).toString(),
      '{{date}}': now.toISOString().split('T')[0],
      '{{datetime}}': now.toISOString(),
      '{{random}}': Math.random().toString(36).substring(7)
    };
  }

  /**
   * Substitute variables in text
   */
  substituteVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    
    // Sort by key length (longest first) to avoid partial replacements
    const sortedEntries = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);
    
    sortedEntries.forEach(([key, value]) => {
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedKey, 'g'), value);
    });
    
    return result;
  }

  /**
   * Substitute variables in an object (deep replacement)
   */
  substituteInObject(obj: any, variables: Record<string, string>): any {
    if (typeof obj === 'string') {
      return this.substituteVariables(obj, variables);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.substituteInObject(item, variables));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Substitute in both keys and values
        const newKey = this.substituteVariables(key, variables);
        result[newKey] = this.substituteInObject(value, variables);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * Get list of available variable keys for UI
   */
  async getAvailableVariableKeys(context: VariableContext): Promise<string[]> {
    const variables = await this.getAllVariables(context);
    return Object.keys(variables).sort();
  }
}

// Export singleton instance
export const variableService = new VariableService();