export default function TrackingMap({ label = 'LIVE · 8 mnt', live = true, pointName = 'titik jemput', active = true }) {
  return (
    <section className="track-map" aria-label={`Peta armada menuju ${pointName}`}>
      <svg viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        <rect width="400" height="200" fill="#ece5d8" />
        <rect x="-10" y="-10" width="140" height="74" rx="10" fill="#e2d8c8" />
        <rect x="260" y="120" width="150" height="90" rx="10" fill="#e2d8c8" />
        <path d="M-20 150 C70 120 112 136 182 92 S318 42 422 66" stroke="#ffffff" strokeWidth="16" fill="none" />
        <path d="M52 -10 L80 210" stroke="#ffffff" strokeWidth="10" />
        <path d="M226 -10 L206 210" stroke="#ffffff" strokeWidth="7" />
        <path d="M-10 54 L410 78" stroke="#ffffff" strokeWidth="6" opacity="0.8" />
        <circle cx="338" cy="52" r="30" fill="#c9dce2" opacity="0.8" />

        <path
          d="M40 160 C100 120 150 148 210 108 S310 72 350 80"
          stroke="#c0492b"
          strokeWidth="4"
          strokeDasharray="9 8"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M40 160 C100 120 150 148 210 108 S310 72 350 80"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeDasharray="2 11"
          fill="none"
          opacity="0.7"
        />

        <g className="track-car" transform={active ? undefined : 'translate(350 80)'}>
          <circle r="13" fill="#ffffff" stroke="#c0492b" strokeWidth="2" />
          <g transform="translate(-6.5 -4.5) scale(0.55)">
            <path
              d="M1 16V9.6c0-.9.7-1.6 1.6-1.6h8.8c.4 0 .8.1 1.1.4l5 4.4c.3.3.5.7.5 1.2v2"
              fill="none"
              stroke="#c0492b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M1 16h18" stroke="#c0492b" strokeWidth="2" strokeLinecap="round" />
            <path d="M10.6 8v4.8H19" fill="none" stroke="#c0492b" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="5.6" cy="17.6" r="2.1" fill="#c0492b" />
            <circle cx="15.4" cy="17.6" r="2.1" fill="#c0492b" />
          </g>
          {active ? (
            <animateMotion
              dur="7s"
              repeatCount="indefinite"
              keyPoints="0;0.85;0.85"
              keyTimes="0;0.8;1"
              calcMode="linear"
              path="M40,160 C100,120 150,148 210,108 S310,72 350,80"
            />
          ) : null}
        </g>

        <g transform="translate(350 80)">
          <circle r="12" fill="#c0492b" opacity="0.18" />
          <circle r="5.5" fill="#c0492b" stroke="#ffffff" strokeWidth="2" />
        </g>

        <g transform="translate(350 104)">
          <circle r="7" fill="#223c4a" stroke="#ffffff" strokeWidth="2.5" />
          <text x="13" y="4" fill="#223c4a" fontSize="10" fontWeight="700">
            Kamu
          </text>
        </g>
      </svg>

      <span className={`track-live${live ? ' is-live' : ''}`}>
        {live ? <i aria-hidden="true" /> : <span className="track-live-dot" aria-hidden="true" />}
        {label}
      </span>
      <span className="track-point">Titik jemput · {pointName}</span>
    </section>
  )
}
