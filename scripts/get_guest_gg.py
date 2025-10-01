import csv
import requests
import sys

CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQRRyn7JQqc-Ve6vONQBKVIws9xjqnTZO_PNLY2DWPc9t8OPIZBa1f-oe-wc59p1h6ZIHKXa07o2hgj/pub?gid=0&single=true&output=csv"

def fetch_guest_csv(url: str):
    resp = requests.get(url)
    resp.raise_for_status()
    # Ensure proper UTF-8 encoding for Vietnamese characters
    resp.encoding = 'utf-8'
    return resp.text

def parse_csv_data(csv_text: str):
    lines = csv_text.splitlines()
    # Skip first 2 rows (summary data) and use row 3 as headers
    if len(lines) < 3:
        return []
    
    # Start reading from line 3 (index 2) which contains actual headers
    reader = csv.DictReader(lines[2:])
    guests = []
    
    for row in reader:
        # Filter out empty rows (all values are None or empty)
        if any(value and value.strip() for value in row.values()):
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
