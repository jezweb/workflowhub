import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { organizationApi } from '@/lib/api/context';
import type { OrganizationContext } from '@/types/context';

export function OrganizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<OrganizationContext>({
    name: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    address: '',
    context_text: '',
    social_links: {
      twitter: '',
      linkedin: '',
      facebook: '',
      instagram: '',
      github: ''
    }
  });

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const org = await organizationApi.get();
      if (org) {
        setFormData({
          ...org,
          social_links: org.social_links || {
            twitter: '',
            linkedin: '',
            facebook: '',
            instagram: '',
            github: ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to load organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await organizationApi.update(formData);
      alert('Organization settings saved successfully');
    } catch (error) {
      console.error('Failed to save organization:', error);
      alert('Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof OrganizationContext, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  if (loading) {
    return <div>Loading organization settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
          <CardDescription>
            Basic information about your organization. This data can be used as variables in forms, actions, and agents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Acme Inc."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address || ''}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 Main St, City, State 12345"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Brief description of your organization"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context / About</Label>
            <Textarea
              id="context"
              value={formData.context_text || ''}
              onChange={(e) => updateField('context_text', e.target.value)}
              placeholder="Detailed information about your organization that can be used as context in AI agents..."
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              This text can be used as context for AI agents and automations
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Social media profiles for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.social_links?.twitter || ''}
                onChange={(e) => updateSocialLink('twitter', e.target.value)}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formData.social_links?.linkedin || ''}
                onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                value={formData.social_links?.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.social_links?.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formData.social_links?.github || ''}
                onChange={(e) => updateSocialLink('github', e.target.value)}
                placeholder="https://github.com/yourorg"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Organization Settings'}
        </Button>
      </div>
    </form>
  );
}