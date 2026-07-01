FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x ./entrypoint.sh

EXPOSE 8000

# entrypoint.sh 會先跑 alembic upgrade head 再 exec uvicorn
CMD ["./entrypoint.sh"]
