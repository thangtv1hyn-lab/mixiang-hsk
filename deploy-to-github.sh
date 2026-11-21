#!/bin/bash
set -e

DEFAULT_REPO="https://github.com/thangtv1hyn-lab/mixiang-hsk.git"

echo "=================================================="
echo "     ĐẨY CODE LÊN GITHUB DỰ ÁN MIXIANGG HSK"
echo "=================================================="
echo ""
echo "Nhấn Enter để dùng repo mặc định ($DEFAULT_REPO) hoặc nhập link mới:"
read -r REPO_URL
REPO_URL="${REPO_URL:-$DEFAULT_REPO}"

if [ ! -d ".git" ]; then
  echo "Khởi tạo Git repository mới..."
  git init -b main
fi

git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"
git branch -M main

git add -A
if ! git diff --cached --quiet; then
  git commit -m "feat: update MiXiangg HSK admin dashboard, free Gemini AI features, and Render config"
else
  echo "Không có thay đổi mới cần commit."
fi

echo "Đang đẩy mã nguồn lên nhánh main của GitHub ($REPO_URL)..."
git push -u origin main

echo ""
echo "✅ ĐÃ ĐẨY CODE LÊN GITHUB THÀNH CÔNG!"
echo "Render.com sẽ tự động build & deploy nếu đã bật Auto-Deploy."
