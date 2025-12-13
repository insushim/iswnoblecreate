import { create } from 'zustand';
import { db, createPlotStructure, createForeshadowing, createConflict } from '@/lib/db';
import { PlotStructure, Foreshadowing, Conflict, PlotPoint } from '@/types';

interface PlotState {
  plotStructure: PlotStructure | null;
  foreshadowings: Foreshadowing[];
  conflicts: Conflict[];
  isLoading: boolean;

  // Plot Structure
  fetchPlotStructure: (projectId: string) => Promise<void>;
  updatePlotStructure: (id: string, updates: Partial<PlotStructure>) => Promise<void>;
  addPlotPoint: (plotPoint: Omit<PlotPoint, 'id'>) => Promise<void>;
  updatePlotPoint: (pointId: string, updates: Partial<PlotPoint>) => Promise<void>;
  deletePlotPoint: (pointId: string) => Promise<void>;

  // Foreshadowing
  fetchForeshadowings: (projectId: string) => Promise<void>;
  createForeshadowing: (projectId: string, data: Partial<Foreshadowing>) => Promise<Foreshadowing>;
  updateForeshadowing: (id: string, updates: Partial<Foreshadowing>) => Promise<void>;
  deleteForeshadowing: (id: string) => Promise<void>;

  // Conflict
  fetchConflicts: (projectId: string) => Promise<void>;
  createConflict: (projectId: string, data: Partial<Conflict>) => Promise<Conflict>;
  updateConflict: (id: string, updates: Partial<Conflict>) => Promise<void>;
  deleteConflict: (id: string) => Promise<void>;
}

export const usePlotStore = create<PlotState>((set, get) => ({
  plotStructure: null,
  foreshadowings: [],
  conflicts: [],
  isLoading: false,

  fetchPlotStructure: async (projectId: string) => {
    set({ isLoading: true });
    try {
      let structure = await db.plotStructures.where('projectId').equals(projectId).first();

      if (!structure) {
        structure = createPlotStructure(projectId);
        await db.plotStructures.add(structure);
      }

      set({ plotStructure: structure });
    } catch (error) {
      console.error('플롯 구조 로딩 실패:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  updatePlotStructure: async (id: string, updates: Partial<PlotStructure>) => {
    try {
      await db.plotStructures.update(id, { ...updates, updatedAt: new Date() });
      set((state) => ({
        plotStructure: state.plotStructure
          ? { ...state.plotStructure, ...updates, updatedAt: new Date() }
          : null,
      }));
    } catch (error) {
      console.error('플롯 구조 업데이트 실패:', error);
      throw error;
    }
  },

  addPlotPoint: async (plotPoint: Omit<PlotPoint, 'id'>) => {
    const { plotStructure } = get();
    if (!plotStructure) return;

    const newPoint: PlotPoint = {
      ...plotPoint,
      id: crypto.randomUUID(),
    };

    const updatedPoints = [...plotStructure.plotPoints, newPoint];
    await get().updatePlotStructure(plotStructure.id, { plotPoints: updatedPoints });
  },

  updatePlotPoint: async (pointId: string, updates: Partial<PlotPoint>) => {
    const { plotStructure } = get();
    if (!plotStructure) return;

    const updatedPoints = plotStructure.plotPoints.map((point) =>
      point.id === pointId ? { ...point, ...updates } : point
    );
    await get().updatePlotStructure(plotStructure.id, { plotPoints: updatedPoints });
  },

  deletePlotPoint: async (pointId: string) => {
    const { plotStructure } = get();
    if (!plotStructure) return;

    const updatedPoints = plotStructure.plotPoints.filter((point) => point.id !== pointId);
    await get().updatePlotStructure(plotStructure.id, { plotPoints: updatedPoints });
  },

  fetchForeshadowings: async (projectId: string) => {
    try {
      const foreshadowings = await db.foreshadowings.where('projectId').equals(projectId).toArray();
      set({ foreshadowings });
    } catch (error) {
      console.error('복선 로딩 실패:', error);
    }
  },

  createForeshadowing: async (projectId: string, data: Partial<Foreshadowing>) => {
    const newForeshadowing = createForeshadowing(projectId, data);
    await db.foreshadowings.add(newForeshadowing);
    set((state) => ({ foreshadowings: [...state.foreshadowings, newForeshadowing] }));
    return newForeshadowing;
  },

  updateForeshadowing: async (id: string, updates: Partial<Foreshadowing>) => {
    await db.foreshadowings.update(id, updates);
    set((state) => ({
      foreshadowings: state.foreshadowings.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    }));
  },

  deleteForeshadowing: async (id: string) => {
    await db.foreshadowings.delete(id);
    set((state) => ({
      foreshadowings: state.foreshadowings.filter((f) => f.id !== id),
    }));
  },

  fetchConflicts: async (projectId: string) => {
    try {
      const conflicts = await db.conflicts.where('projectId').equals(projectId).toArray();
      set({ conflicts });
    } catch (error) {
      console.error('갈등 로딩 실패:', error);
    }
  },

  createConflict: async (projectId: string, data: Partial<Conflict>) => {
    const newConflict = createConflict(projectId, data);
    await db.conflicts.add(newConflict);
    set((state) => ({ conflicts: [...state.conflicts, newConflict] }));
    return newConflict;
  },

  updateConflict: async (id: string, updates: Partial<Conflict>) => {
    await db.conflicts.update(id, updates);
    set((state) => ({
      conflicts: state.conflicts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteConflict: async (id: string) => {
    await db.conflicts.delete(id);
    set((state) => ({
      conflicts: state.conflicts.filter((c) => c.id !== id),
    }));
  },
}));
