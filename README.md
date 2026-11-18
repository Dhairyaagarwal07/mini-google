# Mini Google - Pre-1998 vs PageRank (1,000,000 Random Surfer Simulation)

## Class Activity Overview
This interactive web application demonstrates the paradigm shift in web search rankings that enabled Google to dominate the Internet in 1998:
- **Pre-1998 Era (AltaVista, Lycos, WebCrawler)**: Ranks websites purely based on **Term Frequency (Keyword Density)**. Website #6 (`pizza-pizza-pizza.com`) exploits this flaw with 10 repeated keywords to rank **#1**.
- **1998+ PageRank (Google & Random Surfer Model)**: Evaluates the link graph topology via **1,000,000 Random Surfer Moves** with a damping factor of $d = 0.85$ (15% teleport probability). Website #2 (`best-pizza-pune.com`) overwhelmingly wins **#1 (~39.3% PageRank score)** because reputable food guides and blogs all link to it, while the spam site has zero incoming links.

---

## The 6 Pune Websites Dataset

| ID | URL | Content Snippet | Outgoing Links | Inbound Links | "Pizza" Count | PageRank (~1M Moves) |
|---|---|---|---|---|---|---|
| **1** | `pune-food-guide.com` | "Where to eat in Pune - vada pav and biryani and pizza" | `[2]` | `[2, 6]` | 1 | ~21.3% |
| **2** | `best-pizza-pune.com` | "Fresh wood-fired pizza made daily - try our cheese pizza" | `[1, 3]` | `[1, 3, 4, 5]` | 2 | **~39.3% (#1 Authority)** |
| **3** | `college-canteen-blog.com` | "Student reviews of canteen food and chai and Friday pizza" | `[2, 4]` | `[2]` | 1 | ~19.2% |
| **4** | `pizza-recipes-home.com` | "Make pizza at home - pizza dough and pizza sauce" | `[2, 5]` | `[3]` | 3 | ~10.7% |
| **5** | `cheap-eats-pune.com` | "Good food under 100 rupees - misal and dosa and pizza slices" | `[2]` | `[4]` | 1 | ~7.0% |
| **6** | `pizza-pizza-pizza.com` | "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza" | `[1]` | `None (0)` | **10 (Spam)** | **~2.5% (Last)** |

---

## Key Features
1. **Black / Dark Theme**: Deep black background (`#07090e`) with Google neon glow accents (blue, red, yellow, green).
2. **Animated Hyperlink Canvas Graph**:
   - Directed curved arrows indicating hyperlinks between websites.
   - Dynamic node scaling and glowing auras that expand as PageRank visits accumulate.
   - Real-time animated **Random Surfer Particle** that hops along edges with custom speed control.
   - Clickable nodes with a browser mockup modal inspecting the webpage text and link topology.
3. **1,000,000 Surfer Moves Simulator**:
   - Asynchronous batch Monte Carlo simulation with a live progress bar and status telemetry.
   - Real-time convergence to steady-state PageRank eigenvectors.
4. **Side-by-Side Comparison**:
   - Left: **Pre-1998 (AltaVista)** showing keyword spam manipulation.
   - Right: **1998+ PageRank (Google)** showing link authority defense.
5. **Interactive Search Bar**:
   - Test "pizza" (the classic spam showdown) or other terms like "pune", "food", "canteen".

---

## How to Run
Simply open `index.html` in any web browser:
```bash
# On macOS:
open index.html
```
No build steps or dependencies required! Pure HTML5, CSS3, and modern Vanilla JavaScript.
