"""
Column mapping configuration for CSV seeding
"""
from typing import Dict, List

# Mapping from CSV column names to database field names
COLUMN_MAP = {
    # Guest information (from new CSV format)
    "Name": "full_name",
    "title": "title",
    "Role": "role",
    "Organizati/tags": "organization",  # Organization name (will be split later)
    "host": "host_name",
    "message": "invitation_message",  # Invitation message content
    
    # Legacy mappings (for backward compatibility)
    "FullName": "full_name",
    "Email": "email", 
    "Phone": "phone",
    "Title": "title",
    "Organization": "organization",
    "Company": "organization",  # Alternative name
    "GroupTag": "group_tag",
    "IsVIP": "is_vip",
    "VIP": "is_vip",  # Alternative name
    
    # Event information
    "EventCode": "event_code",
    "EventName": "event_name",
    "EventDate": "event_date",
    "EventLocation": "event_location",
    
    # Host information
    "Host": "host_name",
    "HostName": "host_name",
    "HostEmail": "host_email",
    
    # RSVP information
    "RSVP": "rsvp_status",
    "RSVPStatus": "rsvp_status",
    "Response": "rsvp_status",  # Alternative name
    
    # Additional fields
    "Notes": "notes",
    "Comments": "notes",  # Alternative name
    "EmailSubject": "email_subject_last",
    "Attachment": "attach_file_name",
}

# Required columns that must be present in CSV
REQUIRED = [
    "Name"  # Only Name is required, other fields are optional
]

# Unique keys for upsert operations
UNIQUE_KEYS = [
    "Name"  # Name is the natural key for guests (since no email in new format)
]

# Default values for optional fields
DEFAULTS = {
    "rsvp_status": "pending",
    "is_vip": False,
    "group_tag": "Regular",
    "email": "",  # No email in new format, will be empty
    "phone": "",  # No phone in new format, will be empty
    "event_code": "DEFAULT_EVENT"  # Default event code
}

# Valid values for enum fields
VALID_RSVP_STATUS = ["pending", "accepted", "declined"]
VALID_TITLES = ["Mr", "Ms", "Dr", "Prof", "Mrs", "Miss"]
VALID_GROUP_TAGS = ["VIP", "Regular", "Partner", "Media", "Staff", "Speaker"]

# Field validation rules
VALIDATION_RULES = {
    "full_name": {
        "required": True,
        "message": "Name is required"
    },
    "email": {
        "required": False,  # Not required in new format
        "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        "message": "Invalid email format"
    },
    "phone": {
        "required": False,
        "pattern": r"^[\+]?[0-9\s\-\(\)]{10,}$",
        "message": "Invalid phone format"
    },
    "rsvp_status": {
        "required": False,
        "values": VALID_RSVP_STATUS,
        "message": f"RSVP status must be one of: {', '.join(VALID_RSVP_STATUS)}"
    },
    "title": {
        "required": False,
        "values": VALID_TITLES,
        "message": f"Title must be one of: {', '.join(VALID_TITLES)}"
    },
    "group_tag": {
        "required": False,
        "values": VALID_GROUP_TAGS,
        "message": f"Group tag must be one of: {', '.join(VALID_GROUP_TAGS)}"
    }
}

# Event mapping configuration
EVENT_MAPPING = {
    "event_code": "code",  # Field in Event model
    "event_name": "name",
    "event_date": "start_datetime", 
    "event_location": "location"
}

# Host mapping configuration (if using separate host table)
HOST_MAPPING = {
    "host_name": "name",
    "host_email": "email"
}
