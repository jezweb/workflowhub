import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, ExternalLink, FileText, Eye } from 'lucide-react';

interface Form {
  id: string;
  name: string;
  description?: string;
  slug: string;
  webhook_url: string;
  webhook_headers?: string;
  webhook_method?: string;
  success_message?: string;
  redirect_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      const data = await response.json();
      setForms(data);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    
    try {
      await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      fetchForms();
    } catch (error) {
      console.error('Failed to delete form:', error);
    }
  };

  const handlePublish = async (form: Form) => {
    try {
      await fetch(`/api/forms/${form.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_published: !form.is_published }),
      });
      fetchForms();
    } catch (error) {
      console.error('Failed to update form:', error);
    }
  };

  const getPublicUrl = (slug: string) => {
    return `${window.location.origin}/form/${slug}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading forms...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
        <button
          onClick={() => {
            setEditingForm(null);
            setShowEditor(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          Create Form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
          <p className="text-gray-500 mb-4">Create your first form to start collecting data</p>
          <button
            onClick={() => {
              setEditingForm(null);
              setShowEditor(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Create Your First Form
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div key={form.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{form.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      form.is_published 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {form.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  {form.description && (
                    <p className="text-gray-600 mb-3">{form.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Slug: <code className="bg-gray-100 px-2 py-1 rounded">{form.slug}</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingForm(form);
                      setShowEditor(true);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Edit form"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => window.open(`/forms/${form.id}/submissions`, '_blank')}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="View submissions"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handlePublish(form)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title={form.is_published ? 'Unpublish' : 'Publish'}
                  >
                    <ExternalLink size={18} />
                  </button>
                  <button
                    onClick={() => copyToClipboard(getPublicUrl(form.slug))}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Copy public URL"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(form.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete form"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {form.is_published && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  <div className="text-gray-600 mb-1">Public URL:</div>
                  <code className="text-blue-600">{getPublicUrl(form.slug)}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <FormEditor
          form={editingForm}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            setShowEditor(false);
            fetchForms();
          }}
        />
      )}
    </div>
  );
}

interface FormEditorProps {
  form: Form | null;
  onClose: () => void;
  onSave: () => void;
}

function FormEditor({ form, onClose, onSave }: FormEditorProps) {
  const [formData, setFormData] = useState({
    name: form?.name || '',
    description: form?.description || '',
    slug: form?.slug || '',
    webhook_url: form?.webhook_url || '',
    webhook_headers: form?.webhook_headers || '{}',
    success_message: form?.success_message || 'Thank you for your submission!',
    redirect_url: form?.redirect_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = form ? `/api/forms/${form.id}` : '/api/forms';
      const method = form ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      onSave();
    } catch (error) {
      console.error('Failed to save form:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {form ? 'Edit Form' : 'Create New Form'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="auto-generated-from-name"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              required
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              placeholder="https://n8n.example.com/webhook/form"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Success Message
            </label>
            <input
              type="text"
              value={formData.success_message}
              onChange={(e) => setFormData({ ...formData, success_message: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redirect URL (optional)
            </label>
            <input
              type="url"
              value={formData.redirect_url}
              onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
              placeholder="https://example.com/thank-you"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {form ? 'Save Changes' : 'Create Form'}
            </button>
            {form && (
              <a
                href={`/forms/${form.id}/edit`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Edit Fields
              </a>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}