import { buildShareUrl } from './sharedTripRouter';
import { saveTrip, togglePublic, type TripRecord } from './tripsApi';
import type { FormData, ItineraryPlan } from '../types';

export interface PublicShareResult {
  url: string;
  slug: string;
  trip: TripRecord;
}

export async function ensurePublicTrip(
  userId: string,
  itinerary: ItineraryPlan,
  formInput: Partial<FormData> = {},
  existingTripId?: string,
): Promise<PublicShareResult> {
  let trip: TripRecord | null = null;

  if (existingTripId) {
    trip = await togglePublic(existingTripId, true);
  }

  if (!trip) {
    trip = await saveTrip(userId, itinerary, formInput, { isPublic: true });
  }

  if (!trip || !trip.shareSlug) {
    throw new Error('Failed to create public share');
  }

  return {
    url: buildShareUrl(trip.shareSlug),
    slug: trip.shareSlug,
    trip,
  };
}
