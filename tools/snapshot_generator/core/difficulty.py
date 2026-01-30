"""
Difficulty Analyzer

Analyzes solved games to determine difficulty metrics:
- Solution move count
- Branching factor (average choices per state)
- Dead ends encountered
- Card accessibility (starter cards)
"""

from typing import Dict, List, Tuple
from dataclasses import dataclass

from .game_state import GameState, Card


@dataclass
class DifficultyMetrics:
    """Metrics for a solved game."""
    solution_moves: int
    nodes_explored: int
    dead_ends: int
    solve_time_ms: int
    branching_factor: float
    starter_accessibility: int  # Moves to access 7s and 6s
    difficulty_score: float
    recommended_tier: str  # 'easy', 'moderate', 'hard'


class DifficultyAnalyzer:
    """Analyzes game difficulty based on solver metrics."""
    
    # Difficulty score thresholds
    EASY_MAX = 40.0
    MODERATE_MAX = 80.0
    
    @staticmethod
    def calculate_difficulty_score(
        solution_moves: int,
        dead_ends: int,
        branching_factor: float,
        starter_accessibility: int
    ) -> float:
        """
        Calculate overall difficulty score.
        
        Formula:
        - solution_moves * 0.3 (longer = harder)
        - dead_ends * 2.0 (more dead ends = harder)
        - (3.0 - branching_factor) * 20 (fewer choices = harder)
        - starter_accessibility * 5 (buried starters = harder)
        
        Args:
            solution_moves: Number of moves in solution
            dead_ends: Number of dead ends encountered
            branching_factor: Average legal moves per state
            starter_accessibility: Moves to access 7s and 6s
            
        Returns:
            Difficulty score (0-150 typical range)
        """
        score = (
            solution_moves * 0.3 +
            dead_ends * 2.0 +
            (3.0 - min(branching_factor, 3.0)) * 20 +
            starter_accessibility * 5
        )
        return score
    
    @staticmethod
    def determine_tier(difficulty_score: float) -> str:
        """
        Determine difficulty tier based on score.
        
        Args:
            difficulty_score: Calculated difficulty score
            
        Returns:
            'easy', 'moderate', or 'hard'
        """
        if difficulty_score <= DifficultyAnalyzer.EASY_MAX:
            return 'easy'
        elif difficulty_score <= DifficultyAnalyzer.MODERATE_MAX:
            return 'moderate'
        else:
            return 'hard'
    
    @staticmethod
    def analyze_starter_accessibility(state: GameState, solution_path: List) -> int:
        """
        Calculate how many moves to access all 7s and 6s.
        
        Args:
            state: Initial game state
            solution_path: Sequence of moves to win
            
        Returns:
            Maximum moves to access any starter card
        """
        # Find all 7s and 6s in tableau
        starters = []
        for col_idx in range(7):
            col = state.tableau[str(col_idx)]
            for card in col:
                if card.rank in ('6', '7'):
                    starters.append((col_idx, card))
        
        if not starters:
            return 0
        
        # Simplified: return depth of deepest starter
        # More sophisticated would trace through solution path
        max_depth = 0
        for col_idx, card in starters:
            col = state.tableau[str(col_idx)]
            # Cards on top of starter
            depth = len(col) - col.index(card) - 1 if card in col else 0
            max_depth = max(max_depth, depth)
        
        return max_depth
    
    @staticmethod
    def calculate_branching_factor(nodes_explored: int, solution_moves: int) -> float:
        """
        Calculate average branching factor.
        
        Args:
            nodes_explored: Total states explored by solver
            solution_moves: Moves in solution path
            
        Returns:
            Average branching factor
        """
        if solution_moves == 0:
            return 0.0
        # Rough approximation: nodes / moves
        return nodes_explored / solution_moves if solution_moves > 0 else 0.0
    
    @classmethod
    def analyze_solution(
        cls,
        initial_state: GameState,
        solution_moves: int,
        nodes_explored: int,
        dead_ends: int,
        solve_time_ms: int,
        solution_path: List = None
    ) -> DifficultyMetrics:
        """
        Complete difficulty analysis.
        
        Args:
            initial_state: Starting game state
            solution_moves: Number of moves in solution
            nodes_explored: Total states explored
            dead_ends: Dead ends encountered
            solve_time_ms: Solver execution time
            solution_path: Optional sequence of moves
            
        Returns:
            Complete difficulty metrics
        """
        # Calculate starter accessibility
        if solution_path:
            starter_accessibility = cls.analyze_starter_accessibility(
                initial_state, solution_path
            )
        else:
            # Estimate based on card positions
            starter_accessibility = cls._estimate_starter_accessibility(initial_state)
        
        # Calculate branching factor
        branching_factor = cls.calculate_branching_factor(
            nodes_explored, solution_moves
        )
        
        # Calculate difficulty score
        difficulty_score = cls.calculate_difficulty_score(
            solution_moves,
            dead_ends,
            branching_factor,
            starter_accessibility
        )
        
        # Determine tier
        recommended_tier = cls.determine_tier(difficulty_score)
        
        return DifficultyMetrics(
            solution_moves=solution_moves,
            nodes_explored=nodes_explored,
            dead_ends=dead_ends,
            solve_time_ms=solve_time_ms,
            branching_factor=branching_factor,
            starter_accessibility=starter_accessibility,
            difficulty_score=difficulty_score,
            recommended_tier=recommended_tier
        )
    
    @staticmethod
    def _estimate_starter_accessibility(state: GameState) -> int:
        """
        Estimate starter accessibility without solution path.
        
        Looks at position of 6s and 7s in tableau.
        
        Returns:
            Estimated moves to access starters
        """
        max_depth = 0
        
        for col_idx in range(7):
            col = state.tableau[str(col_idx)]
            face_down_count = state.column_state['faceDownCounts'][col_idx]
            
            # Check face-up cards for 6s and 7s
            face_up_start = face_down_count
            for i in range(face_up_start, len(col)):
                card = col[i]
                if card.rank in ('6', '7'):
                    # Cards above this starter
                    depth = len(col) - i - 1
                    max_depth = max(max_depth, depth)
        
        return max_depth
    
    @staticmethod
    def check_bell_curve_distribution(
        metrics_list: List[DifficultyMetrics]
    ) -> Dict[str, int]:
        """
        Check distribution of difficulties.
        
        Args:
            metrics_list: List of metrics for generated games
            
        Returns:
            Count by tier: {'easy': X, 'moderate': Y, 'hard': Z}
        """
        distribution = {'easy': 0, 'moderate': 0, 'hard': 0}
        
        for metrics in metrics_list:
            distribution[metrics.recommended_tier] += 1
        
        return distribution
    
    @staticmethod
    def generate_report(metrics: DifficultyMetrics) -> str:
        """
        Generate human-readable report.
        
        Args:
            metrics: Difficulty metrics
            
        Returns:
            Formatted report string
        """
        lines = [
            "## Difficulty Analysis",
            "",
            f"**Difficulty Score:** {metrics.difficulty_score:.1f}",
            f"**Recommended Tier:** {metrics.recommended_tier.upper()}",
            "",
            "### Solver Metrics",
            f"- Solution Moves: {metrics.solution_moves}",
            f"- Nodes Explored: {metrics.nodes_explored}",
            f"- Dead Ends: {metrics.dead_ends}",
            f"- Solve Time: {metrics.solve_time_ms}ms",
            f"- Branching Factor: {metrics.branching_factor:.2f}",
            "",
            "### Card Analysis",
            f"- Starter Accessibility: {metrics.starter_accessibility} moves",
            "",
            "### Classification",
        ]
        
        if metrics.recommended_tier == 'easy':
            lines.append("This level is suitable for Bronze tier (levels 1-10).")
        elif metrics.recommended_tier == 'moderate':
            lines.append("This level is suitable for Silver tier (levels 11-20).")
        else:
            lines.append("This level is suitable for Gold tier (levels 21-30).")
        
        return '\n'.join(lines)
