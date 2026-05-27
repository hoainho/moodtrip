import { hasConsented, recordConsent, type ConsentScope } from './consent';
import { trackEvent } from './analytics';

export type AffiliatePartner = 'traveloka' | 'klook' | 'agoda';

export interface AffiliateLinkInput {
  partner: AffiliatePartner;
  url: string;
  context: {
    tripId?: string;
    destination?: string;
    venueName?: string;
    productType?: 'hotel' | 'activity' | 'esim' | 'transport';
  };
}

const ALLOWED_DOMAINS: Record<AffiliatePartner, string[]> = {
  traveloka: ['traveloka.com', 'www.traveloka.com'],
  klook: ['klook.com', 'www.klook.com', 'affiliate.klook.com'],
  agoda: ['agoda.com', 'www.agoda.com'],
};

export const AFFILIATE_CONSENT_SCOPE: ConsentScope = 'ai_generation_cross_border';

export function isAllowedAffiliateUrl(partner: AffiliatePartner, rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return ALLOWED_DOMAINS[partner].some((host) => parsed.hostname === host);
}

const AFFILIATE_IDS: Record<AffiliatePartner, string> = {
  traveloka: 'MOODTRIP_TVL',
  klook: 'MOODTRIPKK',
  agoda: 'MOODTRIPAG',
};

const CLICK_ID_PARAM: Record<AffiliatePartner, string> = {
  traveloka: 'aid',
  klook: 'aid',
  agoda: 'cid',
};

const SUB_ID_PARAM: Record<AffiliatePartner, string> = {
  traveloka: 'sub_id',
  klook: 'aff_label',
  agoda: 'tag',
};

export function decorateAffiliateUrl(input: AffiliateLinkInput, clickId: string): string {
  const url = new URL(input.url);
  url.searchParams.set(CLICK_ID_PARAM[input.partner], AFFILIATE_IDS[input.partner]);
  url.searchParams.set(SUB_ID_PARAM[input.partner], clickId);
  return url.toString();
}

export function newClickId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface AffiliateClickOutcome {
  ok: boolean;
  reason?: 'BLOCKED_DOMAIN' | 'CONSENT_REQUIRED' | 'BLOCKED_BY_USER';
  redirectUrl?: string;
  clickId?: string;
}

export async function recordAffiliateClickIntent(
  input: AffiliateLinkInput,
  opts: { requireConsent?: boolean } = {},
): Promise<AffiliateClickOutcome> {
  if (!isAllowedAffiliateUrl(input.partner, input.url)) {
    return { ok: false, reason: 'BLOCKED_DOMAIN' };
  }
  if (opts.requireConsent && !hasConsented(AFFILIATE_CONSENT_SCOPE)) {
    return { ok: false, reason: 'CONSENT_REQUIRED' };
  }

  const clickId = newClickId();
  const redirectUrl = decorateAffiliateUrl(input, clickId);

  void trackEvent(`affiliate_click_${input.partner}`, {
    clickId,
    productType: input.context.productType ?? null,
    venue: input.context.venueName ?? null,
    destination: input.context.destination ?? null,
    tripId: input.context.tripId ?? null,
  });

  return { ok: true, redirectUrl, clickId };
}

export async function acceptAffiliateConsent(): Promise<void> {
  await recordConsent([AFFILIATE_CONSENT_SCOPE]);
}
