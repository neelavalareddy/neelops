import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import BrandLogo from "@/components/BrandLogo";

const FLOW_STEPS = [
  {
    n: "01",
    who: "Company",
    title: "Publish what needs testing",
    body: "List a full AI agent for live conversations or post a single AI output for structured review.",
    accent: "var(--blue)",
  },
  {
    n: "02",
    who: "Tester",
    title: "Generate real evaluation signal",
    body: "Humans either stress-test the agent in chat or review the output directly against the task criteria.",
    accent: "var(--pass)",
  },
  {
    n: "03",
    who: "Classify Judge",
    title: "Score and organize the result",
    body: "The platform decides what is valid, flags failures, and turns the interaction into usable evidence for the team.",
    accent: "var(--amber)",
  },
];

const HERO_METRICS = [
  { value: "agent", label: "live conversation testing" },
  { value: "output", label: "single-response review" },
  { value: "judge", label: "scored evaluation layer" },
];

const TRUST_POINTS = [
  "Human review flows",
  "Multi-model judgment",
  "Hallucination flags",
  "Report-ready evidence",
];

const PRODUCT_SURFACES = [
  {
    title: "Agent Testing",
    body: "Companies publish an AI agent and testers interact with it through a built-in chat interface.",
  },
  {
    title: "Output Review",
    body: "Teams can also post a single AI response, summary, or code snippet for direct human evaluation.",
  },
  {
    title: "Judge Engine",
    body: "Classify scores relevance, rule compliance, authenticity, and failure patterns before treating work as high-signal.",
  },
  {
    title: "Reports",
    body: "Results roll up into structured findings companies can use before shipping to real users.",
  },
];

const JUDGE_CRITERIA = [
  {
    id: "01",
    label: "Human Authenticity",
    desc: "Is the work coming from a real human rather than low-effort automation or templated spam?",
    color: "var(--pass)",
    threshold: ">= 70%",
  },
  {
    id: "02",
    label: "Rule Compliance",
    desc: "Did the tester stay inside the rules the company defined for the task or session?",
    color: "var(--amber)",
    threshold: ">= 80%",
  },
  {
    id: "03",
    label: "Objective Relevance",
    desc: "Was the work actually aimed at the stated objective, rather than filler or noise?",
    color: "var(--blue)",
    threshold: ">= 60%",
  },
  {
    id: "04",
    label: "Failure Capture",
    desc: "Did the session or review reveal unsupported claims, contradictions, or hallucination patterns worth logging?",
    color: "var(--fail)",
    threshold: "logged",
  },
];

const COMPANY_POINTS = [
  "Run live adversarial testing against full AI agents",
  "Collect ratings and written feedback on single outputs",
  "Capture transcripts, criteria scores, and flagged failures",
  "Give product teams evidence they can actually act on",
];

const TESTER_POINTS = [
  "Choose either live agent sessions or output-review tasks",
  "Do real evaluation work instead of fake engagement loops",
  "Earn when the submission is relevant, useful, and valid",
  "Build reputation by surfacing signal, not noise",
];

const LIVE_ENTRY_POINTS = [
  {
    title: "Browse Agents",
    body: "Open the main marketplace for live AI agent testing.",
    href: "/agents",
    cta: "Open agents",
  },
  {
    title: "Publish An Agent",
    body: "Create a listing with objective, rules, persona, and payout.",
    href: "/agents/new",
    cta: "Create listing",
  },
  {
    title: "Use The Task Sandbox",
    body: "Review single AI outputs with ratings and written feedback.",
    href: "/tasks",
    cta: "Open tasks",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.shell}>
          <div className={styles.headerInner}>
            <Link href="/" className={styles.brand}>
              <div className={styles.brandMark}>
                <BrandLogo className={styles.brandLogo} size={34} />
              </div>
              <div>
                <p className={styles.brandName}>Classify</p>
                <p className={styles.brandTag}>Catch hallucinations pre-prod</p>
              </div>
            </Link>

            <nav className={styles.nav}>
              <Link href="/agents" className={styles.navLink}>
                Browse Agents
              </Link>
              <Link href="/tasks" className={styles.navLink}>
                Tasks
              </Link>
              <Link href="/agents/new" className="c-btn-primary">
                Connect Agent
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.heroSection}>
          <div className={styles.heroGlow} aria-hidden />
          <div className={styles.heroGrid}>
            <div className={`${styles.heroCopy} animate-fade-up`}>
              <div className={`${styles.kicker} c-pill`}>AI evaluation platform</div>

              <h1 className={styles.heroTitle}>
                Test agents, review outputs, <span className={styles.heroAccent}>catch failures before launch.</span>
              </h1>

              <p className={styles.heroText}>
                Classify gives teams one place to evaluate both full AI agents and individual AI outputs.
                Real humans generate signal, the judge scores the work, and the results come back as something a company can use.
              </p>

              <div className={styles.heroActions}>
                <Link href="/agents/new" className="c-btn-primary">
                  Publish Something
                </Link>
                <Link href="/agents" className="c-btn-ghost">
                  Explore Marketplace
                </Link>
              </div>

              <div className={styles.metricRow}>
                {HERO_METRICS.map((metric) => (
                  <div key={metric.label} className={styles.metricCard}>
                    <div className={styles.metricValue}>{metric.value}</div>
                    <div className={styles.metricLabel}>{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className={styles.trustList}>
                {TRUST_POINTS.map((item) => (
                  <span key={item} className={styles.trustItem}>
                    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <polyline
                        points="1.2,5.2 3.8,7.7 8.8,2.2"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className={`${styles.heroPanel} animate-fade-up animate-delay-200`}>
              <div className={styles.signalCard}>
                <div className={styles.signalHeader}>
                  <div>
                    <p className={styles.signalLabel}>Platform loop</p>
                    <h2 className={styles.signalTitle}>Human evaluation, organized for shipping teams.</h2>
                  </div>
                  <div className={styles.signalBadge}>Judge-backed</div>
                </div>

                <div className={styles.signalSurface}>
                  <div className={styles.signalRail} aria-hidden />
                  {FLOW_STEPS.map((step) => (
                    <article
                      key={step.n}
                      className={styles.stepCard}
                      style={{ "--step-accent": step.accent } as CSSProperties}
                    >
                      <div className={styles.stepIndex}>
                        <span className={styles.stepWho}>{step.who}</span>
                        <span className={styles.stepNumber}>{step.n}</span>
                      </div>
                      <div>
                        <h3 className={styles.stepTitle}>{step.title}</h3>
                        <p className={styles.stepBody}>{step.body}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionIntro}>
            <div className={styles.sectionEyebrow}>What Classify Covers</div>
            <h2 className={styles.sectionTitle}>
              One product, two evaluation surfaces.
            </h2>
            <p className={styles.sectionText}>
              The core idea is simple: some teams need full conversational testing, while others just need feedback on a single output.
              Classify supports both without changing the reporting and judgment layer.
            </p>
          </div>

          <div className={styles.pillarGrid}>
            {PRODUCT_SURFACES.map((pillar) => (
              <article key={pillar.title} className={styles.pillarCard}>
                <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                <p className={styles.pillarText}>{pillar.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionIntro}>
            <div className={styles.sectionEyebrow}>How Judgment Works</div>
            <h2 className={styles.sectionTitle}>
              Every submission is scored for quality, not just volume.
            </h2>
            <p className={styles.sectionText}>
              The platform is built to reward useful evaluation signal. Whether the work is a live session or a one-off output review,
              Classify focuses on relevance, compliance, authenticity, and whether the work exposed something meaningful.
            </p>
          </div>

          <div className={styles.criteriaGrid}>
            {JUDGE_CRITERIA.map((criterion) => (
              <article
                key={criterion.id}
                className={styles.criteriaCard}
                style={{ "--criterion-accent": criterion.color } as CSSProperties}
              >
                <div className={styles.criteriaTop}>
                  <span className={styles.criteriaId}>{criterion.id}</span>
                  <span className={styles.criteriaThreshold}>{criterion.threshold}</span>
                </div>
                <h3 className={styles.criteriaTitle}>{criterion.label}</h3>
                <p className={styles.criteriaText}>{criterion.desc}</p>
              </article>
            ))}
          </div>

          <div className={styles.pipelineCard}>
            <div className={styles.pipelineEyebrow}>Judge pipeline</div>
            <div className={styles.pipelineFlow}>
              <div className={styles.pipelineStep}>
                <strong>Pre-checks</strong>
                <span>structure and obvious abuse filters</span>
              </div>
              <div className={styles.pipelineArrow}>→</div>
              <div className={styles.pipelineStep}>
                <strong>Primary judge</strong>
                <span>main scoring pass</span>
              </div>
              <div className={styles.pipelineArrow}>→</div>
              <div className={styles.pipelineStep}>
                <strong>Secondary judge</strong>
                <span>consistency check</span>
              </div>
              <div className={styles.pipelineArrow}>→</div>
              <div className={`${styles.pipelineStep} ${styles.pipelineFocus}`}>
                <strong>Result</strong>
                <span>valid work becomes reportable signal</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.audienceBand}>
          <div className={`${styles.shell} ${styles.audienceGrid}`}>
            <article className={styles.audienceCard}>
              <div className={styles.sectionEyebrow}>For Companies</div>
              <h2 className={styles.audienceTitle}>Get evaluation evidence before users find the problem.</h2>
              <div className={styles.pointList}>
                {COMPANY_POINTS.map((item) => (
                  <div key={item} className={styles.pointItem}>
                    <span className={styles.pointGlyph}>◈</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/agents/new" className="c-btn-primary">
                Publish your first listing
              </Link>
            </article>

            <article className={`${styles.audienceCard} ${styles.audienceCardAlt}`}>
              <div className={`${styles.sectionEyebrow} ${styles.sectionEyebrowPass}`}>For Testers</div>
              <h2 className={styles.audienceTitle}>Earn by doing useful review work.</h2>
              <div className={styles.pointList}>
                {TESTER_POINTS.map((item) => (
                  <div key={item} className={styles.pointItem}>
                    <span className={`${styles.pointGlyph} ${styles.pointGlyphPass}`}>◈</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/agents" className="c-btn-ghost">
                Browse live work
              </Link>
            </article>
          </div>
        </section>

        <section className={`${styles.shell} ${styles.section}`}>
          <div className={styles.sectionIntro}>
            <div className={styles.sectionEyebrow}>Go There Now</div>
            <h2 className={styles.sectionTitle}>
              The key surfaces are already live in the app.
            </h2>
            <p className={styles.sectionText}>
              If you want to understand the product quickly, start with the agent marketplace. If you want a simpler review loop,
              the task sandbox is still available for single-output evaluation.
            </p>
          </div>

          <div className={styles.actionGrid}>
            {LIVE_ENTRY_POINTS.map((item) => (
              <article key={item.title} className={styles.actionCard}>
                <h3 className={styles.actionTitle}>{item.title}</h3>
                <p className={styles.actionText}>{item.body}</p>
                <Link href={item.href} className="c-btn-ghost" style={{ alignSelf: "flex-start" }}>
                  {item.cta}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaGlow} aria-hidden />
          <div className={`${styles.shell} ${styles.ctaWrap}`}>
            <div className={styles.ctaCard}>
              <div className={styles.sectionEyebrow}>Ready</div>
              <h2 className={styles.ctaTitle}>Catch the failure before it reaches production.</h2>
              <p className={styles.ctaText}>
                Publish an agent, post an output, or start testing what is already live in the marketplace.
              </p>
              <div className={styles.heroActions}>
                <Link href="/agents/new" className="c-btn-primary">
                  Publish now
                </Link>
                <Link href="/agents" className="c-btn-ghost">
                  Start testing
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.shell} ${styles.footerInner}`}>
          <span className={styles.footerBrand}>Classify</span>
          <span className={styles.footerMeta}>Agent testing + output evaluation</span>
          <span className={styles.footerMeta}>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
