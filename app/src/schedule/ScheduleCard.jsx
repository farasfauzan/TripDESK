import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '../shared/Icons.jsx'
import { durationText, rupiah } from '../shared/utils.js'

export default function ScheduleCard({ schedule, date, pickupPointId = '' }) {
  const pickup = pickupPointId ? `&pickup=${pickupPointId}` : ''

  return (
    <Link className="schedule-card" to={`/jadwal/${schedule.id}?date=${date}${pickup}`}>
      <div className="schedule-time">
        <strong>{schedule.departTime}</strong>
        <span>{schedule.arriveTime}</span>
      </div>

      <div className="schedule-body">
        <p className="schedule-route">
          {schedule.origin}
          <ArrowRightIcon width={14} height={14} />
          {schedule.destination}
          {schedule.pickupEtaMinutes ? (
            <span className="eta-badge">armada ~{schedule.pickupEtaMinutes} mnt</span>
          ) : null}
        </p>
        <p className="schedule-meta">
          {durationText(schedule.durationMinutes)} · {schedule.fleet}
        </p>
        {schedule.pickupTime ? (
          <p className="schedule-pickup">
            Jemput {schedule.pickupTime} · {schedule.pickupPoint?.name}
          </p>
        ) : (
          <p className={`schedule-seats${schedule.seatsLeft <= 3 ? ' is-low' : ''}`}>
            {schedule.seatsLeft > 0 ? `Sisa ${schedule.seatsLeft} kursi` : 'Kursi habis'}
          </p>
        )}
      </div>

      <div className="schedule-price">
        <strong>{rupiah(schedule.price)}</strong>
        <span className="schedule-cta">Pilih →</span>
      </div>
    </Link>
  )
}
