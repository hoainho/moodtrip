export interface RecapCardInput {
  destination: string;
  overview: string;
  days: number;
  topActivities: string[];
  userHandle?: string;
}

const PALETTE = {
  bg: '#0a0e1a',
  accent: '#0d9488',
  accent2: '#06b6d4',
  text: '#e2e8f0',
  subtle: '#94a3b8',
};

export function buildRecapCardJsx(input: RecapCardInput): unknown {
  const activities = input.topActivities.slice(0, 4);
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        padding: 64,
        background: `linear-gradient(135deg, ${PALETTE.bg} 0%, #0f172a 100%)`,
        fontFamily: 'Be Vietnam Pro, system-ui, sans-serif',
        color: PALETTE.text,
        position: 'relative',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 64,
              right: 64,
              fontSize: 28,
              fontWeight: 700,
              background: `linear-gradient(90deg, ${PALETTE.accent} 0%, ${PALETTE.accent2} 100%)`,
              backgroundClip: 'text',
              color: 'transparent',
              display: 'flex',
            },
            children: 'MoodTrip',
          },
        },
        {
          type: 'div',
          props: {
            style: { fontSize: 22, color: PALETTE.subtle, marginBottom: 8, display: 'flex' },
            children: `${input.days} ngày · Lịch trình chia sẻ`,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: 24,
              display: 'flex',
            },
            children: input.destination,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 30,
              color: PALETTE.subtle,
              lineHeight: 1.3,
              marginBottom: 40,
              display: 'flex',
            },
            children: input.overview.length > 140 ? `${input.overview.slice(0, 137)}…` : input.overview,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 'auto',
            },
            children: activities.map((line) => ({
              type: 'div',
              props: {
                style: {
                  fontSize: 26,
                  color: PALETTE.text,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: PALETTE.accent,
                        display: 'flex',
                      },
                    },
                  },
                  {
                    type: 'div',
                    props: { style: { display: 'flex' }, children: line },
                  },
                ],
              },
            })),
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 32,
              right: 64,
              fontSize: 20,
              color: PALETTE.subtle,
              display: 'flex',
            },
            children: input.userHandle ? `bởi @${input.userHandle}` : 'moodtrip.app',
          },
        },
      ],
    },
  };
}
