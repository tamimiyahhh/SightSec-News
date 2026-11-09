export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

export default function NewsCard({ article, saved, onToggleSave, onDetails }) {
  return (
    <div className="card h-100 news-card shadow-sm">
      {article.image ? (
        <img
          src={article.image}
          className="card-img-top news-img"
          alt=""
          loading="lazy"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : (
        <div className="news-img placeholder-img">No image</div>
      )}
      <div className="card-body d-flex flex-column">
        <div className="small text-muted mb-1">
          {article.source} · {formatDate(article.publishedAt)}
        </div>
        <h5 className="card-title">{article.title}</h5>
        <div className="d-flex gap-2 flex-wrap mt-auto">
          <button className="btn btn-outline-primary btn-sm" onClick={() => onDetails(article)}>
            Details
          </button>
          <a className="btn btn-primary btn-sm" href={article.url} target="_blank" rel="noreferrer">
            Read More
          </a>
          <button
            className={`btn btn-sm ms-auto ${saved ? "btn-warning" : "btn-outline-warning"}`}
            onClick={() => onToggleSave(article)}
            title={saved ? "Remove from favorites" : "Save to favorites"}
          >
            {saved ? "★ Saved" : "☆ Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
