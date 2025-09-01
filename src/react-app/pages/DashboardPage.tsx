import { useState, useEffect } from 'react';
import { Play, Plus, ChevronDown, ChevronRight, Zap } from 'lucide-react';

interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  color: string;
  webhook_url: string;
  position: number;
  enabled: boolean;
  collection_id?: string;
  collection_name?: string;
  collection_color?: string;
}

interface ButtonCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  position: number;
  collapsed?: boolean;
  button_count?: number;
}

export default function DashboardPage() {
  const [buttons, setButtons] = useState<ActionButton[]>([]);
  const [collections, setCollections] = useState<ButtonCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('collapsedCollections');
    if (saved) {
      setCollapsedCollections(new Set(JSON.parse(saved)));
    }
    
    fetchData();
  }, []);

  useEffect(() => {
    // Save collapsed state to localStorage
    localStorage.setItem('collapsedCollections', JSON.stringify(Array.from(collapsedCollections)));
  }, [collapsedCollections]);

  const fetchData = async () => {
    try {
      const [buttonsRes, collectionsRes] = await Promise.all([
        fetch('/api/buttons'),
        fetch('/api/collections')
      ]);
      
      const buttonsData = await buttonsRes.json();
      const collectionsData = await collectionsRes.json();
      
      setButtons(buttonsData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const toggleCollection = (collectionId: string) => {
    setCollapsedCollections(prev => {
      const next = new Set(prev);
      if (next.has(collectionId)) {
        next.delete(collectionId);
      } else {
        next.add(collectionId);
      }
      return next;
    });
  };

  const renderButton = (button: ActionButton) => (
    <button
      key={button.id}
      onClick={() => triggerButton(button.id)}
      disabled={triggering === button.id}
      className="relative group p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
      style={{ borderLeft: `4px solid ${button.collection_color || button.color}` }}
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
  );

  const renderCollection = (collection: ButtonCollection) => {
    const collectionButtons = buttons.filter(b => b.collection_id === collection.id);
    const isCollapsed = collapsedCollections.has(collection.id);

    return (
      <div key={collection.id} className="mb-6">
        <div 
          className="flex items-center gap-3 mb-4 cursor-pointer select-none"
          onClick={() => toggleCollection(collection.id)}
        >
          <button className="text-gray-500 hover:text-gray-700">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>
          <div className="flex items-center gap-2">
            {collection.icon && <span className="text-2xl">{collection.icon}</span>}
            <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
            <span className="text-sm text-gray-500">({collectionButtons.length})</span>
          </div>
        </div>
        
        {collection.description && !isCollapsed && (
          <p className="text-sm text-gray-600 ml-8 mb-4">{collection.description}</p>
        )}
        
        {!isCollapsed && (
          <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collectionButtons.map(renderButton)}
            {collectionButtons.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400">
                No buttons in this collection yet
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Separate buttons into grouped and ungrouped
  const ungroupedButtons = buttons.filter(b => !b.collection_id);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Quick actions to trigger your n8n workflows
        </p>
      </div>

      {/* Quick Actions (ungrouped buttons) */}
      {ungroupedButtons.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <span className="text-sm text-gray-500">({ungroupedButtons.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ungroupedButtons.map(renderButton)}
          </div>
        </div>
      )}

      {/* Collections */}
      {collections.map(renderCollection)}

      {/* Add button */}
      <div className="mt-8">
        <button className="p-6 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors w-full sm:w-auto">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Plus size={20} />
            <span>Add Button</span>
          </div>
        </button>
      </div>

      {/* Empty state */}
      {buttons.length === 0 && collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No action buttons or collections configured yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Add buttons and organize them into collections in the Settings page.
          </p>
        </div>
      )}
    </div>
  );
}