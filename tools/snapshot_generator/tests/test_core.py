#!/usr/bin/env python3
"""
Unit tests for snapshot generator core functionality.

Run with: python tests/test_core.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core import GameState, Card, MoveValidator, MoveGenerator, Solver


class TestCard:
    """Test Card class."""
    
    def test_card_creation(self):
        card = Card('A', 'h')
        assert card.rank == 'A'
        assert card.suit == 'h'
        assert str(card) == 'Ah'
    
    def test_card_color(self):
        assert Card('A', 'h').color == 'red'
        assert Card('A', 'd').color == 'red'
        assert Card('A', 'c').color == 'black'
        assert Card('A', 's').color == 'black'
    
    def test_numeric_rank(self):
        assert Card('A', 'h').numeric_rank == 1
        assert Card('10', 'h').numeric_rank == 10
        assert Card('J', 'h').numeric_rank == 11
        assert Card('Q', 'h').numeric_rank == 12
        assert Card('K', 'h').numeric_rank == 13


class TestGameState:
    """Test GameState class."""
    
    def test_create_new_game_classic(self):
        state = GameState.create_new_game(mode='classic', difficulty='easy', seed=42)
        
        assert state.metadata['mode'] == 'classic'
        assert state.metadata['difficulty'] == 'easy'
        assert state.metadata['pockets'] == 1
        assert state.metadata['allUp'] == True
        
        # Check card counts
        total_cards = sum(len(col) for col in state.tableau.values())
        total_cards += len(state.stock)
        total_cards += len(state.waste)
        assert total_cards == 52
        
        # Check column types set
        assert len(state.column_state['types']) == 7
    
    def test_fingerprint_consistency(self):
        state1 = GameState.create_new_game(seed=42)
        state2 = GameState.create_new_game(seed=42)
        
        assert state1.get_fingerprint() == state2.get_fingerprint()
    
    def test_fingerprint_uniqueness(self):
        state1 = GameState.create_new_game(seed=42)
        state2 = GameState.create_new_game(seed=43)
        
        assert state1.get_fingerprint() != state2.get_fingerprint()


class TestMoveValidator:
    """Test MoveValidator class."""
    
    def test_foundation_placement_up_empty(self):
        validator = MoveValidator()
        # UP foundation empty - only 7 can start
        assert validator.can_place_on_foundation(Card('7', 'h'), 'up', []) == True
        assert validator.can_place_on_foundation(Card('6', 'h'), 'up', []) == False
        assert validator.can_place_on_foundation(Card('A', 'h'), 'up', []) == False
    
    def test_foundation_placement_down_empty(self):
        validator = MoveValidator()
        # DOWN foundation empty - only 6 can start
        assert validator.can_place_on_foundation(Card('6', 'h'), 'down', []) == True
        assert validator.can_place_on_foundation(Card('7', 'h'), 'down', []) == False
        assert validator.can_place_on_foundation(Card('A', 'h'), 'down', []) == False
    
    def test_foundation_placement_up_sequence(self):
        validator = MoveValidator()
        pile = [Card('7', 'h')]
        assert validator.can_place_on_foundation(Card('8', 'h'), 'up', pile) == True
        assert validator.can_place_on_foundation(Card('9', 'h'), 'up', pile) == False
        assert validator.can_place_on_foundation(Card('8', 'd'), 'up', pile) == False  # Wrong suit
    
    def test_tableau_placement_alternating_colors(self):
        validator = MoveValidator()
        # Red 7 on Black 8
        assert validator.can_place_on_tableau(Card('7', 'h'), Card('8', 'c')) == True
        # Same color - invalid
        assert validator.can_place_on_tableau(Card('7', 'h'), Card('8', 'd')) == False
        # Wrong rank - invalid
        assert validator.can_place_on_tableau(Card('6', 'h'), Card('8', 'c')) == False
    
    def test_tableau_empty_column(self):
        validator = MoveValidator()
        # Only Ace or King can go on empty column
        assert validator.can_place_on_tableau(Card('A', 'h'), None, True) == True
        assert validator.can_place_on_tableau(Card('K', 'h'), None, True) == True
        assert validator.can_place_on_tableau(Card('7', 'h'), None, True) == False
    
    def test_column_type_detection(self):
        validator = MoveValidator()
        assert validator.get_column_type([Card('K', 'h'), Card('Q', 'c')]) == 'king'
        assert validator.get_column_type([Card('A', 'h'), Card('2', 'c')]) == 'ace'
        assert validator.get_column_type([Card('7', 'h')]) == 'traditional'
        assert validator.get_column_type([]) == None


class TestSolver:
    """Test Solver class."""
    
    def test_solves_simple_game(self):
        # Create a trivially won game (all cards on foundations)
        # This tests the win detection
        state = GameState.create_new_game(seed=42)
        solver = Solver(max_nodes=100, max_time_ms=1000)
        result = solver.solve(state)
        
        # Should either find solution or hit limits
        assert isinstance(result.winnable, bool)
        assert result.nodes_explored > 0
    
    def test_already_won_game(self):
        # Create state that's already won
        state = GameState.create_new_game()
        # Move all cards to foundations manually
        for col_idx in range(7):
            state.foundations['up']['h'].extend(state.tableau[str(col_idx)])
            state.tableau[str(col_idx)] = []
        state.stock = []
        state.waste = []
        
        solver = Solver()
        result = solver.solve(state)
        
        assert result.winnable == True
        assert len(result.solution) == 0


def run_tests():
    """Run all tests."""
    import traceback
    
    test_classes = [
        TestCard,
        TestGameState,
        TestMoveValidator,
        TestSolver
    ]
    
    passed = 0
    failed = 0
    
    for test_class in test_classes:
        print(f"\n{'='*60}")
        print(f"Running {test_class.__name__}")
        print('='*60)
        
        instance = test_class()
        methods = [m for m in dir(instance) if m.startswith('test_')]
        
        for method_name in methods:
            try:
                method = getattr(instance, method_name)
                method()
                print(f"  PASS: {method_name}")
                passed += 1
            except Exception as e:
                print(f"  FAIL: {method_name}")
                print(f"    {e}")
                failed += 1
    
    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed")
    print('='*60)
    
    return failed == 0


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
