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
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core import GameState, Card, MoveGenerator, MoveValidator, DifficultyAnalyzer, Solver


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


def solve_snapshot(args):
    """Run solver on a snapshot."""
    import json
    
    print(f"Solving: {args.input}")
    print(f"Max nodes: {args.max_nodes}, Max time: {args.max_time}ms")
    print()
    
    try:
        # Load state from file
        with open(args.input, 'r') as f:
            data = json.load(f)
        
        # Reconstruct GameState from JSON
        state = GameState.create_new_game(mode='classic')  # Placeholder
        # TODO: Implement from_snapshot_dict() method
        
        print("ERROR: Loading from JSON not yet implemented")
        print("Use: python cli.py --generate-and-solve instead")
        
    except Exception as e:
        print(f"ERROR: {e}")


def generate_and_solve(args):
    """Generate a level and immediately solve it."""
    print(f"Generating and solving {args.mode} {args.difficulty} level...")
    print(f"Solver limits: {args.max_nodes} nodes, {args.max_time}ms")
    print()
    
    # Create new game
    state = GameState.create_new_game(
        mode=args.mode,
        difficulty=args.difficulty,
        seed=args.seed
    )
    
    # Run solver
    solver = Solver(max_nodes=args.max_nodes, max_time_ms=args.max_time)
    result = solver.solve(state)
    
    print(f"Result: {'WINNABLE' if result.winnable else 'NOT WINNABLE'}")
    print(f"  Solution moves: {len(result.solution)}")
    print(f"  Nodes explored: {result.nodes_explored}")
    print(f"  Solve time: {result.solve_time_ms}ms")
    print(f"  Dead ends: {result.dead_ends}")
    print(f"  Max depth: {result.max_depth}")
    
    if result.winnable:
        # Analyze difficulty
        analyzer = DifficultyAnalyzer()
        metrics = analyzer.analyze_solution(
            initial_state=state,
            solution_moves=len(result.solution),
            nodes_explored=result.nodes_explored,
            dead_ends=result.dead_ends,
            solve_time_ms=result.solve_time_ms,
            solution_path=result.solution
        )
        
        print(f"\nDifficulty Analysis:")
        print(f"  Score: {metrics.difficulty_score:.1f}")
        print(f"  Tier: {metrics.recommended_tier.upper()}")
        print(f"  Starter accessibility: {metrics.starter_accessibility} moves")
        print(f"  Branching factor: {metrics.branching_factor:.2f}")
        
        # Save if winnable
        if args.output:
            output_path = os.path.join(args.output, f"{state.metadata['id']}_verified.json")
            os.makedirs(args.output, exist_ok=True)
            
            # Add validation info to metadata
            state.metadata['validation']['isWinnable'] = True
            state.metadata['validation']['solverMetrics'] = {
                'solutionMoves': len(result.solution),
                'nodesExplored': result.nodes_explored,
                'solveTimeMs': result.solve_time_ms,
                'deadEnds': result.dead_ends,
                'maxDepth': result.max_depth,
                'difficultyScore': metrics.difficulty_score,
                'recommendedTier': metrics.recommended_tier
            }
            
            state.save(output_path)
            print(f"\nSaved verified snapshot: {output_path}")
    
    return result.winnable


def batch_generate(args):
    """Generate a batch of winnable snapshots with discard loop."""
    print(f"Batch generation with winnability verification:")
    print(f"  Mode: {args.mode}")
    print(f"  Easy: {args.easy}")
    print(f"  Moderate: {args.moderate}")
    print(f"  Hard: {args.hard}")
    print(f"  Max attempts per level: {args.max_attempts}")
    print(f"  Solver: {args.max_nodes} nodes, {args.max_time}ms")
    print()
    
    os.makedirs(args.output, exist_ok=True)
    total_requested = args.easy + args.moderate + args.hard
    total_generated = 0
    total_attempts = 0
    discarded = 0
    
    results_by_tier = {'easy': [], 'moderate': [], 'hard': []}
    
    for difficulty, count in [('easy', args.easy), 
                               ('moderate', args.moderate), 
                               ('hard', args.hard)]:
        if count == 0:
            continue
            
        print(f"\n{'='*60}")
        print(f"Generating {count} {difficulty.upper()} levels")
        print('='*60)
        
        for i in range(count):
            level_num = i + 1
            print(f"\n[{difficulty} {level_num}/{count}] Generating...")
            
            level_attempts = 0
            found = False
            
            while level_attempts < args.max_attempts and not found:
                total_attempts += 1
                level_attempts += 1
                
                # Generate new deal
                seed = args.seed_start + total_attempts if args.seed_start else None
                state = GameState.create_new_game(
                    mode=args.mode,
                    difficulty=difficulty,
                    seed=seed
                )
                
                # Verify winnability
                solver = Solver(max_nodes=args.max_nodes, max_time_ms=args.max_time)
                result = solver.solve(state)
                
                if result.winnable:
                    # Success! Save the verified snapshot
                    found = True
                    total_generated += 1
                    
                    # Update metadata
                    state.metadata['id'] = f"{args.mode}_normal_{difficulty}_{level_num:02d}_verified"
                    state.metadata['validation']['isWinnable'] = True
                    state.metadata['validation']['solverMetrics'] = {
                        'solutionMoves': len(result.solution),
                        'nodesExplored': result.nodes_explored,
                        'solveTimeMs': result.solve_time_ms,
                        'deadEnds': result.dead_ends,
                        'maxDepth': result.max_depth
                    }
                    
                    # Analyze difficulty
                    analyzer = DifficultyAnalyzer()
                    metrics = analyzer.analyze_solution(
                        initial_state=state,
                        solution_moves=len(result.solution),
                        nodes_explored=result.nodes_explored,
                        dead_ends=result.dead_ends,
                        solve_time_ms=result.solve_time_ms,
                        solution_path=result.solution
                    )
                    
                    state.metadata['validation']['difficultyMetrics'] = {
                        'difficultyScore': metrics.difficulty_score,
                        'recommendedTier': metrics.recommended_tier,
                        'branchingFactor': metrics.branching_factor,
                        'starterAccessibility': metrics.starter_accessibility
                    }
                    
                    # Save file
                    output_path = os.path.join(args.output, f"{state.metadata['id']}.json")
                    state.save(output_path)
                    
                    results_by_tier[difficulty].append({
                        'id': state.metadata['id'],
                        'score': metrics.difficulty_score,
                        'moves': len(result.solution),
                        'attempts': level_attempts
                    })
                    
                    print(f"  [SUCCESS] Saved: {state.metadata['id']}.json")
                    print(f"    Score: {metrics.difficulty_score:.1f} ({metrics.recommended_tier})")
                    print(f"    Solution: {len(result.solution)} moves")
                    print(f"    Attempts: {level_attempts}")
                    
                else:
                    discarded += 1
                    if level_attempts % 10 == 0:
                        print(f"  ...attempt {level_attempts}, discarded {discarded} so far")
            
            if not found:
                print(f"  [FAILED] Could not generate winnable level after {args.max_attempts} attempts")
    
    # Generate summary report
    print(f"\n{'='*60}")
    print("BATCH GENERATION SUMMARY")
    print('='*60)
    print(f"Total requested: {total_requested}")
    print(f"Total generated: {total_generated}")
    print(f"Total attempts: {total_attempts}")
    print(f"Discarded (unwinnable): {discarded}")
    print(f"Success rate: {(total_generated/total_attempts*100):.1f}%" if total_attempts > 0 else "N/A")
    print()
    
    for tier in ['easy', 'moderate', 'hard']:
        if results_by_tier[tier]:
            scores = [r['score'] for r in results_by_tier[tier]]
            avg_score = sum(scores) / len(scores)
            print(f"{tier.upper()}: {len(results_by_tier[tier])} levels, avg score: {avg_score:.1f}")
    
    # Save report
    if args.report:
        report_path = os.path.join(args.output, f"batch_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md")
        generate_batch_report(results_by_tier, total_attempts, discarded, report_path)
        print(f"\nReport saved: {report_path}")
    
    print(f"\nOutput directory: {args.output}")


def generate_batch_report(results_by_tier, total_attempts, discarded, report_path):
    """Generate a markdown report for the batch."""
    from datetime import datetime
    
    lines = [
        "# Batch Generation Report",
        "",
        f"**Generated:** {datetime.now().isoformat()}",
        f"**Total Attempts:** {total_attempts}",
        f"**Discarded (Unwinnable):** {discarded}",
        "",
        "## Summary by Tier",
        ""
    ]
    
    for tier in ['easy', 'moderate', 'hard']:
        if results_by_tier[tier]:
            results = results_by_tier[tier]
            scores = [r['score'] for r in results]
            moves = [r['moves'] for r in results]
            attempts = [r['attempts'] for r in results]
            
            lines.extend([
                f"### {tier.upper()}",
                "",
                f"- **Count:** {len(results)}",
                f"- **Avg Difficulty Score:** {sum(scores)/len(scores):.1f}",
                f"- **Score Range:** {min(scores):.1f} - {max(scores):.1f}",
                f"- **Avg Solution Moves:** {sum(moves)/len(moves):.0f}",
                f"- **Avg Attempts:** {sum(attempts)/len(attempts):.1f}",
                "",
                "| Level | Score | Moves | Attempts |",
                "|-------|-------|-------|----------|"
            ])
            
            for r in sorted(results, key=lambda x: x['id']):
                lines.append(f"| {r['id']} | {r['score']:.1f} | {r['moves']} | {r['attempts']} |")
            
            lines.append("")
    
    with open(report_path, 'w') as f:
        f.write('\n'.join(lines))


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
    parser.add_argument('--max-attempts', type=int, default=100, 
                        help='Max attempts per level before giving up')
    parser.add_argument('--report', action='store_true', 
                        help='Generate markdown report for batch')
    
    parser.add_argument('--validate', action='store_true', help='Validate existing snapshot')
    parser.add_argument('--input', help='Input file for validation')
    
    parser.add_argument('--solve', action='store_true', help='Solve existing snapshot')
    parser.add_argument('--max-nodes', type=int, default=10000, help='Max solver nodes')
    parser.add_argument('--max-time', type=int, default=5000, help='Max solver time (ms)')
    
    parser.add_argument('--generate-and-solve', action='store_true', 
                        help='Generate level and solve it')
    
    args = parser.parse_args()
    
    # Validate arguments
    if args.validate and not args.input:
        parser.error('--input required when using --validate')
    
    if args.solve and not args.input:
        parser.error('--input required when using --solve')
    
    if args.batch:
        if args.easy == 0 and args.moderate == 0 and args.hard == 0:
            parser.error('Batch mode requires at least one of: --easy, --moderate, --hard')
        batch_generate(args)
    elif args.validate:
        validate_snapshot(args)
    elif args.solve:
        solve_snapshot(args)
    elif args.generate_and_solve:
        generate_and_solve(args)
    else:
        generate_single(args)


if __name__ == '__main__':
    main()
