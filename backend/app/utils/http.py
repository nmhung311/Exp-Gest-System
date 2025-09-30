"""
HTTP utilities for fetching CSV data from external sources
"""
import os
import requests
from typing import Optional
from urllib.parse import urlparse


def fetch_csv(url: str, timeout: int = 30) -> bytes:
    """
    Fetch CSV data from a URL
    
    Args:
        url: URL to fetch CSV from
        timeout: Request timeout in seconds
        
    Returns:
        Raw CSV data as bytes
        
    Raises:
        requests.RequestException: If request fails
        ValueError: If response is not valid CSV
    """
    try:
        # Validate URL
        parsed_url = urlparse(url)
        if not parsed_url.scheme or not parsed_url.netloc:
            raise ValueError(f"Invalid URL: {url}")
        
        # Make request
        response = requests.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        # Check content type
        content_type = response.headers.get('content-type', '').lower()
        if 'text/csv' not in content_type and 'text/plain' not in content_type:
            # Some servers don't set proper content-type for CSV
            # Check if URL contains 'csv' or response looks like CSV
            if 'csv' not in url.lower() and not _looks_like_csv(response.content[:100]):
                raise ValueError(f"Response is not CSV. Content-Type: {content_type}")
        
        # Read content
        content = response.content
        
        # Validate CSV content
        if not content.strip():
            raise ValueError("Empty CSV content")
        
        return content
        
    except requests.exceptions.Timeout:
        raise requests.RequestException(f"Request timeout after {timeout} seconds")
    except requests.exceptions.ConnectionError:
        raise requests.RequestException("Connection error - check URL and network")
    except requests.exceptions.HTTPError as e:
        raise requests.RequestException(f"HTTP error: {e.response.status_code} - {e.response.reason}")
    except requests.exceptions.RequestException as e:
        raise requests.RequestException(f"Request failed: {str(e)}")


def _looks_like_csv(content: bytes) -> bool:
    """
    Check if content looks like CSV by examining first 100 bytes
    
    Args:
        content: First 100 bytes of response
        
    Returns:
        True if content looks like CSV
    """
    try:
        text = content.decode('utf-8', errors='ignore')
        # Check for common CSV patterns
        return (
            ',' in text or  # Contains commas
            '\t' in text or  # Contains tabs
            text.count('\n') > 0  # Contains newlines
        )
    except:
        return False


def save_snapshot(content: bytes, filepath: str) -> None:
    """
    Save CSV content to snapshot file
    
    Args:
        content: CSV content as bytes
        filepath: Path to save snapshot
    """
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    with open(filepath, 'wb') as f:
        f.write(content)


def load_snapshot(filepath: str) -> Optional[bytes]:
    """
    Load CSV content from snapshot file
    
    Args:
        filepath: Path to snapshot file
        
    Returns:
        CSV content as bytes, or None if file doesn't exist
    """
    if not os.path.exists(filepath):
        return None
    
    try:
        with open(filepath, 'rb') as f:
            return f.read()
    except Exception:
        return None
