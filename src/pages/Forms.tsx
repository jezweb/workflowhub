import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { useToast } from '@/hooks/use-toast';
import type { Form } from '@/types/form';
import * as api from '@/lib/api';

export function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      const data = await api.getForms();
      setForms(data.forms);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load forms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: Partial<Form>) => {
    try {
      if (selectedForm) {
        await api.updateForm(selectedForm.id, formData);
        toast({
          title: 'Success',
          description: 'Form updated successfully',
        });
      } else {
        await api.createForm(formData);
        toast({
          title: 'Success',
          description: 'Form created successfully',
        });
      }
      setSelectedForm(null);
      setIsCreating(false);
      loadForms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save form',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await api.deleteForm(formId);
      toast({
        title: 'Success',
        description: 'Form deleted successfully',
      });
      loadForms();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete form',
        variant: 'destructive',
      });
    }
  };

  const copyFormUrl = (formId: string) => {
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied!',
      description: 'Form URL copied to clipboard',
    });
  };

  if (isCreating || selectedForm) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => {
            setIsCreating(false);
            setSelectedForm(null);
          }}>
            ← Back to Forms
          </Button>
        </div>
        <FormBuilder 
          form={selectedForm || undefined}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage your forms
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Form
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">Loading forms...</p>
          </CardContent>
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No forms yet</CardTitle>
            <CardDescription>
              Create your first form to start collecting data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{form.name}</CardTitle>
                {form.description && (
                  <CardDescription>{form.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 mb-4">
                  {form.fields.length} fields · {form.is_public ? 'Public' : 'Private'}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedForm(form)}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/forms/${form.id}`, '_blank')}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyFormUrl(form.id)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy URL
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(form.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}