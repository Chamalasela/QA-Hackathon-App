"""
MediCare Clinic QA Hackathon — UI Automation Evaluator

Evaluates team-submitted Selenium/Playwright/Cypress automation scripts.
Checks for: file existence, code structure, page coverage, assertion patterns.

Usage:
    python evaluate-automation.py --team <team-number>
    python evaluate-automation.py --all
"""
import os
import re
import sys
import json
import argparse
import glob

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)

MAX_AUTOMATION_SCORE = 200

# Patterns to detect in automation code
FRAMEWORK_PATTERNS = {
    'selenium': [r'from\s+selenium', r'webdriver\.', r'find_element', r'WebDriverWait'],
    'playwright': [r'from\s+playwright', r'page\.goto', r'page\.click', r'page\.fill', r'expect\(page'],
    'cypress': [r'cy\.visit', r'cy\.get', r'cy\.contains', r'describe\(', r'it\('],
    'pytest': [r'import\s+pytest', r'def\s+test_', r'@pytest'],
    'jest': [r'describe\(', r'test\(', r'expect\(', r'it\('],
}

# Page/feature coverage detection
PAGE_PATTERNS = {
    'login': [r'login', r'sign.?in', r'email.*password', r'/login'],
    'register': [r'register', r'sign.?up', r'/register'],
    'patients': [r'patient', r'/patients'],
    'appointments': [r'appointment', r'book.*appointment', r'/appointments', r'/book'],
    'doctors': [r'doctor', r'/doctor'],
    'billing': [r'billing', r'invoice', r'/billing'],
}

ASSERTION_PATTERNS = [
    r'assert\s', r'assertEqual', r'assertTrue', r'assertIn',
    r'expect\(', r'should\(', r'\.to\.', r'\.toBe\(',
    r'assert_that', r'verify', r'check',
]

BUG_DETECTION_PATTERNS = {
    'xss': [r'<script', r'xss', r'dangerouslySetInnerHTML', r'injection', r'sanitiz'],
    'auth': [r'unauthorized', r'403', r'401', r'idor', r'access.?control'],
    'validation': [r'invalid', r'validation', r'required', r'boundary', r'negative'],
    'data_exposure': [r'ssn', r'password', r'social.?security', r'sensitive'],
}


def find_automation_files(team_num):
    """Find all potential automation script files in team submission."""
    team_dir = os.path.join(ROOT_DIR, 'submissions', f'team-{team_num}')
    if not os.path.isdir(team_dir):
        return [], f"Team directory not found: {team_dir}"

    patterns = ['**/*.py', '**/*.js', '**/*.ts', '**/*.spec.*', '**/*.test.*']
    files = []
    for pat in patterns:
        files.extend(glob.glob(os.path.join(team_dir, pat), recursive=True))

    # Filter out non-test files
    test_files = [f for f in files if any(kw in f.lower() for kw in
                  ['test', 'spec', 'automation', 'e2e', 'selenium', 'playwright', 'cypress'])]

    # If no test-named files, include all .py/.js files
    if not test_files:
        test_files = files

    return test_files, None


def analyze_file(filepath):
    """Analyze a single automation file."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return {}

    analysis = {
        'file': os.path.basename(filepath),
        'lines': content.count('\n') + 1,
        'frameworks': [],
        'pages_covered': [],
        'assertion_count': 0,
        'bug_categories_tested': [],
    }

    content_lower = content.lower()

    # Detect frameworks
    for fw, patterns in FRAMEWORK_PATTERNS.items():
        if any(re.search(p, content, re.IGNORECASE) for p in patterns):
            analysis['frameworks'].append(fw)

    # Detect page coverage
    for page, patterns in PAGE_PATTERNS.items():
        if any(re.search(p, content_lower) for p in patterns):
            analysis['pages_covered'].append(page)

    # Count assertions
    for pat in ASSERTION_PATTERNS:
        analysis['assertion_count'] += len(re.findall(pat, content, re.IGNORECASE))

    # Detect bug category testing
    for cat, patterns in BUG_DETECTION_PATTERNS.items():
        if any(re.search(p, content_lower) for p in patterns):
            analysis['bug_categories_tested'].append(cat)

    return analysis


def evaluate_team(team_num):
    files, err = find_automation_files(team_num)
    if err:
        return {'team': team_num, 'error': err, 'score': 0}
    if not files:
        return {'team': team_num, 'error': 'No automation files found', 'score': 0}

    analyses = [analyze_file(f) for f in files]
    analyses = [a for a in analyses if a]

    # Aggregate metrics
    total_lines = sum(a.get('lines', 0) for a in analyses)
    all_frameworks = list(set(fw for a in analyses for fw in a.get('frameworks', [])))
    all_pages = list(set(p for a in analyses for p in a.get('pages_covered', [])))
    total_assertions = sum(a.get('assertion_count', 0) for a in analyses)
    all_bug_cats = list(set(c for a in analyses for c in a.get('bug_categories_tested', [])))

    # Scoring
    score = 0

    # Framework usage (max 30)
    score += min(len(all_frameworks) * 15, 30)

    # Page coverage (max 60) — 6 pages, 10 pts each
    score += len(all_pages) * 10

    # Assertion density (max 40)
    if total_assertions >= 20:
        score += 40
    elif total_assertions >= 10:
        score += 30
    elif total_assertions >= 5:
        score += 20
    elif total_assertions >= 1:
        score += 10

    # Code volume (max 30) — proxy for effort
    if total_lines >= 300:
        score += 30
    elif total_lines >= 150:
        score += 20
    elif total_lines >= 50:
        score += 10

    # Bug-specific tests (max 40)
    score += len(all_bug_cats) * 10

    final_score = min(score, MAX_AUTOMATION_SCORE)

    return {
        'team': team_num,
        'files_found': len(files),
        'total_lines': total_lines,
        'frameworks': all_frameworks,
        'pages_covered': all_pages,
        'assertion_count': total_assertions,
        'bug_categories_tested': all_bug_cats,
        'score_breakdown': {
            'framework': min(len(all_frameworks) * 15, 30),
            'page_coverage': len(all_pages) * 10,
            'assertions': min(40, max(0, (total_assertions // 5) * 10)),
            'code_volume': min(30, (total_lines // 50) * 10),
            'bug_testing': len(all_bug_cats) * 10,
        },
        'normalized_score': final_score,
        'file_details': analyses
    }


def main():
    parser = argparse.ArgumentParser(description='Evaluate automation scripts for QA Hackathon')
    parser.add_argument('--team', type=int, help='Team number (1-6)')
    parser.add_argument('--all', action='store_true', help='Evaluate all teams')
    args = parser.parse_args()

    results = []
    if args.all:
        for t in range(1, 7):
            results.append(evaluate_team(t))
    elif args.team:
        results.append(evaluate_team(args.team))
    else:
        parser.print_help()
        sys.exit(1)

    out_dir = os.path.join(ROOT_DIR, 'judging')
    os.makedirs(out_dir, exist_ok=True)

    for r in results:
        team_num = r['team']
        out_path = os.path.join(out_dir, f'team-{team_num}-automation.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(r, f, indent=2)
        print(f"Team {team_num}: {r.get('normalized_score', 0)}/200 "
              f"({r.get('files_found', 0)} files, {r.get('assertion_count', 0)} assertions)")
        if r.get('error'):
            print(f"  ⚠ {r['error']}")


if __name__ == '__main__':
    main()
