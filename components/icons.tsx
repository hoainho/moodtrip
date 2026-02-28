import React from 'react';

const SvgIcon = (props: React.SVGProps<SVGSVGElement> & { children: React.ReactNode }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        {props.children}
    </svg>
);

export const IconMapPin = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </SvgIcon>
);

export const IconCalendar = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
    </SvgIcon>
);

export const IconWallet = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </SvgIcon>
);

export const IconRelax = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" x2="6" y1="2" y2="4" />
        <line x1="10" x2="10" y1="2" y2="4" />
        <line x1="14" x2="14" y1="2" y2="4" />
    </SvgIcon>
);

export const IconExplore = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9Z" />
    </SvgIcon>
);

export const IconNature = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </SvgIcon>
);

export const IconChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m15 18-6-6 6-6" />
    </SvgIcon>
);

export const IconChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m9 18 6-6-6-6" />
    </SvgIcon>
);

export const IconSun = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
    </SvgIcon>
);

export const IconMoon = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </SvgIcon>
);

export const IconFood = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
        <path d="m2 16 2.3-2.3a3 3 0 0 1 4.2 0l1.8 1.8a3 3 0 0 1 0 4.2L8 22" />
        <path d="M20.5 7.5 3.5 20.5" />
    </SvgIcon>
);

export const IconHotel = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
        <path d="M12 10V6" />
        <path d="M2 18h20" />
    </SvgIcon>
);

export const IconTip = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5C17.7 10.2 18 9 18 7.5a6 6 0 0 0-12 0c0 1.5.3 2.7 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
    </SvgIcon>
);

export const IconDownload = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M15 22H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6l5 5v11a2 2 0 0 1-2 2z"/>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
        <path d="M12 18v-6"/>
        <path d="m9 15 3 3 3-3"/>
    </SvgIcon>
);

export const IconShare = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
        <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </SvgIcon>
);

export const IconRestart = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </SvgIcon>
);

export const IconLoader = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </SvgIcon>
);

export const IconWarning = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </SvgIcon>
);

export const IconKey = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
    </SvgIcon>
);

export const IconCopy = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </SvgIcon>
);

export const IconInfo = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" x2="12" y1="16" y2="12" />
        <line x1="12" x2="12.01" y1="8" y2="8" />
    </SvgIcon>
);

export const IconX = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M18 6L6 18M6 6l12 12"/>
    </SvgIcon>
);

export const IconBike = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="5.5" cy="17.5" r="3.5"/>
        <circle cx="18.5" cy="17.5" r="3.5"/>
        <path d="M15 17.5h-5l4-4-2-3h3.5"/>
        <path d="m6.5 14 3-3 2 3h4"/>
    </SvgIcon>
);

export const IconCar = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10h-3.2c-.7 0-1.3.4-1.6.9L10 14H5a1 1 0 0 0-1 1v3c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
    </SvgIcon>
);

export const IconWalk = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="4" r="1"/>
        <path d="M17.5 12.5 14 9.5l-3 3-3-3-2.5 2.5"/>
        <path d="m14 22-3-3-3 3"/>
        <path d="M4.5 12.5 8 16l3-4-2-3"/>
    </SvgIcon>
);

export const IconEdit = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
    </SvgIcon>
);

export const IconBookmark = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </SvgIcon>
);

export const IconCheck = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M20 6 9 17l-5-5"/>
    </SvgIcon>
);

export const IconHeart = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </SvgIcon>
);

export const IconCompass = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </SvgIcon>
);

export const IconFlame = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </SvgIcon>
);

export const IconLandmark = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <line x1="3" x2="21" y1="22" y2="22" />
        <line x1="6" x2="6" y1="18" y2="11" />
        <line x1="10" x2="10" y1="18" y2="11" />
        <line x1="14" x2="14" y1="18" y2="11" />
        <line x1="18" x2="18" y1="18" y2="11" />
        <polygon points="12 2 20 7 4 7" />
    </SvgIcon>
);

export const IconSparkles = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m12 3-1.9 5.8-5.8 1.9 5.8 1.9 1.9 5.8 1.9-5.8 5.8-1.9-5.8-1.9Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
    </SvgIcon>
);

export const IconGlobe = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
    </SvgIcon>
);

export const IconShield = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </SvgIcon>
);

export const IconUsers = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgIcon>
);

export const IconMessageCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </SvgIcon>
);

export const IconCopyright = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <path d="M14.83 14.83a4 4 0 1 1 0-5.66" />
    </SvgIcon>
);

export const IconSend = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </SvgIcon>
);

export const IconThermometer = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </SvgIcon>
);

export const IconCloudSun = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M12 2v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="M20 12h2" />
        <path d="m19.07 4.93-1.41 1.41" />
        <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" />
        <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z" />
    </SvgIcon>
);

export const IconShirt = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </SvgIcon>
);

export const IconAlertTriangle = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </SvgIcon>
);

export const IconConstruction = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <rect x="2" y="6" width="20" height="8" rx="1" />
        <path d="M17 14v7" />
        <path d="M7 14v7" />
        <path d="M17 3v3" />
        <path d="M7 3v3" />
        <path d="M10 14 2.3 6.3" />
        <path d="m14 6 7.7 7.7" />
        <path d="m8 6 8 8" />
    </SvgIcon>
);

export const IconReceipt = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 17.5v-11" />
    </SvgIcon>
);

export const IconCoffee = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    </SvgIcon>
);

export const IconFire = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z" />
    </SvgIcon>
);

export const IconClock = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </SvgIcon>
);

export const IconTarget = (props: React.SVGProps<SVGSVGElement>) => (
    <SvgIcon {...props}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
    </SvgIcon>
);