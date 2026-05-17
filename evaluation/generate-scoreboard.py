"""
MediCare Clinic QA Hackathon — Scoreboard Generator

Aggregates scores from all evaluation scripts and produces a final
scoreboard with rankings.

Usage:
    python generate-scoreboard.py

Reads from judging/ directory and outputs a final scoreboard.
"""
import json
import os
import sys
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
JUDGING_DIR = os.path.join(ROOT_DIR, 'judging')

CATEGORIES = {
    'bugs': {'max': 300, 'weight': 0.30, 'file': 'team-{}-bugs.json', 'key': 'normalized_score'},
    'testcases': {'max': 250, 'weight': 0.25, 'file': 'team-{}-testcases.json', 'key': 'normalized_score'},
    'automation': {'max': 200, 'weight': 0.20, 'file': 'team-{}-automation.json', 'key': 'normalized_score'},
}

# Demo/strategy and AI tool usage are manually scored via judge scorecard
MANUAL_CATEGORIES = {
    'demo_strategy': {'max': 150, 'weight': 0.15},
    'ai_tool_usage': {'max': 100, 'weight': 0.10},
}


def load_score(team_num, category):
    filename = CATEGORIES[category]['file'].format(team_num)
    filepath = os.path.join(JUDGING_DIR, filename)
    if not os.path.exists(filepath):
        return 0, {}
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get(CATEGORIES[category]['key'], 0), data


def load_manual_scores(team_num):
    """Load manually entered judge scores if available."""
    filepath = os.path.join(JUDGING_DIR, f'team-{team_num}-manual.json')
    if not os.path.exists(filepath):
        return {}
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def build_explanation(cat, score, max_score, raw_data):
    """Build a human-readable justification for a score."""
    if not raw_data or score == 0:
        return "No submission found."

    if cat == 'bugs':
        submitted = raw_data.get('bugs_submitted', 0)
        matched = raw_data.get('bugs_matched', 0)
        novel = raw_data.get('bugs_novel', 0) or len(raw_data.get('unmatched', []))
        coverage = raw_data.get('master_coverage', '0/29')
        return (f"Submitted {submitted} bugs. {matched} matched known issues ({coverage} master coverage), "
                f"{novel} novel findings. Score: {score}/{max_score}.")
    elif cat == 'testcases':
        submitted = raw_data.get('testcases_submitted', 0)
        matched = raw_data.get('scenarios_matched', 0)
        novel = raw_data.get('novel_testcases', 0)
        coverage = raw_data.get('master_coverage', '0/50')
        cats = raw_data.get('categories_covered', [])
        return (f"Submitted {submitted} test cases. {matched} matched master scenarios ({coverage} coverage), "
                f"{novel} novel. Categories covered: {', '.join(cats) if cats else 'none'}. Score: {score}/{max_score}.")
    elif cat == 'automation':
        files = raw_data.get('files_found', 0)
        assertions = raw_data.get('total_assertions', 0)
        return (f"Found {files} automation files with {assertions} assertions. Score: {score}/{max_score}.")
    return f"Score: {score}/{max_score}."


def generate_scoreboard():
    teams = []

    for t in range(1, 7):
        team = {
            'team': t,
            'team_name': f'Team {t}',
            'scores': {},
            'explanations': {},
            'total': 0,
            'bonus': 0,
        }

        # Automated scores
        for cat, cfg in CATEGORIES.items():
            score, raw_data = load_score(t, cat)
            team['scores'][cat] = round(score, 1)
            team['explanations'][cat] = build_explanation(cat, round(score, 1), cfg['max'], raw_data)
            team['total'] += score

        # Manual scores
        manual = load_manual_scores(t)
        for cat, cfg in MANUAL_CATEGORIES.items():
            score = manual.get(cat, 0)
            team['scores'][cat] = score
            team['total'] += score

        # Bonus points
        team['bonus'] = manual.get('bonus', 0)
        team['total'] += team['bonus']
        team['total'] = round(team['total'], 1)

        teams.append(team)

    # Sort by total descending
    teams.sort(key=lambda x: x['total'], reverse=True)

    # Add rank
    for i, team in enumerate(teams):
        team['rank'] = i + 1

    return teams


def print_scoreboard(teams):
    print("\n" + "=" * 80)
    print("  🏆  MediCare Clinic QA Hackathon — FINAL SCOREBOARD")
    print("=" * 80)
    print(f"\n  Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    header = f"{'Rank':>4} {'Team':<10} {'Bugs':>8} {'Tests':>8} {'TOTAL':>8}"
    print(header)
    print("-" * 80)

    for t in teams:
        s = t['scores']
        row = (f"{t['rank']:>4} {t['team_name']:<10} "
               f"{s.get('bugs', 0):>7.1f} "
               f"{s.get('testcases', 0):>7.1f} "
               f"{t['total']:>7.1f}")
        print(row)

    print("-" * 80)
    print(f"\n  Max possible: Bugs 300 + Tests 250 = 550\n")


def main():
    teams = generate_scoreboard()
    print_scoreboard(teams)

    # Save JSON
    out_path = os.path.join(JUDGING_DIR, 'final-scoreboard.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            'generated': datetime.now().isoformat(),
            'teams': teams
        }, f, indent=2)
    print(f"  Scoreboard saved to: {out_path}\n")

    # Save HTML scoreboard
    html = generate_html(teams)
    html_path = os.path.join(JUDGING_DIR, 'scoreboard.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  HTML scoreboard saved to: {html_path}")


def generate_html(teams):
    # Build downloadable JSON data
    download_data = []
    for t in teams:
        s = t['scores']
        entry = {
            'team_id': t['team'],
            'team_name': t['team_name'],
            'scores': [
                {
                    'column': 'Bugs',
                    'max_marks': 300,
                    'actual_marks': s.get('bugs', 0),
                    'explanation': t.get('explanations', {}).get('bugs', '')
                },
                {
                    'column': 'Test Cases',
                    'max_marks': 250,
                    'actual_marks': s.get('testcases', 0),
                    'explanation': t.get('explanations', {}).get('testcases', '')
                }
            ],
            'total': t['total']
        }
        download_data.append(entry)
    download_json_str = json.dumps(download_data, indent=2)

    # Build table rows
    rows = ''
    medals = {1: '🥇', 2: '🥈', 3: '🥉'}
    for t in teams:
        s = t['scores']
        medal = medals.get(t['rank'], '')
        winner_cls = 'winner' if t['rank'] == 1 else ''
        bug_exp = t.get('explanations', {}).get('bugs', '')
        tc_exp = t.get('explanations', {}).get('testcases', '')
        rows += (
            f'<tr class="{winner_cls}">'
            f'<td>{medal} {t["rank"]}</td>'
            f'<td><strong>{t["team_name"]}</strong></td>'
            f'<td>{s.get("bugs", 0):.1f}</td>'
            f'<td>{s.get("testcases", 0):.1f}</td>'
            f'<td><strong>{t["total"]:.1f}</strong></td>'
            f'</tr>'
            f'<tr class="explanation-row">'
            f'<td></td>'
            f'<td colspan="4" class="explanation">'
            f'<div><span class="exp-label">Bugs:</span> {bug_exp}</div>'
            f'<div><span class="exp-label">Tests:</span> {tc_exp}</div>'
            f'</td>'
            f'</tr>'
        )

    generated = datetime.now().strftime('%Y-%m-%d %H:%M')

    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>QA Hackathon Scoreboard</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px; }
  h1 { text-align: center; font-size: 2rem; margin-bottom: 8px; }
  .subtitle { text-align: center; color: #94a3b8; margin-bottom: 30px; }
  table { width: 100%; max-width: 900px; margin: 0 auto; border-collapse: collapse; }
  th { background: #1e293b; padding: 12px 16px; text-align: center; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
  td { padding: 12px 16px; text-align: center; border-bottom: 1px solid #1e293b; }
  tr:hover { background: #1e293b; }
  tr.winner td { background: rgba(234, 179, 8, 0.1); }
  tr.explanation-row td { text-align: left; padding: 4px 16px 16px; }
  tr.explanation-row:hover { background: transparent; }
  .explanation { font-size: 0.82rem; color: #94a3b8; line-height: 1.6; }
  .explanation div { margin-bottom: 2px; }
  .exp-label { color: #60a5fa; font-weight: 600; }
  .max { color: #64748b; font-size: 0.75rem; display: block; }
  .toolbar { text-align: center; margin: 24px auto; max-width: 900px; }
  .btn { background: #3b82f6; color: #fff; border: none; padding: 10px 24px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600; }
  .btn:hover { background: #2563eb; }
</style>
</head>
<body>
<h1>🏆 MediCare Clinic QA Hackathon</h1>
<p class="subtitle">Final Scoreboard — Generated """ + generated + """</p>
<table>
<thead><tr>
  <th>Rank</th><th>Team</th>
  <th>Bugs<span class="max">/300</span></th>
  <th>Tests<span class="max">/250</span></th>
  <th>Total<span class="max">/550</span></th>
</tr></thead>
<tbody>""" + rows + """</tbody>
</table>
<div class="toolbar">
  <button class="btn" onclick="downloadResults()">⬇ Download Results JSON</button>
</div>
<script>
const resultsData = """ + download_json_str + """;
function downloadResults() {
  const blob = new Blob([JSON.stringify(resultsData, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hackathon-results.json';
  a.click();
  URL.revokeObjectURL(url);
}
</script>
</body>
</html>"""
    return html


if __name__ == '__main__':
    main()
