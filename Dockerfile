# SMOG Demo - 靜態網頁服務
FROM nginx:alpine

# 複製整個 demo-a 到 nginx 根目錄
COPY demo-a/ /usr/share/nginx/html/

# 預設 80 port（給 nginx 容器內部）
EXPOSE 80
