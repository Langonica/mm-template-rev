#### **The Structural Outline**

1. **The Physics of Meridian Master:** 7-6 Split, Dual-Foundation logic, and Tableau rules.
2. **Dynamic Column Logic (The Core Innovation):** Definitions for King, Ace, Traditional, and NULL types.
3. **Operational Game Modes:** The four modes and their specific constraints (Pockets/Visibility).
4. **The v2.0 Technical Schema:** Full JSON specification for system compatibility.
5. **The Complete Executable Toolkit:**
* *Script A:* The 120-Snapshot Library Generator (with difficulty weighting).
* *Script B:* The Validation & Librarian Engine (Card counting/report generation).

#### **Conservation Rules**

* **Rule 1 (Completeness):** No placeholders. All Python scripts must be full, executable code.
* **Rule 2 (No Shorthand):** "Refer to Section X" is forbidden. All logic must be explicitly stated.
* **Rule 3 (Dynamic Integrity):** The NULL-typing logic must be integrated into every script and schema example.
* **Rule 4 (Cumulative State):** Every rule mentioned in the transcript (e.g., specific pocket counts, face-down staircase counts) must be present.

---

## 1. THE PHYSICS OF THE ENGINE

### A. The 7-6 Split Foundations

* **The Deck:** 1 Standard 52-card deck (Hearts `h`, Diamonds `d`, Clubs `c`, Spades `s`).
* **UP Foundations (4 Piles):** Start at **7**, build ascending to **King** (7-8-9-10-J-Q-K).
* **DOWN Foundations (4 Piles):** Start at **6**, build descending to **Ace** (6-5-4-3-2-A).

### B. Tableau & Sequencing

* **Sequencing:** Alternating colors, descending rank (e.g., Red 9 can only be placed on a Black 10).
* **Maneuverability:** Cards can be moved in sequences or individually.

### C. Dynamic Column Typing (The Core Rule)

A column’s identity is volatile. It is defined by the **Bottom Card (Index 0)**:

1. **KING Type:** Starts with a King. Only Queens (alternating color) can follow.
2. **ACE Type:** Starts with an Ace. Only 2s (alternating color) can follow.
3. **TRADITIONAL Type:** Starts with rank 2–Queen. Standard rules apply.
4. **NULL Type:** The column is empty `[]`.
* **Rule:** Only a **King** or an **Ace** can occupy a NULL column.
* **Re-Typing:** Placing a King turns the column to "King Type." Placing an Ace turns it to "Ace Type." Traditional cards (2-Q) cannot be placed in a NULL column.

---

## 2. OPERATIONAL GAME MODES

| Mode Name | Pockets | `allUp` | Face-Down Count | Logic |
| --- | --- | --- | --- | --- |
| **Classic** | 1 | `true` | 0 | Full transparency; 1 pocket. |
| **Classic Double** | 2 | `true` | 0 | Full transparency; 2 pockets. |
| **Hidden** | 1 | `false` | 21 | Stepped hidden (0, 1, 2, 3, 4, 5, 6). |
| **Hidden Double** | 2 | `false` | 21 | Expert mode; max hidden + 2 pockets. |

---

## 3. THE TECHNICAL SCHEMA (JSON)

```json
{
  "metadata": {
    "id": "mode_difficulty_index",
    "mode": "classic|classic_double|hidden|hidden_double",
    "variant": "normal|ace|king",
    "pockets": 1|2,
    "allUp": true|false,
    "version": "2.0.0",
    "description": "Analysis of the strategic bottleneck."
  },
  "tableau": { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [] },
  "stock": [], "waste": [],
  "pocket1": "rankSuit"|null, "pocket2": "rankSuit"|null,
  "foundations": {
    "up": {"h":[],"d":[],"c":[],"s":[]},
    "down": {"h":[],"d":[],"c":[],"s":[]}
  },
  "columnState": {
    "types": ["king", "ace", "traditional", null], 
    "faceUpCounts": [1, 1, 1, 1, 1, 1, 1],
    "faceDownCounts": [0, 1, 2, 3, 4, 5, 6]
  },
  "analysis": { "progress": { "foundationCards": 0, "totalCards": 52, "percentage": 0.0 } },
  "validation": { "isValid": true, "validatedAt": "ISO-8601" }
}

```

---

## 4. THE COMPLETE EXECUTABLE TOOLKIT

### Script A: 120-Snapshot Library Generator

```python
import json, random, os, datetime

def generate_meridian_library(output_dir="library_v2"):
    os.makedirs(output_dir, exist_ok=True)
    modes = {
        "classic": {"p": 1, "up": True},
        "classic_double": {"p": 2, "up": True},
        "hidden": {"p": 1, "up": False},
        "hidden_double": {"p": 2, "up": False}
    }
    diffs = ["easy", "moderate", "hard"]
    
    for m_key, m_cfg in modes.items():
        for d in diffs:
            for i in range(1, 11):
                ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
                deck = [f"{r}{s}" for s in 'hdcs' for r in ranks]
                random.shuffle(deck)
                
                # Difficulty Weighting: Starter Cards (7s and 6s)
                starters = [c for c in deck if c.startswith('7') or c.startswith('6')]
                others = [c for c in deck if c not in starters]
                
                tableau = {str(k): [] for k in range(7)}
                for k in range(7):
                    for j in range(k + 1):
                        if d == "easy" and j == k and starters:
                            tableau[str(k)].append(starters.pop(0))
                        elif d == "hard" and j == 0 and starters:
                            tableau[str(k)].append(starters.pop(0))
                        else:
                            tableau[str(k)].append(others.pop(0))
                
                types = []
                for k in range(7):
                    if not tableau[str(k)]: types.append(None)
                    elif tableau[str(k)][0].startswith('K'): types.append("king")
                    elif tableau[str(k)][0].startswith('A'): types.append("ace")
                    else: types.append("traditional")
                
                rem = starters + others
                random.shuffle(rem)
                stock, waste = rem[:23], [rem[23]]
                
                snap = {
                    "metadata": {
                        "id": f"{m_key}_{d}_{i:02d}", "mode": m_key, "pockets": m_cfg['p'], 
                        "allUp": m_cfg['up'], "version": "2.0.0", "description": f"Initial {d} deal."
                    },
                    "tableau": tableau, "stock": stock, "waste": waste,
                    "pocket1": None, "pocket2": None if m_cfg['p'] == 2 else "N/A",
                    "foundations": {"up": {s: [] for s in 'hdcs'}, "down": {s: [] for s in 'hdcs'}},
                    "columnState": {
                        "types": types, 
                        "faceUpCounts": [len(tableau[str(k)]) if m_cfg['up'] else 1 for k in range(7)], 
                        "faceDownCounts": [0 if m_cfg['up'] else k for k in range(7)]
                    },
                    "analysis": {"progress": {"foundationCards": 0, "totalCards": 52, "percentage": 0.0}},
                    "validation": {"isValid": True, "validatedAt": datetime.datetime.utcnow().isoformat()}
                }
                with open(f"{output_dir}/{snap['metadata']['id']}.json", 'w') as f:
                    json.dump(snap, f, indent=2)

if __name__ == "__main__":
    generate_meridian_library()

```

### Script B: The Librarian (Validation & Reporting)

```python
def run_librarian_audit(json_path):
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Card Tracking
    cards = []
    for col in data['tableau'].values(): cards.extend(col)
    cards.extend(data['stock'] + data['waste'])
    for p in [data['pocket1'], data['pocket2']]:
        if p and p != "N/A": cards.append(p)
    for res in data['foundations'].values():
        for pile in res.values(): cards.extend(pile)
    
    unique_set = set(cards)
    is_valid = (len(unique_set) == 52 and len(cards) == 52)
    
    # Metadata.txt & Validation.txt Output
    with open(f"{data['metadata']['id']}_METADATA.txt", 'w') as f:
        f.write(f"ID: {data['metadata']['id']}\nTYPES: {data['columnState']['types']}\n")
    
    with open(f"{data['metadata']['id']}_VALIDATION.txt", 'w') as f:
        f.write(f"VALID: {is_valid}\nCOUNT: {len(cards)}\nUNIQUES: {len(unique_set)}")

```

---
