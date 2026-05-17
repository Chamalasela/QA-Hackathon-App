"""
MediCare Clinic QA Hackathon — Bug Report Evaluator

Compares team-submitted bug reports (CSV) against the master bug list
and scores them using fuzzy matching + keyword overlap.

Usage:
    python evaluate-bugs.py --team <team-number>
    python evaluate-bugs.py --all

Outputs a JSON score report per team.
"""
import csv
import json
import os
import sys
import argparse
from difflib import SequenceMatcher

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
MASTER_BUGS = os.path.join(SCRIPT_DIR, 'master-bug-list.json')

# Scoring constants
MAX_BUG_SCORE = 300
CRITICAL_WEIGHT = 15
MAJOR_WEIGHT = 12
MINOR_WEIGHT = 8
COSMETIC_WEIGHT = 5
BONUS_NOVEL = 3  # bonus for novel bugs not in master list


def load_master_bugs():
    with open(MASTER_BUGS, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('bugs', data) if isinstance(data, dict) else data


def load_team_bugs(team_num):
    csv_path = os.path.join(ROOT_DIR, 'submissions', f'team-{team_num}', 'bug-report.csv')
    if not os.path.exists(csv_path):
        return None, f"Bug report not found: {csv_path}"
    rows = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows, None


def similarity(a, b):
    """Return 0-1 similarity score between two strings."""
    if not a or not b:
        return 0
    a_lower = a.lower().strip()
    b_lower = b.lower().strip()
    return SequenceMatcher(None, a_lower, b_lower).ratio()


def normalize_text(text):
    """Normalize text for better matching: lowercase, replace hyphens/underscores with spaces."""
    import re
    t = text.lower().strip()
    t = re.sub(r'[-_/]', ' ', t)
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t)
    return t


def keyword_overlap(team_text, master_bug):
    """Check how many master keywords appear in the team's bug text."""
    combined = normalize_text(team_text)
    keywords = master_bug.get('keywords', [])
    if not keywords:
        return 0
    hits = sum(1 for kw in keywords if normalize_text(kw) in combined)
    return hits / len(keywords)


def reverse_keyword_score(team_title, master_bug):
    """Check if key words from the team's title appear in the master description."""
    import re
    stop_words = {'the', 'a', 'an', 'is', 'in', 'on', 'of', 'for', 'to', 'and', 'or', 'no', 'not', 'with', 'by', 'from', 'at', 'but'}
    title_words = set(re.findall(r'\w+', team_title.lower())) - stop_words
    master_text = normalize_text(f"{master_bug['title']} {master_bug.get('description', '')}")
    if not title_words:
        return 0
    hits = sum(1 for w in title_words if len(w) > 2 and w in master_text)
    meaningful = [w for w in title_words if len(w) > 2]
    return hits / len(meaningful) if meaningful else 0


def severity_weight(severity):
    s = (severity or '').lower()
    if s in ('critical', 'blocker'):
        return CRITICAL_WEIGHT
    elif s in ('major', 'high'):
        return MAJOR_WEIGHT
    elif s in ('minor', 'medium'):
        return MINOR_WEIGHT
    else:
        return COSMETIC_WEIGHT


def match_bug(team_bug, master_bugs, already_matched):
    """Find the best matching master bug for a team-submitted bug."""
    team_text = ' '.join([
        team_bug.get('Title', ''),
        team_bug.get('Steps_To_Reproduce', ''),
        team_bug.get('Expected_Result', ''),
        team_bug.get('Actual_Result', ''),
        team_bug.get('Module', ''),
        team_bug.get('Category', '')
    ])

    best_score = 0
    best_match = None

    for mb in master_bugs:
        if mb['id'] in already_matched:
            continue
        master_text = f"{mb['title']} {mb['description']} {mb.get('module', '')}"
        title_sim = similarity(team_bug.get('Title', ''), mb['title'])
        desc_sim = similarity(team_text, master_text)
        kw_score = keyword_overlap(team_text, mb)
        rev_kw = reverse_keyword_score(team_bug.get('Title', ''), mb)
        combined = (title_sim * 0.3) + (desc_sim * 0.25) + (kw_score * 0.25) + (rev_kw * 0.2)

        if combined > best_score:
            best_score = combined
            best_match = mb

    return best_match, best_score


def evaluate_team(team_num, master_bugs):
    bugs, err = load_team_bugs(team_num)
    if err:
        return {'team': team_num, 'error': err, 'score': 0}

    already_matched = set()
    matched = []
    unmatched = []
    total_points = 0

    for tb in bugs:
        best_match, score = match_bug(tb, master_bugs, already_matched)
        if best_match and score >= 0.30:
            already_matched.add(best_match['id'])
            weight = severity_weight(best_match.get('severity', ''))
            points = round(weight * min(score * 1.5, 1.0), 1)
            total_points += points
            matched.append({
                'team_bug': tb.get('Bug_ID', '?'),
                'team_title': tb.get('Title', ''),
                'master_id': best_match['id'],
                'master_title': best_match['title'],
                'confidence': round(score, 3),
                'points': points
            })
        else:
            # Novel bug — small bonus
            total_points += BONUS_NOVEL
            unmatched.append({
                'team_bug': tb.get('Bug_ID', '?'),
                'team_title': tb.get('Title', ''),
                'points': BONUS_NOVEL,
                'note': 'Novel / unmatched — bonus points'
            })

    # Normalize to MAX_BUG_SCORE
    max_possible = sum(severity_weight(mb.get('severity', '')) for mb in master_bugs)
    normalized = round((total_points / max_possible) * MAX_BUG_SCORE, 1) if max_possible > 0 else 0
    final_score = min(normalized, MAX_BUG_SCORE)

    return {
        'team': team_num,
        'bugs_submitted': len(bugs),
        'bugs_matched': len(matched),
        'bugs_novel': len(unmatched),
        'master_coverage': f"{len(matched)}/{len(master_bugs)}",
        'raw_points': round(total_points, 1),
        'normalized_score': final_score,
        'matched': matched,
        'unmatched': unmatched
    }


def main():
    parser = argparse.ArgumentParser(description='Evaluate bug reports for QA Hackathon')
    parser.add_argument('--team', type=int, help='Team number to evaluate (1-6)')
    parser.add_argument('--all', action='store_true', help='Evaluate all teams')
    args = parser.parse_args()

    master_bugs = load_master_bugs()
    results = []

    if args.all:
        for t in range(1, 7):
            results.append(evaluate_team(t, master_bugs))
    elif args.team:
        results.append(evaluate_team(args.team, master_bugs))
    else:
        parser.print_help()
        sys.exit(1)

    out_dir = os.path.join(ROOT_DIR, 'judging')
    os.makedirs(out_dir, exist_ok=True)

    for r in results:
        team_num = r['team']
        out_path = os.path.join(out_dir, f'team-{team_num}-bugs.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(r, f, indent=2)
        print(f"Team {team_num}: {r.get('normalized_score', 0)}/300 "
              f"({r.get('bugs_matched', 0)} matched, {r.get('bugs_novel', 0)} novel)")
        if r.get('error'):
            print(f"  ⚠ {r['error']}")

    if len(results) > 1:
        summary_path = os.path.join(out_dir, 'bugs-summary.json')
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump([{'team': r['team'], 'score': r.get('normalized_score', 0),
                        'matched': r.get('bugs_matched', 0)} for r in results], f, indent=2)
        print(f"\nSummary saved to {summary_path}")


if __name__ == '__main__':
    main()
