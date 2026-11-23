import { statusOf } from '../shared/utils.js'

export default function StatusPill({ status }) {
  const meta = statusOf(status)
  return <span className={`pill pill-${meta.tone}`}>{meta.label}</span>
}
