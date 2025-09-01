import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, Webhook, Folder } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  description?: string;
}

interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  color: string;
  webhook_url: string;
  position: number;
  enabled: boolean;
  collection_id?: string;
}

interface ChatFolder {
  id: string;
  name: string;
  icon?: string;
  webhook_url: string;
}

interface ButtonCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  position: number;
  button_count?: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [buttons, setButtons] = useState<ActionButton[]>([]);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [collections, setCollections] = useState<ButtonCollection[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'buttons' | 'folders' | 'collections'>('general');
  const [editingButton, setEditingButton] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [newSetting, setNewSetting] = useState({ key: '', value: '' });

  useEffect(() => {
    fetchSettings();
    fetchButtons();
    fetchFolders();
    fetchCollections();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(Object.entries(data).map(([key, value]) => ({
        key,
        value: String(value),
      })));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchButtons = async () => {
    try {
      const response = await fetch('/api/buttons');
      const data = await response.json();
      setButtons(data);
    } catch (error) {
      console.error('Failed to fetch buttons:', error);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/chat/folders');
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch('/api/collections');
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      fetchSettings();
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  };

  const deleteSetting = async (key: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;
    
    try {
      await fetch(`/api/settings/${key}`, {
        method: 'DELETE',
      });
      fetchSettings();
    } catch (error) {
      console.error('Failed to delete setting:', error);
    }
  };

  const saveButton = async (button: ActionButton) => {
    try {
      const method = button.id.startsWith('new-') ? 'POST' : 'PUT';
      const url = button.id.startsWith('new-') 
        ? '/api/buttons'
        : `/api/buttons/${button.id}`;
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(button),
      });
      
      setEditingButton(null);
      fetchButtons();
    } catch (error) {
      console.error('Failed to save button:', error);
    }
  };

  const deleteButton = async (buttonId: string) => {
    if (!confirm('Are you sure you want to delete this button?')) return;
    
    try {
      await fetch(`/api/buttons/${buttonId}`, {
        method: 'DELETE',
      });
      fetchButtons();
    } catch (error) {
      console.error('Failed to delete button:', error);
    }
  };

  const saveFolder = async (folder: ChatFolder) => {
    try {
      const method = folder.id.startsWith('new-') ? 'POST' : 'PUT';
      const url = folder.id.startsWith('new-') 
        ? '/api/chat/folders'
        : `/api/chat/folders/${folder.id}`;
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder),
      });
      
      setEditingFolder(null);
      fetchFolders();
    } catch (error) {
      console.error('Failed to save folder:', error);
    }
  };

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder and all its threads?')) return;
    
    try {
      await fetch(`/api/chat/folders/${folderId}`, {
        method: 'DELETE',
      });
      fetchFolders();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const saveCollection = async (collection: ButtonCollection) => {
    try {
      const method = collection.id.startsWith('new-') ? 'POST' : 'PUT';
      const url = collection.id.startsWith('new-') 
        ? '/api/collections'
        : `/api/collections/${collection.id}`;
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collection),
      });
      
      setEditingCollection(null);
      fetchCollections();
      fetchButtons(); // Refresh buttons to show updated collection assignments
    } catch (error) {
      console.error('Failed to save collection:', error);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? Buttons will be unassigned but not deleted.')) return;
    
    try {
      await fetch(`/api/collections/${collectionId}`, {
        method: 'DELETE',
      });
      fetchCollections();
      fetchButtons();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure application settings, action buttons, and chat folders
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            General Settings
          </button>
          <button
            onClick={() => setActiveTab('buttons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'buttons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Action Buttons
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'folders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Chat Folders
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'collections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Button Collections
          </button>
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.key} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{setting.key}</div>
                  <input
                    type="text"
                    value={setting.value}
                    onChange={(e) => {
                      const updated = settings.map(s =>
                        s.key === setting.key ? { ...s, value: e.target.value } : s
                      );
                      setSettings(updated);
                    }}
                    className="mt-1 w-full px-3 py-1 border rounded-md text-sm"
                  />
                </div>
                <button
                  onClick={() => saveSetting(setting.key, setting.value)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={() => deleteSetting(setting.key)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {/* Add new setting */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">Add New Setting</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={newSetting.key}
                  onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={newSetting.value}
                  onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={() => {
                    if (newSetting.key && newSetting.value) {
                      saveSetting(newSetting.key, newSetting.value);
                      setNewSetting({ key: '', value: '' });
                    }
                  }}
                  disabled={!newSetting.key || !newSetting.value}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Tab */}
      {activeTab === 'buttons' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {buttons.map((button) => (
              <div key={button.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {editingButton === button.id ? (
                  <>
                    <input
                      type="text"
                      value={button.icon || ''}
                      onChange={(e) => {
                        const updated = buttons.map(b =>
                          b.id === button.id ? { ...b, icon: e.target.value } : b
                        );
                        setButtons(updated);
                      }}
                      placeholder="Icon"
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={button.label}
                      onChange={(e) => {
                        const updated = buttons.map(b =>
                          b.id === button.id ? { ...b, label: e.target.value } : b
                        );
                        setButtons(updated);
                      }}
                      placeholder="Label"
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={button.webhook_url}
                      onChange={(e) => {
                        const updated = buttons.map(b =>
                          b.id === button.id ? { ...b, webhook_url: e.target.value } : b
                        );
                        setButtons(updated);
                      }}
                      placeholder="Webhook URL"
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <input
                      type="color"
                      value={button.color}
                      onChange={(e) => {
                        const updated = buttons.map(b =>
                          b.id === button.id ? { ...b, color: e.target.value } : b
                        );
                        setButtons(updated);
                      }}
                      className="w-12 h-8"
                    />
                    <select
                      value={button.collection_id || ''}
                      onChange={(e) => {
                        const updated = buttons.map(b =>
                          b.id === button.id ? { ...b, collection_id: e.target.value || undefined } : b
                        );
                        setButtons(updated);
                      }}
                      className="px-2 py-1 border rounded"
                    >
                      <option value="">No Collection</option>
                      {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => saveButton(button)}
                      className="text-green-600"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditingButton(null)}
                      className="text-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{button.icon || '🔘'}</span>
                    <div className="flex-1">
                      <div className="font-medium">{button.label}</div>
                      <div className="text-sm text-gray-500">{button.webhook_url}</div>
                      {button.collection_id && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Folder size={12} />
                          {collections.find(c => c.id === button.collection_id)?.name || 'Unknown Collection'}
                        </div>
                      )}
                    </div>
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: button.color }}
                    />
                    <button
                      onClick={() => setEditingButton(button.id)}
                      className="text-blue-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteButton(button.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            ))}

            <button
              onClick={() => {
                const newButton: ActionButton = {
                  id: `new-${Date.now()}`,
                  label: 'New Button',
                  icon: '🆕',
                  color: '#3B82F6',
                  webhook_url: '',
                  position: buttons.length,
                  enabled: true,
                };
                setButtons([...buttons, newButton]);
                setEditingButton(newButton.id);
              }}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600"
            >
              <Plus size={20} className="mx-auto" />
              Add New Button
            </button>
          </div>
        </div>
      )}

      {/* Chat Folders Tab */}
      {activeTab === 'folders' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {editingFolder === folder.id ? (
                  <>
                    <input
                      type="text"
                      value={folder.icon || ''}
                      onChange={(e) => {
                        const updated = folders.map(f =>
                          f.id === folder.id ? { ...f, icon: e.target.value } : f
                        );
                        setFolders(updated);
                      }}
                      placeholder="Icon"
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={folder.name}
                      onChange={(e) => {
                        const updated = folders.map(f =>
                          f.id === folder.id ? { ...f, name: e.target.value } : f
                        );
                        setFolders(updated);
                      }}
                      placeholder="Name"
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={folder.webhook_url}
                      onChange={(e) => {
                        const updated = folders.map(f =>
                          f.id === folder.id ? { ...f, webhook_url: e.target.value } : f
                        );
                        setFolders(updated);
                      }}
                      placeholder="Webhook URL"
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <button
                      onClick={() => saveFolder(folder)}
                      className="text-green-600"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditingFolder(null)}
                      className="text-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{folder.icon || '📁'}</span>
                    <div className="flex-1">
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Webhook size={14} />
                        {folder.webhook_url || 'No webhook configured'}
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingFolder(folder.id)}
                      className="text-blue-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            ))}

            <button
              onClick={() => {
                const newFolder: ChatFolder = {
                  id: `new-${Date.now()}`,
                  name: 'New Folder',
                  icon: '📁',
                  webhook_url: '',
                };
                setFolders([...folders, newFolder]);
                setEditingFolder(newFolder.id);
              }}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600"
            >
              <Plus size={20} className="mx-auto" />
              Add New Folder
            </button>
          </div>
        </div>
      )}

      {/* Button Collections Tab */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {collections.map((collection) => (
              <div key={collection.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {editingCollection === collection.id ? (
                  <>
                    <input
                      type="text"
                      value={collection.icon || ''}
                      onChange={(e) => {
                        const updated = collections.map(c =>
                          c.id === collection.id ? { ...c, icon: e.target.value } : c
                        );
                        setCollections(updated);
                      }}
                      placeholder="Icon"
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={collection.name}
                      onChange={(e) => {
                        const updated = collections.map(c =>
                          c.id === collection.id ? { ...c, name: e.target.value } : c
                        );
                        setCollections(updated);
                      }}
                      placeholder="Name"
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <input
                      type="text"
                      value={collection.description || ''}
                      onChange={(e) => {
                        const updated = collections.map(c =>
                          c.id === collection.id ? { ...c, description: e.target.value } : c
                        );
                        setCollections(updated);
                      }}
                      placeholder="Description"
                      className="flex-1 px-2 py-1 border rounded"
                    />
                    <input
                      type="color"
                      value={collection.color}
                      onChange={(e) => {
                        const updated = collections.map(c =>
                          c.id === collection.id ? { ...c, color: e.target.value } : c
                        );
                        setCollections(updated);
                      }}
                      className="w-12 h-8"
                    />
                    <button
                      onClick={() => saveCollection(collection)}
                      className="text-green-600"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setEditingCollection(null)}
                      className="text-gray-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">{collection.icon || '📂'}</span>
                    <div className="flex-1">
                      <div className="font-medium">{collection.name}</div>
                      {collection.description && (
                        <div className="text-sm text-gray-500">{collection.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {collection.button_count || 0} button{collection.button_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: collection.color }}
                    />
                    <button
                      onClick={() => setEditingCollection(collection.id)}
                      className="text-blue-600"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            ))}

            <button
              onClick={() => {
                const newCollection: ButtonCollection = {
                  id: `new-${Date.now()}`,
                  name: 'New Collection',
                  description: '',
                  icon: '📂',
                  color: '#3b82f6',
                  position: collections.length,
                };
                setCollections([...collections, newCollection]);
                setEditingCollection(newCollection.id);
              }}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600"
            >
              <Plus size={20} className="mx-auto" />
              Add New Collection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}