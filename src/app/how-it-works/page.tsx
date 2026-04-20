import Link from "next/link"

const sections = [
  {
    title: "What The App Actually Does",
    body:
      "The current system is not using a trained model or cloud inference. It is a deterministic coverage-audit workflow: it interpolates sparse signal measurements into a continuous field, finds weak-signal regions, and scores Wi-Fi router candidates using domain rules.",
  },
  {
    title: "Deadzone Detection",
    body:
      "For the selected signal layer, the app converts each sample into one numeric field, generates an inverse-distance-weighted grid, then groups neighboring cells below a threshold into contiguous deadzone clusters.",
  },
  {
    title: "Router Estimation",
    body:
      "The estimator looks for the point that best improves weak Wi-Fi coverage while staying off the walls and away from the strongest existing source centroid. LTE and 5G stay view-only now so the app does not imply tower or cellular install locations.",
  },
]

const steps = [
  "Normalize the selected signal values from uploaded JSON samples.",
  "Interpolate a denser grid so the app can reason between measured points.",
  "Mark cells below the selected radio threshold as weak coverage.",
  "Cluster adjacent weak cells into deadzones and compute area, centroid, and severity.",
  "Score possible installation points against weak-cell recovery, deadzone proximity, centrality, and edge clearance.",
  "Return the best Wi-Fi candidate as the router or AP estimate.",
]

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#183652_0%,#0b1624_40%,#050a12_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.32em] text-sky-200/70">Methodology</div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
              How the router estimate and deadzone analysis work
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-200/85">
              This page explains the current logic in plain English, including the mathematical
              foundations, why Wi-Fi says router/AP, and why LTE and 5G no longer produce source-placement suggestions.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            Back to app
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-200/82">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-sky-300/15 bg-slate-950/45 p-6">
            <h2 className="text-2xl font-semibold">Pipeline</h2>
            <div className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-sm font-semibold text-sky-200">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-200/84">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-400/8 p-6">
              <h2 className="text-xl font-semibold">Why LTE and 5G are view-only</h2>
              <p className="mt-3 text-sm leading-7 text-slate-100/88">
                Even though the same math can be applied to other layers, that output is easy to
                misread. To keep the product honest, router placement is now Wi-Fi only. LTE and
                NR remain available as visual overlays, but the app does not pretend to know where
                a cellular tower or source should be installed inside your floor plan.
              </p>
            </div>

            <div className="rounded-[2rem] border border-amber-300/15 bg-amber-300/8 p-6">
              <h2 className="text-xl font-semibold">What would make it more truly AI</h2>
              <p className="mt-3 text-sm leading-7 text-slate-100/88">
                A stronger version would learn from labeled floor plans and installation outcomes,
                include walls and materials, and predict attenuation instead of relying only on
                interpolation plus hand-built heuristics.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Current limits</h2>
              <p className="mt-3 text-sm leading-7 text-slate-200/82">
                The estimate does not yet understand walls, doors, furniture, ceiling height, or
                antenna orientation. It is best treated as a fast first suggestion, not a final
                RF survey answer.
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Mathematics Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold">Detailed Mathematical Foundation</h2>

          {/* Signal Normalization */}
          <div className="rounded-[2rem] border border-sky-300/15 bg-slate-950/45 p-6">
            <h3 className="text-xl font-semibold">1. Signal Normalization & Validation</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              Raw signal measurements are converted to numeric values and filtered by signal type:
            </p>
            <div className="mt-4 space-y-3 rounded-lg bg-white/5 p-4 font-mono text-xs text-slate-300">
              <div><span className="text-sky-300">Wi-Fi RSSI:</span> {'{wifiRssi | rssi}'} (dBm, typically -30 to -90)</div>
              <div><span className="text-emerald-300">LTE RSRP:</span> {'{lteRsrp | rsrp}'} (dBm, typically -75 to -140)</div>
              <div><span className="text-amber-300">5G NR RSRP:</span> {'{nrRsrp}'} (dBm, typically -50 to -140)</div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              Invalid points (NaN, infinity, or outside physical bounds) are excluded. The app enforces signal-specific thresholds:
            </p>
            <div className="mt-3 space-y-1 rounded-lg bg-white/5 p-4 font-mono text-xs text-slate-300">
              <div><span className="text-sky-300">Wi-Fi threshold:</span> -72 dBm (below = weak)</div>
              <div><span className="text-emerald-300">LTE threshold:</span> -105 dBm (below = weak)</div>
              <div><span className="text-amber-300">NR threshold:</span> -100 dBm (below = weak)</div>
            </div>
          </div>

          {/* Interpolation */}
          <div className="rounded-[2rem] border border-emerald-300/15 bg-emerald-400/8 p-6">
            <h3 className="text-xl font-semibold">2. Inverse Distance Weighted (IDW) Interpolation</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              Sparse samples are interpolated onto a regular grid using Inverse Distance Weighting:
            </p>
            <div className="mt-4 rounded-lg bg-white/5 p-4 font-mono text-xs leading-8 text-slate-300">
              <div>Grid spacing (adaptive):  <span className="text-sky-300">0.35–0.75 m</span> based on room size</div>
              <div className="mt-2 text-sky-200">Interpolation formula:</div>
              <div className="mt-1 italic text-slate-400">
                Z(x,y) = Σ [w_i × z_i] / Σ w_i
              </div>
              <div className="mt-1 italic text-slate-400">
                where w_i = 1 / d_i<span className="text-xs">²</span> (inverse distance squared)
              </div>
              <div className="mt-3">
                <span className="text-emerald-300">Power parameter:</span> 2 (quadratic falloff with distance)
              </div>
              <div>
                <span className="text-emerald-300">Search radius:</span> adaptive (typically 2–3× grid spacing)
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              This creates a smooth continuous field where each cell inherits values from nearby samples, with stronger influence from closer neighbors.
            </p>
          </div>

          {/* Deadzone Detection */}
          <div className="rounded-[2rem] border border-amber-300/15 bg-amber-300/8 p-6">
            <h3 className="text-xl font-semibold">3. Deadzone Clustering (Flood Fill + Analysis)</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              After interpolation, the algorithm identifies contiguous regions with weak signal:
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-sky-300">Step A: Cell Classification</div>
                <div className="mt-2 font-mono text-xs leading-6 text-slate-300">
                  <div>For each grid cell:</div>
                  <div className="mt-1 text-slate-400">
                    if (cell_value ≤ threshold) mark as <span className="text-amber-300">WEAK</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-emerald-300">Step B: Connected Component Labeling</div>
                <div className="mt-2 font-mono text-xs leading-6 text-slate-300">
                  <div>Use flood-fill (BFS) to group adjacent WEAK cells</div>
                  <div className="mt-1 text-slate-400">
                    Neighbors: 4-connectivity (up, down, left, right)
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-sky-200">Step C: Compute Deadzone Properties</div>
                <div className="mt-2 space-y-2 font-mono text-xs leading-6 text-slate-300">
                  <div><span className="text-emerald-300">Area:</span> cell_count × (resolution)²</div>
                  <div><span className="text-emerald-300">Centroid:</span> average (x, y) of all cells</div>
                  <div><span className="text-emerald-300">Min Value:</span> weakest cell in the cluster</div>
                  <div><span className="text-emerald-300">Severity:</span> critical if min_value ≤ threshold − 8 dB</div>
                  <div><span className="text-emerald-300">Min area:</span> 0.3 m² (filter noise)</div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              Deadzones are sorted by area (largest first) for prioritization during router placement.
            </p>
          </div>

          {/* Existing Router Detection */}
          <div className="rounded-[2rem] border border-purple-300/15 bg-purple-400/8 p-6">
            <h3 className="text-xl font-semibold">4. Existing Router/AP Detection</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              The system estimates the location of an existing Wi-Fi source by finding the centroid of the strongest samples:
            </p>
            <div className="mt-4 space-y-3 rounded-lg bg-white/5 p-4 font-mono text-xs leading-7 text-slate-300">
              <div><span className="text-purple-300">1. Find max signal:</span> max_rssi = max(all samples)</div>
              <div><span className="text-purple-300">2. Strong cutoff:</span> top 15% of samples, minimum max − 8 dB</div>
              <div><span className="text-purple-300">3. Centroid:</span> existing_pos = avg (x, y) of strong samples</div>
              <div><span className="text-purple-300">4. Clamp:</span> keep 0.4–0.8 m margin from walls</div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              This detection requires at least 2–3 strong samples to be confident. The result is displayed as "Existing AP" and used as a repulsion point during suggested router placement.
            </p>
          </div>

          {/* Router Placement Algorithm */}
          <div className="rounded-[2rem] border border-pink-300/15 bg-pink-400/8 p-6">
            <h3 className="text-xl font-semibold">5. Suggested Router Placement (Multi-Objective Optimization)</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              The primary router placement balances multiple objectives:
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-pink-300">Objective A: Weak Signal Centroid</div>
                <div className="mt-2 font-mono text-xs leading-6 text-slate-300">
                  <div>weighted_weak = Σ (point × weakness_factor) / Σ weakness_factor</div>
                  <div className="mt-1 text-slate-400">
                    weakness = max(1, threshold − signal + 6)
                  </div>
                  <div className="mt-1 text-slate-400">
                    Weight: 55% (highest priority—serve the weakest areas)
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-pink-300">Objective B: Largest Deadzone</div>
                <div className="mt-2 font-mono text-xs leading-6 text-slate-300">
                  <div>Position slightly toward largest_deadzone.centroid</div>
                  <div className="mt-1 text-slate-400">
                    Weight: 25% (target the worst coverage gap)
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-pink-300">Objective C: Room Center</div>
                <div className="mt-2 font-mono text-xs leading-6 text-slate-300">
                  <div>Add small centering bias for stability</div>
                  <div className="mt-1 text-slate-400">
                    Weight: 20% (encourage balanced coverage)
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-4">
                <div className="font-semibold text-pink-300">Blending Formula</div>
                <div className="mt-2 font-mono text-xs leading-6 text-slate-300">
                  <div>candidate = 0.55 × weak_centroid + 0.25 × deadzone + 0.20 × center</div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-200/85">
              Then the candidate is refined with two additional constraints:
            </p>

            <div className="mt-4 space-y-3 rounded-lg bg-white/5 p-4 font-mono text-xs leading-7 text-slate-300">
              <div className="text-pink-300">Repulsion from existing AP:</div>
              <div className="text-slate-400 ml-2">
                <div>if (distance_to_existing &lt; 1.8 m):</div>
                <div className="ml-4">push = (1.8 − distance) / 1.8</div>
                <div className="ml-4">candidate += (1.2 × push × unit_vector_away)</div>
              </div>
              <div className="mt-3 text-pink-300">Wall clearance:</div>
              <div className="text-slate-400 ml-2">
                <div>margin = min(0.9 m, max(0.55 m, 8% of room diagonal))</div>
                <div className="ml-4">candidate_x = clamp(candidate_x, margin, width − margin)</div>
                <div className="ml-4">candidate_y = clamp(candidate_y, margin, height − margin)</div>
              </div>
            </div>
          </div>

          {/* Multi-Router Suggestions */}
          <div className="rounded-[2rem] border border-rose-300/15 bg-rose-400/8 p-6">
            <h3 className="text-xl font-semibold">6. Multiple Router Suggestions</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              When multiple deadzones exist, the system suggests additional routers:
            </p>
            <div className="mt-4 space-y-3 rounded-lg bg-white/5 p-4 font-mono text-xs leading-7 text-slate-300">
              <div className="text-rose-300">Primary router:</div>
              <div className="text-slate-400 ml-2">Placed using the multi-objective algorithm above</div>
              <div className="mt-2 text-rose-300">Secondary routers (one per deadzone after the largest):</div>
              <div className="text-slate-400 ml-2">
                <div>Location = centroid of deadzone</div>
                <div>Label = "Suggested AP (Deadzone N)"</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              This allows the system to suggest multiple access points for larger spaces or complex layouts with geographically separated weak zones.
            </p>
          </div>

          {/* Why Signal Thresholds */}
          <div className="rounded-[2rem] border border-cyan-300/15 bg-cyan-400/8 p-6">
            <h3 className="text-xl font-semibold">7. Signal Thresholds & Standards</h3>
            <p className="mt-3 text-sm leading-7 text-slate-200/85">
              The default thresholds are based on real-world RF standards and operator guidelines:
            </p>
            <div className="mt-4 space-y-3 rounded-lg bg-white/5 p-4 text-xs leading-7 text-slate-300">
              <div>
                <span className="font-semibold text-cyan-300">Wi-Fi (2.4/5 GHz) @ −72 dBm:</span><br/>
                <span className="text-slate-400">Below this, throughput drops significantly; many devices disconnect at −80 dBm. The −72 dBm threshold targets "barely usable" coverage for triggering intervention.</span>
              </div>
              <div className="mt-3">
                <span className="font-semibold text-cyan-300">LTE (Band variety) @ −105 dBm:</span><br/>
                <span className="text-slate-400">LTE has better sensitivity than Wi-Fi. Below −105 dBm, connections become unstable. Urban operators often aim for −90 dBm minimum.</span>
              </div>
              <div className="mt-3">
                <span className="font-semibold text-cyan-300">5G NR (sub-6 GHz) @ −100 dBm:</span><br/>
                <span className="text-slate-400">Similar to LTE; below −110 dBm is challenging. These thresholds remain soft targets for visual feedback.</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
