#!/usr/bin/env python3
"""
Test Data Analyzer

Analyzes debug export JSON files from testers to extract insights
for difficulty calibration and generator tuning.

Usage:
    python3 tools/analyze_test_data.py path/to/export1.json path/to/export2.json ...
    python3 tools/analyze_test_data.py data/exports/*.json
"""

import json
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime


def load_export(filepath):
    """Load a single debug export file."""
    with open(filepath) as f:
        return json.load(f)


def extract_games(export_data):
    """Extract game records from telemetry data."""
    telemetry = export_data.get('data', {}).get('meridian-gs-telemetry', {})
    games = telemetry.get('games', [])
    return games


def extract_stats(export_data):
    """Extract overall stats."""
    return export_data.get('data', {}).get('meridian_solitaire_stats', {})


def analyze_games(games):
    """Analyze game records for patterns."""
    if not games:
        return None
    
    results = {
        'total_games': len(games),
        'wins': 0,
        'losses': 0,
        'forfeits': 0,
        'by_mode': defaultdict(lambda: {'games': 0, 'wins': 0, 'losses': 0}),
        'move_counts': {'won': [], 'lost': []},
        'tier_distribution': defaultdict(int),
        'avg_moves_by_outcome': {},
        'false_positives': 0,  # Warning shown but won
        'false_negatives': 0,  # Lost but no warning
    }
    
    for game in games:
        outcome = game.get('outcome', 'unknown')
        mode = game.get('mode', 'unknown')
        moves = game.get('moves', 0)
        highest_tier = game.get('highestTier', 0)
        
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
        else:
            results['by_mode'][mode]['losses'] += 1
        
        # Tier distribution
        if highest_tier > 0:
            tier_name = {1: 'hint', 2: 'concern', 3: 'warning', 4: 'confirmed'}.get(highest_tier, 'unknown')
            results['tier_distribution'][tier_name] += 1
        
        # False positives/negatives
        if highest_tier >= 3 and outcome == 'won':
            results['false_positives'] += 1
        if highest_tier < 2 and outcome == 'lost':
            results['false_negatives'] += 1
    
    # Calculate averages
    if results['move_counts']['won']:
        results['avg_moves_by_outcome']['won'] = sum(results['move_counts']['won']) / len(results['move_counts']['won'])
    if results['move_counts']['lost']:
        results['avg_moves_by_outcome']['lost'] = sum(results['move_counts']['lost']) / len(results['move_counts']['lost'])
    
    return results


def print_analysis(results, stats, export_meta):
    """Print formatted analysis."""
    print("=" * 60)
    print(f"MERIDIAN SOLITAIRE - TEST DATA ANALYSIS")
    print(f"Export Date: {export_meta.get('exportedAt', 'unknown')}")
    print(f"App Version: {export_meta.get('appVersion', 'unknown')}")
    print("=" * 60)
    
    if not results:
        print("\nNo game data found in export.")
        return
    
    # Overall Stats
    print("\n📊 OVERALL STATISTICS")
    print("-" * 40)
    print(f"Total Games:    {results['total_games']}")
    print(f"Wins:           {results['wins']} ({results['wins']/results['total_games']*100:.1f}%)")
    print(f"Losses:         {results['losses']} ({results['losses']/results['total_games']*100:.1f}%)")
    print(f"Forfeits:       {results['forfeits']} ({results['forfeits']/results['total_games']*100:.1f}%)")
    
    if 'won' in results['avg_moves_by_outcome']:
        print(f"\nAvg Moves (Win):  {results['avg_moves_by_outcome']['won']:.1f}")
    if 'lost' in results['avg_moves_by_outcome']:
        print(f"Avg Moves (Loss): {results['avg_moves_by_outcome']['lost']:.1f}")
    
    # By Mode
    print("\n🎮 BY MODE")
    print("-" * 40)
    for mode, data in sorted(results['by_mode'].items()):
        win_rate = data['wins'] / data['games'] * 100 if data['games'] > 0 else 0
        print(f"{mode:20s} {data['games']:3d} games  {win_rate:5.1f}% win rate")
    
    # Tier Distribution
    if results['tier_distribution']:
        print("\n🔔 NOTIFICATION TIERS")
        print("-" * 40)
        for tier, count in sorted(results['tier_distribution'].items()):
            print(f"{tier:15s} {count:3d} games")
        
        # Accuracy
        print("\n📈 NOTIFICATION ACCURACY")
        print("-" * 40)
        print(f"False Positives (warned but won): {results['false_positives']}")
        print(f"False Negatives (lost, no warning): {results['false_negatives']}")
    
    # Career Stats (if available)
    if stats:
        print("\n🏆 CAREER STATISTICS")
        print("-" * 40)
        print(f"Total Games (Career): {stats.get('totalGames', 0)}")
        print(f"Wins (Career):        {stats.get('wins', 0)}")
        print(f"Best Win Streak:      {stats.get('bestStreak', 0)}")
        print(f"Best Moves:           {stats.get('bestWinMoves', 'N/A')}")
        
        # By mode from career stats
        by_mode = stats.get('byMode', {})
        if by_mode:
            print("\nBy Mode (Career):")
            for mode, mode_stats in sorted(by_mode.items()):
                games = mode_stats.get('games', 0)
                wins = mode_stats.get('wins', 0)
                win_rate = wins / games * 100 if games > 0 else 0
                print(f"  {mode:18s} {games:3d} games  {win_rate:5.1f}% wins")
    
    print("\n" + "=" * 60)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nUsage: python3 tools/analyze_test_data.py <export_file(s)>")
        sys.exit(1)
    
    all_games = []
    all_stats = []
    
    for filepath in sys.argv[1:]:
        path = Path(filepath)
        if not path.exists():
            print(f"Warning: File not found: {filepath}")
            continue
        
        try:
            export_data = load_export(path)
            games = extract_games(export_data)
            stats = extract_stats(export_data)
            
            if games:
                all_games.extend(games)
            if stats:
                all_stats.append(stats)
            
            # Analyze individual file
            results = analyze_games(games)
            print_analysis(results, stats, export_data)
            
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    # Aggregate analysis if multiple files
    if len(sys.argv) > 2:
        print("\n" + "=" * 60)
        print("AGGREGATE ANALYSIS (All Files)")
        print("=" * 60)
        
        # Combine stats
        combined_stats = {
            'totalGames': sum(s.get('totalGames', 0) for s in all_stats),
            'wins': sum(s.get('wins', 0) for s in all_stats),
            'losses': sum(s.get('losses', 0) for s in all_stats),
        }
        
        aggregate_results = analyze_games(all_games)
        print_analysis(aggregate_results, combined_stats, {'exportedAt': 'Aggregate'})


if __name__ == '__main__':
    main()
