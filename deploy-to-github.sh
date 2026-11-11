#!/bin/bash
# Script đẩy code lên GitHub tự động cho MiXiang HSK
echo "=================================================="
echo "      HƯỚNG DẪN ĐẨY CODE LÊN GITHUB DỰ ÁN MIXIANG"
echo "=================================================="
echo ""
echo "Nhập link GitHub Repository của bạn (ví dụ: https://github.com/your-username/mixiang-hsk.git):"
read -r REPO_URL

if [ -z "$REPO_URL" ]; then
  echo "Lỗi: Bạn chưa nhập URL repository!"
  exit 1
fi

git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git branch -M main
echo "Đang đẩy mã nguồn lên nhánh main của GitHub..."
git push -u origin main

echo ""
echo "✅ ĐÃ ĐẨY CODE LÊN GITHUB THÀNH CÔNG!"
echo "Bây giờ bạn chỉ cần vào Render.com -> New Web Service -> Chọn repo này để triển khai."
