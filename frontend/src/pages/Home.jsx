import { useCallback, useEffect, useState } from "react";
import { fetchNews, errorMessage } from "../api.js";
import NewsCard from "../components/NewsCard.jsx";
import ArticleModal from "../components/ArticleModal.jsx";

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "ai", label: "AI" },
  { id: "technology", label: "Technology" },
  { id: "malware", label: "Malware" },
  { id: "privacy", label: "Data Privacy" },
];

const EVENT_COUNTRIES = [
  "Argentina",
  "Australia",
  "Bangladesh",
  "Brazil",
  "Canada",
  "China",
  "Colombia",
  "Egypt",
  "France",
  "Germany",
  "Greece",
  "Hong Kong",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Malaysia",
  "Mexico",
  "Netherlands",
  "Norway",
  "Pakistan",
  "Peru",
  "Philippines",
  "Portugal",
  "Russia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Turkey",
  "Ukraine",
  "United Kingdom",
  "United States",
];

const HISTORY_KEY = "cyberwatch_history";
const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

const getPaginationItems = (totalPages, currentPage) => {
  const pages = [...new Set([
    1,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    ...(currentPage === 1 ? [currentPage + 2] : []),
    totalPages,
  ])]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  return pages.flatMap((pageNumber, index) => {
    if (index === 0) return [pageNumber];
    const previousPage = pages[index - 1];
    return [
      ...(pageNumber - previousPage > 1 ? [`ellipsis-${previousPage}-${pageNumber}`] : []),
      pageNumber,
    ];
  });
};

export default function Home({ savedUrls, onToggleSave }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("cybersecurity");
  const [eventCountry, setEventCountry] = useState("");
  const [publisher, setPublisher] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [jumpEllipsis, setJumpEllipsis] = useState(null);
  const [jumpPage, setJumpPage] = useState("");
  const [data, setData] = useState({ articles: [], totalResults: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(loadHistory);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await fetchNews({ q: query, category, eventCountry, page, pageSize: 10 }));
    } catch (e) {
      setError(errorMessage(e));
      setData({ articles: [], totalResults: 0 });
    } finally {
      setLoading(false);
    }
  }, [query, category, eventCountry, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setJumpEllipsis(null);
    setJumpPage("");
  }, [page]);

  const submit = (term) => {
    const q = term.trim();
    setQuery(q);
    setPage(1);
    if (q) {
      const next = [q, ...history.filter((h) => h !== q)].slice(0, 8);
      setHistory(next);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const totalPages = Math.min(Math.ceil((data.totalResults || 0) / 10), 100);
  const visibleArticles = publisher.trim()
    ? data.articles.filter((article) =>
        (article.source || "").toLowerCase().includes(publisher.trim().toLowerCase())
      )
    : data.articles;

  return (
    <div className="container py-4">
      <form
        className="input-group input-group-lg search-input-group mb-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          className="form-control"
          placeholder="Search news, e.g. ransomware, zero-day, phishing…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
        <button
          className={`btn btn-advanced-search${advancedOpen ? " active" : ""}`}
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="advanced-search-filters"
          onClick={() => setAdvancedOpen((open) => !open)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M7 12h10m-7 5h4" />
            <circle cx="8" cy="7" r="1.5" fill="currentColor" />
            <circle cx="15" cy="12" r="1.5" fill="currentColor" />
            <circle cx="11" cy="17" r="1.5" fill="currentColor" />
          </svg>
          <span>Advanced search</span>
        </button>
      </form>

      {advancedOpen && (
        <section className="advanced-search-panel mb-4" id="advanced-search-filters" aria-label="Advanced search filters">
          <div className="advanced-search-heading">
            <h2 className="h6 mb-1">Advanced filters</h2>
            <p className="small text-muted mb-0">Narrow news by topic, event country, and publisher.</p>
          </div>
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-lg-4">
              <label className="form-label" htmlFor="topic-filter">Topic</label>
              <select
                id="topic-filter"
                className="form-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                {CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>{item.label === "All" ? "All topics" : item.label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-lg-4">
              <label className="form-label" htmlFor="event-country">Event country</label>
              <select
                id="event-country"
                className="form-select"
                value={eventCountry}
                onChange={(e) => {
                  setEventCountry(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All countries</option>
                {EVENT_COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label" htmlFor="publisher-filter">Publisher</label>
              <input
                id="publisher-filter"
                className="form-control"
                type="search"
                placeholder="e.g. BBC News"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
              />
            </div>
          </div>
          <p className="form-text small mb-0 mt-3">
            Country is matched against article text. Publisher filters the currently loaded results page.
          </p>
        </section>
      )}

      {history.length > 0 && (
        <div className="mb-3 small d-flex flex-wrap gap-2 align-items-center">
          <span className="text-muted">Recent:</span>
          {history.map((h) => (
            <button
              key={h}
              className="btn btn-sm btn-outline-secondary py-0"
              onClick={() => {
                setInput(h);
                submit(h);
              }}
            >
              {h}
            </button>
          ))}
          <button className="btn btn-link btn-sm p-0" onClick={clearHistory}>
            clear
          </button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      )}
      {!loading && !error && visibleArticles.length === 0 && (
        <p className="text-muted">
          {publisher.trim()
            ? "No articles on this page match that publisher. Try another page or clear the publisher filter."
            : "No articles found. Try another keyword or category."}
        </p>
      )}

      <div className="news-results-grid">
        <div className="row g-4">
          {!loading &&
            visibleArticles.map((a) => (
              <div className="col-12 col-md-6 col-lg-4" key={a.url}>
                <NewsCard
                  article={a}
                  saved={savedUrls.has(a.url)}
                  onToggleSave={onToggleSave}
                  onDetails={setSelected}
                />
              </div>
            ))}
        </div>
      </div>

      {totalPages > 1 && !loading && (
        <nav className="pagination-wrap mt-4" aria-label="News pages">
          <div className="pagination-pills">
            {page > 1 && (
              <button
                className="page-pill page-arrow"
                aria-label="Previous page"
                onClick={() => setPage(page - 1)}
              >
                ‹
              </button>
            )}
            {getPaginationItems(totalPages, page).map((item) =>
              typeof item === "number" ? (
                <button
                  key={item}
                  className={`page-pill${item === page ? " active" : ""}`}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ) : (
                <span key={item} className="page-ellipsis-slot">
                  {jumpEllipsis === item ? (
                    <form
                      className="page-jump-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const targetPage = Number(jumpPage);
                        if (Number.isInteger(targetPage) && targetPage >= 1 && targetPage <= totalPages) {
                          setJumpEllipsis(null);
                          setJumpPage("");
                          setPage(targetPage);
                        }
                      }}
                    >
                      <label className="visually-hidden" htmlFor="page-jump-input">Go to page</label>
                      <input
                        id="page-jump-input"
                        className="page-jump-input"
                        type="number"
                        min="1"
                        max={totalPages}
                        step="1"
                        value={jumpPage}
                        autoFocus
                        aria-label={`Enter a page number from 1 to ${totalPages}`}
                        onChange={(event) => setJumpPage(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") setJumpEllipsis(null);
                        }}
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="page-ellipsis"
                      aria-label="Enter a page number"
                      title="Click to enter a page number"
                      onClick={() => {
                        setJumpEllipsis(item);
                        setJumpPage("");
                      }}
                    >
                      …
                    </button>
                  )}
                </span>
              )
            )}
            {page < totalPages && (
              <button
                className="page-pill page-arrow"
                aria-label="Next page"
                onClick={() => setPage(page + 1)}
              >
                ›
              </button>
            )}
          </div>
        </nav>
      )}

      <ArticleModal article={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
