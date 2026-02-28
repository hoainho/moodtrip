export type TripMode = 'long' | 'short';

export type ShortTripMood = 'date' | 'cafe' | 'food_tour' | 'nightlife' | 'fun' | 'chill';

export type Mood = 'relax' | 'explore' | 'nature' | 'romantic' | 'adventure' | 'cultural';

export interface Duration {
  days: number;
  nights: number;
}

export interface FormData {
  tripMode: TripMode;
  startLocation: string;
  destination: string;
  startDate: string;
  duration: Duration;
  startTime?: string;
  endTime?: string;
  budget: number;
  moods: Mood[];
  shortMoods?: ShortTripMood[];
  personalNote: string;
}

export interface TravelTip {
  method: string;
  duration: string;
  notes: string;
  google_maps_link: string;
}

export interface ScheduleItem {
  time: string;
  activity: string;
  venue?: string;
  estimated_cost?: string;
  google_maps_link?: string;
  travel_tips?: TravelTip[];
  is_trending?: boolean;
  trending_reason?: string;
}

export interface WeatherInfo {
  temperature: string;
  condition: string;
  humidity?: string;
  wind?: string;
  note: string;
}

export interface PackingSuggestion {
  item: string;
  reason: string;
}

export interface TrafficAlert {
  area: string;
  issue: string;
  suggestion: string;
}

export interface SafetyAlert {
  type: 'festival' | 'religious' | 'safety' | 'event';
  title: string;
  description: string;
  advice: string;
}

export interface BudgetItem {
  category: string;
  amount: string;
  note?: string;
}

export interface BudgetSummary {
  total_estimated: string;
  breakdown: BudgetItem[];
  vs_budget_note: string;
}

export interface DayPlan {
  day: string;
  title: string;
  weather_note?: string;
  weather?: WeatherInfo;
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
  id?: string | number;
  destination: string;
  overview: string;
  timeline: DayPlan[];
  food: FoodSuggestion[];
  accommodation: AccommodationSuggestion[];
  tips: string[];
  packing_suggestions?: PackingSuggestion[];
  traffic_alerts?: TrafficAlert[];
  safety_alerts?: SafetyAlert[];
  budget_summary?: BudgetSummary;
}