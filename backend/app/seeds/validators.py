"""
Data validation utilities for CSV seeding
"""
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class ValidationError(Exception):
    """Custom exception for validation errors"""
    pass


def validate_headers(headers: List[str], required: List[str]) -> None:
    """
    Validate that all required headers are present in CSV
    
    Args:
        headers: List of column headers from CSV
        required: List of required column names
        
    Raises:
        ValidationError: If required headers are missing
    """
    missing_headers = []
    for req_header in required:
        if req_header not in headers:
            missing_headers.append(req_header)
    
    if missing_headers:
        raise ValidationError(
            f"Missing required columns: {', '.join(missing_headers)}. "
            f"Available columns: {', '.join(headers)}"
        )


def normalize_row(row: Dict[str, str]) -> Dict[str, str]:
    """
    Normalize and clean a CSV row
    
    Args:
        row: Raw row data from CSV
        
    Returns:
        Normalized row data
    """
    normalized = {}
    
    for key, value in row.items():
        if value is None:
            normalized[key] = ""
            continue
            
        # Convert to string and strip whitespace
        str_value = str(value).strip()
        
        # Apply field-specific normalization
        if key.lower() in ['email', 'host_email']:
            normalized[key] = str_value.lower()
        elif key.lower() in ['phone']:
            # Keep only digits, +, -, (, ), and spaces
            normalized[key] = re.sub(r'[^\d\+\-\(\)\s]', '', str_value)
        elif key.lower() in ['rsvp', 'rsvpstatus', 'response']:
            # Normalize RSVP status
            normalized[key] = _normalize_rsvp_status(str_value)
        elif key.lower() in ['isvip', 'vip']:
            # Normalize VIP status
            normalized[key] = _normalize_boolean(str_value)
        elif key.lower() in ['title']:
            # Normalize title
            normalized[key] = _normalize_title(str_value)
        elif key.lower() in ['grouptag']:
            # Normalize group tag
            normalized[key] = _normalize_group_tag(str_value)
        else:
            normalized[key] = str_value
    
    return normalized


def validate_row(row: Dict[str, str], row_num: int) -> List[str]:
    """
    Validate a single CSV row
    
    Args:
        row: Row data to validate
        row_num: Row number for error reporting
        
    Returns:
        List of validation errors (empty if valid)
    """
    from app.seeds.mapping import VALIDATION_RULES
    
    errors = []
    
    # Check required fields
    for field, rules in VALIDATION_RULES.items():
        if rules.get('required', False):
            value = row.get(field, '').strip()
            if not value:
                errors.append(f"Row {row_num}: {field} is required")
    
    # Validate email format
    email = row.get('email', '').strip()
    if email:
        if not re.match(VALIDATION_RULES['email']['pattern'], email):
            errors.append(f"Row {row_num}: {VALIDATION_RULES['email']['message']}")
    
    # Validate phone format
    phone = row.get('phone', '').strip()
    if phone:
        if not re.match(VALIDATION_RULES['phone']['pattern'], phone):
            errors.append(f"Row {row_num}: {VALIDATION_RULES['phone']['message']}")
    
    # Validate RSVP status
    rsvp = row.get('rsvp_status', '').strip()
    if rsvp and rsvp not in VALIDATION_RULES['rsvp_status']['values']:
        errors.append(f"Row {row_num}: {VALIDATION_RULES['rsvp_status']['message']}")
    
    # Validate title
    title = row.get('title', '').strip()
    if title and title not in VALIDATION_RULES['title']['values']:
        errors.append(f"Row {row_num}: {VALIDATION_RULES['title']['message']}")
    
    # Validate group tag
    group_tag = row.get('group_tag', '').strip()
    if group_tag and group_tag not in VALIDATION_RULES['group_tag']['values']:
        errors.append(f"Row {row_num}: {VALIDATION_RULES['group_tag']['message']}")
    
    return errors


def _normalize_rsvp_status(value: str) -> str:
    """Normalize RSVP status value"""
    value = value.lower().strip()
    mapping = {
        'yes': 'accepted',
        'no': 'declined', 
        'maybe': 'pending',
        'pending': 'pending',
        'accepted': 'accepted',
        'declined': 'declined',
        'confirmed': 'accepted',
        'cancelled': 'declined'
    }
    return mapping.get(value, 'pending')


def _normalize_boolean(value: str) -> str:
    """Normalize boolean value"""
    value = str(value).lower().strip()
    if value in ['true', '1', 'yes', 'y', 'vip', 'vip:true']:
        return 'true'
    return 'false'


def _normalize_title(value: str) -> str:
    """Normalize title value"""
    value = value.strip()
    # Handle common variations
    mapping = {
        'mr.': 'Mr',
        'ms.': 'Ms', 
        'dr.': 'Dr',
        'prof.': 'Prof',
        'mrs.': 'Mrs'
    }
    return mapping.get(value.lower(), value)


def _normalize_group_tag(value: str) -> str:
    """Normalize group tag value"""
    value = value.strip()
    # Handle common variations
    mapping = {
        'vip:true': 'VIP',
        'vip:false': 'Regular',
        'regular': 'Regular',
        'partner': 'Partner',
        'media': 'Media',
        'staff': 'Staff',
        'speaker': 'Speaker'
    }
    return mapping.get(value.lower(), value)


def validate_event_data(event_data: Dict[str, str]) -> List[str]:
    """
    Validate event data from CSV
    
    Args:
        event_data: Event data to validate
        
    Returns:
        List of validation errors
    """
    errors = []
    
    # Check required event fields
    if not event_data.get('event_code', '').strip():
        errors.append("Event code is required")
    
    # Event name is not required, will use event_code as fallback
    
    # Validate event date if provided
    event_date = event_data.get('event_date', '').strip()
    if event_date:
        try:
            # Try to parse common date formats
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d %H:%M:%S']:
                try:
                    datetime.strptime(event_date, fmt)
                    break
                except ValueError:
                    continue
            else:
                errors.append(f"Invalid event date format: {event_date}")
        except Exception:
            errors.append(f"Invalid event date: {event_date}")
    
    return errors


def validate_host_data(host_data: Dict[str, str]) -> List[str]:
    """
    Validate host data from CSV
    
    Args:
        host_data: Host data to validate
        
    Returns:
        List of validation errors
    """
    from app.seeds.mapping import VALIDATION_RULES
    
    errors = []
    
    # Check required host fields
    if not host_data.get('host_name', '').strip():
        errors.append("Host name is required")
    
    # Validate host email if provided
    host_email = host_data.get('host_email', '').strip()
    if host_email:
        if not re.match(VALIDATION_RULES['email']['pattern'], host_email):
            errors.append(f"Invalid host email format: {host_email}")
    
    return errors
