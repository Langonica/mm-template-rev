#!/usr/bin/env python3
"""
Debug script to verify solver correctness.

Tests specific scenarios to ensure move generation and application work.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import GameState, Card, MoveGenerator, MoveValidator, Solver, MoveType


def test_known_winnable():
    """Test with a trivially winnable game state."""
    print("=" * 60)
    print("TEST: Known Winnable Game")
    print("=" * 60)
    
    # Create a game where most cards are already on foundations
    state = GameState.create_new_game(seed=42)
    
    # Move many cards to foundations manually to create an easy win
    # This simulates a late-game state
    cards_to_move = []
    for col_idx in range(7):
        col = state.tableau[str(col_idx)]
        if col:
            # Move all but one card from each column
            while len(col) > 1:
                card = col.pop()
                cards_to_move.append(card)
    
    # Put these cards on foundations (distribute among suits)
    suits = ['h', 'd', 'c', 's']
    for i, card in enumerate(cards_to_move):
        suit = card.suit
        # Try UP foundation
        if card.rank == '7':
            state.foundations['up'][suit].append(card)
        # Try DOWN foundation  
        elif card.rank == '6':
            state.foundations['down'][suit].append(card)
        else:
            # Put back in tableau
            state.tableau[str(i % 7)].append(card)
    
    print(f"Foundation cards: {sum(len(p) for p in state.foundations['up'].values()) + sum(len(p) for p in state.foundations['down'].values())}")
    print(f"Tableau cards: {sum(len(col) for col in state.tableau.values())}")
    print(f"Stock: {len(state.stock)}, Waste: {len(state.waste)}")
    
    # Generate moves
    generator = MoveGenerator(state)
    moves = generator.generate_all_moves()
    print(f"\nLegal moves found: {len(moves)}")
    
    for move in moves[:10]:  # Show first 10
        print(f"  {move}")
    
    # Try to solve
    solver = Solver(max_nodes=5000, max_time_ms=5000)
    result = solver.solve(state)
    
    print(f"\nSolver result: {'WINNABLE' if result.winnable else 'NOT WINNABLE'}")
    print(f"  Nodes explored: {result.nodes_explored}")
    print(f"  Solution moves: {len(result.solution)}")
    
    return result.winnable


def test_move_generation():
    """Test that all move types are being generated."""
    print("\n" + "=" * 60)
    print("TEST: Move Generation Coverage")
    print("=" * 60)
    
    state = GameState.create_new_game(seed=123)
    generator = MoveGenerator(state)
    moves = generator.generate_all_moves()
    
    # Count by type
    by_type = {}
    for move in moves:
        t = move.move_type.value
        by_type[t] = by_type.get(t, 0) + 1
    
    print(f"Total moves: {len(moves)}")
    print("By type:")
    for move_type, count in sorted(by_type.items()):
        print(f"  {move_type}: {count}")
    
    # Check foundation moves exist
    foundation_moves = [m for m in moves if m.move_type == MoveType.TO_FOUNDATION]
    print(f"\nFoundation moves: {len(foundation_moves)}")
    if foundation_moves:
        print("  (Good - can move cards to foundations)")
    else:
        print("  (WARNING - no foundation moves found)")
    
    # Check tableau moves exist
    tableau_moves = [m for m in moves if m.move_type == MoveType.TO_TABLEAU]
    print(f"Tableau moves: {len(tableau_moves)}")
    
    return len(moves) > 0


def test_foundation_rules():
    """Test foundation placement rules."""
    print("\n" + "=" * 60)
    print("TEST: Foundation Rules")
    print("=" * 60)
    
    validator = MoveValidator()
    
    # Test UP foundation
    print("\nUP Foundation (7→K):")
    tests = [
        (Card('7', 'h'), 'up', [], True, "7 starts UP"),
        (Card('8', 'h'), 'up', [], False, "8 can't start UP"),
        (Card('6', 'h'), 'up', [], False, "6 can't start UP"),
        (Card('8', 'h'), 'up', [Card('7', 'h')], True, "8 on 7 in UP"),
        (Card('9', 'h'), 'up', [Card('7', 'h')], False, "9 can't skip on 7"),
        (Card('8', 'd'), 'up', [Card('7', 'h')], False, "wrong suit"),
    ]
    
    for card, ftype, pile, expected, desc in tests:
        result = validator.can_place_on_foundation(card, ftype, pile)
        status = "PASS" if result == expected else "FAIL"
        print(f"  [{status}] {desc}: {result}")
    
    # Test DOWN foundation
    print("\nDOWN Foundation (6→A):")
    tests = [
        (Card('6', 'h'), 'down', [], True, "6 starts DOWN"),
        (Card('7', 'h'), 'down', [], False, "7 can't start DOWN"),
        (Card('5', 'h'), 'down', [Card('6', 'h')], True, "5 on 6 in DOWN"),
    ]
    
    for card, ftype, pile, expected, desc in tests:
        result = validator.can_place_on_foundation(card, ftype, pile)
        status = "PASS" if result == expected else "FAIL"
        print(f"  [{status}] {desc}: {result}")


def test_sample_games(n=5):
    """Test solver on multiple random games."""
    print("\n" + "=" * 60)
    print(f"TEST: Sample {n} Random Games")
    print("=" * 60)
    
    winnable = 0
    not_winnable = 0
    
    for i in range(n):
        print(f"\nGame {i+1}:")
        state = GameState.create_new_game(seed=1000 + i)
        
        # Count initial legal moves
        generator = MoveGenerator(state)
        moves = generator.generate_all_moves()
        print(f"  Initial moves: {len(moves)}")
        
        # Solve with generous limits
        solver = Solver(max_nodes=10000, max_time_ms=10000)
        result = solver.solve(state)
        
        print(f"  Result: {'WINNABLE' if result.winnable else 'NOT WINNABLE'}")
        print(f"  Nodes: {result.nodes_explored}, Time: {result.solve_time_ms}ms")
        
        if result.winnable:
            winnable += 1
        else:
            not_winnable += 1
    
    print(f"\nSummary: {winnable} winnable, {not_winnable} not winnable")
    print(f"Winnability rate: {(winnable/n*100):.1f}%")
    
    return winnable / n if n > 0 else 0


def main():
    print("SNAPSHOT GENERATOR - DEBUG SUITE")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Foundation Rules", test_foundation_rules()))
    results.append(("Move Generation", test_move_generation()))
    results.append(("Known Winnable", test_known_winnable()))
    win_rate = test_sample_games(n=3)  # Test 3 games for quick check
    
    print("\n" + "=" * 60)
    print("DEBUG SUMMARY")
    print("=" * 60)
    print(f"Sample winnability rate: {win_rate*100:.1f}%")
    
    if win_rate < 0.1:
        print("\nWARNING: Very low winnability detected!")
        print("Possible issues:")
        print("- Move generation not finding all legal moves")
        print("- Move application corrupting state")
        print("- Win condition detection incorrect")
        print("- Solver limits too restrictive")
    elif win_rate > 0.5:
        print("\nOK: Winnability rate looks reasonable for random deals")
    else:
        print("\nCAUTION: Low but not critical winnability")
        print("This is expected for completely random deals")


if __name__ == '__main__':
    main()
