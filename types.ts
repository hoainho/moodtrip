export type Mood = 'relax' | 'explore' | 'nature' | 'romantic' | 'adventure' | 'cultural';

export interface Duration {
  days: number;
  nights: number;
}

export interface FormData {
  destination: string;
  duration: Duration;
  budget: number;
  mood: Mood;
}

export interface ScheduleItem {
  time: string;
  activity: string;
  venue?: string;
  estimated_cost?: string;
}

export interface DayPlan {
  day: string;
  title: string;
  weather_note?: string;
  schedule: ScheduleItem[];
}

export interface FoodSuggestion {
  name: string;
  description: string;
}

export interface AccommodationSuggestion {
  name: string;
  type: string;
  reason: string;
}

export interface ItineraryPlan {
  destination: string;
  overview: string;
  timeline: DayPlan[];
  food: FoodSuggestion[];
  accommodation: AccommodationSuggestion[];
  tips: string[];
}