import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Copy, Download, FileSearch, LockKeyhole, Mic, Paperclip, Radar, Sparkles, Upload, UsersRound } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker

const modes = [
  { id: 'audit', number: '01', label: 'Audit', icon: FileSearch, title: 'Is this content ready for an AI answer?', help: 'Score quote-readiness and see the structural signals that need attention.' },
  { id: 'draft', number: '02', label: 'Draft', icon: Sparkles, title: 'Start with a clear point of view.', help: 'Turn a specific topic into a structured first draft you can edit.' },
  { id: 'scout', number: '03', label: 'Scout', icon: Radar, title: 'Find a conversation worth joining.', help: 'Research is only useful when every claim has a traceable source.' },
  { id: 'snapshot', number: '04', label: 'Snapshot', icon: UsersRound, title: 'See the context around your category.', help: 'Bring competitors, market evidence, and differentiation into one founder-ready brief.' },
]

const criteria = [
  ['Direct answer', 'Does the opening answer the main question?'],
  ['Self-contained sentences', 'Can a sentence be quoted without extra context?'],
  ['Clear structure', 'Is the content easy to scan?'],
  ['Explicit naming', 'Does it name the brand or subject directly?'],
  ['Fact density', 'Are concrete facts distinguishable from claims?'],
]

const demoFixtures = {
  profile: { business: 'Northstar Energy', audience: 'Operations leads at small manufacturers', goal: 'AEO-ready LinkedIn content', differentiator: 'turns monthly utility data into a ranked action plan' },
  audit: 'DEMO ONLY — Northstar Energy is a fictional example. We help busy manufacturing operations teams understand utility data and choose their next energy action. Our reporting turns a monthly bill into a ranked action plan, so teams can move from unclear data to a documented decision.',
  draft: '## How small manufacturers can turn utility data into a next action\n\n**DEMO ONLY — this is fictional sample content, not a verified claim.**\n\nNorthstar Energy helps operations leads turn a monthly utility bill into a ranked action plan. The useful first step is to name one operational question, identify the data needed to answer it, and document the next owner.\n\nBefore publishing, replace the demo language with your own verified evidence and source links.',
  scout: '## Fictional content opportunity\n\n**Demo data only — no real web search was performed.**\n\n### Gap\nOperations leads want a simple explanation of how to move from monthly energy data to a next action. In this fictional example, competitors discuss dashboards but do not explain ownership and decision-making.\n\n### Suggested article\n**From utility bill to action owner: a 30-minute operations review**\nExplain a repeatable meeting agenda: identify one variance, decide one action, and assign one owner.\n\n### Mock sources\n- *Fictional Manufacturing Operations Pulse*, 2026 — placeholder audience question\n- *Fictional Competitor Product Note*, 2026 — placeholder competitor activity\n- *Fictional Energy Data Brief*, 2026 — placeholder data signal\n\nReplace every mock source with a real named, dated source before publishing.',
  snapshot: '## Founder Snapshot — fictional demo\n\n**All companies, figures, and sources below are placeholders for UI testing only.**\n\n### Mock competitors\n- **MeterMap Demo** — fictional utility-monitoring dashboard; mock source: *Demo Product Page*, 2026\n- **PlantSignal Demo** — fictional operations-alerting tool; mock source: *Demo Launch Note*, 2026\n\n### Mock market size\n**$0.0B — fictional placeholder.** Mock source: *Demo Market Report*, 2026. Do not use this number in a deck.\n\n### Positioning draft\nNorthstar Energy is a fictional example of a tool that turns monthly utility data into a ranked action plan for small manufacturing operations leads. Unlike the mock alternatives above, it is positioned around deciding and assigning the next action—not only monitoring a dashboard.\n\nReplace the placeholder competitors, figure, and sources with live research before sharing this externally.',
}

function score(content, brand) {
  const normalized = content.replace(/[*_`#]/g, '')
  const first = normalized.trim().split(/[.!?]/)[0] || ''
  const sentences = normalized.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean)
  const hasParagraphs = /\n|(^|\s)[-•]\s/.test(content)
  return [
    brand && first.toLowerCase().startsWith(brand.toLowerCase()) ? 5 : /^(we|i)\b/i.test(first) ? 4 : 2,
    sentences.filter((s) => s.length >= 35).length >= 2 ? 4 : 2,
    content.length < 300 || hasParagraphs ? 4 : 2,
    brand && content.toLowerCase().includes(brand.toLowerCase()) ? 5 : 2,
    /\d|%|according to|data|report|study/i.test(content) ? 4 : 1,
  ]
}

function makeRewrite(content, profile) {
  const subject = profile.business || 'This business'
  const audience = profile.audience || 'its intended audience'
  const differentiator = profile.differentiator || 'turns a complex process into a clear next step'
  const focus = content.trim().split(/[.!?]/)[0].replace(/^we\s+/i, '').toLowerCase() || 'the problem at hand'
  return `**${subject} helps ${audience} make a confident next decision.**\n\n${subject} ${differentiator}. This gives people a practical path from ${focus} to action.\n\n${content.trim()}\n\n*Before publishing, verify every factual or performance claim and attach its source.*`
}

function citationAnswer(content) {
  const sentence = content.split(/(?<=[.!?])\s+/).map((item) => item.trim()).find((item) => item.length > 28)
  return sentence ? `The source provides this clear answer:\n\nQuoted: "${sentence}"` : 'The source text does not contain a complete, quotable answer.'
}

async function localAI(instructions, input, webSearch = false) {
  const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructions, input, web_search: webSearch }) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'The local AI service could not complete the request.')
  return data.text
}

function Card({ children, className = '', accent = false }) {
  return <section className={`card-brut ${accent ? 'card-brut-accent' : ''} ${className}`}>{children}</section>
}

function Label({ children }) { return <p className="kicker">{children}</p> }

function EmptyState({ icon: Icon, title, children }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{children}</p></div></div>
}

function CopyButton({ value, label = 'Copy' }) {
  const copy = async () => { await navigator.clipboard.writeText(value); toast.success('Copied to clipboard') }
  return <button className="button button-ghost" onClick={copy}><Copy size={15} />{label}</button>
}

function ReviewPublishCard({ text }) {
  const [value, setValue] = useState(text)
  useEffect(() => setValue(text), [text])
  const download = () => {
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([value], { type: 'text/markdown' }))
    link.download = 'context-unlock-draft.md'; link.click(); URL.revokeObjectURL(link.href)
  }
  const prepareLinkedIn = async () => { await navigator.clipboard.writeText(value); window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank', 'noopener'); toast.success('Copied your final text. Paste it into the LinkedIn composer.') }
  return <Card className="review-card"><div className="card-top"><div><Label>REVIEW & PUBLISH</Label><h3>Make the final call.</h3></div><span className="status-chip is-done">HUMAN REVIEW</span></div><textarea aria-label="Final optimized content" rows="7" value={value} onChange={(event) => setValue(event.target.value)} /><div className="card-footer"><p>You edit, copy, download, or publish—nothing posts automatically.</p><div className="review-actions"><CopyButton value={value} /><button className="button button-ghost" onClick={download}><Download size={15} />Download</button><button className="button button-dark" onClick={prepareLinkedIn}>Copy & open LinkedIn <ArrowRight size={15} /></button></div></div></Card>
}

export default function App() {
  const [mode, setMode] = useState('audit')
  const [profile, setProfile] = useState({ business: '', audience: '', goal: '', differentiator: '' })
  const [profileMethod, setProfileMethod] = useState('type')
  const [profileSaved, setProfileSaved] = useState(false)
  const [auditInput, setAuditInput] = useState('')
  const [audit, setAudit] = useState(null)
  const [topic, setTopic] = useState('')
  const [format, setFormat] = useState('LinkedIn post')
  const [draft, setDraft] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceNote, setVoiceNote] = useState('')
  const recorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const demoLoadedRef = useRef(false)
  const [researchResults, setResearchResults] = useState({ scout: null, snapshot: null })
  const [isDemo, setIsDemo] = useState(false)

  const active = modes.find((item) => item.id === mode)
  const profileComplete = Object.values(profile).every(Boolean)
  const average = useMemo(() => audit ? Math.round((audit.scores.reduce((sum, item) => sum + item, 0) / 25) * 100) : null, [audit])

  const saveProfile = () => {
    if (!profileComplete) return toast.error('Add all four context fields to personalize the workspace.')
    setProfileSaved(true); toast.success('Context saved for this session')
  }
  const setAuditResult = (content, context) => {
    const scores = score(content, context.business)
    const rewritten = makeRewrite(content, context)
    const rewrittenScores = score(rewritten, context.business)
    const passOne = Math.round((scores.reduce((sum, item) => sum + item, 0) / 25) * 100)
    const passTwo = Math.round((rewrittenScores.reduce((sum, item) => sum + item, 0) / 25) * 100)
    setAudit({ scores, rewrite: rewritten, passOne, passTwo, originalCitation: citationAnswer(content), rewriteCitation: citationAnswer(rewritten) })
  }
  const loadDemo = () => {
    setProfile(demoFixtures.profile); setProfileSaved(true); setAuditInput(demoFixtures.audit); setDraft(demoFixtures.draft); setResearchResults({ scout: demoFixtures.scout, snapshot: demoFixtures.snapshot }); setMode('audit'); setAuditResult(demoFixtures.audit, demoFixtures.profile); setIsDemo(true)
    toast.success('Demo loaded. All sample names and claims are fictional.')
  }
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('demo') && !demoLoadedRef.current) {
      demoLoadedRef.current = true
      loadDemo()
    }
  }, [])
  const updateProfileFromText = (text) => {
    const next = { ...profile }
    const rules = [
      ['business', /(?:business|startup|company|project)\s*(?:is|:)?\s*([^\n.]{4,120})/i],
      ['audience', /(?:audience|customers?|targeting|for)\s*(?:is|:)?\s*([^\n.]{4,120})/i],
      ['goal', /(?:goal|content|create|need)\s*(?:is|:)?\s*([^\n.]{4,120})/i],
      ['differentiator', /(?:different|differentiator|unique|because)\s*(?:is|:)?\s*([^\n.]{4,120})/i],
    ]
    rules.forEach(([key, expression]) => { const match = text.match(expression); if (match && !next[key]) next[key] = match[1].trim() })
    setProfile(next); setProfileSaved(false)
    toast.info('We filled only details stated in your input. Review every field before saving.')
  }
  const readFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.type === 'application/pdf') {
      try {
        const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
        const pages = await Promise.all(Array.from({ length: Math.min(document.numPages, 20) }, async (_, index) => (await document.getPage(index + 1)).getTextContent()))
        updateProfileFromText(pages.flatMap((page) => page.items.map((item) => item.str)).join(' '))
        toast.success('PDF text extracted. Review the profile before saving.')
      } catch { toast.error('We could not read this PDF. Try a text-based PDF or paste its contents.') }
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateProfileFromText(String(reader.result || ''))
    reader.readAsText(file)
  }
  const transcribeText = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return toast.error('Speech recognition is not available in this browser. Use typing or upload a text file.')
    const recognition = new Recognition(); recognition.lang = 'en-US'; recognition.interimResults = false
    recognition.onstart = () => setTranscribing(true)
    recognition.onerror = () => { setTranscribing(false); toast.error('Voice capture failed. Try typing instead.') }
    recognition.onend = () => setTranscribing(false)
    recognition.onresult = (event) => { updateProfileFromText(event.results[0][0].transcript); toast.success('Voice note transcribed—please confirm the extracted context.') }
    recognition.start()
  }
  const transcribeAudio = async (blob) => {
    try {
      const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(blob) })
      const response = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audio: base64, mime_type: blob.type || 'audio/webm', filename: 'context-unlock-voice.webm' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      updateProfileFromText(data.text)
      toast.success('Voice note transcribed. Please review the extracted profile.')
    } catch { toast.info('Audio is saved below. Automatic transcription was unavailable, so you can still fill the profile manually.') }
  }
  const startVoiceCapture = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return toast.error('Audio recording is not available in this browser. Try Chrome or Edge, or use file upload.')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder; audioChunksRef.current = []
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunksRef.current.push(event.data) }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setVoiceNote(URL.createObjectURL(blob)); setTranscribing(false); await transcribeAudio(blob)
      }
      recorder.start(); setTranscribing(true)
    } catch { toast.error('Microphone access was not granted. You can upload a file or type your profile instead.') }
  }
  const stopVoiceCapture = () => recorderRef.current?.state === 'recording' && recorderRef.current.stop()
  const runAudit = () => {
    if (!profileSaved) return toast.error('Confirm your profile before running an audit.')
    if (!auditInput.trim()) return toast.error('Paste content before running an audit.')
    setAuditResult(auditInput, profile)
  }
  const runDraft = async () => {
    if (!topic.trim()) return toast.error('Add a topic or question first.')
    setIsWorking(true)
    try {
      const result = await localAI('You are an AEO content editor. Draft clear, concise Markdown using only the supplied context. Do not invent statistics, customers, sources, results, or competitors. Start with a direct answer, use self-contained sentences, and name the business explicitly.', JSON.stringify({ ...profile, topic, format }))
      setDraft(result)
    } catch (error) {
      const name = profile.business || 'Your business'; const audience = profile.audience || 'your audience'; const edge = profile.differentiator || 'make a complex decision easier'
      setDraft(`## ${topic}\n\n${audience} do not need more generic advice about this topic. **${name} helps people ${edge}.**\n\nStart with the outcome, name the audience, and add only evidence you can verify before publishing.`)
      toast.info('Local AI is offline, so a source-safe local draft was used.')
    } finally { setIsWorking(false) }
  }
  const requestResearch = async (label) => {
    if (!profileSaved) return toast.error('Confirm your profile before starting research.')
    setIsWorking(true)
    setResearch(null)
    const task = label === 'Scout'
      ? 'Run at least three web searches: audience concerns, competitor activity, and a recent news/report signal. Return valid Markdown with named sources and dates. Do not state a trend unless traceable.'
      : 'Find real named competitors and one real citable market-size figure. Return valid Markdown with source names and dates. Do not estimate or invent facts.'
    try {
      const result = await localAI(task, JSON.stringify(profile), true)
      setResearchResults((current) => ({ ...current, [label === 'Scout' ? 'scout' : 'snapshot']: result }))
      setIsDemo(false)
    }
    catch (error) { toast.error(error.message) }
    finally { setIsWorking(false) }
  }

  return <main className="app-shell">
    <header className="top-nav">
      <a className="wordmark" href="#top"><span>C</span><b>ContextUnlock</b></a>
      <div className="privacy-note"><LockKeyhole size={14} /> Session-only context</div>
    </header>

    <div className="page-wrap" id="top">
      <section className="hero"><Label>ANSWER ENGINE OPTIMIZATION</Label><h1>Make your expertise<br /><em>easy to quote.</em></h1><p>ContextUnlock gives founders a focused workspace for making clear, cited, and answer-ready content.</p><button className="demo-button" onClick={loadDemo}>Try a fictional demo <ArrowRight size={15} /></button></section>

      <div className="bento-grid">
        <Card className="profile-card"><div className="card-top"><div><Label>01 / YOUR CONTEXT</Label><h2>Give the work a point of view.</h2></div><span className={`status-chip ${profileSaved ? 'is-done' : ''}`}>{profileSaved ? <><Check size={13} /> READY</> : 'REQUIRED'}</span></div>
          <div className="capture-actions"><button className={`capture-action ${profileMethod === 'type' ? 'selected' : ''}`} onClick={() => setProfileMethod('type')}><Check size={17} /><span><b>Type context</b><small>Fill in the fields below</small></span></button><label className="capture-action"><Upload size={17} /><span><b>Upload a file</b><small>PDF, TXT, or Markdown</small></span><input type="file" accept=".txt,.md,text/plain,text/markdown,application/pdf" onChange={readFile} /></label><button className={`capture-action ${transcribing ? 'recording' : ''}`} onClick={transcribing ? stopVoiceCapture : startVoiceCapture}><Mic size={17} /><span><b>{transcribing ? 'Stop recording' : 'Record voice note'}</b><small>{transcribing ? 'Recording in progress…' : 'Speak your business context'}</small></span></button></div>
          {voiceNote && <div className="voice-preview"><span>VOICE NOTE READY</span><audio controls src={voiceNote} /></div>}
          <div className="field-grid">
            {[['business', 'Business or project', 'e.g. a climate-tech analytics startup'], ['audience', 'Target audience', 'e.g. sustainability leads at SMEs'], ['goal', 'Content goal', 'e.g. LinkedIn thought leadership'], ['differentiator', 'Your differentiator', 'e.g. turns utility data into actions']].map(([key, label, placeholder]) => <label key={key}>{label}<input value={profile[key]} placeholder={placeholder} onChange={(e) => { setProfile({ ...profile, [key]: e.target.value }); setProfileSaved(false) }} /></label>)}
          </div><div className="card-footer"><p>Only used in this browser session.</p><button className="button button-dark" onClick={saveProfile}>Save context <ArrowRight size={15} /></button></div>
        </Card>

        <Card className="mode-card"><Label>02 / CHOOSE A MODE</Label><div className="mode-list">{modes.map((item) => { const Icon = item.icon; return <button className={`mode-option ${mode === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setMode(item.id)}><span>{item.number}</span><Icon size={17} /><b>{item.label}</b>{mode === item.id && <ArrowRight size={15} />}</button> })}</div></Card>

        <motion.section key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .28 }} className="workspace-card">
          <div className="workspace-heading"><div><Label>{active.number} / {active.label}</Label><h2>{active.title}</h2></div><p>{active.help}</p></div>
          {mode === 'audit' && <AuditView input={auditInput} setInput={setAuditInput} audit={audit} average={average} onRun={runAudit} />}
          {mode === 'draft' && <DraftView topic={topic} setTopic={setTopic} format={format} setFormat={setFormat} draft={draft} working={isWorking} onRun={runDraft} />}
          {mode === 'scout' && <ResearchView type="Scout" icon={Radar} working={isWorking} profile={profile} result={researchResults.scout} demo={isDemo} onRun={() => requestResearch('Scout')} />}
          {mode === 'snapshot' && <ResearchView type="Founder Snapshot" icon={UsersRound} working={isWorking} profile={profile} result={researchResults.snapshot} demo={isDemo} onRun={() => requestResearch('Founder Snapshot')} />}
        </motion.section>
      </div>
    </div>
  </main>
}

function AuditView({ input, setInput, audit, average, onRun }) {
  return <div className="result-grid"><Card className="input-card"><label>CONTENT TO AUDIT<textarea rows="9" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste a paragraph, post, or landing page section here." /></label><button className="button button-accent" onClick={onRun}>Run AEO audit <ArrowRight size={15} /></button></Card>
    <Card className="score-card" accent={Boolean(audit)}><div className="card-top"><div><Label>QUOTE-READINESS</Label><h3>{average === null ? 'Waiting for content' : `${average}/100`}</h3></div><div className="score-orb">{average === null ? '--' : `${average}%`}</div></div>
      {audit ? <div className="scores">{criteria.map(([name, hint], index) => <motion.div className="score-row" key={name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * .06 }}><span title={hint}>{name}</span><b>{audit.scores[index]}/5</b><div className="progress"><motion.i initial={{ width: 0 }} animate={{ width: `${audit.scores[index] * 20}%` }} transition={{ duration: .6, delay: index * .06 }} /></div></motion.div>)}</div> : <EmptyState icon={FileSearch} title="Your scorecard will appear here">We evaluate writing signals, not factual accuracy. Verify every claim before publishing.</EmptyState>}</Card>
    <AnimatePresence>{audit && <><motion.div className="wide" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><Card className="rewrite-card" accent><div className="card-top"><div><Label>REWRITE LOOP / PASS 01 → 02</Label><h3>Clearer, more quotable language</h3></div><span className="status-chip is-done">{audit.passOne}% → {audit.passTwo}%</span></div><ReactMarkdown>{audit.rewrite}</ReactMarkdown><div className="card-footer"><p>Stopped after one improvement pass; add verified evidence before publishing.</p><CopyButton value={audit.rewrite} label="Copy rewrite" /></div></Card></motion.div><motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .06 }}><Card className="citation-card"><Label>CITATION TEST</Label><h3>Would a model quote it?</h3><p><b>Original</b><br />{audit.originalCitation}</p><p className="citation-after"><b>Rewrite</b><br />{audit.rewriteCitation}</p></Card></motion.div><motion.div className="wide" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}><ReviewPublishCard text={audit.rewrite} /></motion.div></>}</AnimatePresence>
  </div>
}

function DraftView({ topic, setTopic, format, setFormat, draft, working, onRun }) { return <div className="draft-layout"><Card><label>TOPIC OR QUESTION<textarea rows="5" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What should your audience understand?" /></label><div className="card-footer"><div className="format-picker">{['LinkedIn post', 'Website section', 'Founder POV'].map((item) => <button key={item} className={format === item ? 'selected' : ''} onClick={() => setFormat(item)}>{item}</button>)}</div><button className="button button-accent" disabled={working} onClick={onRun}>{working ? 'Writing…' : 'Generate draft'} <ArrowRight size={15} /></button></div></Card>{draft ? <Card className="draft-result" accent><div className="card-top"><div><Label>DRAFT READY</Label><h3>A point of view to refine</h3></div><CopyButton value={draft} /></div><ReactMarkdown>{draft}</ReactMarkdown></Card> : <Card><EmptyState icon={Sparkles} title="A focused first draft will appear here">The draft uses your profile and topic; factual claims need a cited source.</EmptyState></Card>}</div> }

function ResearchView({ type, icon, working, profile, result, demo, onRun }) { const Icon = icon; return <div className="research-layout"><Card className="research-brief"><div><Label>{type === 'Scout' ? 'RESEARCH BRIEF' : 'MARKET BRIEF'}</Label><h3>{profile.business ? `Research for ${profile.business}` : 'Save your profile to tailor this brief.'}</h3><p>{type === 'Scout' ? 'Three live search angles: audience concerns, competitor activity, and a recent signal.' : 'Named competitors, a citable market figure, and clear differentiation.'}</p></div><button className="button button-accent" onClick={onRun} disabled={working}>{working ? 'Researching…' : demo ? 'Run live research' : `Run ${type}`} <ArrowRight size={15} /></button></Card><Card className="draft-result" accent>{result ? <><Label>{demo ? 'FICTIONAL DEMO RESULT' : 'SOURCE-BACKED RESULT'}</Label><ReactMarkdown>{result}</ReactMarkdown></> : <EmptyState icon={Icon} title="Ready for live research">Start the local API (`npm run api`) to use the configured model and web search. Sources and dates are required in every result.</EmptyState>}</Card></div> }
