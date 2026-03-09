# ⚓ Privateer: Letters of Marque – A Trading Duel

**Privateer: Letters of Marque** is a fast‑paced, tactical trading duel set in the Age of Sail.  
Build wealth, trade cargo, claim commissions, raid rivals, battle storms, and outmaneuver competing captains — human or AI.

This repository contains the full source code for the Privateer web game, featuring custom nautical artwork, optimized UI, and a fully interactive multiplayer + AI duel engine.

Live Project:  
https://privateer.lovable.app

---

## 🧭 About the Game

Privateer is designed as a **competitive head‑to‑head duel**, where two captains race to earn the most doubloons through:

- Buying and selling cargo  
- Completing commission bonuses  
- Weathering storms  
- Raiding enemy ships  
- Upgrading their fleet and roles  
- Managing a captain’s ledger  

The game includes a full custom visual asset suite:

- 3D‑style resource tokens (gold, silver, gems, rum, iron, silk, cargo crates, ships, fleet markers, roles, actions)  
- Nautical UI elements (compasses, cutlasses, seals, arrows, banners)  
- Dynamic ship‑hold and ledger backgrounds  
- Animated end‑of‑game cinematic (MP4/WebM)  

All assets are optimized for performance and clarity while maintaining a cohesive Age‑of‑Sail aesthetic.

---

## 🛠 Tech Stack

This project is built using:

- **Vite** — blazing‑fast dev server and bundler  
- **React** — component‑based UI  
- **TypeScript** — type‑safe game logic  
- **Tailwind CSS** — utility‑first styling  
- **shadcn/ui** — accessible, themeable UI components  
- **Vitest** — lightweight testing framework  

---

## 📦 Running the Project Locally

### 1. Clone the repository

git clone <YOUR_GIT_URL>
cd privateer
npm install
or
bun install
npm run dev
or
bun dev


### 3. Start the development server

npm run dev
or
bun dev

This launches the game with hot‑reloading via Vite.

## How to Edit the Game

### Option A — Use Lovable (Recommended)
Edit the game using prompt‑based development:
https://lovable.dev/projects/d904d748-d9b7-4786-8c79-81c3ddc88cb6
All changes commit automatically to this GitHub repo.

### Option B — Edit Locally in Your IDE

Clone the repository
Install dependencies
Run the dev server
Commit your changes
Push to GitHub

Changes instantly sync to Lovable.

### Option C — Edit Directly in GitHub

Open any file
Click the ✏️ Edit button
Commit your changes

### Option D — GitHub Codespaces

Open the repository
Click Code → Codespaces
Create a new Codespace
Develop fully in the cloud

## Deployment
Deployment is handled via Lovable.
To publish:

Open the Lovable project
Click Share → Publish
Your updated version deploys instantly

## Custom Domains
You can attach your own domain:

Go to Project → Settings → Domains
Click Connect Domain
Add the DNS records provided by Lovable

Documentation:
https://docs.lovable.dev/features/custom-domain#custom-domain

## Testing

Run tests via Vitest:

npm test
or
bun test

## Contributing
Contributions are welcome. Guidelines:

Use TypeScript
Maintain accessibility
Match the established nautical visual theme
Ensure no gameplay regressions
Run lint + tests before submitting


## License
This project is proprietary and part of the Privateer: Letters of Marque game ecosystem.
Unauthorized commercial use or redistribution is prohibited.

## Credits
Game design, artwork, icons, UX, and development by qballcreative (Darrell Portz).
Built with Lovable, React, TypeScript, Vite, Tailwind CSS, and shadcn/ui.
Fair winds and following seas, Captain. ⚓
