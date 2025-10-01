import csv
import requests
import sys

CSV_URL = "https://docs.google.com/spreadsheets/d/1r489l9sbIdbuEeRw0FT-vknamclIkkDmc-h1QMEVvbA/export?format=csv&gid=0"

def fetch_guest_csv(url: str):
    resp = requests.get(url)
    resp.raise_for_status()
    # Ensure proper UTF-8 encoding for Vietnamese characters
    resp.encoding = 'utf-8'
    return resp.text

def parse_csv_data(csv_text: str):
    lines = csv_text.splitlines()
    if len(lines) < 1:
        return []
    
    # Try to detect if we need to skip rows by checking the first few lines
    header_line = 0
    for i, line in enumerate(lines[:3]):
        if 'name' in line.lower() or 'title' in line.lower() or 'email' in line.lower():
            header_line = i
            break
    
    # Start reading from the detected header line
    reader = csv.DictReader(lines[header_line:])
    guests = []
    
    for row in reader:
        # Filter out empty rows and handle list values
        has_data = False
        for key, value in row.items():
            if value:
                if isinstance(value, list):
                    # Convert list to string
                    value = ' '.join(str(v) for v in value if v)
                if str(value).strip():
                    has_data = True
                    break
        
        if has_data:
            guests.append(row)
    
    return guests

def main():
    try:
        csv_text = fetch_guest_csv(CSV_URL)
        guests = parse_csv_data(csv_text)
        print(f"Fetched {len(guests)} guests.")
        for guest in guests:
            print(guest)
    except Exception as e:
        print(f"Error fetching or parsing guest data: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
