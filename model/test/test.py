import os
import subprocess
import sys

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    
    test_files = [f for f in sorted(os.listdir(current_dir)) if f.endswith('.py') and f != 'test.py']
    
    if not test_files:
        print("Không tìm thấy file test nào.")
        return

    print("=== DANH SÁCH CÁC SCRIPT TEST ===")
    for i, f in enumerate(test_files, 1):
        print(f"{i}. {f}")
    print("0. Thoát")
    
    try:
        choice = int(input("\nChọn script để chạy (nhập số): "))
        if choice == 0:
            return
        if 1 <= choice <= len(test_files):
            selected_script = test_files[choice - 1]
            script_path = os.path.join(current_dir, selected_script)
            print(f"\n[*] Đang chạy {selected_script}...\n" + "="*50)
            
            # Chạy script với working directory là thư mục model để giữ nguyên các đường dẫn tương đối
            subprocess.run([sys.executable, script_path], cwd=parent_dir)
        else:
            print("Lựa chọn không hợp lệ.")
    except ValueError:
        print("Vui lòng nhập một số hợp lệ.")
    except KeyboardInterrupt:
        print("\nĐã hủy.")

if __name__ == "__main__":
    main()
