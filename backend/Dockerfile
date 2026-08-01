FROM python:3.13-slim

WORKDIR /app

# WeasyPrint 需要 pango/cairo 系統庫才能產生 PDF，缺少時 report_generator
# 會靜默退回 HTML；fonts-noto-cjk 提供報告的中文字型。
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpango-1.0-0 \
        libpangoft2-1.0-0 \
        libharfbuzz-subset0 \
        fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

# entrypoint.sh 會先跑 alembic upgrade head 再 exec uvicorn
CMD ["./entrypoint.sh"]
