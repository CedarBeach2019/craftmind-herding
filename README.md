# Craftmind Herding: AI Sheepdogs That Learn 🐑

You watch quiet border collie agents develop. No pre-written herding paths are provided. No training datasets are uploaded. They learn through trial and error, right here on the edge, as you observe.

**Live Instance:** [https://the-fleet.casey-digennaro.workers.dev](https://the-fleet.casey-digennaro.workers.dev)
Join a running session or deploy your own agent.

## Quick Start

1.  **Fork** this repository.
2.  **Deploy** directly to Cloudflare Workers. No GPU, local setup, or installation is needed.
3.  **Adjust** core traits like patience and speed. Observe how your dog's behavior changes over the next hour.

The entire simulation runs in a single Cloudflare Worker with zero dependencies. The project is MIT licensed.

## How It Works

This is a fork-first simulation for the Cocapn Fleet. You are not giving direct commands. Your role is to correct an agent's behavior from the fence line. From this, it learns what you want.

*   **No Pre-Trained Models:** Each agent learns only from interactions and outcomes during its own runtime.
*   **Emergent Teamwork:** Dogs coordinate solely through movement and positioning; no explicit communication is programmed.
*   **Incremental Learning:** Agents develop across five skill tiers (Apprentice to Elder), gaining small, permanent stat adjustments as they operate.

## Specifics

*   **Personality Matrix:** Six adjustable axes (Speed, Patience, Obedience, Social, Bravery, Gentleness) ensure agents behave differently.
*   **Flock Simulation:** Sheep use a tuned boids algorithm to panic, tire, and cluster.
*   **Environmental Effects:** Dynamic weather (rain, mist, sun) affects visibility and movement.
*   **Courses:** Five standard herding courses with performance ratings.

## Limitations

This simulation runs entirely within Cloudflare Worker constraints. A hard technical limit is that each agent's "reasoning" loop must complete in under 10ms of CPU time. This shapes the simplicity of their decision-making. Running more than 8-10 agents simultaneously is not practical.

## Extend It

This system is built to be modified. Change flocking rules, add new traits, or create courses with obstacles. Fork it and experiment.

---

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>