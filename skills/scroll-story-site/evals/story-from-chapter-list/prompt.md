---
tags: [scroll-story-site]
max_turns: 60
timeout_seconds: 1800
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I'm building "latchkey", a CLI that gives AI agents scoped, expiring access to a dev's cloud accounts (AWS, GCP, Vercel). Brand colour is a warm amber (#f0a030) on near-black. I want a homepage like a scroll story with a 3D world, chapters, the works. Rough storyline:

1. hero: "Give your agent a key, not the keys."
2. the problem: devs paste a long-lived admin token into an agent's env and forget it
3. latchkey mints a key that only opens the one door (scoped)
4. the key dies on its own after 15 minutes (expiring)
5. every use is logged, and the dev can see what the agent touched
6. works with Claude Code, Codex and Cursor today, more coming
7. free for one account, $9/month for unlimited
8. close

Put it in ./latchkey-site/ as static files (index.html + world.js). Make it feel premium and make sure the copy never gets cut off on a laptop screen.
