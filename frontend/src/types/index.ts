export interface User { 
  id: number; 
  email: string; 
  username: string; 
  avatar_url: string; 
  provider: string; 
  tokens: number;
  last_login_date: string | null;
  login_streak: number;
}

export interface Deck { 
  id: number; 
  user_id: number; 
  title: string; 
  description: string; 
  is_public: boolean; 
  tags: string[]; 
  card_count: number; 
  is_ai_generated: boolean;
  created_at: string; 
  updated_at: string; 
}

export interface Card { 
  id: number; 
  deck_id: number; 
  front: string; 
  back: string; 
  front_image_url: string; 
  back_image_url: string; 
  interval: number; 
  repetitions: number; 
  ease_factor: number; 
  due_date: string; 
  is_ai_created: boolean;
  created_at: string; 
}

export interface OverviewStats { 
  total_decks: number; 
  total_cards: number; 
  cards_due_today: number; 
  cards_mastered: number; 
  total_sessions: number; 
  total_study_time: number; 
}

export interface ActivityData { 
  date: string; 
  count: number; 
}

export interface DeckStats { 
  deck_id: number; 
  total_cards: number; 
  due_today: number; 
  mastered: number; 
  new_cards: number; 
  learning: number; 
}

export interface LibraryDeck { 
  id: number; 
  title: string; 
  description: string; 
  tags: string[]; 
  card_count: number; 
  clone_count: number;
  author: { 
    id: number; 
    username: string; 
  }; 
}
