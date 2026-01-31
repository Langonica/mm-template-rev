#!/usr/bin/env python3
"""
Test Data Analyzer v2.0

Analyzes aggregated telemetry data from debug exports.
Complements analyze_game_logs.py by providing career-level statistics.

Usage:
    python3 tools/analyze_test_data.py exports/*.json
"""

import json
import sys
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime


def load_export(filepath):
    """Load debug export file."""
    with open(filepath) as f:
        return json.load(f)


def extract_telemetry(export_data):
    """Extract telemetry from export."""
    return export_data.get('data', {}).get('meridian-gs-telemetry', {})


def extract_stats(export_data):
    """Extract career statistics."""
    return export_data.get('data', {}).get('meridian_solitaire_stats', {})


def extract_logs(export_data):
    """Extract detailed game logs if present."""
    return export_data.get('data', {}).get('meridian_game_logs', [])


def analyze_telemetry(telemetry):
    """Analyze telemetry data."""
    games = telemetry.get('games', [])
    if not games:
        return None
    
    results = {
        'total_games': len(games),
        'wins': 0,
        'losses': 0,
        'forfeits': 0,
        'by_mode': defaultdict(lambda: {'games': 0, 'wins': 0, 'moves': []}),
        'move_counts': {'won': [], 'lost': []},
        'solver_results': Counter(),
    }
    
    for game in games:
        outcome = game.get('outcome', 'unknown')
        mode = game.get('mode', 'unknown')
        moves = game.get('moves', 0)
        solver_result = game.get('solverResult', 'none')
        
        # Count outcomes
        if outcome == 'won':
            results['wins'] += 1
            results['move_counts']['won'].append(moves)
        elif outcome == 'lost':
            results['losses'] += 1
            results['move_counts']['lost'].append(moves)
        elif outcome == 'forfeit':
            results['forfeits'] += 1
            results['move_counts']['lost'].append(moves)
        
        # By mode
        results['by_mode'][mode]['games'] += 1
        if outcome == 'won':
            results['by_mode'][mode]['wins'] += 1
        results['by_mode'][mode]['moves'].append(moves)
        
        # Solver results
        results['solver_results'][solver_result] += 1
    
    # Calculate averages
    if results['move_counts']['won']:
        results['avg_moves_won'] = sum(results['move_counts']['won']) / len(results['move_counts']['won'])
    if results['move_counts']['lost']:
        results['avg_moves_lost'] = sum(results['move_counts']['lost']) / len(results['move_counts']['lost'])
    
    return results


def analyze_career_stats(stats):
    """Analyze career statistics."""
    if not stats:
        return None
    
    return {
        'total_games': stats.get('totalGames', 0),
        'wins': stats.get('wins', 0),
        'losses': stats.get('losses', 0),
        'forfeits': stats.get('forfeits', 0),
        'best_streak': stats.get('bestStreak', 0),
        'best_moves': stats.get('bestWinMoves'),
        'best_time': stats.get('bestWinTime'),
        'perfect_games': stats.get('perfectGames', 0),
        'total_moves': stats.get('totalMoves', 0),
        'by_mode': stats.get('byMode', {})
    }


def print_analysis(telemetry_analysis, career_stats, export_meta):
    """Print formatted analysis."""
    print("="*70)
    print(f"TEST DATA ANALYSIS")
    print(f"Export: {export_meta.get('exportedAt', 'Unknown')}")
    print(f"Version: {export_meta.get('appVersion', 'Unknown')}")
    print("="*70)
    
    # Telemetry (session data)
    if telemetry_analysis:
        print(f"\n📊 Session Telemetry:")
        print(f"  Games: {telemetry_analysis['total_games']}")
        print(f"  Wins: {telemetry_analysis['wins']} ({telemetry_analysis['wins']/telemetry_analysis['total_games']*100:.1f}%)")
        print(f"  Losses: {telemetry_analysis['losses']}")
        if telemetry_analysis['forfeits']:
            print(f"  Forfeits: {telemetry_analysis['forfeits']}")
        
        if 'avg_moves_won' in telemetry_analysis:
            print(f"\n  Avg Moves (Win): {telemetry_analysis['avg_moves_won']:.1f}")
        if 'avg_moves_lost' in telemetry_analysis:
            print(f"  Avg Moves (Loss): {telemetry_analysis['avg_moves_lost']:.1f}")
        
        print(f"\n🎮 By Mode:")
        for mode, data in sorted(telemetry_analysis['by_mode'].items()):
            win_rate = data['wins'] / data['games'] * 100 if data['games'] > 0 else 0
            avg_moves = sum(data['moves']) / len(data['moves']) if data['moves'] else 0
            print(f"  {mode:20s} {data['games']:3d} games  {win_rate:5.1f}% wins  {avg_moves:5.1f} avg moves")
    
    # Career stats
    if career_stats:
        print(f"\n🏆 Career Statistics:")
        print(f"  Total Games: {career_stats['total_games']}")
        print(f"  Win Rate: {career_stats['wins']/career_stats['total_games']*100:.1f}%" if career_stats['total_games'] > 0 else "  N/A")
        print(f"  Best Streak: {career_stats['best_streak']}")
        print(f"  Best Moves: {career_stats['best_moves'] or 'N/A'}")
        print(f"  Perfect Games: {career_stats['perfect_games']}")
        
        if career_stats['by_mode']:
            print(f"\n  By Mode (Career):")
            for mode, mode_stats in sorted(career_stats['by_mode'].items()):
                games = mode_stats.get('games', 0)
                wins = mode_stats.get('wins', 0)
                if games > 0:
                    print(f"    {mode:18s} {games:3d} games  {wins/games*100:5.1f}% wins")
    
    print("\n" + "="*70)


def print_aggregate(all_telemetry, all_career):
    """Print aggregate across all files."""
    print("\n" + "="*70)
    print("AGGREGATE ACROSS ALL FILES")
    print("="*70)
    
    total_games = sum(t['total_games'] for t in all_telemetry if t)
    total_wins = sum(t['wins'] for t in all_telemetry if t)
    total_losses = sum(t['losses'] for t in all_telemetry if t)
    
    print(f"\n📈 Combined:")
    print(f"  Total Games: {total_games}")
    print(f"  Wins: {total_wins} ({total_wins/total_games*100:.1f}%)")
    print(f"  Losses: {total_losses} ({total_losses/total_games*100:.1f}%)")
    
    # Combined by mode
    by_mode = defaultdict(lambda: {'games': 0, 'wins': 0, 'moves': []})
    for t in all_telemetry:
        if not t:
            continue
        for mode, data in t['by_mode'].items():
            by_mode[mode]['games'] += data['games']
            by_mode[mode]['wins'] += data['wins']
            by_mode[mode]['moves'].extend(data['moves'])
    
    if by_mode:
        print(f"\n🎮 By Mode (Aggregate):")
        for mode, data in sorted(by_mode.items()):
            win_rate = data['wins'] / data['games'] * 100
            avg_moves = sum(data['moves']) / len(data['moves']) if data['moves'] else 0
            print(f"  {mode:20s} {data['games']:3d} games  {win_rate:5.1f}% wins  {avg_moves:5.1f} avg")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nUsage: python3 tools/analyze_test_data.py <export_file(s)>")
        sys.exit(1)
    
    all_telemetry = []
    all_career = []
    
    for filepath in sys.argv[1:]:
        path = Path(filepath)
        if not path.exists():
            print(f"⚠️  File not found: {filepath}")
            continue
        
        try:
            export_data = load_export(path)
            telemetry = extract_telemetry(export_data)
            stats = extract_stats(export_data)
            
            telemetry_analysis = analyze_telemetry(telemetry) if telemetry else None
            career_analysis = analyze_career_stats(stats) if stats else None
            
            if telemetry_analysis or career_analysis:
                all_telemetry.append(telemetry_analysis)
                all_career.append(career_analysis)
                print_analysis(telemetry_analysis, career_analysis, export_data)
            else:
                print(f"⚠️  No data in {filepath}")
                
        except Exception as e:
            print(f"❌ Error in {filepath}: {e}")
    
    if len(all_telemetry) > 1:
        print_aggregate(all_telemetry, all_career)


if __name__ == '__main__':
    main()
