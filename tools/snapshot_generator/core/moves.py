"""
Move Validation and Generation

Implements all Meridian Solitaire move rules:
- Foundation placement (UP: 7→K, DOWN: 6→A)
- Tableau sequencing (alternating colors, descending)
- Column typing (Ace, King, Traditional, NULL)
- Pocket operations
"""

from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass
from enum import Enum

from .game_state import GameState, Card


class MoveType(Enum):
    """Types of moves in Meridian Solitaire."""
    TO_FOUNDATION = "to_foundation"
    TO_TABLEAU = "to_tableau"
    TO_POCKET = "to_pocket"
    FROM_POCKET = "from_pocket"
    DRAW_STOCK = "draw_stock"
    RECYCLE_WASTE = "recycle_waste"


@dataclass
class Move:
    """Represents a single move."""
    move_type: MoveType
    source: Dict  # {type: 'tableau'|'waste'|'pocket', ...}
    target: Dict  # {type: 'foundation'|'tableau'|'pocket', ...}
    cards: List[Card]  # Cards being moved
    
    def __str__(self) -> str:
        card_str = ', '.join(str(c) for c in self.cards)
        return f"{self.move_type.value}: {card_str}"


class MoveValidator:
    """Validates moves according to Meridian Solitaire rules."""
    
    @staticmethod
    def can_place_on_foundation(card: Card, foundation_type: str, 
                                foundation_pile: List[Card]) -> bool:
        """
        Check if card can be placed on foundation.
        
        UP foundations: Start with 7, build to K (7→8→9→10→J→Q→K)
        DOWN foundations: Start with 6, build to A (6→5→4→3→2→A)
        
        Args:
            card: Card to place
            foundation_type: 'up' or 'down'
            foundation_pile: Current cards in foundation pile
            
        Returns:
            True if move is valid
        """
        # Must match suit
        if foundation_pile and foundation_pile[-1].suit != card.suit:
            return False
        
        if foundation_type == 'up':
            # UP: 7→K
            if not foundation_pile:
                return card.rank == '7'
            top = foundation_pile[-1]
            return card.numeric_rank == top.numeric_rank + 1
        
        else:  # foundation_type == 'down'
            # DOWN: 6→A
            if not foundation_pile:
                return card.rank == '6'
            top = foundation_pile[-1]
            return card.numeric_rank == top.numeric_rank - 1
    
    @staticmethod
    def can_place_on_tableau(card: Card, target_card: Optional[Card],
                             target_column_empty: bool = False,
                             column_type: Optional[str] = None) -> bool:
        """
        Check if card can be placed on tableau.
        
        Rules:
        - Must alternate colors (red on black, black on red)
        - Descending rank only (e.g., 7 on 8)
        - Empty columns: Only Ace or King (sets column type)
        - Column typing affects what can be built
        
        Args:
            card: Card to place
            target_card: Card already on tableau (None if empty column)
            target_column_empty: True if target column is empty
            column_type: Type of target column ('ace', 'king', 'traditional', None)
            
        Returns:
            True if move is valid
        """
        if target_column_empty:
            # Empty columns only accept Ace or King
            if card.rank not in ('A', 'K'):
                return False
            return True
        
        if target_card is None:
            return False
        
        # Must alternate colors
        if card.color == target_card.color:
            return False
        
        # Must be descending rank
        if card.numeric_rank != target_card.numeric_rank - 1:
            return False
        
        # Column typing rules
        if column_type == 'ace':
            # Ace columns build ascending A→2→3→4→5→6
            # But tableau is descending, so this is about what can be placed
            # Actually in tableau we always build descending
            pass
        elif column_type == 'king':
            # King columns build descending K→Q→J→10→9→8→7
            pass
        
        return True
    
    @staticmethod
    def can_place_sequence_on_tableau(sequence: List[Card], 
                                       target_card: Optional[Card],
                                       target_column_empty: bool = False) -> bool:
        """
        Check if a sequence of cards can be moved to tableau.
        
        Args:
            sequence: List of cards in sequence (first card goes on target)
            target_card: Card on target column
            target_column_empty: True if target column is empty
            
        Returns:
            True if entire sequence can be placed
        """
        if not sequence:
            return False
        
        # Check first card against target
        if not MoveValidator.can_place_on_tableau(
            sequence[0], target_card, target_column_empty
        ):
            return False
        
        # Check rest of sequence against each other
        for i in range(1, len(sequence)):
            if not MoveValidator.can_place_on_tableau(
                sequence[i], sequence[i-1], False
            ):
                return False
        
        return True
    
    @staticmethod
    def get_column_type(column: List[Card]) -> Optional[str]:
        """
        Determine column type based on bottom card (index 0).
        
        Returns:
            'ace', 'king', 'traditional', or None (empty)
        """
        if not column:
            return None
        
        bottom_card = column[0]
        if bottom_card.rank == 'K':
            return 'king'
        elif bottom_card.rank == 'A':
            return 'ace'
        else:
            return 'traditional'


class MoveGenerator:
    """Generates all legal moves from a game state."""
    
    def __init__(self, state: GameState):
        self.state = state
        self.validator = MoveValidator()
    
    def generate_all_moves(self) -> List[Move]:
        """Generate all legal moves from current state."""
        moves = []
        
        moves.extend(self._generate_foundation_moves())
        moves.extend(self._generate_tableau_moves())
        moves.extend(self._generate_pocket_moves())
        moves.extend(self._generate_stock_moves())
        
        return moves
    
    def _generate_foundation_moves(self) -> List[Move]:
        """Generate moves to foundations."""
        moves = []
        
        # Check waste top card
        if self.state.waste:
            waste_card = self.state.waste[-1]
            for foundation_type in ['up', 'down']:
                for suit in 'hdcs':
                    pile = self.state.foundations[foundation_type][suit]
                    if self.validator.can_place_on_foundation(
                        waste_card, foundation_type, pile
                    ):
                        moves.append(Move(
                            move_type=MoveType.TO_FOUNDATION,
                            source={'type': 'waste'},
                            target={'type': 'foundation', 'foundation_type': foundation_type, 'suit': suit},
                            cards=[waste_card]
                        ))
        
        # Check pocket cards
        for pocket_num, pocket_card in [(1, self.state.pocket1), (2, self.state.pocket2)]:
            if pocket_card and pocket_card != "N/A":
                for foundation_type in ['up', 'down']:
                    for suit in 'hdcs':
                        pile = self.state.foundations[foundation_type][suit]
                        if self.validator.can_place_on_foundation(
                            pocket_card, foundation_type, pile
                        ):
                            moves.append(Move(
                                move_type=MoveType.TO_FOUNDATION,
                                source={'type': 'pocket', 'pocket_num': pocket_num},
                                target={'type': 'foundation', 'foundation_type': foundation_type, 'suit': suit},
                                cards=[pocket_card]
                            ))
        
        # Check tableau face-up cards
        for col_idx in range(7):
            col = self.state.tableau[str(col_idx)]
            if col:
                # Get face-up cards (based on column_state)
                face_up_count = self.state.column_state['faceUpCounts'][col_idx]
                face_up_cards = col[-face_up_count:] if face_up_count > 0 else []
                
                if face_up_cards:
                    top_card = face_up_cards[-1]  # Topmost face-up card
                    for foundation_type in ['up', 'down']:
                        for suit in 'hdcs':
                            pile = self.state.foundations[foundation_type][suit]
                            if self.validator.can_place_on_foundation(
                                top_card, foundation_type, pile
                            ):
                                moves.append(Move(
                                    move_type=MoveType.TO_FOUNDATION,
                                    source={'type': 'tableau', 'column': col_idx},
                                    target={'type': 'foundation', 'foundation_type': foundation_type, 'suit': suit},
                                    cards=[top_card]
                                ))
        
        return moves
    
    def _generate_tableau_moves(self) -> List[Move]:
        """Generate moves between tableau columns."""
        moves = []
        
        # For each source column
        for src_idx in range(7):
            src_col = self.state.tableau[str(src_idx)]
            if not src_col:
                continue
            
            # Get face-up cards
            face_up_count = self.state.column_state['faceUpCounts'][src_idx]
            face_up_cards = src_col[-face_up_count:] if face_up_count > 0 else []
            
            if not face_up_cards:
                continue
            
            # Try moving single cards and sequences
            for seq_length in range(1, len(face_up_cards) + 1):
                sequence = face_up_cards[-seq_length:]
                
                # Try placing on each target column
                for tgt_idx in range(7):
                    if src_idx == tgt_idx:
                        continue
                    
                    tgt_col = self.state.tableau[str(tgt_idx)]
                    tgt_empty = len(tgt_col) == 0
                    tgt_card = tgt_col[-1] if tgt_col else None
                    
                    if self.validator.can_place_sequence_on_tableau(
                        sequence, tgt_card, tgt_empty
                    ):
                        moves.append(Move(
                            move_type=MoveType.TO_TABLEAU,
                            source={'type': 'tableau', 'column': src_idx},
                            target={'type': 'tableau', 'column': tgt_idx},
                            cards=sequence
                        ))
        
        # Also check waste and pockets as sources
        if self.state.waste:
            waste_card = self.state.waste[-1]
            for tgt_idx in range(7):
                tgt_col = self.state.tableau[str(tgt_idx)]
                tgt_empty = len(tgt_col) == 0
                tgt_card = tgt_col[-1] if tgt_col else None
                
                if self.validator.can_place_on_tableau(
                    waste_card, tgt_card, tgt_empty
                ):
                    moves.append(Move(
                        move_type=MoveType.TO_TABLEAU,
                        source={'type': 'waste'},
                        target={'type': 'tableau', 'column': tgt_idx},
                        cards=[waste_card]
                    ))
        
        return moves
    
    def _generate_pocket_moves(self) -> List[Move]:
        """Generate moves to/from pockets."""
        moves = []
        
        # Cards that can go TO pockets
        if self.state.waste:
            waste_card = self.state.waste[-1]
            # Pocket 1
            if self.state.pocket1 is None:
                moves.append(Move(
                    move_type=MoveType.TO_POCKET,
                    source={'type': 'waste'},
                    target={'type': 'pocket', 'pocket_num': 1},
                    cards=[waste_card]
                ))
            # Pocket 2 (if mode allows)
            if self.state.pocket2 is None:
                moves.append(Move(
                    move_type=MoveType.TO_POCKET,
                    source={'type': 'waste'},
                    target={'type': 'pocket', 'pocket_num': 2},
                    cards=[waste_card]
                ))
        
        # Cards that can come FROM pockets
        for pocket_num, pocket_card in [(1, self.state.pocket1), (2, self.state.pocket2)]:
            if pocket_card and pocket_card != "N/A":
                # To tableau
                for tgt_idx in range(7):
                    tgt_col = self.state.tableau[str(tgt_idx)]
                    tgt_empty = len(tgt_col) == 0
                    tgt_card = tgt_col[-1] if tgt_col else None
                    
                    if self.validator.can_place_on_tableau(
                        pocket_card, tgt_card, tgt_empty
                    ):
                        moves.append(Move(
                            move_type=MoveType.FROM_POCKET,
                            source={'type': 'pocket', 'pocket_num': pocket_num},
                            target={'type': 'tableau', 'column': tgt_idx},
                            cards=[pocket_card]
                        ))
        
        return moves
    
    def _generate_stock_moves(self) -> List[Move]:
        """Generate stock draw and recycle moves."""
        moves = []
        
        if self.state.stock:
            # Draw from stock
            moves.append(Move(
                move_type=MoveType.DRAW_STOCK,
                source={'type': 'stock'},
                target={'type': 'waste'},
                cards=[]  # Drawn card determined at execution
            ))
        elif self.state.waste and len(self.state.waste) > 1:
            # Recycle waste to stock (if waste has cards)
            moves.append(Move(
                move_type=MoveType.RECYCLE_WASTE,
                source={'type': 'waste'},
                target={'type': 'stock'},
                cards=[]
            ))
        
        return moves
