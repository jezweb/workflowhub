import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

interface FormField {
  id: string;
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
  width: 'full' | 'half';
}

interface Form {
  id: string;
  name: string;
  description?: string;
  success_message: string;
  redirect_url?: string;
  fields: FormField[];
}

export default function PublicFormPage() {
  const { slug } = useParams();
  const [form, setForm] = useState<Form | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (slug) {
      fetchForm();
    }
  }, [slug]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/public/form/${slug}`);
      if (!response.ok) {
        throw new Error('Form not found');
      }
      const data = await response.json();
      setForm(data);
      
      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      data.fields.forEach((field: FormField) => {
        if (field.default_value) {
          initialData[field.name] = field.default_value;
        } else if (field.type === 'checkbox') {
          initialData[field.name] = [];
        }
      });
      setFormData(initialData);
    } catch (error) {
      setError('Form not found or not published');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }
    
    if (field.validation_pattern && value) {
      const regex = new RegExp(field.validation_pattern);
      if (!regex.test(value)) {
        return field.validation_message || `Please enter a valid ${field.label}`;
      }
    }
    
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form) return;
    
    // Validate all fields
    const errors: Record<string, string> = {};
    form.fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        errors[field.name] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const hasFiles = Object.keys(files).length > 0;
      let response;
      
      if (hasFiles) {
        // Submit with files using FormData
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        });
        Object.entries(files).forEach(([key, file]) => {
          formDataToSend.append(key, file);
        });
        
        response = await fetch(`/api/public/form/${slug}/submit`, {
          method: 'POST',
          body: formDataToSend,
        });
      } else {
        // Submit without files using JSON
        response = await fetch(`/api/public/form/${slug}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        if (result.redirectUrl) {
          setTimeout(() => {
            window.location.href = result.redirectUrl;
          }, 2000);
        }
      } else {
        setError(result.error || 'Failed to submit form');
      }
    } catch (error) {
      setError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: FormField, value: any) => {
    setFormData({ ...formData, [field.name]: value });
    // Clear validation error when field is changed
    if (validationErrors[field.name]) {
      setValidationErrors({ ...validationErrors, [field.name]: '' });
    }
  };

  const renderField = (field: FormField) => {
    const error = validationErrors[field.name];
    const fieldClass = `w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    }`;
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            rows={4}
            className={fieldClass}
          />
        );
      
      case 'select':
        const selectOptions = field.options ? field.options.split('\n').filter(o => o.trim()) : [];
        return (
          <select
            name={field.name}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            className={fieldClass}
          >
            <option value="">Choose...</option>
            {selectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      case 'radio':
        const radioOptions = field.options ? field.options.split('\n').filter(o => o.trim()) : [];
        return (
          <div className="space-y-2">
            {radioOptions.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={formData[field.name] === option}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  required={field.required}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        const checkboxOptions = field.options ? field.options.split('\n').filter(o => o.trim()) : [];
        return (
          <div className="space-y-2">
            {checkboxOptions.map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  name={field.name}
                  value={option}
                  checked={(formData[field.name] || []).includes(option)}
                  onChange={(e) => {
                    const current = formData[field.name] || [];
                    if (e.target.checked) {
                      handleFieldChange(field, [...current, option]);
                    } else {
                      handleFieldChange(field, current.filter((v: string) => v !== option));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <input
            type="file"
            name={field.name}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFiles({ ...files, [field.name]: file });
              }
            }}
            required={field.required}
            className={fieldClass}
          />
        );
      
      default:
        return (
          <input
            type={field.type}
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            required={field.required}
            pattern={field.validation_pattern}
            className={fieldClass}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading form...</div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-700">{form?.success_message}</p>
          {form?.redirect_url && (
            <p className="text-sm text-gray-500 mt-4">Redirecting...</p>
          )}
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && (
            <p className="text-gray-600 mb-6">{form.description}</p>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid gap-6 ${form.fields.some(f => f.width === 'half') ? 'grid-cols-1 md:grid-cols-2' : ''}`}>
              {form.fields.map((field) => (
                <div key={field.id} className={field.width === 'full' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                  {field.help_text && (
                    <p className="mt-1 text-sm text-gray-500">{field.help_text}</p>
                  )}
                  {validationErrors[field.name] && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send size={20} />
                    Submit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}