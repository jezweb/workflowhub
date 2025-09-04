import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { teamApi } from '@/lib/api/context';
import type { TeamProfile } from '@/types/context';

export function TeamProfileSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TeamProfile>({
    user_id: '',
    full_name: '',
    title: '',
    department: '',
    phone: '',
    mobile: '',
    email: '',
    bio: '',
    skills: []
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await teamApi.getMe();
      if (data) {
        setProfile({
          ...data,
          skills: data.skills || []
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await teamApi.updateMe(profile);
      alert('Profile saved successfully');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof TeamProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills?.includes(newSkill.trim())) {
      setProfile(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills?.filter(s => s !== skill) || []
    }));
  };

  if (loading) {
    return <div>Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your profile information that can be used as variables in automations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profile.full_name || ''}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={profile.title || ''}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Software Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profile.department || ''}
                onChange={(e) => updateField('department', e.target.value)}
                placeholder="Engineering"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@company.com"
              />
              <p className="text-xs text-muted-foreground">
                Can be different from your login email
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                type="tel"
                value={profile.mobile || ''}
                onChange={(e) => updateField('mobile', e.target.value)}
                placeholder="+1 234 567 8901"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Brief bio or professional summary..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <CardDescription>
            Add your professional skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Type a skill and press Enter"
            />
            <Button type="button" onClick={addSkill}>
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill) => (
              <Badge key={skill} variant="secondary" className="pl-2 pr-1">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Variables</CardTitle>
          <CardDescription>
            These variables can be used in forms, actions, and agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.name}}"}</span>
              <span>{profile.full_name || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.title}}"}</span>
              <span>{profile.title || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.department}}"}</span>
              <span>{profile.department || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.email}}"}</span>
              <span>{profile.email || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.phone}}"}</span>
              <span>{profile.phone || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.mobile}}"}</span>
              <span>{profile.mobile || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.bio}}"}</span>
              <span className="truncate max-w-xs">{profile.bio || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{team.current.skills}}"}</span>
              <span className="truncate max-w-xs">{profile.skills?.join(', ') || '(not set)'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}