#!/usr/bin/env python3
"""
BFS Solver for Meridian Solitaire

Implements breadth-first search to determine if a game state is winnable
and find the shortest solution path.
"""

import time
from typing import Dict, List, Optional, Tuple, Set
from collections import deque
from dataclasses import dataclass

from .game_state import GameState, Card
from .moves import Move, MoveType, MoveGenerator


@dataclass
class SolverResult:
    """Result from running the solver."""
    winnable: bool
    solution: List[Move]
    nodes_explored: int
    solve_time_ms: int
    dead_ends: int
    max_depth: int
    
    def __str__(self) -> str:
        status = "WINNABLE" if self.winnable else "NOT WINNABLE"
        return f"SolverResult({status}, moves={len(self.solution)}, nodes={self.nodes_explored})"


class Solver:
    """
    BFS solver for Meridian Solitaire.
    
    Uses breadth-first search to explore all possible game states
    from a starting position to determine if the game is winnable.
    """
    
    def __init__(self, max_nodes: int = 10000, max_time_ms: int = 5000):
        """
        Initialize solver.
        
        Args:
            max_nodes: Maximum states to explore before giving up
            max_time_ms: Maximum time to spend solving (milliseconds)
        """
        self.max_nodes = max_nodes
        self.max_time_ms = max_time_ms
    
    def solve(self, initial_state: GameState) -> SolverResult:
        """
        Determine if game is winnable and find solution.
        
        Args:
            initial_state: Starting game state
            
        Returns:
            SolverResult with winnability and metrics
        """
        start_time = time.time()
        
        # Check if already won
        if self._is_won(initial_state):
            return SolverResult(
                winnable=True,
                solution=[],
                nodes_explored=1,
                solve_time_ms=0,
                dead_ends=0,
                max_depth=0
            )
        
        # BFS setup
        # Queue contains: (state, path_to_state)
        queue = deque([(initial_state, [])])
        
        # Track visited states to avoid loops
        visited: Set[str] = {initial_state.get_fingerprint()}
        
        nodes_explored = 1
        dead_ends = 0
        max_depth = 0
        
        while queue:
            # Check time limit
            elapsed_ms = (time.time() - start_time) * 1000
            if elapsed_ms > self.max_time_ms:
                return SolverResult(
                    winnable=False,
                    solution=[],
                    nodes_explored=nodes_explored,
                    solve_time_ms=int(elapsed_ms),
                    dead_ends=dead_ends,
                    max_depth=max_depth
                )
            
            # Check node limit
            if nodes_explored >= self.max_nodes:
                return SolverResult(
                    winnable=False,
                    solution=[],
                    nodes_explored=nodes_explored,
                    solve_time_ms=int(elapsed_ms),
                    dead_ends=dead_ends,
                    max_depth=max_depth
                )
            
            current_state, path = queue.popleft()
            current_depth = len(path)
            max_depth = max(max_depth, current_depth)
            
            # Generate all legal moves
            generator = MoveGenerator(current_state)
            moves = generator.generate_all_moves()
            
            if not moves:
                dead_ends += 1
                continue
            
            # Try each move
            for move in moves:
                # Apply move to get new state
                new_state = self._apply_move(current_state, move)
                
                if new_state is None:
                    continue
                
                # Check if won
                if self._is_won(new_state):
                    solution = path + [move]
                    elapsed_ms = (time.time() - start_time) * 1000
                    return SolverResult(
                        winnable=True,
                        solution=solution,
                        nodes_explored=nodes_explored,
                        solve_time_ms=int(elapsed_ms),
                        dead_ends=dead_ends,
                        max_depth=max(max_depth, current_depth + 1)
                    )
                
                # Check if visited
                fingerprint = new_state.get_fingerprint()
                if fingerprint in visited:
                    continue
                
                visited.add(fingerprint)
                nodes_explored += 1
                
                # Add to queue
                queue.append((new_state, path + [move]))
        
        # Queue empty, no solution found
        elapsed_ms = (time.time() - start_time) * 1000
        return SolverResult(
            winnable=False,
            solution=[],
            nodes_explored=nodes_explored,
            solve_time_ms=int(elapsed_ms),
            dead_ends=dead_ends,
            max_depth=max_depth
        )
    
    def _is_won(self, state: GameState) -> bool:
        """
        Check if game is won (all cards on foundations).
        
        Args:
            state: Game state to check
            
        Returns:
            True if all 52 cards are on foundations
        """
        foundation_count = sum(
            len(pile) for suit_piles in state.foundations.values()
            for pile in suit_piles.values()
        )
        return foundation_count == 52
    
    def _apply_move(self, state: GameState, move: Move) -> Optional[GameState]:
        """
        Apply a move to create a new game state.
        
        Args:
            state: Current state
            move: Move to apply
            
        Returns:
            New GameState after move, or None if invalid
        """
        # Deep copy state
        new_state = self._copy_state(state)
        
        try:
            if move.move_type == MoveType.TO_FOUNDATION:
                self._apply_foundation_move(new_state, move)
            elif move.move_type == MoveType.TO_TABLEAU:
                self._apply_tableau_move(new_state, move)
            elif move.move_type == MoveType.TO_POCKET:
                self._apply_to_pocket_move(new_state, move)
            elif move.move_type == MoveType.FROM_POCKET:
                self._apply_from_pocket_move(new_state, move)
            elif move.move_type == MoveType.DRAW_STOCK:
                self._apply_draw_stock(new_state)
            elif move.move_type == MoveType.RECYCLE_WASTE:
                self._apply_recycle_waste(new_state)
            else:
                return None
            
            return new_state
        except Exception:
            return None
    
    def _copy_state(self, state: GameState) -> GameState:
        """Create a deep copy of game state."""
        # Simple deep copy - in production might want more efficient method
        import copy
        return copy.deepcopy(state)
    
    def _apply_foundation_move(self, state: GameState, move: Move) -> None:
        """Apply move to foundation."""
        card = move.cards[0]
        foundation_type = move.target['foundation_type']
        suit = move.target['suit']
        
        # Remove from source
        source_type = move.source['type']
        if source_type == 'tableau':
            col_idx = move.source['column']
            col = state.tableau[str(col_idx)]
            if col and col[-1] == card:
                col.pop()
                # Reveal new top card if face-down exists
                self._reveal_card_if_needed(state, col_idx)
        elif source_type == 'waste':
            if state.waste and state.waste[-1] == card:
                state.waste.pop()
        elif source_type == 'pocket':
            pocket_num = move.source['pocket_num']
            if pocket_num == 1 and state.pocket1 == card:
                state.pocket1 = None
            elif pocket_num == 2 and state.pocket2 == card:
                state.pocket2 = None
        
        # Add to foundation
        state.foundations[foundation_type][suit].append(card)
    
    def _apply_tableau_move(self, state: GameState, move: Move) -> None:
        """Apply move to tableau."""
        cards = move.cards
        target_col_idx = move.target['column']
        target_col = state.tableau[str(target_col_idx)]
        
        # Remove from source
        source_type = move.source['type']
        if source_type == 'tableau':
            source_col_idx = move.source['column']
            source_col = state.tableau[str(source_col_idx)]
            # Remove cards from source
            for _ in cards:
                if source_col:
                    source_col.pop()
            # Reveal new top card
            self._reveal_card_if_needed(state, source_col_idx)
        elif source_type == 'waste':
            if state.waste:
                state.waste.pop()
        elif source_type == 'pocket':
            pocket_num = move.source['pocket_num']
            if pocket_num == 1:
                state.pocket1 = None
            elif pocket_num == 2:
                state.pocket2 = None
        
        # Add to target
        target_col.extend(cards)
        
        # Update column type if target was empty
        if len(target_col) == len(cards):
            first_card = cards[0]
            if first_card.rank == 'K':
                state.column_state['types'][target_col_idx] = 'king'
            elif first_card.rank == 'A':
                state.column_state['types'][target_col_idx] = 'ace'
            else:
                state.column_state['types'][target_col_idx] = 'traditional'
    
    def _apply_to_pocket_move(self, state: GameState, move: Move) -> None:
        """Apply move to pocket."""
        card = move.cards[0]
        pocket_num = move.target['pocket_num']
        
        # Remove from waste
        if state.waste:
            state.waste.pop()
        
        # Add to pocket
        if pocket_num == 1:
            state.pocket1 = card
        elif pocket_num == 2:
            state.pocket2 = card
    
    def _apply_from_pocket_move(self, state: GameState, move: Move) -> None:
        """Apply move from pocket to tableau."""
        card = move.cards[0]
        pocket_num = move.source['pocket_num']
        target_col_idx = move.target['column']
        target_col = state.tableau[str(target_col_idx)]
        
        # Remove from pocket
        if pocket_num == 1 and state.pocket1 == card:
            state.pocket1 = None
        elif pocket_num == 2 and state.pocket2 == card:
            state.pocket2 = None
        
        # Add to tableau
        target_col.append(card)
        
        # Update column type if target was empty
        if len(target_col) == 1:
            if card.rank == 'K':
                state.column_state['types'][target_col_idx] = 'king'
            elif card.rank == 'A':
                state.column_state['types'][target_col_idx] = 'ace'
            else:
                state.column_state['types'][target_col_idx] = 'traditional'
    
    def _apply_draw_stock(self, state: GameState) -> None:
        """Apply stock draw move."""
        if state.stock:
            card = state.stock.pop(0)
            state.waste.append(card)
    
    def _apply_recycle_waste(self, state: GameState) -> None:
        """Apply waste recycle move."""
        if state.waste:
            # Move all waste cards back to stock (except top if needed)
            # In classic rules, waste goes back to stock in order
            cards = state.waste[:-1] if len(state.waste) > 1 else state.waste[:]
            state.waste = [state.waste[-1]] if state.waste else []
            state.stock = cards + state.stock
    
    def _reveal_card_if_needed(self, state: GameState, col_idx: int) -> None:
        """Reveal face-down card if present after removing top card."""
        col = state.tableau[str(col_idx)]
        face_up_count = state.column_state['faceUpCounts'][col_idx]
        face_down_count = state.column_state['faceDownCounts'][col_idx]
        
        if col and face_down_count > 0:
            # Reveal one more card
            state.column_state['faceUpCounts'][col_idx] = min(
                face_up_count + 1, len(col)
            )
            state.column_state['faceDownCounts'][col_idx] = max(
                0, face_down_count - 1
            )
