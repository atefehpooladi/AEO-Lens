import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  Clipboard,
  Mic,
  Radar,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

const formats = ["Blog article", "LinkedIn post", "Instagram post"];
const screenMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
};

async function request(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function Topbar({ onHome, result, blog }) {
  return (
    <nav>
      <button className="brand" onClick={onHome}>
        <span className="brand-mark"><img src="/context-unlocked-mark.png" alt="Context Unlock logo" /></span>
        <i>✦</i>Context Unlock
      </button>
      {result || blog ? (
        <button className="nav-action" onClick={onHome}>
          Start over
        </button>
      ) : (
        <span>NordGlow · skincare content</span>
      )}
    </nav>
  );
}

function Processing({ label }) {
  return (
    <motion.section className="processing" {...screenMotion}>
      <span className="pulse-dot" />
      <span className="eyebrow">CONTEXT UNLOCK</span>
      <h2>{label}</h2>
      <p>Giving your content the attention it deserves.</p>
    </motion.section>
  );
}

function ErrorCard({ message, onRetry }) {
  return (
    <section className="inline-error">
      <p>{message}</p>
      <button className="secondary" onClick={onRetry}>
        Try again
      </button>
    </section>
  );
}

function Publish({ content, destination, onBlogPublish }) {
  const [value, setValue] = useState(content);
  const publish = async () => {
    if (destination === "Blog article") {
      onBlogPublish(value);
      return;
    }
    await navigator.clipboard.writeText(value);
    const url =
      destination === "Instagram post"
        ? "https://www.instagram.com/"
        : "https://www.linkedin.com/feed/?shareActive=true";
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Copied. Paste it into the open composer.");
  };
  return (
    <motion.section className="card result" {...screenMotion}>
      <div className="result-head">
        <div>
          <span className="eyebrow">READY TO REVIEW</span>
          <h1>Your final content</h1>
        </div>
        <span className="verified">
          <Check size={14} /> Review complete
        </span>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18 }}
      >
        <textarea
          aria-label="Final content"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows="14"
        />
      </motion.div>
      <button className="primary" onClick={publish}>
        {destination === "Blog article" ? "Publish to blog" : `Copy & open ${destination || "publisher"}`} <ArrowRight size={16} />
      </button>
      <p className="small">
        Your text is editable. Nothing posts automatically.
      </p>
    </motion.section>
  );
}

function BlogPrototype({ posts, onHome }) {
  const post = posts[0];
  return <motion.section className="card blog-prototype" {...screenMotion}>
    <span className="eyebrow">NORDGLOW JOURNAL · PROTOTYPE</span>
    <h1>{post?.title || "NordGlow Journal"}</h1>
    <p className="blog-meta">Published just now · Sensitive-skin education</p>
    <article>{post?.content}</article>
    <button className="secondary" onClick={onHome}>Back to studio</button>
  </motion.section>
}

function VoiceCapture({ onText }) {
  const recorder = useRef(null),
    chunks = useRef([]);
  const [recording, setRecording] = useState(false),
    [busy, setBusy] = useState(false);
  const toggle = async () => {
    if (recording) {
      recorder.current.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (event) => chunks.current.push(event.data);
      rec.onstop = async () => {
        setRecording(false);
        setBusy(true);
        try {
          const blob = new Blob(chunks.current, { type: rec.mimeType });
          const audio = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(",")[1]);
            reader.readAsDataURL(blob);
          });
          const data = await request("/api/transcribe", {
            audio,
            filename: "voice.webm",
            mime_type: blob.type,
          });
          onText(data.text);
        } catch (error) {
          toast.error(error.message);
        } finally {
          setBusy(false);
          stream.getTracks().forEach((track) => track.stop());
        }
      };
      recorder.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access is needed to record a note.");
    }
  };
  return (
    <button
      className={`voice ${recording ? "recording" : ""}`}
      disabled={busy}
      onClick={toggle}
    >
      <Mic size={17} />
      {busy
        ? "Transcribing…"
        : recording
          ? "Stop recording"
          : "Record a voice note"}
    </button>
  );
}

function GapQuestion({ transcript, onClose, onComplete }) {
  const [other, setOther] = useState(false),
    [choice, setChoice] = useState(""),
    [otherText, setOtherText] = useState("");
  const complete = () => {
    if (!choice && !otherText.trim()) return;
    onComplete(`${transcript}\n\nContent focus: ${other ? otherText : choice}`);
    onClose();
  };
  return (
    <div className="overlay">
      <motion.div className="modal" {...screenMotion}>
        <button className="close" onClick={onClose}>
          <X size={18} />
        </button>
        <span className="eyebrow">ONE QUICK DETAIL</span>
        <h2>What should this content focus on?</h2>
        <p>We only ask for details that were missing from your voice note.</p>
        <div className="choices">
          {[
            "A product benefit",
            "An ingredient question",
            "A sensitive-skin routine",
          ].map((item) => (
            <motion.button
              whileTap={{ scale: 0.98 }}
              className={choice === item ? "selected" : ""}
              onClick={() => {
                setChoice(item);
                setOther(false);
              }}
              key={item}
            >
              {item}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.98 }}
            className={other ? "selected" : ""}
            onClick={() => {
              setOther(true);
              setChoice("");
            }}
          >
            Other
          </motion.button>
        </div>
        {other && (
          <input
            value={otherText}
            onChange={(event) => setOtherText(event.target.value)}
            placeholder="Tell us the focus"
            autoFocus
          />
        )}
        <button className="primary" onClick={complete}>
          Continue <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home"),
    [input, setInput] = useState(""),
    [working, setWorking] = useState(false),
    [workLabel, setWorkLabel] = useState(""),
    [result, setResult] = useState(""),
    [topics, setTopics] = useState([]),
    [format, setFormat] = useState(""),
    [selectedTopic, setSelectedTopic] = useState(null),
    [voiceTranscript, setVoiceTranscript] = useState(""),
    [gap, setGap] = useState(false),
    [error, setError] = useState(null),
    [blogPosts, setBlogPosts] = useState([]);
  const home = () => {
    setScreen("home");
    setError(null);
  };
  const audit = async (text = input) => {
    if (!text.trim())
      return toast.error("Paste content or record a note first.");
    setError(null);
    setWorkLabel("Refining your content");
    setWorking(true);
    try {
      const data = await request("/api/audit", { content: text });
      setResult(data.content);
      setScreen("result");
    } catch (issue) {
      toast.error(issue.message);
      setError({ message: issue.message, retry: () => audit(text) });
    } finally {
      setWorking(false);
    }
  };
  const findTrends = async () => {
    setError(null);
    setFormat("");
    setSelectedTopic(null);
    setScreen("trends");
    setWorkLabel("Finding verified skincare trends");
    setWorking(true);
    try {
      const data = await request("/api/trends", {});
      setTopics(data.topics || []);
      setScreen("trends");
    } catch (issue) {
      toast.error(issue.message);
      setError({ message: issue.message, retry: findTrends });
    } finally {
      setWorking(false);
    }
  };
  const create = async (topic) => {
    if (!format) return toast.error("Choose where you’ll publish first.");
    setError(null);
    setWorkLabel("Writing your content");
    setWorking(true);
    try {
      const data = await request("/api/create", { topic: topic.title, format });
      setResult(data.content);
      setScreen("result");
    } catch (issue) {
      toast.error(issue.message);
      setError({ message: issue.message, retry: () => create(topic) });
    } finally {
      setWorking(false);
    }
  };
  const publishToBlog = (content) => {
    const firstLine = content.replace(/^#+\s*/, "").split("\n").find(Boolean) || "NordGlow Journal";
    setBlogPosts((posts) => [{ id: Date.now(), title: firstLine.slice(0, 90), content }, ...posts]);
    setScreen("blog");
    toast.success("Published to the NordGlow blog prototype.");
  };
  return (
    <main>
      <Topbar onHome={home} result={screen === "result"} blog={screen === "blog"} />
      <div className="container">
        <AnimatePresence mode="wait">
          {working ? (
            <Processing key="processing" label={workLabel} />
          ) : screen === "blog" ? (
            <BlogPrototype key="blog" posts={blogPosts} onHome={home} />
          ) : screen === "result" ? (
            <motion.div key="result" {...screenMotion}>
              <button className="back" onClick={home}>
                ← Back to home
              </button>
              <Publish
                content={result}
                destination={format || "LinkedIn post"}
                onBlogPublish={publishToBlog}
              />
            </motion.div>
          ) : screen === "home" ? (
            <motion.div key="home" {...screenMotion}>
              <header>
                <span className="eyebrow">AEO CONTENT STUDIO</span>
                <h1>
                  Make skincare content <em>easy to find and trust.</em>
                </h1>
                <p>
                  NordGlow is already loaded. Choose a clear place to begin.
                </p>
              </header>
              <div className="entry-grid">
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  className="entry card"
                  onClick={() => setScreen("audit")}
                >
                  <span className="entry-icon">
                    <Clipboard size={20} />
                  </span>
                  <span>
                    <small>01 / AUDIT & AUTO-IMPROVE</small>
                    <strong>Improve existing content</strong>
                    <p>
                      Paste text or record a note. We refine it behind the
                      scenes.
                    </p>
                  </span>
                  <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  className="entry card"
                  onClick={findTrends}
                >
                  <span className="entry-icon">
                    <Radar size={20} />
                  </span>
                  <span>
                    <small>02 / TREND → CONTENT</small>
                    <strong>Turn a trend into content</strong>
                    <p>Find a timely skincare conversation worth joining.</p>
                  </span>
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          ) : screen === "audit" ? (
            <motion.section className="card work" key="audit" {...screenMotion}>
              <button className="back" onClick={home}>
                ← Back
              </button>
              <span className="eyebrow">AUDIT & AUTO-IMPROVE</span>
              <h1>Give us the content you have.</h1>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Paste a post, article, or product description here…"
                rows="11"
              />
              <VoiceCapture
                onText={(text) => {
                  setVoiceTranscript(text);
                  setInput(text);
                  setGap(true);
                }}
              />
              <div className="destination-picker">
                <span>Publish to</span>
                <div className="format-row">
                  {formats.map((item) => (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className={format === item ? "selected" : ""}
                      key={item}
                      onClick={() => setFormat(item)}
                    >
                      {item}
                    </motion.button>
                  ))}
                </div>
              </div>
              <button className="primary" onClick={() => audit()}>
                Improve content <Sparkles size={16} />
              </button>
              {error && <ErrorCard {...error} />}
              <p className="small">
                We validate the rewrite before you see it. Internal passes and
                scores stay private.
              </p>
            </motion.section>
          ) : (
            <motion.section
              className="card work"
              key="trends"
              {...screenMotion}
            >
              <button className="back" onClick={home}>
                ← Back
              </button>
              <span className="eyebrow">
                SKINCARE CATEGORY SIGNALS · LAST 6 MONTHS
              </span>
              <h1>Choose a timely conversation.</h1>
              {error ? (
                <ErrorCard {...error} />
              ) : topics.length === 0 ? (
                <p className="no-results">
                  No skincare theme had support from three tracked sources in
                  the last six months. Try again later.
                </p>
              ) : (
                <div className="topics">
                  {topics.map((topic, index) => (
                    <article key={index}>
                      <div className="topic-heading">
                        <h2>{topic.title}</h2>
                        <span
                          className={`evidence ${topic.evidence === "Verified trend" ? "verified-evidence" : ""}`}
                        >
                          {topic.evidence}
                        </span>
                      </div>
                      <p>{topic.why}</p>
                      <p className="source-count">
                        Supported by {topic.sources?.length || 0} tracked
                        sources
                      </p>
                      <details>
                        <summary>View sources</summary>
                        <ul className="source-list">
                          {topic.sources?.map((source, item) => (
                            <li key={item}>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {source.publisher}
                              </a>{" "}
                              · {source.published} · {source.type}
                            </li>
                          ))}
                        </ul>
                      </details>
                      <div className="format-row">
                        {formats.map((item) => (
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            className={
                              selectedTopic === index && format === item
                                ? "selected"
                                : ""
                            }
                            key={item}
                            onClick={() => {
                              setSelectedTopic(index);
                              setFormat(item);
                            }}
                          >
                            {item}
                          </motion.button>
                        ))}
                      </div>
                      <button
                        className="primary"
                        disabled={selectedTopic !== index}
                        onClick={() => create(topic)}
                      >
                        {selectedTopic === index
                          ? "Create content"
                          : "Choose a format"}{" "}
                        <ArrowRight size={16} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      {gap && (
        <GapQuestion
          transcript={voiceTranscript}
          onClose={() => setGap(false)}
          onComplete={(text) => {
            setInput(text);
            audit(text);
          }}
        />
      )}
    </main>
  );
}
