import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os

class ImageCropperApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Công cụ Crop Ảnh Nhanh")
        self.root.geometry("800x600")

        # Các biến lưu trữ trạng thái
        self.file_path = None
        self.original_image = None
        self.display_image = None
        self.scale_ratio = 1.0

        # Tọa độ vùng crop trên màn hình
        self.start_x = None
        self.start_y = None
        self.rect_id = None

        self.setup_gui()

    def setup_gui(self):
        # Khu vực nút bấm
        btn_frame = tk.Frame(self.root, pady=10)
        btn_frame.pack(side=tk.TOP, fill=tk.X)

        self.btn_open = tk.Button(btn_frame, text="Mở ảnh", command=self.open_image, width=15)
        self.btn_open.pack(side=tk.LEFT, padx=10)

        self.btn_crop = tk.Button(btn_frame, text="Crop & Lưu", command=self.crop_and_save, width=15, state=tk.DISABLED)
        self.btn_crop.pack(side=tk.LEFT, padx=10)
        
        self.lbl_info = tk.Label(btn_frame, text="Hãy mở một bức ảnh để bắt đầu.", fg="blue")
        self.lbl_info.pack(side=tk.LEFT, padx=20)

        # Khu vực hiển thị ảnh (Canvas)
        self.canvas = tk.Canvas(self.root, bg="gray", cursor="cross")
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Gắn các sự kiện chuột vào Canvas
        self.canvas.bind("<ButtonPress-1>", self.on_button_press)
        self.canvas.bind("<B1-Motion>", self.on_mouse_drag)

    def open_image(self):
        # Mở hộp thoại chọn file
        file_path = filedialog.askopenfilename(
            title="Chọn ảnh",
            filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.bmp")]
        )
        if not file_path:
            return

        self.file_path = file_path
        self.original_image = Image.open(file_path)
        
        # Cập nhật Canvas và hiển thị ảnh
        self.update_canvas_image()
        self.btn_crop.config(state=tk.NORMAL)
        self.lbl_info.config(text="Kéo chuột trên ảnh để chọn vùng cần crop.")
        
        # Xóa khung crop cũ nếu có
        if self.rect_id:
            self.canvas.delete(self.rect_id)
            self.rect_id = None

    def update_canvas_image(self):
        # Lấy kích thước hiện tại của Canvas
        self.canvas.update()
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()

        img_width, img_height = self.original_image.size

        # Tính toán tỷ lệ thu nhỏ để ảnh vừa với màn hình nhưng giữ nguyên tỷ lệ khung hình
        scale_w = canvas_width / img_width
        scale_h = canvas_height / img_height
        self.scale_ratio = min(scale_w, scale_h)

        # Nếu ảnh nhỏ hơn màn hình, không cần phóng to (giữ scale = 1.0)
        if self.scale_ratio > 1.0:
            self.scale_ratio = 1.0

        new_width = int(img_width * self.scale_ratio)
        new_height = int(img_height * self.scale_ratio)

        # Resize ảnh để hiển thị (Dùng LANCZOS để ảnh hiển thị nét)
        resized_img = self.original_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        self.display_image = ImageTk.PhotoImage(resized_img)

        self.canvas.delete("all") # Xóa ảnh cũ
        # Canh giữa ảnh trên canvas
        self.img_x = (canvas_width - new_width) // 2
        self.img_y = (canvas_height - new_height) // 2
        
        self.canvas.create_image(self.img_x, self.img_y, anchor=tk.NW, image=self.display_image)

    def on_button_press(self, event):
        # Ghi nhận tọa độ chuột khi bắt đầu nhấn
        self.start_x = event.x
        self.start_y = event.y

        # Nếu đã có khung vẽ từ trước thì xóa đi
        if self.rect_id:
            self.canvas.delete(self.rect_id)
            
        self.rect_id = self.canvas.create_rectangle(
            self.start_x, self.start_y, 1, 1, outline='red', width=2, dash=(4, 2)
        )

    def on_mouse_drag(self, event):
        # Cập nhật kích thước khung chữ nhật khi kéo chuột
        cur_x, cur_y = (event.x, event.y)
        self.canvas.coords(self.rect_id, self.start_x, self.start_y, cur_x, cur_y)

    def crop_and_save(self):
        if not self.rect_id:
            messagebox.showwarning("Cảnh báo", "Bạn chưa vẽ vùng cần crop!")
            return

        # Lấy tọa độ của khung chữ nhật trên màn hình
        coords = self.canvas.coords(self.rect_id)
        if not coords:
            return
            
        x1, y1, x2, y2 = coords

        # Đảm bảo x1, y1 luôn là góc trên bên trái
        x_min, y_min = min(x1, x2), min(y1, y2)
        x_max, y_max = max(x1, x2), max(y1, y2)

        # Trừ đi khoảng offset (do canh giữa ảnh trên màn hình)
        x_min_adj = x_min - self.img_x
        y_min_adj = y_min - self.img_y
        x_max_adj = x_max - self.img_x
        y_max_adj = y_max - self.img_y

        # Áp dụng tỷ lệ scale để tìm ra tọa độ thật trên bức ảnh gốc
        real_x1 = max(0, int(x_min_adj / self.scale_ratio))
        real_y1 = max(0, int(y_min_adj / self.scale_ratio))
        real_x2 = min(self.original_image.width, int(x_max_adj / self.scale_ratio))
        real_y2 = min(self.original_image.height, int(y_max_adj / self.scale_ratio))

        # Nếu vùng crop quá nhỏ hoặc bị lật ngược thì bỏ qua
        if real_x2 <= real_x1 or real_y2 <= real_y1:
            messagebox.showerror("Lỗi", "Vùng crop không hợp lệ.")
            return

        # Thực hiện crop trên ảnh gốc
        cropped_img = self.original_image.crop((real_x1, real_y1, real_x2, real_y2))

        # === TẠO TÊN FILE VÀ LƯU ===
        directory, original_filename = os.path.split(self.file_path)
        base_name, _ = os.path.splitext(original_filename)

        count = 1
        while True:
            # Tạo format: [tên gốc]_crop[count].png
            save_name = f"{base_name}_crop{count}.png"
            save_path = os.path.join(directory, save_name)
            
            # Kiểm tra xem file đã tồn tại chưa
            if not os.path.exists(save_path):
                break
            count += 1

        cropped_img.save(save_path, "PNG")
        self.lbl_info.config(text=f"Đã lưu thành công: {save_name}", fg="green")
        messagebox.showinfo("Thành công", f"Ảnh đã được lưu tại:\n{save_path}")

if __name__ == "__main__":
    root = tk.Tk()
    app = ImageCropperApp(root)
    root.mainloop()