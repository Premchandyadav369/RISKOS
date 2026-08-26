FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy all application code
COPY . .

ENV PYTHONPATH=.
EXPOSE 8000

CMD ["python", "backend/run.py"]
