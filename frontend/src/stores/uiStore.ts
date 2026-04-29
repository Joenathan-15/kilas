import { create } from 'zustand';

interface Generation {
  id: string;
  title: string;
  startedAt: Date;
}

interface UIState {
  activeGenerations: Generation[];
  addGeneration: (id: string, title: string) => void;
  removeGeneration: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeGenerations: [],
  addGeneration: (id, title) => set((state) => ({
    activeGenerations: [...state.activeGenerations, { id, title, startedAt: new Date() }]
  })),
  removeGeneration: (id) => set((state) => ({
    activeGenerations: state.activeGenerations.filter((g) => g.id !== id)
  })),
}));
