export type Category = 'AI' | 'Tech' | 'Finance' | 'Culture' | 'Cyberpunk' | 'Design';

export interface Article {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  readTime: string;
  author: string;
  date: string;
  excerpt: string;
  content: string[];
  trendingScore: number;
}

export interface UserPreferences {
  categories: Category[];
  newsletter: boolean;
}