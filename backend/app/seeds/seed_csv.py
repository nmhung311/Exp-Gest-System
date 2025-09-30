#!/usr/bin/env python3
"""
CSV seeding script for EXP Guest Management System
Reads guest data from Google Sheets CSV and seeds the database
"""
import os
import sys
import csv
import argparse
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

# Add backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from app.db.session import SessionLocal
from app.models import Event, Guest, User, Role
from app.utils.http import fetch_csv, save_snapshot, load_snapshot
from app.seeds.mapping import (
    COLUMN_MAP, REQUIRED, UNIQUE_KEYS, DEFAULTS, 
    VALIDATION_RULES, EVENT_MAPPING, HOST_MAPPING
)
from app.seeds.validators import (
    validate_headers, normalize_row, validate_row, 
    validate_event_data, validate_host_data, ValidationError
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CSVSeeder:
    """Main class for CSV seeding operations"""
    
    def __init__(self, dry_run: bool = False, stop_on_error: bool = False):
        self.dry_run = dry_run
        self.stop_on_error = stop_on_error
        self.stats = {
            'total_rows': 0,
            'valid_rows': 0,
            'inserted': 0,
            'updated': 0,
            'skipped': 0,
            'errors': 0
        }
        self.error_log = []
    
    def load_csv_data(self, csv_url: Optional[str] = None, csv_file: Optional[str] = None) -> bytes:
        """
        Load CSV data from URL or file
        
        Args:
            csv_url: URL to fetch CSV from
            csv_file: Local CSV file path
            
        Returns:
            CSV content as bytes
        """
        if csv_file and os.path.exists(csv_file):
            logger.info(f"Loading CSV from local file: {csv_file}")
            with open(csv_file, 'rb') as f:
                return f.read()
        
        if csv_url:
            logger.info(f"Fetching CSV from URL: {csv_url}")
            timeout = int(os.getenv('SEED_TIMEOUT', '30'))
            return fetch_csv(csv_url, timeout)
        
        # Fallback to snapshot
        snapshot_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'seed', 'snapshot_guests_v1.csv')
        if os.path.exists(snapshot_path):
            logger.info(f"Loading CSV from snapshot: {snapshot_path}")
            with open(snapshot_path, 'rb') as f:
                return f.read()
        
        raise ValueError("No CSV source available. Provide URL, file, or ensure snapshot exists.")
    
    def parse_csv(self, csv_content: bytes) -> List[Dict[str, str]]:
        """
        Parse CSV content into list of dictionaries
        
        Args:
            csv_content: Raw CSV content
            
        Returns:
            List of parsed rows
        """
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    text = csv_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError("Could not decode CSV content with any supported encoding")
            
            # Parse CSV
            reader = csv.DictReader(text.splitlines())
            rows = list(reader)
            
            if not rows:
                raise ValueError("CSV file is empty")
            
            logger.info(f"Parsed {len(rows)} rows from CSV")
            return rows
            
        except Exception as e:
            raise ValueError(f"Failed to parse CSV: {str(e)}")
    
    def validate_csv_data(self, rows: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """
        Validate CSV data and return valid rows
        
        Args:
            rows: List of parsed CSV rows
            
        Returns:
            List of valid rows
        """
        if not rows:
            raise ValueError("No data to validate")
        
        # Get headers
        headers = list(rows[0].keys())
        logger.info(f"CSV headers: {headers}")
        
        # Validate headers
        try:
            validate_headers(headers, REQUIRED)
            logger.info("✅ Headers validation passed")
        except ValidationError as e:
            logger.error(f"❌ Headers validation failed: {e}")
            if self.stop_on_error:
                sys.exit(1)
            raise
        
        valid_rows = []
        
        for i, row in enumerate(rows, 1):
            try:
                # Normalize row
                normalized_row = normalize_row(row)
                
                # Map columns to database fields first
                mapped_row = self._map_columns(normalized_row)
                
                # Validate mapped row
                errors = validate_row(mapped_row, i)
                
                if errors:
                    error_msg = f"Row {i} validation failed: {'; '.join(errors)}"
                    logger.warning(f"⚠️  {error_msg}")
                    self.error_log.append(error_msg)
                    self.stats['errors'] += 1
                    
                    if self.stop_on_error:
                        logger.error("Stopping due to validation error")
                        sys.exit(1)
                    
                    self.stats['skipped'] += 1
                    continue
                
                valid_rows.append(mapped_row)
                self.stats['valid_rows'] += 1
                
            except Exception as e:
                error_msg = f"Row {i} processing failed: {str(e)}"
                logger.error(f"❌ {error_msg}")
                self.error_log.append(error_msg)
                self.stats['errors'] += 1
                
                if self.stop_on_error:
                    logger.error("Stopping due to processing error")
                    sys.exit(1)
                
                self.stats['skipped'] += 1
        
        logger.info(f"✅ Validation completed: {self.stats['valid_rows']} valid rows, {self.stats['skipped']} skipped")
        return valid_rows
    
    def _map_columns(self, row: Dict[str, str]) -> Dict[str, str]:
        """
        Map CSV columns to database fields
        
        Args:
            row: Raw CSV row
            
        Returns:
            Mapped row with database field names
        """
        mapped = {}
        
        for csv_col, db_field in COLUMN_MAP.items():
            if csv_col in row:
                mapped[db_field] = row[csv_col]
        
        # Apply defaults
        for field, default_value in DEFAULTS.items():
            if field not in mapped or not mapped[field]:
                mapped[field] = default_value
        
        return mapped
    
    def process_events(self, rows: List[Dict[str, str]], db) -> Dict[str, Event]:
        """
        Process events from CSV data
        
        Args:
            rows: Valid CSV rows
            db: Database session
            
        Returns:
            Dictionary mapping event codes to Event objects
        """
        events = {}
        event_codes = set()
        
        # Collect unique event codes
        for row in rows:
            event_code = row.get('event_code', '').strip()
            if event_code:
                event_codes.add(event_code)
        
        # Process each event
        for event_code in event_codes:
            # Find event data in rows
            event_data = {}
            for row in rows:
                if row.get('event_code', '').strip() == event_code:
                    for csv_field, db_field in EVENT_MAPPING.items():
                        if csv_field in row and row[csv_field]:
                            event_data[db_field] = row[csv_field]
                    break
            
            # Set default values for event
            if 'name' not in event_data or not event_data['name']:
                event_data['name'] = event_code
            
            # Add event_code to event_data for validation
            event_data['event_code'] = event_code
            
            # Validate event data
            errors = validate_event_data(event_data)
            if errors:
                logger.warning(f"⚠️  Event {event_code} validation failed: {'; '.join(errors)}")
                continue
            
            # Find or create event
            event = db.query(Event).filter(Event.name == event_data.get('name', event_code)).first()
            
            if not event:
                if not self.dry_run:
                    event = Event(
                        name=event_data.get('name', event_code),
                        start_datetime=datetime.now(),  # Default to now if not provided
                        location=event_data.get('location', ''),
                        status='upcoming'
                    )
                    db.add(event)
                    db.flush()
                    logger.info(f"📅 Created event: {event.name}")
                else:
                    logger.info(f"📅 [DRY RUN] Would create event: {event_data.get('name', event_code)}")
            
            events[event_code] = event
        
        return events
    
    def process_guests(self, rows: List[Dict[str, str]], events: Dict[str, Event], db) -> None:
        """
        Process guests from CSV data
        
        Args:
            rows: Valid CSV rows
            events: Dictionary of events by code
            db: Database session
        """
        for row in rows:
            try:
                # Get event (use default event if no event_code specified)
                event_code = row.get('event_code', 'DEFAULT_EVENT').strip()
                if event_code not in events:
                    # Create default event if not exists
                    if not self.dry_run:
                        default_event = Event(
                            name="Default Event",
                            start_datetime=datetime.utcnow(),
                            location="TBD",
                            status='upcoming'
                        )
                        db.add(default_event)
                        db.flush()
                        events[event_code] = default_event
                        logger.info(f"📅 Created default event: {default_event.name}")
                    else:
                        logger.info(f"📅 [DRY RUN] Would create default event")
                        # For dry run, create a mock event
                        class MockEvent:
                            id = 1
                            name = "Default Event"
                        events[event_code] = MockEvent()
                
                event = events[event_code]
                
                # Find existing guest by name (since no email in new format)
                full_name = row.get('full_name', '').strip()
                if not full_name:
                    logger.warning(f"⚠️  Skipping guest - no name provided")
                    self.stats['skipped'] += 1
                    continue
                
                # Generate unique email and phone from name for database consistency
                email = f"{full_name.lower().replace(' ', '.')}@imported.local"
                phone = f"+8490{hash(full_name) % 100000000:08d}"  # Generate unique phone
                
                # Process organization/tags field
                org_tags = row.get('organization', '').strip()
                organization = org_tags
                group_tag = "Regular"  # Default group tag
                
                # Try to extract tag from organization field (e.g., "ABC Technology (tech)" -> org="ABC Technology", tag="tech")
                if '(' in org_tags and ')' in org_tags:
                    # Extract tag from parentheses
                    import re
                    match = re.search(r'(.+?)\s*\(([^)]+)\)', org_tags)
                    if match:
                        organization = match.group(1).strip()
                        group_tag = match.group(2).strip()
                
                existing_guest = db.query(Guest).filter(
                    Guest.full_name == full_name,
                    Guest.event_id == event.id
                ).first()
                
                if existing_guest:
                    # Update existing guest
                    if not self.dry_run:
                        for field, value in row.items():
                            if hasattr(existing_guest, field) and value:
                                # Convert boolean fields
                                if field == 'is_vip':
                                    setattr(existing_guest, field, str(value).lower() == 'true')
                                else:
                                    setattr(existing_guest, field, value)
                        existing_guest.updated_at = datetime.utcnow()
                        logger.info(f"🔄 Updated guest: {existing_guest.full_name}")
                    else:
                        logger.info(f"🔄 [DRY RUN] Would update guest: {row.get('full_name', 'Unknown')}")
                    
                    self.stats['updated'] += 1
                else:
                    # Create new guest
                    if not self.dry_run:
                        # Combine host and message for notes field
                        host_name = row.get('host_name', '').strip()
                        invitation_message = row.get('invitation_message', '').strip()
                        notes_content = f"Host: {host_name}\nMessage: {invitation_message}" if host_name or invitation_message else ""
                        
                        guest = Guest(
                            full_name=row.get('full_name', ''),
                            email=email,
                            phone=phone,
                            title=row.get('title', ''),
                            role=row.get('role', ''),
                            organization=organization,
                            group_tag=group_tag,
                            is_vip=str(row.get('is_vip', 'false')).lower() == 'true',
                            rsvp_status=row.get('rsvp_status', 'pending'),
                            event_id=event.id,
                            notes=notes_content,
                            email_subject_last=row.get('email_subject_last', ''),
                            attach_file_name=row.get('attach_file_name', '')
                        )
                        db.add(guest)
                        logger.info(f"➕ Created guest: {guest.full_name}")
                    else:
                        logger.info(f"➕ [DRY RUN] Would create guest: {row.get('full_name', 'Unknown')}")
                    
                    self.stats['inserted'] += 1
                
            except Exception as e:
                error_msg = f"Failed to process guest {row.get('full_name', 'Unknown')}: {str(e)}"
                logger.error(f"❌ {error_msg}")
                self.error_log.append(error_msg)
                self.stats['errors'] += 1
                
                if self.stop_on_error:
                    logger.error("Stopping due to guest processing error")
                    sys.exit(1)
    
    def save_snapshot(self, csv_content: bytes) -> None:
        """
        Save CSV content as snapshot
        
        Args:
            csv_content: CSV content to save
        """
        snapshot_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'seed', 'snapshot_guests_v1.csv')
        save_snapshot(csv_content, snapshot_path)
        logger.info(f"💾 Saved snapshot to: {snapshot_path}")
    
    def print_summary(self) -> None:
        """Print seeding summary"""
        logger.info("=" * 50)
        logger.info("📊 SEEDING SUMMARY")
        logger.info("=" * 50)
        logger.info(f"Total rows processed: {self.stats['total_rows']}")
        logger.info(f"Valid rows: {self.stats['valid_rows']}")
        logger.info(f"Inserted: {self.stats['inserted']}")
        logger.info(f"Updated: {self.stats['updated']}")
        logger.info(f"Skipped: {self.stats['skipped']}")
        logger.info(f"Errors: {self.stats['errors']}")
        
        if self.error_log:
            logger.info("\n❌ ERRORS:")
            for error in self.error_log:
                logger.info(f"  - {error}")
        
        logger.info("=" * 50)


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Seed database from CSV')
    parser.add_argument('--dry-run', action='store_true', help='Parse and validate only, do not write to database')
    parser.add_argument('--file', help='Use local CSV file instead of URL')
    parser.add_argument('--stop-on-error', action='store_true', help='Stop on first error')
    
    args = parser.parse_args()
    
    try:
        # Initialize seeder
        seeder = CSVSeeder(dry_run=args.dry_run, stop_on_error=args.stop_on_error)
        
        # Load CSV data
        csv_url = os.getenv('SEED_CSV_URL') if not args.file else None
        csv_content = seeder.load_csv_data(csv_url, args.file)
        
        # Save snapshot if not dry run
        if not args.dry_run:
            seeder.save_snapshot(csv_content)
        
        # Parse CSV
        rows = seeder.parse_csv(csv_content)
        seeder.stats['total_rows'] = len(rows)
        
        # Validate data
        valid_rows = seeder.validate_csv_data(rows)
        
        if not valid_rows:
            logger.error("❌ No valid rows found")
            sys.exit(1)
        
        if args.dry_run:
            logger.info("🔍 DRY RUN - No database changes will be made")
            seeder.print_summary()
            return
        
        # Process data
        db = SessionLocal()
        try:
            # Process events
            events = seeder.process_events(valid_rows, db)
            
            # Process guests
            seeder.process_guests(valid_rows, events, db)
            
            # Commit changes
            db.commit()
            logger.info("✅ Database changes committed")
            
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Database error: {e}")
            raise
        finally:
            db.close()
        
        # Print summary
        seeder.print_summary()
        
        # Exit with error code if there were errors
        if seeder.stats['errors'] > 0:
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"❌ Seeding failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
