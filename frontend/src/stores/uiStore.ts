import { create } from 'zustand';

interface Generation {
  id: string;
  title: string;
  startedAt: Date;
  status: 'loading' | 'success' | 'error';
}

interface UIState {
  activeGenerations: Generation[];
  addGeneration: (gen: { id: string; title: string; status?: 'loading' | 'success' | 'error' }) => void;
  removeGeneration: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeGenerations: [],
  addGeneration: (gen) => set((state) => ({
    activeGenerations: [...state.activeGenerations, { 
      id: gen.id, 
      title: gen.title, 
      startedAt: new Date(),
      status: gen.status || 'loading'
    }]
  })),
  removeGeneration: (id) => set((state) => ({
    activeGenerations: state.activeGenerations.filter((g) => g.id !== id)
  })),
}));
