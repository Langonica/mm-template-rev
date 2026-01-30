#!/usr/bin/env python3
"""
Game Log Analyzer

Analyzes detailed game logs from meridian_game_logs localStorage key.
These logs contain the full event stream of each game session.

Usage:
    python3 tools/analyze_game_logs.py path/to/export.json
    python3 tools/analyze_game_logs.py --logs-only path/to/logs_export.json
"""

import json
import sys
from pathlib import Path
from collections import defaultdict
from datetime import datetime


def load_logs_from_export(filepath):
    """Extract game logs from a debug export file."""
    with open(filepath) as f:
        data = json.load(f)
    
    # Logs might be in data.data.meridian_game_logs or directly in file
    if 'data' in data and 'meridian_game_logs' in data.get('data', {}):
        return data['data']['meridian_game_logs']
    elif 'logs' in data:
        return data['logs']
    elif isinstance(data, list):
        return data
    return []


def analyze_log_session(session):
    """Analyze a single game session log."""
    events = session.get('events', [])
    
    analysis = {
        'sessionId': session.get('sessionId'),
        'mode': session.get('mode'),
        'outcome': session.get('outcome'),
        'moves': session.get('moves', 0),
        'duration': session.get('duration', 0),
        'eventCounts': defaultdict(int),
        'movesByType': defaultdict(int),
        'undoCount': 0,
        'stockCycles': 0,
        'foundationsPlaced': 0,
        'notifications': [],
        'firstFoundationAt': None,
        'timeline': []
    }
    
    for event in events:
        event_type = event.get('type')
        analysis['eventCounts'][event_type] += 1
        
        if event_type == 'MOVE':
            move_type = event.get('moveType', 'unknown')
            analysis['movesByType'][move_type] += 1
            
        elif event_type == 'UNDO':
            analysis['undoCount'] += 1
            
        elif event_type == 'STOCK_CYCLE':
            analysis['stockCycles'] = event.get('cycleNumber', analysis['stockCycles'])
            
        elif event_type == 'FOUNDATION':
            analysis['foundationsPlaced'] += 1
            if analysis['firstFoundationAt'] is None:
                analysis['firstFoundationAt'] = event.get('relativeTime', 0)
                
        elif event_type == 'NOTIFICATION':
            analysis['notifications'].append({
                'tier': event.get('tier'),
                'time': event.get('relativeTime', 0)
            })
        
        # Build timeline
        analysis['timeline'].append({
            'type': event_type,
            'time': event.get('relativeTime', 0),
            'details': {k: v for k, v in event.items() if k not in ['type', 'timestamp', 'relativeTime']}
        })
    
    return analysis


def print_session_analysis(analysis, verbose=False):
    """Print analysis for a single session."""
    print(f"\n{'='*60}")
    print(f"Session: {analysis['sessionId'][:20]}...")
    print(f"Mode: {analysis['mode']} | Outcome: {analysis['outcome'].upper()}")
    print(f"{'='*60}")
    
    print(f"\n📊 Basic Stats:")
    print(f"  Total Moves: {analysis['moves']}")
    print(f"  Duration: {analysis['duration']}s")
    print(f"  Undos Used: {analysis['undoCount']}")
    print(f"  Stock Cycles: {analysis['stockCycles']}")
    print(f"  Foundations: {analysis['foundationsPlaced']}")
    if analysis['firstFoundationAt']:
        print(f"  First Foundation: {analysis['firstFoundationAt']/1000:.1f}s")
    
    if analysis['movesByType']:
        print(f"\n🎯 Moves by Type:")
        for move_type, count in sorted(analysis['movesByType'].items()):
            print(f"  {move_type:20s} {count:3d}")
    
    if analysis['notifications']:
        print(f"\n🔔 Notifications:")
        for notif in analysis['notifications']:
            print(f"  {notif['tier']:15s} at {notif['time']/1000:.1f}s")
    
    if verbose and analysis['timeline']:
        print(f"\n📝 Event Timeline (last 10):")
        for event in analysis['timeline'][-10:]:
            details = ', '.join(f"{k}={v}" for k, v in event['details'].items())
            print(f"  {event['time']/1000:8.1f}s  {event['type']:15s}  {details}")


def print_aggregate_analysis(analyses):
    """Print aggregate analysis across all sessions."""
    if not analyses:
        print("No sessions to analyze")
        return
    
    total = len(analyses)
    wins = sum(1 for a in analyses if a['outcome'] == 'won')
    losses = total - wins
    
    print("\n" + "="*60)
    print("AGGREGATE ANALYSIS")
    print("="*60)
    
    print(f"\n📈 Overall:")
    print(f"  Total Sessions: {total}")
    print(f"  Wins: {wins} ({wins/total*100:.1f}%)")
    print(f"  Losses: {losses} ({losses/total*100:.1f}%)")
    
    # By mode
    by_mode = defaultdict(lambda: {'games': 0, 'wins': 0, 'moves': [], 'undos': []})
    for a in analyses:
        mode = a['mode']
        by_mode[mode]['games'] += 1
        by_mode[mode]['wins'] += (1 if a['outcome'] == 'won' else 0)
        by_mode[mode]['moves'].append(a['moves'])
        by_mode[mode]['undos'].append(a['undoCount'])
    
    print(f"\n🎮 By Mode:")
    for mode, stats in sorted(by_mode.items()):
        win_rate = stats['wins'] / stats['games'] * 100
        avg_moves = sum(stats['moves']) / len(stats['moves'])
        avg_undos = sum(stats['undos']) / len(stats['undos'])
        print(f"\n  {mode}:")
        print(f"    Games: {stats['games']}, Win Rate: {win_rate:.1f}%")
        print(f"    Avg Moves: {avg_moves:.1f}, Avg Undos: {avg_undos:.1f}")
    
    # Move count distribution for wins
    won_games = [a for a in analyses if a['outcome'] == 'won']
    if won_games:
        moves = [a['moves'] for a in won_games]
        print(f"\n📊 Winning Game Move Distribution:")
        print(f"  Min: {min(moves)}, Max: {max(moves)}")
        print(f"  Avg: {sum(moves)/len(moves):.1f}, Median: {sorted(moves)[len(moves)//2]}")
        
        # Buckets
        buckets = {'<20': 0, '20-30': 0, '30-40': 0, '40-50': 0, '50+': 0}
        for m in moves:
            if m < 20:
                buckets['<20'] += 1
            elif m < 30:
                buckets['20-30'] += 1
            elif m < 40:
                buckets['30-40'] += 1
            elif m < 50:
                buckets['40-50'] += 1
            else:
                buckets['50+'] += 1
        
        print(f"\n  Distribution:")
        for bucket, count in buckets.items():
            bar = '█' * (count * 20 // len(moves))
            print(f"    {bucket:6s} {count:3d} {bar}")
    
    # Undo analysis
    games_with_undos = [a for a in analyses if a['undoCount'] > 0]
    if games_with_undos:
        print(f"\n↩️  Undo Analysis:")
        print(f"  Games with undos: {len(games_with_undos)}/{total} ({len(games_with_undos)/total*100:.1f}%)")
        undo_counts = [a['undoCount'] for a in games_with_undos]
        print(f"  Avg undos (when used): {sum(undo_counts)/len(undo_counts):.1f}")
        print(f"  Max undos in one game: {max(undo_counts)}")
    
    # Notification analysis
    games_with_warnings = [a for a in analyses if any(n['tier'] in ['warning', 'confirmed'] for n in a['notifications'])]
    if games_with_warnings:
        print(f"\n⚠️  Warning Analysis:")
        warned_then_won = sum(1 for a in games_with_warnings if a['outcome'] == 'won')
        print(f"  Games with warnings: {len(games_with_warnings)}")
        print(f"  Warned but won (false positive?): {warned_then_won}")
        print(f"  Accuracy: {(len(games_with_warnings) - warned_then_won) / len(games_with_warnings) * 100:.1f}%")


def export_sessions_to_timeline(analyses, output_path):
    """Export all sessions as a single timeline for visualization."""
    timeline = []
    
    for analysis in analyses:
        for event in analysis['timeline']:
            timeline.append({
                'sessionId': analysis['sessionId'],
                'mode': analysis['mode'],
                'outcome': analysis['outcome'],
                **event
            })
    
    # Sort by session then time
    timeline.sort(key=lambda x: (x['sessionId'], x['time']))
    
    with open(output_path, 'w') as f:
        json.dump(timeline, f, indent=2)
    
    print(f"\n📄 Timeline exported to: {output_path}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze Meridian game logs')
    parser.add_argument('files', nargs='+', help='Export JSON files to analyze')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed event timelines')
    parser.add_argument('--logs-only', action='store_true', help='Files contain only logs, not full export')
    parser.add_argument('--export-timeline', '-t', metavar='FILE', help='Export combined timeline to JSON')
    
    args = parser.parse_args()
    
    all_sessions = []
    
    for filepath in args.files:
        path = Path(filepath)
        if not path.exists():
            print(f"Warning: File not found: {filepath}")
            continue
        
        try:
            logs = load_logs_from_export(path)
            
            if not logs:
                print(f"No logs found in {filepath}")
                continue
            
            print(f"\n📁 Processing: {path.name} ({len(logs)} sessions)")
            
            for session in logs:
                analysis = analyze_log_session(session)
                all_sessions.append(analysis)
                
                if args.verbose or len(logs) <= 5:
                    print_session_analysis(analysis, args.verbose)
            
        except Exception as e:
            print(f"Error processing {filepath}: {e}")
    
    # Aggregate analysis
    if all_sessions:
        print_aggregate_analysis(all_sessions)
        
        if args.export_timeline:
            export_sessions_to_timeline(all_sessions, args.export_timeline)
    else:
        print("\nNo sessions found to analyze.")
        print("Make sure exports contain 'meridian_game_logs' key")


if __name__ == '__main__':
    main()
