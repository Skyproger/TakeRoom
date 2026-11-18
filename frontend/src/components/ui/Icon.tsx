import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function base({ size = 20, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  };
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9.5h18" />
      <path d="M8 3v3" />
      <path d="M16 3v3" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 1.75" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="9" cy="9" r="3.5" />
      <path d="M2.5 20c.7-3.2 3.4-5.2 6.5-5.2s5.8 2 6.5 5.2" />
      <circle cx="17" cy="8.5" r="2.5" />
      <path d="M15 14.4c2.4.4 4.2 2 4.9 4.6" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h1" />
      <path d="M14 7h1" />
      <path d="M9 11h1" />
      <path d="M14 11h1" />
      <path d="M9 15h1" />
      <path d="M14 15h1" />
      <path d="M10.5 21v-3h3v3" />
    </svg>
  );
}

export function ProjectorIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="3" y="8" width="14" height="8" rx="2" />
      <circle cx="10" cy="12" r="2" />
      <path d="M17 12h4" />
      <path d="M6 18v2" />
      <path d="M14 18v2" />
    </svg>
  );
}

export function WhiteboardIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M20 3l-6 6" />
      <path d="M17 4l3 3" />
      <path d="M13.5 9.5L4 19v2h2l9.5-9.5" />
    </svg>
  );
}

export function VideoIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="M16 10l5-3v10l-5-3" />
    </svg>
  );
}

export function DotIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M5 12l5 5 9-11" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
    </svg>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function LogoIcon(props: IconProps) {
  return (
    <svg aria-hidden="true" {...base(props)}>
      <rect x="3" y="4" width="18" height="17" rx="4" fill="currentColor" stroke="none" />
      <path d="M8 8h8M8 12h5M8 16h8" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function featureIcon(code: string) {
  switch (code) {
    case 'display':
      return ProjectorIcon;
    case 'whiteboard':
      return WhiteboardIcon;
    case 'video':
      return VideoIcon;
    default:
      return CircleIcon;
  }
}
