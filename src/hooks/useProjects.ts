import { useState } from 'react';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { PROJECT_TYPES, DEFAULT_FILES } from '../App';

export const useProjects = (
  user: any,
  db: any,
  FIREBASE_AVAILABLE: boolean,
  projects: any[],
  setProjects: any,
  setCurrentProjectId: any,
  setActiveTab: any,
  setAiError: any,
  addLog: any,
  categories: string[],
  setCategories: any
) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  const createNewProject = async (name = "Nouveau Projet", type = 'web') => {
    const id = crypto.randomUUID();
    const typeInfo = PROJECT_TYPES.find(t => t.id === type) || PROJECT_TYPES[0];
    const initialFiles = type === 'web' ? DEFAULT_FILES : {
      [type === 'python' ? 'app.py' : type === 'sql' ? 'schema.sql' : type === 'markdown' ? 'README.md' : 'main.code']: `// Initial Forge: ${typeInfo.name}\n// Neural Studio FS initialized.`
    };
    
    const newP: any = {
      id,
      name,
      type,
      category: 'Projets',
      versions: [{ timestamp: Date.now(), files: initialFiles, prompt: `Initial ${typeInfo.name} v1.0` }],
      currentVersionIndex: 0,
      activeFile: Object.keys(initialFiles)[0],
      updatedAt: new Date().toISOString()
    };

    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      await setDoc(doc(db!, 'users', user.uid, 'projects', id), {
        ...newP,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
    } else {
      const updated = [...projects, newP];
      setProjects(updated);
      localStorage.setItem('wf_projects', JSON.stringify(updated));
    }
    setCurrentProjectId(id);
    setActiveTab('editor');
    setAiError({ message: "Projet créé ✓", type: 'success' });
    setTimeout(() => setAiError(null), 3000);
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      await deleteDoc(doc(db!, 'users', user.uid, 'projects', id));
    } else {
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      localStorage.setItem('wf_projects', JSON.stringify(updated));
    }
    setAiError({ message: "Projet supprimé ✓", type: 'success' });
    setTimeout(() => setAiError(null), 3000);
  };

  const duplicateProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = projects.find(proj => proj.id === id);
    if (!p) return;

    const newId = crypto.randomUUID();
    const newProject = {
      ...p,
      id: newId,
      name: `${p.name} (copie)`,
      versions: JSON.parse(JSON.stringify(p.versions)),
      updatedAt: new Date().toISOString()
    };

    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      await setDoc(doc(db!, 'users', user.uid, 'projects', newId), {
        ...newProject,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
    } else {
      const updated = [...projects, newProject];
      setProjects(updated);
      localStorage.setItem('wf_projects', JSON.stringify(updated));
    }
    setCurrentProjectId(newId);
    setAiError({ message: "Projet dupliqué ✓", type: 'success' });
    setTimeout(() => setAiError(null), 3000);
    addLog(`PROJECT_DUPLICATION: Clone of ${p.name} deployed to VFS`);
  };

  const renameProject = async (id: string, newName: string) => {
    if (!newName.trim()) {
      setEditingProjectId(null);
      return;
    }
    const p = projects.find(proj => proj.id === id);
    if (!p) return;

    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      await setDoc(doc(db!, 'users', user.uid, 'projects', id), {
        ...p,
        name: newName,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else {
      const updated = projects.map(proj => proj.id === id ? { ...proj, name: newName } : proj);
      setProjects(updated);
      localStorage.setItem('wf_projects', JSON.stringify(updated));
    }
    setEditingProjectId(null);
    setAiError({ message: "Projet renommé ✓", type: 'success' });
    setTimeout(() => setAiError(null), 3000);
    addLog(`PROJECT_RENAME: Identity shifted from ${p.name} to ${newName}`);
  };

  const updateProjectCode = async (currentProjectId: string, newFiles: Record<string, string>, newPrompt: string) => {
    if (!currentProjectId) return;
    
    addLog(`CORE_FORGE_SYMMETRY: Syncing ${Object.keys(newFiles).length} files to memory`);
    const p = projects.find(proj => proj.id === currentProjectId);
    if (!p) return;

    const newV: any = { timestamp: Date.now(), files: newFiles, prompt: newPrompt };
    const newVs = [...p.versions.slice(0, p.currentVersionIndex + 1), newV];
    const updatedProject = { ...p, versions: newVs, currentVersionIndex: newVs.length - 1, updatedAt: new Date().toISOString() };

    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      try {
        await setDoc(doc(db!, 'users', user.uid, 'projects', currentProjectId), {
          ...updatedProject,
          userId: user.uid,
          updatedAt: serverTimestamp()
        });
      } catch (err) { console.error("Cloud save failed:", err); }
    } else {
      const updated = projects.map(item => item.id === currentProjectId ? updatedProject : item);
      setProjects(updated);
      localStorage.setItem('wf_projects', JSON.stringify(updated));
    }
  };

  return {
    editingProjectId,
    setEditingProjectId,
    createNewProject,
    deleteProject,
    duplicateProject,
    renameProject,
    updateProjectCode
  };
};
