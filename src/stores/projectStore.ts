import { create } from 'zustand';
import { db, createDefaultProject } from '@/lib/db';
import { Project } from '@/types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await db.projects.orderBy('updatedAt').reverse().toArray();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: '프로젝트 목록을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  fetchProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await db.projects.get(id);
      if (project) {
        set({ currentProject: project, isLoading: false });
      } else {
        set({ error: '프로젝트를 찾을 수 없습니다.', isLoading: false });
      }
    } catch (error) {
      set({ error: '프로젝트를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  createProject: async (data: Partial<Project>) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = createDefaultProject(data);
      await db.projects.add(newProject);
      const projects = get().projects;
      set({ projects: [newProject, ...projects], currentProject: newProject, isLoading: false });
      return newProject;
    } catch (error) {
      set({ error: '프로젝트 생성에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    set({ isLoading: true, error: null });
    try {
      const updatedData = { ...data, updatedAt: new Date() };
      await db.projects.update(id, updatedData);

      const projects = get().projects.map(p =>
        p.id === id ? { ...p, ...updatedData } : p
      );

      const currentProject = get().currentProject;
      if (currentProject?.id === id) {
        set({ currentProject: { ...currentProject, ...updatedData } });
      }

      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: '프로젝트 업데이트에 실패했습니다.', isLoading: false });
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      // 관련 데이터 모두 삭제
      await Promise.all([
        db.projects.delete(id),
        db.characters.where('projectId').equals(id).delete(),
        db.chapters.where('projectId').equals(id).delete(),
        db.worldSettings.where('projectId').equals(id).delete(),
        db.dictionary.where('projectId').equals(id).delete(),
        db.locations.where('projectId').equals(id).delete(),
        db.plotStructures.where('projectId').equals(id).delete(),
        db.foreshadowings.where('projectId').equals(id).delete(),
        db.conflicts.where('projectId').equals(id).delete(),
        db.researchNotes.where('projectId').equals(id).delete(),
        db.writingSessions.where('projectId').equals(id).delete(),
      ]);

      const projects = get().projects.filter(p => p.id !== id);
      const currentProject = get().currentProject;

      set({
        projects,
        currentProject: currentProject?.id === id ? null : currentProject,
        isLoading: false
      });
    } catch (error) {
      set({ error: '프로젝트 삭제에 실패했습니다.', isLoading: false });
    }
  },

  duplicateProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const originalProject = await db.projects.get(id);
      if (!originalProject) {
        throw new Error('원본 프로젝트를 찾을 수 없습니다.');
      }

      const newProject = createDefaultProject({
        ...originalProject,
        id: undefined,
        title: `${originalProject.title} (복사본)`,
        createdAt: undefined,
        updatedAt: undefined,
      });

      await db.projects.add(newProject);

      // 캐릭터 복사
      const characters = await db.characters.where('projectId').equals(id).toArray();
      const characterIdMap = new Map<string, string>();

      for (const char of characters) {
        const newId = crypto.randomUUID();
        characterIdMap.set(char.id, newId);
        await db.characters.add({
          ...char,
          id: newId,
          projectId: newProject.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 세계관 설정 복사
      const worldSettings = await db.worldSettings.where('projectId').equals(id).toArray();
      for (const setting of worldSettings) {
        await db.worldSettings.add({
          ...setting,
          id: crypto.randomUUID(),
          projectId: newProject.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const projects = get().projects;
      set({ projects: [newProject, ...projects], isLoading: false });
      return newProject;
    } catch (error) {
      set({ error: '프로젝트 복제에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  },
}));
