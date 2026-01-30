#!/usr/bin/env python3
"""
Snapshot Generator CLI

Command line interface for generating and validating Meridian Solitaire snapshots.

Usage:
    python cli.py --mode classic --difficulty easy --output ./staging/
    python cli.py --batch --easy 10 --moderate 10 --hard 10 --output ./staging/
    python cli.py --validate --input ../../src/data/snapshots/classic_normal_easy_01.json
"""

import argparse
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import GameState, Card, MoveGenerator, MoveValidator, DifficultyAnalyzer


def generate_single(args):
    """Generate a single snapshot."""
    print(f"Generating {args.mode} {args.difficulty} level...")
    
    # Create new game
    state = GameState.create_new_game(
        mode=args.mode,
        difficulty=args.difficulty,
        seed=args.seed
    )
    
    # Generate moves to test
    generator = MoveGenerator(state)
    moves = generator.generate_all_moves()
    
    print(f"  Initial legal moves: {len(moves)}")
    
    # Save to file
    output_path = os.path.join(args.output, f"{state.metadata['id']}.json")
    os.makedirs(args.output, exist_ok=True)
    state.save(output_path)
    
    print(f"  Saved: {output_path}")
    print(f"  Fingerprint: {state.get_fingerprint()}")
    
    return state


def validate_snapshot(args):
    """Validate an existing snapshot file."""
    import json
    
    print(f"Validating: {args.input}")
    
    try:
        with open(args.input, 'r') as f:
            data = json.load(f)
        
        # Basic validation
        required_keys = ['metadata', 'tableau', 'stock', 'waste', 'foundations', 'columnState']
        for key in required_keys:
            if key not in data:
                print(f"  ERROR: Missing key '{key}'")
                return False
        
        # Card count validation
        all_cards = []
        for col in data['tableau'].values():
            all_cards.extend(col)
        all_cards.extend(data['stock'])
        all_cards.extend(data['waste'])
        
        if data['pocket1'] and data['pocket1'] != "N/A":
            all_cards.append(data['pocket1'])
        if data['pocket2'] and data['pocket2'] != "N/A":
            all_cards.append(data['pocket2'])
        
        for foundation_type in ['up', 'down']:
            for suit in 'hdcs':
                all_cards.extend(data['foundations'][foundation_type][suit])
        
        unique_cards = set(all_cards)
        
        print(f"  Total cards: {len(all_cards)}")
        print(f"  Unique cards: {len(unique_cards)}")
        print(f"  Valid: {len(all_cards) == 52 and len(unique_cards) == 52}")
        
        # Check for winnable moves
        # TODO: Full solver integration
        
        return True
        
    except Exception as e:
        print(f"  ERROR: {e}")
        return False


def batch_generate(args):
    """Generate a batch of snapshots."""
    print(f"Batch generation:")
    print(f"  Easy: {args.easy}")
    print(f"  Moderate: {args.moderate}")
    print(f"  Hard: {args.hard}")
    print()
    
    total = args.easy + args.moderate + args.hard
    generated = []
    
    for difficulty, count in [('easy', args.easy), 
                               ('moderate', args.moderate), 
                               ('hard', args.hard)]:
        for i in range(count):
            print(f"Generating {difficulty} {i+1}/{count}...")
            
            # Simple generation (no solver yet)
            state = GameState.create_new_game(
                mode=args.mode,
                difficulty=difficulty,
                seed=args.seed_start + len(generated) if args.seed_start else None
            )
            
            # Update ID to include index
            state.metadata['id'] = f"{args.mode}_normal_{difficulty}_{i+1:02d}_generated"
            
            output_path = os.path.join(args.output, f"{state.metadata['id']}.json")
            os.makedirs(args.output, exist_ok=True)
            state.save(output_path)
            
            generated.append(state)
            print(f"  Saved: {output_path}")
    
    print(f"\nGenerated {len(generated)} snapshots in {args.output}")


def main():
    parser = argparse.ArgumentParser(
        description='Meridian Solitaire Snapshot Generator',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Generate single level:
    python cli.py --mode classic --difficulty easy --output ./staging/
  
  Generate batch:
    python cli.py --batch --easy 10 --moderate 10 --hard 10 --output ./staging/
  
  Validate existing:
    python cli.py --validate --input ../../src/data/snapshots/classic_normal_easy_01.json
        """
    )
    
    parser.add_argument('--mode', choices=['classic', 'classic_double', 'hidden', 'hidden_double'],
                        default='classic', help='Game mode')
    parser.add_argument('--difficulty', choices=['easy', 'moderate', 'hard'],
                        default='easy', help='Difficulty level')
    parser.add_argument('--output', default='./staging', help='Output directory')
    parser.add_argument('--seed', type=int, help='Random seed')
    parser.add_argument('--seed-start', type=int, default=1, help='Starting seed for batch')
    
    parser.add_argument('--batch', action='store_true', help='Generate batch')
    parser.add_argument('--easy', type=int, default=0, help='Number of easy levels')
    parser.add_argument('--moderate', type=int, default=0, help='Number of moderate levels')
    parser.add_argument('--hard', type=int, default=0, help='Number of hard levels')
    
    parser.add_argument('--validate', action='store_true', help='Validate existing snapshot')
    parser.add_argument('--input', help='Input file for validation')
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.validate and not args.input:
        parser.error('--input required when using --validate')
    
    if args.batch:
        if args.easy == 0 and args.moderate == 0 and args.hard == 0:
            parser.error('Batch mode requires at least one of: --easy, --moderate, --hard')
        batch_generate(args)
    elif args.validate:
        validate_snapshot(args)
    else:
        generate_single(args)


if __name__ == '__main__':
    main()
