export type TripMode = 'long' | 'short';

export type ShortTripMood = 'date' | 'cafe' | 'food_tour' | 'nightlife' | 'fun' | 'chill';

export type Mood = 'relax' | 'explore' | 'nature' | 'romantic' | 'adventure' | 'cultural';

/**
 * Flexible, emotion-driven mood input — the PRIMARY way a user expresses mood.
 * Replaces the rigid 6-button picker on the human-facing form.
 *  - `text`: free-form emotional description ("mệt, cần chậm lại, gần biển…"). User data → fenced in the prompt.
 *  - `seeds`: optional emotion-suggestion labels the user tapped (open set, not exclusive).
 *  - `intensity`: 0..1, how strongly the mood should drive the plan (default 0.5).
 * `Mood`/`ShortTripMood` remain a LIVE INTERNAL taxonomy derived from seeds (see constants.ts
 * seedsToMoods) so the card-pull, preferences, 3D personal world and persona keep working.
 */
export interface MoodInput {
  text: string;
  seeds: string[];
  intensity: number;
}

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
  /** PRIMARY flexible mood input (free-text + seeds + intensity). */
  mood?: MoodInput;
  /** Derived internal taxonomy (from mood.seeds). Kept for card-pull / preferences / 3D world / persona. */
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