// src/types/index.ts

// Activity types for different quests
export enum ActivityType {
    BREATHING = 'breathing',
    GRATITUDE = 'gratitude',
    AFFIRMATION = 'affirmation',
    MEDITATION = 'meditation',
    GAME = 'game',
    THOUGHT_BUBBLES = 'thoughtbubbles'
  }
  
  // Interface for quest objects
  export interface Quest {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    color: string;
    totalSteps: number;
    completedSteps: number;
    completed: boolean;
    icon: string;
    
  }
  
  // Interface for streak data tracking
  export interface StreakData {
    currentStreak: number;
    lastCompletedDate: string | null;
    completedQuests: Record<ActivityType, boolean>;
  }