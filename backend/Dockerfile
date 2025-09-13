# Use Python 3.11 Alpine image
FROM python:3.11-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache gcc musl-dev

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Create instance directory
RUN mkdir -p instance

# Expose port
EXPOSE 5001

# Start the application
CMD ["python", "app.py"]
