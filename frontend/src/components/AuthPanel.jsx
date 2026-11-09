import { useState } from "react";
import { supabase, supabaseConfigured } from "../supabase.js";

const passwordRules = [
  { label: "At least 12 characters", test: (value) => value.length >= 12 },
  { label: "At least one uppercase letter (A–Z)", test: (value) => /[A-Z]/.test(value) },
  { label: "At least one lowercase letter (a–z)", test: (value) => /[a-z]/.test(value) },
  { label: "At least one number (0–9)", test: (value) => /\d/.test(value) },
  { label: "At least one symbol", test: (value) => /[^A-Za-z0-9\s]/.test(value) },
];

const usernamePattern = /^[A-Za-z0-9_-]{3,32}$/;
const authEmailForUsername = (username) =>
  `${username.trim().toLowerCase()}@accounts.sightsec.invalid`;

function PasswordVisibilityButton({ visible, onToggle }) {
  return (
    <button
      type="button"
      className="btn btn-outline-secondary"
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      onClick={onToggle}
    >
      {visible ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
          <path d="M9.9 5.2A10.7 10.7 0 0112 5c5 0 8.3 4.5 9 7-.3 1.1-1.2 2.6-2.6 3.9M6.2 6.2C3.9 7.7 2.4 10 2 12c.7 2.5 4 7 10 7a10 10 0 004.1-.9" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

export default function AuthPanel({ onClose }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!usernamePattern.test(username.trim())) {
      setError("Username must be 3–32 characters and contain only letters, numbers, underscores, or hyphens.");
      return;
    }
    if (mode === "signup" && passwordRules.some((rule) => !rule.test(password))) {
      setError("Your password must meet every requirement listed below.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const email = authEmailForUsername(username);
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username: username.trim() } },
        });
        if (authError) throw authError;
        if (data.session) {
          onClose();
        } else {
          setError("Supabase did not sign you in after signup. Turn off email confirmation in Supabase Auth settings; username-only accounts cannot receive confirmation emails.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        onClose();
      }
    } catch (authError) {
      setError(authError.message || "Unable to authenticate. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        className="modal d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-dialog-scrollable auth-modal-dialog"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title fs-5" id="account-modal-title">
                {mode === "login" ? "Log in" : "Create account"}
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {!supabaseConfigured ? (
                <div className="alert alert-warning mb-0">
                  Account access needs Supabase configured. Set <code>VITE_SUPABASE_URL</code> and{" "}
                  <code>VITE_SUPABASE_ANON_KEY</code> for the frontend, and configure Supabase on the
                  backend as described in the README.
                </div>
              ) : (
                <form onSubmit={submit}>
                  {error && <div className="alert alert-danger">{error}</div>}
                  {message && <div className="alert alert-success">{message}</div>}
                  <label className="form-label" htmlFor="account-username">Username</label>
                  <input
                    id="account-username"
                    className="form-control mb-3"
                    type="text"
                    autoComplete="username"
                    minLength={3}
                    maxLength={32}
                    pattern="[A-Za-z0-9_-]{3,32}"
                    title="Use 3–32 letters, numbers, underscores, or hyphens."
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                  {mode === "signup" && (
                    <div className="form-text mt-0 mb-3">
                      Use 3–32 letters, numbers, underscores, or hyphens. No email address is needed.
                      Password reset by email will not be available.
                    </div>
                  )}
                  <label className="form-label" htmlFor="account-password">Password</label>
                  {mode === "signup" && (
                    <p className="form-text mt-0 mb-2">Your password must include all of the following:</p>
                  )}
                  <div className="input-group mb-3">
                    <input
                      id="account-password"
                      className="form-control"
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      minLength={mode === "signup" ? 12 : undefined}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <PasswordVisibilityButton
                      visible={showPassword}
                      onToggle={() => setShowPassword((visible) => !visible)}
                    />
                  </div>
                  {mode === "signup" && (
                    <>
                      <ul className="list-unstyled small mb-3" aria-live="polite">
                        {passwordRules.map((rule) => {
                          const satisfied = rule.test(password);
                          return (
                            <li key={rule.label} className={satisfied ? "text-success" : "text-muted"}>
                              <span aria-hidden="true">{satisfied ? "✓" : "○"}</span>{" "}
                              {rule.label}
                            </li>
                          );
                        })}
                      </ul>
                      <label className="form-label" htmlFor="account-confirm-password">Retype password</label>
                      <div className="input-group mb-3">
                        <input
                          id="account-confirm-password"
                          className="form-control"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          minLength={12}
                          required
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                        <PasswordVisibilityButton
                          visible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((visible) => !visible)}
                        />
                      </div>
                      {confirmPassword && (
                        <div className={`small mb-3 ${password === confirmPassword ? "text-success" : "text-danger"}`} aria-live="polite">
                          {password === confirmPassword ? "Passwords match." : "Passwords do not match."}
                        </div>
                      )}
                    </>
                  )}
                  <button className="btn btn-primary w-100" type="submit" disabled={busy}>
                    {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
                  </button>
                  <div className="text-center small mt-3">
                    {mode === "login" ? "New here?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      className="btn btn-link btn-sm p-0 align-baseline"
                      onClick={() => {
                        setMode(mode === "login" ? "signup" : "login");
                        setConfirmPassword("");
                        setError("");
                        setMessage("");
                      }}
                    >
                      {mode === "login" ? "Create an account" : "Log in"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" onClick={onClose} />
    </>
  );
}
