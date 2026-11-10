import { useMemo, useState } from "react";

const DRAFT_KEY = "sightsec_submission_draft";

const SECTIONS = [
  {
    id: "part-a",
    label: "PART A",
    title: "Working integrated system",
    description: "Describe the running system and how at least two systems or services exchange data or capability through middleware, APIs, or enterprise service technologies.",
    prompts: [
      "Identify the integrated systems and show what data or capability passes between them.",
      "Document the source code, dependency manifest, configuration, and exact build and run instructions needed by the panel.",
      "Disclose AI assistance and explain what was changed or verified afterwards.",
    ],
  },
  {
    id: "part-b",
    label: "PART B",
    title: "Integration documentation",
    description: "Consolidate the term's artifacts and update each one to match the system as it was actually built.",
    prompts: [
      "Corrected integration models from Technical 1.",
      "Integration point register: protocol, data format, authentication, synchronicity, error handling, retry policy, and versioning strategy for every point.",
      "Reusable component from Technical 3 and its published interface.",
      "Release and deployment plan from Technical 4.",
      "Record every divergence from the original proposal and its reason.",
    ],
  },
  {
    id: "part-c",
    label: "PART C",
    title: "Performance, reliability, and security",
    description: "Provide measured evidence for the system's behavior rather than unsupported claims.",
    prompts: [
      "Performance: test environment, variable increased, measurements, degradation point, and failure mode.",
      "Reliability: inject external dependency timeouts, errors, and malformed data; report behavior and measured recovery.",
      "Security: assess every integration point for authentication, authorization, transport protection, input validation, and logging.",
      "Name the specific control at each integration point and document any accepted residual risk.",
    ],
  },
  {
    id: "part-d",
    label: "PART D",
    title: "Trends evaluation",
    description: "Evaluate current systems-integration directions against this system on engineering grounds.",
    prompts: [
      "Cloud deployment",
      "Micro-service decomposition",
      "Containerization",
      "Event-driven integration",
      "API-first design",
      "For each trend, state whether it is adopted and justify both adoptions and rejections.",
    ],
  },
  {
    id: "part-e",
    label: "PART E",
    title: "Case-based lessons",
    description: "Investigate at least two documented real-world integration projects.",
    prompts: [
      "For each project, provide a traceable source and explain what went wrong or what succeeded.",
      "State the specific change each lesson produced in your own system; a lesson without a traceable design effect is incomplete.",
    ],
  },
  {
    id: "part-f",
    label: "PART F",
    title: "Risk closure and AI-use log",
    description: "Close out the RMMM register and transparently record project-level AI use.",
    prompts: [
      "Give every Module 7 risk a final status: materialized, mitigated, still open, or closed.",
      "For each materialized risk, compare what actually happened with what was predicted.",
      "Record where AI was used, what it was used for, and what was changed afterwards.",
    ],
  },
];

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return { draft: {}, error: "" };
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("The saved submission draft has an invalid format.");
    }
    return { draft: parsed, error: "" };
  } catch (error) {
    console.error("Could not load the project submission draft:", error);
    return {
      draft: {},
      error: error instanceof SyntaxError
        ? "The saved draft could not be read. Editing will start with a blank draft."
        : error.message || "The saved draft could not be read. Editing will start with a blank draft.",
    };
  }
}

export default function Submission() {
  const [initial] = useState(loadDraft);
  const [draft, setDraft] = useState(initial.draft);
  const [storageError, setStorageError] = useState(initial.error);
  const completedCount = useMemo(
    () => SECTIONS.filter(({ id }) => typeof draft[id] === "string" && draft[id].trim()).length,
    [draft]
  );

  const updateSection = (id, value) => {
    const updatedDraft = { ...draft, [id]: value };
    setDraft(updatedDraft);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updatedDraft));
      setStorageError("");
    } catch (error) {
      console.error("Could not save the project submission draft:", error);
      setStorageError("Your changes could not be saved in this browser. Check available storage and try again.");
    }
  };

  return (
    <main className="container py-4 submission-page">
      <header className="submission-header mb-4">
        <div>
          <div className="submission-eyebrow">SYSTEMS INTEGRATION AND ARCHITECTURE 2</div>
          <h1 className="h2 mb-2">Final Project Submission</h1>
          <p className="text-muted mb-0">
            Evidence and Documentation for Submission 1: AI-assisted work requires disclosure.
          </p>
        </div>
        <div className="submission-progress" aria-live="polite">
          <strong>{completedCount} of {SECTIONS.length}</strong>
          <span>parts drafted</span>
        </div>
      </header>

      {storageError && <div className="alert alert-warning" role="status">{storageError}</div>}
      {!storageError && <p className="small text-muted submission-save-status">Draft saves automatically in this browser.</p>}

      <div className="submission-sections">
        {SECTIONS.map((section) => (
          <section className="submission-card" key={section.id} aria-labelledby={`${section.id}-title`}>
            <div className="submission-card-heading">
              <span className="submission-part-label">{section.label}</span>
              <div>
                <h2 className="h5 mb-1" id={`${section.id}-title`}>{section.title}</h2>
                <p className="text-muted mb-0">{section.description}</p>
              </div>
            </div>
            <ul className="submission-prompts">
              {section.prompts.map((prompt) => <li key={prompt}>{prompt}</li>)}
            </ul>
            <label className="form-label" htmlFor={`${section.id}-notes`}>Your notes and evidence</label>
            <textarea
              id={`${section.id}-notes`}
              className="form-control submission-textarea"
              rows={5}
              value={typeof draft[section.id] === "string" ? draft[section.id] : ""}
              onChange={(event) => updateSection(section.id, event.target.value)}
              placeholder={`Add your ${section.label.replace("PART ", "Part ")} details here...`}
            />
          </section>
        ))}
      </div>
    </main>
  );
}
