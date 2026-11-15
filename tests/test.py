import argparse
import os
import subprocess
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)


def parse_args():
    parser = argparse.ArgumentParser(description="NLP2026 Test Suite Runner")
    parser.add_argument("--run", type=str, help="Specific test script name or number to run")
    parser.add_argument("--all", action="store_true", help="Run all test scripts in sequence")
    return parser.parse_args()


def run_script(script_name):
    script_path = os.path.join(CURRENT_DIR, script_name)
    print(f"\n[*] Running: {script_name}")
    print("=" * 50)
    result = subprocess.run([sys.executable, script_path], cwd=PROJECT_ROOT)
    return result.returncode


def main():
    args = parse_args()
    test_files = [f for f in sorted(os.listdir(CURRENT_DIR)) if f.endswith('.py') and f != 'test.py']

    if not test_files:
        print("[!] No test scripts found in tests/ directory.")
        return

    if args.all:
        print("=" * 50)
        print("      RUNNING ALL NLP2026 TESTS")
        print("=" * 50)
        failures = []
        for f in test_files:
            code = run_script(f)
            if code != 0:
                failures.append(f)
        print("\n" + "=" * 50)
        if failures:
            print(f"[!] Tests failed: {', '.join(failures)}")
            sys.exit(1)
        else:
            print("[+] All tests passed successfully!")
            return

    if args.run:
        target = args.run.strip()
        if target.isdigit():
            idx = int(target)
            if 1 <= idx <= len(test_files):
                sys.exit(run_script(test_files[idx - 1]))
            else:
                print(f"[!] Test number {idx} out of range (1-{len(test_files)}).")
                sys.exit(1)
        else:
            if target in test_files:
                sys.exit(run_script(target))
            else:
                print(f"[!] Test script '{target}' not found.")
                sys.exit(1)

    print("=" * 50)
    print("      NLP2026 TEST SUITE RUNNER")
    print("=" * 50)
    for i, f in enumerate(test_files, 1):
        print(f" [{i}] {f}")
    print(" [0] Exit")

    try:
        raw_input = input("\nSelect a test script to execute (number): ").strip()
        if not raw_input or raw_input == '0':
            print("Exiting.")
            return

        choice = int(raw_input)
        if 1 <= choice <= len(test_files):
            run_script(test_files[choice - 1])
        else:
            print("[!] Invalid selection.")
    except ValueError:
        print("[!] Please enter a valid integer.")
    except KeyboardInterrupt:
        print("\n[!] Execution canceled.")


if __name__ == "__main__":
    main()
