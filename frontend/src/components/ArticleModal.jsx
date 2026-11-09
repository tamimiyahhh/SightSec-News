import { formatDate } from "./NewsCard.jsx";

export default function ArticleModal({ article, onClose }) {
  if (!article) return null;
  const description = (article.description || "").trim();
  const rawContent = (article.content || "").replace(/\[\+\d+ chars\]$/, "…").trim();
  const descriptionPrefix = description.replace(/(?:\.{3}|…)\s*$/, "").trim();
  const contentStartsWithDescription =
    descriptionPrefix.length > 0 &&
    rawContent.toLowerCase().startsWith(descriptionPrefix.toLowerCase());
  const firstParagraph = contentStartsWithDescription ? rawContent : description;
  const continuation = contentStartsWithDescription ? "" : rawContent;
  const metadata = [
    article.source,
    article.author && `By ${article.author}`,
    formatDate(article.publishedAt),
  ].filter(Boolean).join(" · ");

  return (
    <>
      <div className="modal d-block" tabIndex="-1" onClick={onClose}>
        <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{article.title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              {article.image && <img src={article.image} alt="" className="img-fluid rounded mb-3" />}
              {metadata && <p className="text-muted small">{metadata}</p>}
              {firstParagraph && <p>{firstParagraph}</p>}
              {continuation && <p>{continuation}</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <a className="btn btn-primary" href={article.url} target="_blank" rel="noreferrer">
                Open Full Article
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
