import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
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
    keywords: [],
    products: [],
    services: [],
    social_links: {
      twitter: '',
      linkedin: '',
      facebook: '',
      instagram: '',
      github: ''
    }
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newService, setNewService] = useState('');

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const org = await organizationApi.get();
      if (org) {
        setFormData({
          ...org,
          keywords: org.keywords || [],
          products: org.products || [],
          services: org.services || [],
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

  // Tag management functions
  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords?.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }));
  };

  const addProduct = () => {
    if (newProduct.trim() && !formData.products?.includes(newProduct.trim())) {
      setFormData(prev => ({
        ...prev,
        products: [...(prev.products || []), newProduct.trim()]
      }));
      setNewProduct('');
    }
  };

  const removeProduct = (product: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products?.filter(p => p !== product) || []
    }));
  };

  const addService = () => {
    if (newService.trim() && !formData.services?.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...(prev.services || []), newService.trim()]
      }));
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.filter(s => s !== service) || []
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

      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>
            SEO keywords and search terms for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Type a keyword and press Enter"
            />
            <Button type="button" onClick={addKeyword}>
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.keywords?.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="pl-2 pr-1">
                {keyword}
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
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
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Products your organization offers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProduct())}
              placeholder="Type a product and press Enter"
            />
            <Button type="button" onClick={addProduct}>
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.products?.map((product) => (
              <Badge key={product} variant="secondary" className="pl-2 pr-1">
                {product}
                <button
                  type="button"
                  onClick={() => removeProduct(product)}
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
          <CardTitle>Services</CardTitle>
          <CardDescription>
            Services your organization provides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
              placeholder="Type a service and press Enter"
            />
            <Button type="button" onClick={addService}>
              Add
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {formData.services?.map((service) => (
              <Badge key={service} variant="secondary" className="pl-2 pr-1">
                {service}
                <button
                  type="button"
                  onClick={() => removeService(service)}
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
              <span className="text-muted-foreground">{"{{org.name}}"}</span>
              <span>{formData.name || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.description}}"}</span>
              <span className="truncate max-w-xs">{formData.description || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.website}}"}</span>
              <span>{formData.website || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.email}}"}</span>
              <span>{formData.email || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.phone}}"}</span>
              <span>{formData.phone || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.address}}"}</span>
              <span className="truncate max-w-xs">{formData.address || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.context}}"}</span>
              <span className="truncate max-w-xs">{formData.context_text || '(not set)'}</span>
            </div>
            {formData.social_links?.twitter && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"{{org.social.twitter}}"}</span>
                <span className="truncate max-w-xs">{formData.social_links.twitter}</span>
              </div>
            )}
            {formData.social_links?.linkedin && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"{{org.social.linkedin}}"}</span>
                <span className="truncate max-w-xs">{formData.social_links.linkedin}</span>
              </div>
            )}
            {formData.social_links?.facebook && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"{{org.social.facebook}}"}</span>
                <span className="truncate max-w-xs">{formData.social_links.facebook}</span>
              </div>
            )}
            {formData.social_links?.instagram && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"{{org.social.instagram}}"}</span>
                <span className="truncate max-w-xs">{formData.social_links.instagram}</span>
              </div>
            )}
            {formData.social_links?.github && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{"{{org.social.github}}"}</span>
                <span className="truncate max-w-xs">{formData.social_links.github}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.keywords}}"}</span>
              <span className="truncate max-w-xs">{formData.keywords?.join(', ') || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.products}}"}</span>
              <span className="truncate max-w-xs">{formData.products?.join(', ') || '(not set)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{"{{org.services}}"}</span>
              <span className="truncate max-w-xs">{formData.services?.join(', ') || '(not set)'}</span>
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