import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPromos } from '../api.js'
import { ErrorBox, Loading } from '../components/State.jsx'
import { CheckIcon, CopyIcon, SparkIcon } from '../components/Icons.jsx'

export default function Promo() {
  const [promos, setPromos] = useState([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getPromos(controller.signal)
      .then(setPromos)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [])

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(''), 1800)
    } catch {
      setError('Browser tidak mengizinkan akses clipboard.')
    }
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Promo</p>
          <h1>Promo & voucher</h1>
        </div>
        <Link to="/cari" className="head-action">
          Pesan
        </Link>
      </header>

      <div className="promo-hero">
        <span className="promo-hero-icon">
          <SparkIcon width={20} height={20} />
        </span>
        <div>
          <strong>Hemat tiap perjalanan</strong>
          <p>Klaim kode promo, lalu pakai saat memesan travel.</p>
        </div>
      </div>

      <ErrorBox message={error} />

      {!promos.length && !error ? (
        <Loading label="Memuat promo…" />
      ) : (
        <div className="promo-list">
          {promos.map((promo) => (
            <article className="promo-tile" key={promo.id}>
              <div className="promo-tile-head">
                <span className="chip chip-ok">{promo.badge}</span>
                <h3>{promo.title}</h3>
              </div>
              <p>{promo.description}</p>

              <div className="promo-code-row">
                <code>{promo.id}</code>
                <button type="button" className="copy-btn" onClick={() => copyCode(promo.id)}>
                  {copied === promo.id ? (
                    <CheckIcon width={15} height={15} />
                  ) : (
                    <CopyIcon width={15} height={15} />
                  )}
                  {copied === promo.id ? 'Tersalin' : 'Salin'}
                </button>
              </div>

              <Link className="btn btn-ghost btn-block" to="/cari">
                Pakai promo
              </Link>
            </article>
          ))}
        </div>
      )}

      <p className="fine-print is-center">
        Kode promo masih demo: belum dipotong otomatis di total pembayaran.
      </p>
    </div>
  )
}
