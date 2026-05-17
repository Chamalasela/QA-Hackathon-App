"""
MediCare Clinic QA Hackathon — Test Case Evaluator

Compares team-submitted test cases (CSV) against master test scenarios
and scores them based on coverage, quality, and category distribution.

Usage:
    python evaluate-testcases.py --team <team-number>
    python evaluate-testcases.py --all
"""
import csv
import json
import os
import sys
import argparse
from difflib import SequenceMatcher

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
MASTER_SCENARIOS = os.path.join(SCRIPT_DIR, 'master-test-scenarios.json')

MAX_TC_SCORE = 250

CATEGORY_WEIGHTS = {
    'functional': 1.0,
    'security': 1.3,
    'performance': 1.2,
    'usability': 0.9,
    'data_privacy': 1.2,
    'boundary': 1.1,
    'negative': 1.1,
    'integration': 1.0,
}

PRIORITY_WEIGHTS = {'critical': 5, 'high': 4, 'medium': 3, 'low': 2}


def load_master_scenarios():
    with open(MASTER_SCENARIOS, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('scenarios', data) if isinstance(data, dict) else data


def load_team_testcases(team_num):
    csv_path = os.path.join(ROOT_DIR, 'submissions', f'team-{team_num}', 'test-cases.csv')
    if not os.path.exists(csv_path):
        return None, f"Test case file not found: {csv_path}"
    rows = []
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows, None


def similarity(a, b):
    if not a or not b:
        return 0
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()


def normalize_text(text):
    """Normalize text for better matching."""
    import re
    t = text.lower().strip()
    t = re.sub(r'[-_/]', ' ', t)
    t = re.sub(r'[^\w\s]', ' ', t)
    t = re.sub(r'\s+', ' ', t)
    return t


def reverse_keyword_score(team_title, master_title):
    """Check word overlap between team title and master title."""
    import re
    stop_words = {'the', 'a', 'an', 'is', 'in', 'on', 'of', 'for', 'to', 'and', 'or', 'no', 'not', 'with', 'by', 'from', 'at', 'but', 'verify', 'test', 'check'}
    team_words = set(re.findall(r'\w+', normalize_text(team_title))) - stop_words
    master_words = set(re.findall(r'\w+', normalize_text(master_title))) - stop_words
    meaningful_team = {w for w in team_words if len(w) > 2}
    meaningful_master = {w for w in master_words if len(w) > 2}
    if not meaningful_team or not meaningful_master:
        return 0
    overlap = meaningful_team & meaningful_master
    return len(overlap) / max(len(meaningful_team), len(meaningful_master))


def keyword_overlap(team_text, master_keywords):
    """Score how well team text matches master scenario keywords."""
    import re
    if not master_keywords:
        return 0
    team_norm = normalize_text(team_text)
    matched = 0
    for kw in master_keywords:
        kw_norm = normalize_text(kw)
        # Check if keyword phrase appears in team text
        if kw_norm in team_norm:
            matched += 1
        else:
            # Check individual keyword words against team text words
            kw_words = set(re.findall(r'\w+', kw_norm))
            team_words = set(re.findall(r'\w+', team_norm))
            if kw_words and kw_words.issubset(team_words):
                matched += 0.7
    return matched / len(master_keywords) if master_keywords else 0


def match_scenario(tc, master_scenarios, already_matched):
    tc_title = tc.get('Title', '')
    tc_text = ' '.join([
        tc_title,
        tc.get('Steps', ''),
        tc.get('Expected_Result', ''),
        tc.get('Module', ''),
        tc.get('Category', '')
    ])

    best_score = 0
    best_match = None

    for ms in master_scenarios:
        if ms['id'] in already_matched:
            continue
        ms_text = f"{ms['title']} {ms.get('module', '')} {ms.get('category', '')}"
        title_sim = similarity(tc.get('Title', ''), ms['title'])
        full_sim = similarity(tc_text, ms_text)
        word_overlap = reverse_keyword_score(tc.get('Title', ''), ms['title'])
        kw_score = keyword_overlap(tc_text, ms.get('keywords', []))
        combined = (title_sim * 0.25) + (full_sim * 0.2) + (word_overlap * 0.25) + (kw_score * 0.3)

        if combined > best_score:
            best_score = combined
            best_match = ms

    return best_match, best_score


def assess_quality(tc):
    """Rate test case quality 0-1 based on completeness."""
    score = 0
    fields = ['Title', 'Steps', 'Expected_Result', 'Preconditions', 'Test_Data', 'Priority', 'Category', 'Module']
    for f in fields:
        val = tc.get(f, '').strip()
        if val:
            score += 1
            if len(val) > 20:
                score += 0.5  # detailed content bonus
    return min(score / (len(fields) * 1.5), 1.0)


def evaluate_team(team_num, master_scenarios):
    tcs, err = load_team_testcases(team_num)
    if err:
        return {'team': team_num, 'error': err, 'score': 0}

    already_matched = set()
    matched = []
    novel = []
    total_points = 0

    for tc in tcs:
        best, score = match_scenario(tc, master_scenarios, already_matched)
        quality = assess_quality(tc)
        cat = (tc.get('Category', '') or 'functional').lower().replace(' ', '_')
        cat_weight = CATEGORY_WEIGHTS.get(cat, 1.0)
        pri = (tc.get('Priority', '') or 'medium').lower()
        pri_weight = PRIORITY_WEIGHTS.get(pri, 3)

        if best and score >= 0.32:
            already_matched.add(best['id'])
            points = round(pri_weight * cat_weight * quality * min(score * 1.5, 1.0), 2)
            total_points += points
            matched.append({
                'tc_id': tc.get('TC_ID', '?'),
                'tc_title': tc.get('Title', ''),
                'master_id': best['id'],
                'master_title': best['title'],
                'confidence': round(score, 3),
                'quality': round(quality, 2),
                'points': points
            })
        else:
            bonus = round(2 * quality, 2)
            total_points += bonus
            novel.append({
                'tc_id': tc.get('TC_ID', '?'),
                'tc_title': tc.get('Title', ''),
                'quality': round(quality, 2),
                'points': bonus,
                'note': 'Novel / unmatched scenario'
            })

    # Category distribution bonus
    categories_covered = set()
    for tc in tcs:
        cat = (tc.get('Category', '') or '').lower().replace(' ', '_')
        if cat:
            categories_covered.add(cat)
    diversity_bonus = len(categories_covered) * 2

    max_possible = sum(PRIORITY_WEIGHTS.get(ms.get('priority', 'medium'), 3) *
                       CATEGORY_WEIGHTS.get(ms.get('category', 'functional'), 1.0)
                       for ms in master_scenarios)
    raw = total_points + diversity_bonus
    normalized = round((raw / max_possible) * MAX_TC_SCORE, 1) if max_possible > 0 else 0
    final_score = min(normalized, MAX_TC_SCORE)

    return {
        'team': team_num,
        'testcases_submitted': len(tcs),
        'scenarios_matched': len(matched),
        'novel_testcases': len(novel),
        'master_coverage': f"{len(matched)}/{len(master_scenarios)}",
        'categories_covered': sorted(categories_covered),
        'diversity_bonus': diversity_bonus,
        'raw_points': round(raw, 1),
        'normalized_score': final_score,
        'matched': matched,
        'novel': novel
    }


def main():
    parser = argparse.ArgumentParser(description='Evaluate test cases for QA Hackathon')
    parser.add_argument('--team', type=int, help='Team number (1-6)')
    parser.add_argument('--all', action='store_true', help='Evaluate all teams')
    args = parser.parse_args()

    master = load_master_scenarios()
    results = []

    if args.all:
        for t in range(1, 7):
            results.append(evaluate_team(t, master))
    elif args.team:
        results.append(evaluate_team(args.team, master))
    else:
        parser.print_help()
        sys.exit(1)

    out_dir = os.path.join(ROOT_DIR, 'judging')
    os.makedirs(out_dir, exist_ok=True)

    for r in results:
        team_num = r['team']
        out_path = os.path.join(out_dir, f'team-{team_num}-testcases.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(r, f, indent=2)
        print(f"Team {team_num}: {r.get('normalized_score', 0)}/250 "
              f"({r.get('scenarios_matched', 0)} matched, {r.get('novel_testcases', 0)} novel)")
        if r.get('error'):
            print(f"  ⚠ {r['error']}")

    if len(results) > 1:
        summary_path = os.path.join(out_dir, 'testcases-summary.json')
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump([{'team': r['team'], 'score': r.get('normalized_score', 0),
                        'matched': r.get('scenarios_matched', 0)} for r in results], f, indent=2)
        print(f"\nSummary saved to {summary_path}")


if __name__ == '__main__':
    main()
