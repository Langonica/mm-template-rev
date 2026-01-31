#!/usr/bin/env python3
"""
Game Log Analyzer v2.0

Analyzes comprehensive player action logs for simulation development.
Extracts meaningful patterns: moves, pocket usage, column conversions, etc.

Usage:
    python3 tools/analyze_game_logs.py exports/*.json
    python3 tools/analyze_game_logs.py --verbose exports/tester.json
"""

import json
import sys
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime


def load_logs(filepath):
    """Load game logs from export file."""
    with open(filepath) as f:
        data = json.load(f)
    
    # Handle different export formats
    if 'data' in data and 'meridian_game_logs' in data.get('data', {}):
        return data['data']['meridian_game_logs']
    elif 'logs' in data:
        return data['logs']
    elif isinstance(data, list):
        return data
    return []


def analyze_session(session):
    """Analyze a single game session."""
    events = session.get('events', [])
    stats = session.get('stats', {})
    
    analysis = {
        'sessionId': session.get('sessionId'),
        'mode': session.get('mode'),
        'outcome': session.get('outcome'),
        'moves': session.get('moves', 0),
        'duration': session.get('duration', 0),
        'dealId': session.get('dealId'),
        
        # Aggregated stats (from game)
        'stats': stats,
        
        # Detailed breakdowns
        'moveTypes': Counter(),
        'foundationCards': [],  # Each card placed on foundation
        'pocketUsage': {'store': [], 'retrieve': []},
        'columnConversions': [],
        'stockRecycles': [],
        'undoPoints': [],  # When undos happened
        
        # Temporal patterns
        'foundationTiming': [],  # (moveNumber, relativeTime)
        'cycleTiming': [],  # (cycleNumber, moveNumber)
        
        # State at key moments
        'initialState': session.get('initialState'),
        'finalState': session.get('finalState'),
    }
    
    for event in events:
        event_type = event.get('type')
        
        if event_type == 'CARD_MOVE':
            to_type = event.get('to', {}).get('type')
            analysis['moveTypes'][to_type] += 1
            
        elif event_type == 'FOUNDATION_PLACE':
            analysis['foundationCards'].append({
                'card': event.get('card'),
                'suit': event.get('suit'),
                'direction': event.get('direction'),
                'pileSize': event.get('pileSize'),
                'moveNumber': event.get('moveNumber'),
                'time': event.get('relativeTime')
            })
            analysis['foundationTiming'].append((
                event.get('moveNumber', 0),
                event.get('relativeTime', 0)
            ))
            
        elif event_type == 'POCKET':
            action = event.get('action')
            entry = {
                'card': event.get('card'),
                'pocket': event.get('pocketNum'),
                'moveNumber': event.get('moveNumber')
            }
            analysis['pocketUsage'][action].append(entry)
            
        elif event_type == 'COLUMN_CONVERT':
            analysis['columnConversions'].append({
                'column': event.get('column'),
                'from': event.get('from'),
                'to': event.get('to'),
                'triggerCard': event.get('triggerCard'),
                'moveNumber': event.get('moveNumber')
            })
            
        elif event_type == 'STOCK_RECYCLE':
            analysis['stockRecycles'].append({
                'cycleNumber': event.get('cycleNumber'),
                'wasteSize': event.get('wasteSize'),
                'moveNumber': event.get('moveNumber', 0)
            })
            analysis['cycleTiming'].append((
                event.get('cycleNumber', 0),
                event.get('moveNumber', 0)
            ))
            
        elif event_type == 'UNDO':
            analysis['undoPoints'].append({
                'moveNumber': event.get('moveNumber'),
                'card': event.get('undoneCard')
            })
    
    return analysis


def print_session_analysis(analysis, verbose=False):
    """Print analysis for a single session."""
    print(f"\n{'='*70}")
    print(f"Session: {analysis['sessionId'][:25]}...")
    print(f"Mode: {analysis['mode']} | Outcome: {analysis['outcome'].upper() if analysis['outcome'] else 'N/A'}")
    print(f"Moves: {analysis['moves']} | Duration: {analysis['duration']}s")
    print(f"{'='*70}")
    
    stats = analysis['stats']
    
    # Move breakdown
    print(f"\n📊 Move Breakdown:")
    print(f"  Total Moves: {stats.get('totalMoves', 'N/A')}")
    print(f"  To Foundation: {stats.get('foundationMoves', 'N/A')}")
    print(f"  To Tableau: {stats.get('tableauMoves', 'N/A')}")
    print(f"  Stock Draws: {stats.get('stockDraws', 'N/A')}")
    print(f"  Stock Recycles: {stats.get('stockRecycles', 'N/A')} (cycles: {stats.get('stockCycles', 'N/A')})")
    
    # Pocket usage
    pocket_stores = len(analysis['pocketUsage']['store'])
    pocket_retrieves = len(analysis['pocketUsage']['retrieve'])
    if pocket_stores or pocket_retrieves:
        print(f"\n🎒 Pocket Usage:")
        print(f"  Stores: {pocket_stores}")
        print(f"  Retrieves: {pocket_retrieves}")
        if verbose and analysis['pocketUsage']['store']:
            print(f"  Store details:")
            for p in analysis['pocketUsage']['store'][:5]:
                print(f"    Move {p['moveNumber']}: {p['card']} to pocket {p['pocket']}")
    
    # Foundation progress
    foundations = stats.get('foundationsCompleted', 0)
    foundation_cards = len(analysis['foundationCards'])
    print(f"\n🏛️  Foundation Progress:")
    print(f"  Cards Placed: {foundation_cards}")
    print(f"  Foundations Completed: {foundations}/8")
    
    if analysis['foundationTiming'] and verbose:
        print(f"  First foundation card at move: {analysis['foundationTiming'][0][0]}")
        if len(analysis['foundationTiming']) > 1:
            last = analysis['foundationTiming'][-1]
            print(f"  Last foundation card at move: {last[0]}")
    
    # Column conversions
    conversions = len(analysis['columnConversions'])
    if conversions:
        print(f"\n🔄 Column Conversions: {conversions}")
        if verbose:
            for conv in analysis['columnConversions'][:5]:
                print(f"  Col {conv['column']}: {conv['from']} → {conv['to']} (move {conv['moveNumber']})")
    
    # Undo analysis
    undos = len(analysis['undoPoints'])
    if undos:
        print(f"\n↩️  Undo Usage: {undos} times")
        if verbose and analysis['undoPoints']:
            undo_moves = [u['moveNumber'] for u in analysis['undoPoints']]
            print(f"  Undone moves: {undo_moves[:10]}{'...' if len(undo_moves) > 10 else ''}")
    
    # Final state
    final = analysis.get('finalState')
    if final:
        print(f"\n🏁 Final State:")
        print(f"  Cards on Foundations: {final.get('foundations', 'N/A')}")
        print(f"  Cards in Tableau: {final.get('tableauCards', 'N/A')}")
        print(f"  Empty Columns: {final.get('emptyColumns', 'N/A')}")


def print_aggregate(analyses):
    """Print aggregate statistics across all sessions."""
    if not analyses:
        print("\nNo completed sessions to analyze")
        return
    
    completed = [a for a in analyses if a['outcome']]
    wins = [a for a in completed if a['outcome'] == 'won']
    losses = [a for a in completed if a['outcome'] == 'lost']
    
    print("\n" + "="*70)
    print("AGGREGATE ANALYSIS")
    print("="*70)
    
    print(f"\n📈 Overall:")
    print(f"  Total Sessions: {len(completed)}")
    print(f"  Wins: {len(wins)} ({len(wins)/len(completed)*100:.1f}%)")
    print(f"  Losses: {len(losses)} ({len(losses)/len(completed)*100:.1f}%)")
    
    # By mode
    by_mode = defaultdict(lambda: {'games': 0, 'wins': 0, 'moves': [], 'foundations': []})
    for a in completed:
        mode = a['mode']
        by_mode[mode]['games'] += 1
        by_mode[mode]['wins'] += (1 if a['outcome'] == 'won' else 0)
        by_mode[mode]['moves'].append(a['moves'])
        by_mode[mode]['foundations'].append(a['stats'].get('foundationsCompleted', 0))
    
    print(f"\n🎮 By Mode:")
    for mode, data in sorted(by_mode.items()):
        win_rate = data['wins'] / data['games'] * 100
        avg_moves = sum(data['moves']) / len(data['moves'])
        avg_foundations = sum(data['foundations']) / len(data['foundations'])
        print(f"\n  {mode}:")
        print(f"    Games: {data['games']}, Win Rate: {win_rate:.1f}%")
        print(f"    Avg Moves: {avg_moves:.1f}")
        print(f"    Avg Foundations: {avg_foundations:.1f}/8")
    
    # Win analysis
    if wins:
        win_moves = [a['moves'] for a in wins]
        win_foundations = [a['stats'].get('foundationsCompleted', 0) for a in wins]
        win_cycles = [a['stats'].get('stockCycles', 0) for a in wins]
        
        print(f"\n🏆 Win Analysis:")
        print(f"  Move Range: {min(win_moves)} - {max(win_moves)}")
        print(f"  Avg Moves: {sum(win_moves)/len(win_moves):.1f}")
        print(f"  Avg Stock Cycles: {sum(win_cycles)/len(win_cycles):.1f}")
        
        # Distribution
        buckets = {'<30': 0, '30-45': 0, '45-60': 0, '60-80': 0, '80+': 0}
        for m in win_moves:
            if m < 30:
                buckets['<30'] += 1
            elif m < 45:
                buckets['30-45'] += 1
            elif m < 60:
                buckets['45-60'] += 1
            elif m < 80:
                buckets['60-80'] += 1
            else:
                buckets['80+'] += 1
        
        print(f"\n  Move Distribution (wins):")
        for bucket, count in buckets.items():
            if count > 0:
                bar = '█' * (count * 30 // len(wins))
                print(f"    {bucket:6s} {count:3d} {bar}")
    
    # Loss analysis
    if losses:
        loss_moves = [a['moves'] for a in losses]
        loss_foundations = [a['stats'].get('foundationsCompleted', 0) for a in losses]
        
        print(f"\n💔 Loss Analysis:")
        print(f"  Avg Moves: {sum(loss_moves)/len(loss_moves):.1f}")
        print(f"  Avg Foundations: {sum(loss_foundations)/len(loss_foundations):.1f}/8")
    
    # Pocket usage across all games
    total_stores = sum(len(a['pocketUsage']['store']) for a in analyses)
    total_retrieves = sum(len(a['pocketUsage']['retrieve']) for a in analyses)
    if total_stores or total_retrieves:
        print(f"\n🎒 Total Pocket Usage:")
        print(f"  Stores: {total_stores}, Retrieves: {total_retrieves}")
    
    # Strategy patterns
    total_conversions = sum(len(a['columnConversions']) for a in analyses)
    if total_conversions:
        print(f"\n🔄 Total Column Conversions: {total_conversions}")


def export_for_simulation(analyses, output_path):
    """Export data in format suitable for simulation training."""
    training_data = []
    
    for analysis in analyses:
        if not analysis['outcome']:
            continue
            
        training_data.append({
            'sessionId': analysis['sessionId'],
            'mode': analysis['mode'],
            'outcome': analysis['outcome'],
            'moves': analysis['moves'],
            'stats': analysis['stats'],
            'foundationTiming': analysis['foundationTiming'],
            'cycleTiming': analysis['cycleTiming'],
            'pocketUsage': analysis['pocketUsage'],
            'columnConversions': analysis['columnConversions'],
            'initialState': analysis['initialState'],
            'finalState': analysis['finalState']
        })
    
    with open(output_path, 'w') as f:
        json.dump({
            'exportedAt': datetime.now().isoformat(),
            'count': len(training_data),
            'sessions': training_data
        }, f, indent=2)
    
    print(f"\n📄 Simulation data exported: {output_path}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze Meridian game logs')
    parser.add_argument('files', nargs='+', help='Export JSON files')
    parser.add_argument('--verbose', '-v', action='store_true', help='Detailed output')
    parser.add_argument('--export', '-e', metavar='FILE', help='Export for simulation')
    
    args = parser.parse_args()
    
    all_analyses = []
    
    for filepath in args.files:
        path = Path(filepath)
        if not path.exists():
            print(f"⚠️  File not found: {filepath}")
            continue
        
        try:
            logs = load_logs(path)
            if not logs:
                print(f"⚠️  No logs in {path.name}")
                continue
            
            print(f"\n📁 {path.name}: {len(logs)} sessions")
            
            for session in logs:
                analysis = analyze_session(session)
                all_analyses.append(analysis)
                
                if args.verbose or len(logs) <= 3:
                    print_session_analysis(analysis, args.verbose)
                    
        except Exception as e:
            print(f"❌ Error in {filepath}: {e}")
    
    if all_analyses:
        print_aggregate(all_analyses)
        
        if args.export:
            export_for_simulation(all_analyses, args.export)
    else:
        print("\n⚠️  No valid sessions found")


if __name__ == '__main__':
    main()
