const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

export function HomeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 10.7 12 3.6l8.5 7.1" />
      <path d="M5.8 9.4V20.4h12.4V9.4" />
      <path d="M9.6 20.4v-5.7h4.8v5.7" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.4" />
      <path d="m16 16 4.3 4.3" />
    </svg>
  )
}

export function TicketIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.6 8.4a2.2 2.2 0 0 1 2.2-2.2h12.4a2.2 2.2 0 0 1 2.2 2.2v1.3a2.6 2.6 0 0 0 0 5.1v1.4a2.2 2.2 0 0 1-2.2 2.2H5.8a2.2 2.2 0 0 1-2.2-2.2v-1.4a2.6 2.6 0 0 0 0-5.1z" />
      <path d="M12 7.4v9.2" strokeDasharray="2 2.4" />
    </svg>
  )
}

export function UserIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M4.8 20.2c.7-3.5 3.6-5.6 7.2-5.6s6.5 2.1 7.2 5.6" />
    </svg>
  )
}

export function SwapIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7.5 4.5 4 8l3.5 3.5" />
      <path d="M4 8h13.5" />
      <path d="m16.5 19.5 3.5-3.5-3.5-3.5" />
      <path d="M20 16H6.5" />
    </svg>
  )
}

export function ClockIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3 1.8" />
    </svg>
  )
}

export function PinIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s6.5-5.4 6.5-10.4a6.5 6.5 0 1 0-13 0C5.5 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </svg>
  )
}

export function ChevronLeftIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
    </svg>
  )
}

export function ChevronRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12h14" />
      <path d="m13.5 7 5 5-5 5" />
    </svg>
  )
}

export function BusIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.6" y="4.4" width="16.8" height="12.4" rx="2.6" />
      <path d="M3.6 10.6h16.8" />
      <path d="M7.4 16.8v2.4M16.6 16.8v2.4" />
      <circle cx="7.6" cy="14" r=".9" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="14" r=".9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ShieldIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.4 5 6v5.4c0 4.3 2.9 7.7 7 9.2 4.1-1.5 7-4.9 7-9.2V6z" />
      <path d="m9 12 2.2 2.2L15.4 10" />
    </svg>
  )
}

export function InfoIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.4" />
      <circle cx="12" cy="8.1" r=".9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function CopyIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="8.6" y="8.6" width="11" height="11" rx="2.4" />
      <path d="M15.4 8.6V6.9a2.3 2.3 0 0 0-2.3-2.3H6.9a2.3 2.3 0 0 0-2.3 2.3v6.2a2.3 2.3 0 0 0 2.3 2.3h1.7" />
    </svg>
  )
}

export function DownloadIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.2v10.4" />
      <path d="m7.8 10.6 4.2 4.2 4.2-4.2" />
      <path d="M5.2 17.8v1.2a1.6 1.6 0 0 0 1.6 1.6h10.4a1.6 1.6 0 0 0 1.6-1.6v-1.2" />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.6 7h14.8" />
      <path d="M9.4 7V5.6a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6V7" />
      <path d="M6.6 7l.8 11.1a1.8 1.8 0 0 0 1.8 1.7h6.4a1.8 1.8 0 0 0 1.8-1.7L18.2 7" />
      <path d="M10.2 11v5.2M13.8 11v5.2" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m4.8 12.4 4.6 4.6L19.2 7" />
    </svg>
  )
}

export function CalendarIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.8" y="5.4" width="16.4" height="15" rx="2.4" />
      <path d="M3.8 10h16.4M8.2 3.4v4M15.8 3.4v4" />
    </svg>
  )
}

export function WalletIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="6.2" width="17.2" height="12.6" rx="2.6" />
      <path d="M3.4 10.4h17.2" />
      <circle cx="16.6" cy="14.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SparkIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.6 13.6 9l5.4 1.6-5.4 1.6L12 17.6l-1.6-5.4L5 10.6 10.4 9z" />
    </svg>
  )
}

export function PhoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.3 3.8h3l1.5 3.7-1.9 1.4a11 11 0 0 0 5.2 5.2l1.4-1.9 3.7 1.5v3a2 2 0 0 1-2.2 2A15.6 15.6 0 0 1 4.3 6a2 2 0 0 1 2-2.2Z" />
    </svg>
  )
}

export function MailIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.4" />
      <path d="m4.2 7 7.8 5.8L19.8 7" />
    </svg>
  )
}

export function CarIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.2 15.2v-2.4c0-.5.2-1 .5-1.4l2.1-2.7c.4-.5 1-.8 1.7-.8h5.4c.7 0 1.3.4 1.6 1l1.8 2.9c.2.3.3.7.3 1v2.4" />
      <path d="M3.2 15.2h17.6" />
      <path d="M8.8 8.1v4.6h6.4" />
      <circle cx="7.2" cy="16.9" r="1.7" />
      <circle cx="16.8" cy="16.9" r="1.7" />
    </svg>
  )
}

export function VanIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3.2 15.5V8.6c0-.8.6-1.4 1.4-1.4h9.1c.4 0 .8.1 1.1.4l4.3 4.1c.3.3.5.7.5 1.1v2.7" />
      <path d="M3.2 15.5h17.6" />
      <path d="M14.2 7.2v5.2H19" />
      <circle cx="7" cy="17" r="1.7" />
      <circle cx="16.6" cy="17" r="1.7" />
    </svg>
  )
}

export function FleetIcon({ fleet = '', ...props }) {
  const isCar = /staria|mpv|innova|avanza|sedan/i.test(fleet)
  const Icon = isCar ? CarIcon : VanIcon
  return <Icon {...props} />
}

export function SunIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  )
}

export function CloudIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 18h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.2 4.5 4.5 0 0 0 7 18Z" />
    </svg>
  )
}

export function RainIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 16h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 7.2 4.5 4.5 0 0 0 7 16Z" />
      <path d="m8 19-1 2M12 19l-1 2M16 19l-1 2" />
    </svg>
  )
}

export function WeatherIcon({ type = 'sun', ...props }) {
  const Icon = type === 'rain' ? RainIcon : type === 'cloud' ? CloudIcon : SunIcon
  return <Icon {...props} />
}

export const fleetTone = (fleet = '') => {
  if (/elf|truck|box/i.test(fleet)) return 'elf'
  if (/staria|mpv|innova|avanza/i.test(fleet)) return 'staria'
  return 'hiace'
}

export function ChevronDownIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />
    </svg>
  )
}
