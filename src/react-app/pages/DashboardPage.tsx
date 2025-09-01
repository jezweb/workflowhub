import { useState, useEffect } from 'react';
import { Play, Plus } from 'lucide-react';

interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  color: string;
  webhook_url: string;
  position: number;
  enabled: boolean;
}

export default function DashboardPage() {
  const [buttons, setButtons] = useState<ActionButton[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  useEffect(() => {
    fetchButtons();
  }, []);

  const fetchButtons = async () => {
    try {
      const response = await fetch('/api/buttons');
      const data = await response.json();
      setButtons(data);
    } catch (error) {
      console.error('Failed to fetch buttons:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerButton = async (buttonId: string) => {
    setTriggering(buttonId);
    try {
      const response = await fetch(`/api/buttons/${buttonId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      alert(`Workflow triggered successfully: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('Failed to trigger button:', error);
      alert('Failed to trigger workflow');
    } finally {
      setTriggering(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Quick actions to trigger your n8n workflows
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {buttons.map((button) => (
          <button
            key={button.id}
            onClick={() => triggerButton(button.id)}
            disabled={triggering === button.id}
            className="relative group p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
            style={{ borderLeft: `4px solid ${button.color}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {button.icon && <span className="text-2xl">{button.icon}</span>}
                <span className="font-medium text-gray-900">{button.label}</span>
              </div>
              <Play 
                size={20} 
                className={`text-gray-400 group-hover:text-gray-600 ${
                  triggering === button.id ? 'animate-pulse' : ''
                }`}
              />
            </div>
          </button>
        ))}

        <button className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Plus size={20} />
            <span>Add Button</span>
          </div>
        </button>
      </div>

      {buttons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No action buttons configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Add buttons in the Settings page or via the API.
          </p>
        </div>
      )}
    </div>
  );
}