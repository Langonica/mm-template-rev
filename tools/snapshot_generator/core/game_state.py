"""
Game State Representation

Represents a complete state of a Meridian Solitaire game.
Compatible with the existing snapshot JSON schema.
"""

import json
import random
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Card:
    """Represents a playing card."""
    rank: str  # A, 2-10, J, Q, K
    suit: str  # h, d, c, s
    
    def __str__(self) -> str:
        return f"{self.rank}{self.suit}"
    
    def __hash__(self) -> int:
        return hash((self.rank, self.suit))
    
    @property
    def color(self) -> str:
        """Returns 'red' or 'black'."""
        return 'red' if self.suit in ('h', 'd') else 'black'
    
    @property
    def numeric_rank(self) -> int:
        """Returns numeric rank (A=1, 2-10=2-10, J=11, Q=12, K=13)."""
        mapping = {'A': 1, 'J': 11, 'Q': 12, 'K': 13}
        return mapping.get(self.rank, int(self.rank) if self.rank.isdigit() else 0)


@dataclass
class GameState:
    """
    Represents a complete game state.
    
    Attributes:
        metadata: Game metadata (mode, difficulty, etc.)
        tableau: 7 columns of cards (column_index -> list of Cards)
        stock: Draw pile cards
        waste: Face-up drawn cards
        pocket1: First pocket (or None)
        pocket2: Second pocket (or None, or "N/A" for single pocket modes)
        foundations: Foundation piles (up/down -> suit -> list of Cards)
        column_state: Column typing information
    """
    metadata: Dict
    tableau: Dict[str, List[Card]]
    stock: List[Card]
    waste: List[Card]
    pocket1: Optional[Card]
    pocket2: Optional[Card]
    foundations: Dict[str, Dict[str, List[Card]]]
    column_state: Dict
    
    @classmethod
    def create_new_game(
        cls,
        mode: str = 'classic',
        difficulty: str = 'easy',
        seed: Optional[int] = None
    ) -> 'GameState':
        """
        Creates a new randomized game state.
        
        Args:
            mode: 'classic', 'classic_double', 'hidden', 'hidden_double'
            difficulty: 'easy', 'moderate', 'hard'
            seed: Random seed for reproducibility
            
        Returns:
            New GameState instance
        """
        if seed is not None:
            random.seed(seed)
        
        # Create deck
        ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
        suits = ['h', 'd', 'c', 's']
        deck = [Card(r, s) for s in suits for r in ranks]
        random.shuffle(deck)
        
        # Mode configuration
        mode_config = {
            'classic': {'pockets': 1, 'all_up': True, 'face_down': 0},
            'classic_double': {'pockets': 2, 'all_up': True, 'face_down': 0},
            'hidden': {'pockets': 1, 'all_up': False, 'face_down': 21},
            'hidden_double': {'pockets': 2, 'all_up': False, 'face_down': 21}
        }[mode]
        
        # Deal to tableau (7 columns, 0-6 cards each)
        tableau = {str(i): [] for i in range(7)}
        for col_idx in range(7):
            for card_idx in range(col_idx + 1):
                tableau[str(col_idx)].append(deck.pop())
        
        # Determine column types based on bottom card
        types = []
        face_up_counts = []
        face_down_counts = []
        
        for col_idx in range(7):
            col = tableau[str(col_idx)]
            if not col:
                types.append(None)
            elif col[0].rank == 'K':
                types.append("king")
            elif col[0].rank == 'A':
                types.append("ace")
            else:
                types.append("traditional")
            
            if mode_config['all_up']:
                face_up_counts.append(len(col))
                face_down_counts.append(0)
            else:
                # Hidden mode: staircase pattern (0, 1, 2, 3, 4, 5, 6 face-down)
                face_down = col_idx
                face_up = len(col) - face_down
                face_up_counts.append(max(1, face_up))  # At least 1 face-up
                face_down_counts.append(face_down)
        
        # Remaining cards to stock (23 cards) and waste (1 card)
        stock = deck[:-1] if len(deck) > 1 else []
        waste = [deck[-1]] if deck else []
        
        # Pocket configuration
        pocket1 = None
        pocket2 = None if mode_config['pockets'] == 2 else "N/A"
        
        # Empty foundations
        foundations = {
            'up': {s: [] for s in 'hdcs'},
            'down': {s: [] for s in 'hdcs'}
        }
        
        metadata = {
            'id': f"{mode}_normal_{difficulty}_generated",
            'mode': mode,
            'variant': 'normal',
            'difficulty': difficulty,
            'pockets': mode_config['pockets'],
            'allUp': mode_config['all_up'],
            'version': '2.3.2',
            'description': f'Generated {difficulty} level',
            'seed': seed
        }
        
        column_state = {
            'types': types,
            'faceUpCounts': face_up_counts,
            'faceDownCounts': face_down_counts
        }
        
        return cls(
            metadata=metadata,
            tableau=tableau,
            stock=stock,
            waste=waste,
            pocket1=pocket1,
            pocket2=pocket2,
            foundations=foundations,
            column_state=column_state
        )
    
    def to_snapshot_dict(self) -> Dict:
        """Converts to snapshot JSON format."""
        return {
            'metadata': self.metadata,
            'tableau': {
                k: [str(c) for c in v] for k, v in self.tableau.items()
            },
            'stock': [str(c) for c in self.stock],
            'waste': [str(c) for c in self.waste],
            'pocket1': str(self.pocket1) if self.pocket1 else None,
            'pocket2': str(self.pocket2) if self.pocket2 and self.pocket2 != "N/A" else self.pocket2,
            'foundations': {
                'up': {k: [str(c) for c in v] for k, v in self.foundations['up'].items()},
                'down': {k: [str(c) for c in v] for k, v in self.foundations['down'].items()}
            },
            'columnState': self.column_state,
            'analysis': {
                'progress': {
                    'foundationCards': sum(
                        len(pile) for suit_piles in self.foundations.values()
                        for pile in suit_piles.values()
                    ),
                    'totalCards': 52,
                    'percentage': 0.0
                }
            },
            'validation': {
                'isValid': True,
                'validatedAt': datetime.utcnow().isoformat()
            }
        }
    
    def to_json(self) -> str:
        """Returns JSON string representation."""
        return json.dumps(self.to_snapshot_dict(), indent=2)
    
    def save(self, filepath: str) -> None:
        """Saves to JSON file."""
        with open(filepath, 'w') as f:
            f.write(self.to_json())
    
    def get_fingerprint(self) -> str:
        """
        Returns compact state fingerprint for deduplication.
        Format: "tableau_hash|stock_top|waste_top|foundations_count"
        """
        # Simple fingerprint - can be made more sophisticated
        tableau_str = '|'.join(
            ','.join(str(c) for c in self.tableau[str(i)])
            for i in range(7)
        )
        stock_top = str(self.stock[0]) if self.stock else 'empty'
        waste_top = str(self.waste[-1]) if self.waste else 'empty'
        foundation_count = sum(
            len(pile) for suit_piles in self.foundations.values()
            for pile in suit_piles.values()
        )
        return f"{hash(tableau_str)}|{stock_top}|{waste_top}|{foundation_count}"
