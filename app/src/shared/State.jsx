export function Loading({ label = 'Memuat data…' }) {
  return (
    <div className="state state-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Coba lagi
        </button>
      ) : null}
    </div>
  )
}

// Emoji bawaan sengaja bus, bukan 🎫: di iOS/Apple tiket digambar sebagai
// tiket konser ("LIVE CONCERT TICKET ZONE A") yang membingungkan di app travel.
export function EmptyState({ title, description, action, emoji = '🚌' }) {
  return (
    <div className="state state-empty">
      <div className="state-emoji" aria-hidden="true">
        {emoji}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
