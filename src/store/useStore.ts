import { create } from 'zustand';
import { Category, Article, UserPreferences } from '@/lib/types';

interface AppState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  selectedArticle: Article | null;
  setSelectedArticle: (article: Article | null) => void;
  userPreferences: UserPreferences;
  setSelectedCategories: (categories: Category[]) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (val: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  activeView: 'all' | 'login' | 'deck' | 'article';
  setActiveView: (view: 'all' | 'login' | 'deck' | 'article') => void;
}

export const useStore = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        if (newTheme === 'light') {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
      }
      return { theme: newTheme };
    }),
  isLoading: true,
  setIsLoading: (val) => set({ isLoading: val }),
  selectedArticle: null,
  setSelectedArticle: (article) => set({ selectedArticle: article }),
  userPreferences: {
    categories: ['AI', 'Tech', 'Finance', 'Culture', 'Cyberpunk', 'Design'],
    newsletter: true,
  },
  setSelectedCategories: (categories) =>
    set((state) => ({
      userPreferences: { ...state.userPreferences, categories },
    })),
  isAuthOpen: false,
  setIsAuthOpen: (val) => set({ isAuthOpen: val }),
  isAuthenticated: true, // Default to true so Top-Right avatar badge is immediately visible, but toggleable!
  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  activeView: 'all',
  setActiveView: (view) => set({ activeView: view }),
}));