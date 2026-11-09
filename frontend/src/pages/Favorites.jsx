import { formatDate } from "../components/NewsCard.jsx";

export default function Favorites({ favorites, onRemove, error }) {
  return (
    <div className="container py-4">
      <h2 className="mb-4">Saved Articles</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {favorites.length === 0 && !error && (
        <p className="text-muted">Nothing saved yet. Press “☆ Save” on any article.</p>
      )}
      <ul className="list-group">
        {favorites.map((f) => (
          <li key={f.id} className="list-group-item d-flex align-items-center gap-3">
            {f.image && <img src={f.image} alt="" className="fav-thumb" onError={(e) => (e.currentTarget.style.display = "none")} />}
            <div className="flex-grow-1">
              <div className="fw-semibold">✓ {f.title}</div>
              <div className="small text-muted">
                {f.source} {f.published_at ? `· ${formatDate(f.published_at)}` : ""}
              </div>
            </div>
            <a className="btn btn-sm btn-primary" href={f.url} target="_blank" rel="noreferrer">
              Open
            </a>
            <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(f)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
