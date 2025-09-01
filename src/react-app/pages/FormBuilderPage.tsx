import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, GripVertical, ArrowLeft, Eye } from 'lucide-react';

interface FormField {
  id?: string;
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  help_text?: string;
  required: boolean;
  options?: string;
  validation_pattern?: string;
  validation_message?: string;
  default_value?: string;
  position: number;
  width: 'full' | 'half';
}

interface Form {
  id: string;
  name: string;
  description?: string;
  slug: string;
  webhook_url: string;
  is_published: boolean;
  fields?: FormField[];
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
];

export default function FormBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  useEffect(() => {
    if (id) {
      fetchForm();
    }
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${id}`);
      const data = await response.json();
      setForm(data);
      setFields(data.fields || []);
    } catch (error) {
      console.error('Failed to fetch form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = () => {
    setEditingField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      position: fields.length,
      width: 'full',
    });
    setShowFieldEditor(true);
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setShowFieldEditor(true);
  };

  const handleSaveField = async (fieldData: FormField) => {
    try {
      if (fieldData.id) {
        // Update existing field
        await fetch(`/api/fields/${fieldData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldData),
        });
      } else {
        // Create new field
        await fetch(`/api/forms/${id}/fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldData),
        });
      }
      fetchForm();
      setShowFieldEditor(false);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to save field:', error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    
    try {
      await fetch(`/api/fields/${fieldId}`, { method: 'DELETE' });
      fetchForm();
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading form...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Form not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/forms')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
            <p className="text-gray-600">Form Builder</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href={`/form/${form.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            <Eye size={18} />
            Preview
          </a>
          <button
            onClick={handleAddField}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Field
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {fields.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No fields yet. Start by adding your first field.</p>
            <button
              onClick={handleAddField}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Add First Field
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {fields.map((field) => (
              <div key={field.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical size={20} className="text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {field.name} · {FIELD_TYPES.find(t => t.value === field.type)?.label}
                        {field.width === 'half' && ' · Half width'}
                      </div>
                      {field.help_text && (
                        <div className="text-sm text-gray-400 mt-1">{field.help_text}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditField(field)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => field.id && handleDeleteField(field.id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFieldEditor && editingField && (
        <FieldEditor
          field={editingField}
          onClose={() => {
            setShowFieldEditor(false);
            setEditingField(null);
          }}
          onSave={handleSaveField}
        />
      )}
    </div>
  );
}

interface FieldEditorProps {
  field: FormField;
  onClose: () => void;
  onSave: (field: FormField) => void;
}

function FieldEditor({ field, onClose, onSave }: FieldEditorProps) {
  const [fieldData, setFieldData] = useState<FormField>(field);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(fieldData);
  };

  const needsOptions = ['select', 'radio', 'checkbox'].includes(fieldData.type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {field.id ? 'Edit Field' : 'Add Field'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type
              </label>
              <select
                value={fieldData.type}
                onChange={(e) => setFieldData({ ...fieldData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <select
                value={fieldData.width}
                onChange={(e) => setFieldData({ ...fieldData, width: e.target.value as 'full' | 'half' })}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="full">Full Width</option>
                <option value="half">Half Width</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              required
              value={fieldData.label}
              onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name (for form data)
            </label>
            <input
              type="text"
              required
              value={fieldData.name}
              onChange={(e) => setFieldData({ ...fieldData, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_') })}
              placeholder="field_name"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={fieldData.placeholder || ''}
              onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={fieldData.help_text || ''}
              onChange={(e) => setFieldData({ ...fieldData, help_text: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={fieldData.default_value || ''}
              onChange={(e) => setFieldData({ ...fieldData, default_value: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options (one per line)
              </label>
              <textarea
                value={fieldData.options || ''}
                onChange={(e) => setFieldData({ ...fieldData, options: e.target.value })}
                rows={4}
                placeholder="Option 1&#10;Option 2&#10;Option 3"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Validation Pattern (regex)
            </label>
            <input
              type="text"
              value={fieldData.validation_pattern || ''}
              onChange={(e) => setFieldData({ ...fieldData, validation_pattern: e.target.value })}
              placeholder="e.g., ^[A-Z]{2}[0-9]{4}$"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Validation Error Message
            </label>
            <input
              type="text"
              value={fieldData.validation_message || ''}
              onChange={(e) => setFieldData({ ...fieldData, validation_message: e.target.value })}
              placeholder="Please enter a valid value"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="required"
              checked={fieldData.required}
              onChange={(e) => setFieldData({ ...fieldData, required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="required" className="ml-2 block text-sm text-gray-900">
              Required field
            </label>
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
              {field.id ? 'Save Changes' : 'Add Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}