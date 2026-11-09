import { useEffect, useMemo, useState } from "react";
import Home from "./pages/Home.jsx";
import Favorites from "./pages/Favorites.jsx";
import AuthPanel from "./components/AuthPanel.jsx";
import { addFavorite, errorMessage, fetchFavorites, removeFavorite } from "./api.js";
import { supabase, supabaseConfigured } from "./supabase.js";

const THEME_KEY = "sightsec_theme";

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  } catch (error) {
    console.error("Could not read the saved color theme:", error);
    return "dark";
  }
}

export default function App() {
  const [view, setView] = useState("home");
  const [theme, setTheme] = useState(getInitialTheme);
  const [favorites, setFavorites] = useState([]);
  const [favError, setFavError] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthReady(true);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setFavError(errorMessage(error));
      setUser(data.session?.user || null);
      setAuthReady(true);
    }).catch((error) => {
      if (!active) return;
      setFavError(errorMessage(error));
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setFavorites([]);
      setFavError("");
      setAuthReady(true);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setFavorites([]);
      return;
    }
    let active = true;
    fetchFavorites()
      .then((items) => {
        if (active) setFavorites(items);
      })
      .catch((error) => {
        if (active) setFavError(errorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [authReady, user?.id]);

  const savedUrls = useMemo(() => new Set(favorites.map((f) => f.url)), [favorites]);

  const toggleSave = async (article) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      const existing = favorites.find((f) => f.url === article.url);
      if (existing) {
        await removeFavorite(existing.id);
        setFavorites((fs) => fs.filter((f) => f.id !== existing.id));
      } else {
        const saved = await addFavorite(article);
        setFavorites((fs) => [saved, ...fs]);
      }
    } catch (e) {
      setFavError(errorMessage(e));
    }
  };

  const removeFav = async (fav) => {
    try {
      await removeFavorite(fav.id);
      setFavorites((fs) => fs.filter((f) => f.id !== fav.id));
    } catch (e) {
      setFavError(errorMessage(e));
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setFavError(errorMessage(error));
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (error) {
      console.error("Could not save the color theme preference:", error);
    }
  };

  return (
    <>
      <nav className="navbar app-navbar">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <img className="site-logo" src="/protection.png" alt="" />
            SightSec News
          </span>
          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${view === "home" ? "btn-light" : "btn-outline-light"}`} onClick={() => setView("home")}>
              News
            </button>
            <button
              className={`btn btn-sm icon-action${view === "fav" ? " active" : ""}`}
              aria-label={`Favorites, ${favorites.length} saved`}
              title={`Favorites (${favorites.length})`}
              onClick={() => setView("fav")}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 4.75A1.75 1.75 0 017.75 3h8.5A1.75 1.75 0 0118 4.75V21l-6-3.5L6 21V4.75z" />
              </svg>
              {favorites.length > 0 && <span className="icon-count">{favorites.length}</span>}
            </button>
            <button
              className="btn btn-sm icon-action theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                </svg>
              ) : (
                <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.2 15.1A8.5 8.5 0 018.9 3.8 8.5 8.5 0 1020.2 15.1z" />
                </svg>
              )}
            </button>
            {user ? (
              <>
                <span className="navbar-text small d-none d-md-inline">
                  {user.user_metadata?.username || user.email}
                </span>
                <button
                  className="btn btn-sm icon-action"
                  aria-label="Log out"
                  title="Log out"
                  onClick={signOut}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 17l5-5-5-5m5 5H3" />
                    <path d="M12 3h6a2 2 0 012 2v14a2 2 0 01-2 2h-6" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                className="btn btn-sm icon-action"
                aria-label="Log in or sign up"
                title="Log in / Sign up"
                onClick={() => setAuthOpen((open) => !open)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="8" r="4" />
                  <path d="M3 21v-2a7 7 0 0114 0v2m3-11v6m-3-3h6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}
      {/* Home stays mounted so search state survives switching tabs */}
      <div style={{ display: view === "home" ? "block" : "none" }}>
        <Home savedUrls={savedUrls} onToggleSave={toggleSave} />
      </div>
      {view === "fav" && (
        user ? (
          <Favorites favorites={favorites} onRemove={removeFav} error={favError} />
        ) : (
          <div className="container py-4">
            <h2 className="mb-2">Your saved articles</h2>
            <p className="text-muted">Log in or create an account to save favorites across devices.</p>
            <button className="btn btn-primary" onClick={() => setAuthOpen(true)}>Log in / Sign up</button>
          </div>
        )
      )}

      <footer className="text-center text-muted small py-4">
        Data from GNews.io· React + Express + Supabase
      </footer>
    </>
  );
}
