import os
import subprocess
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)


def main():
    test_files = [f for f in sorted(os.listdir(CURRENT_DIR)) if f.endswith('.py') and f != 'test.py']

    if not test_files:
        print("[!] No test scripts found in tests/ directory.")
        return

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
            selected_script = test_files[choice - 1]
            script_path = os.path.join(CURRENT_DIR, selected_script)
            print(f"\n[*] Running: {selected_script}")
            print("=" * 50)

            # Run with PROJECT_ROOT as working directory
            subprocess.run([sys.executable, script_path], cwd=PROJECT_ROOT)
        else:
            print("[!] Invalid selection.")
    except ValueError:
        print("[!] Please enter a valid integer.")
    except KeyboardInterrupt:
        print("\n[!] Execution canceled.")


if __name__ == "__main__":
    main()
