# Batch Loading API for Preload Pagination
# Tối ưu API để hỗ trợ batch loading nhiều trang cùng lúc

from flask import Blueprint, request, jsonify
from sqlalchemy import and_, or_, desc, asc
from sqlalchemy.orm import joinedload
from models import Guest, Event, Checkin, db
from datetime import datetime, timedelta
import json
import time
from typing import Dict, List, Any, Optional

batch_bp = Blueprint('batch', __name__, url_prefix='/api/batch')

# Cache for batch requests (in production, use Redis)
batch_cache = {}
CACHE_TTL = 300  # 5 minutes

def get_cache_key(endpoint: str, params: Dict[str, Any]) -> str:
    """Generate cache key for batch request"""
    sorted_params = sorted(params.items())
    return f"{endpoint}:{hash(str(sorted_params))}"

def is_cache_valid(cache_entry: Dict[str, Any]) -> bool:
    """Check if cache entry is still valid"""
    return time.time() - cache_entry['timestamp'] < CACHE_TTL

def get_cached_data(cache_key: str) -> Optional[Dict[str, Any]]:
    """Get cached data if valid"""
    if cache_key in batch_cache:
        cache_entry = batch_cache[cache_key]
        if is_cache_valid(cache_entry):
            return cache_entry['data']
        else:
            del batch_cache[cache_key]
    return None

def set_cached_data(cache_key: str, data: Dict[str, Any]) -> None:
    """Set cached data"""
    batch_cache[cache_key] = {
        'data': data,
        'timestamp': time.time()
    }

def build_guests_query(filters: Dict[str, Any]):
    """Build query for guests with filters"""
    query = Guest.query
    
    # Event filter
    if filters.get('event_id'):
        query = query.filter(Guest.event_id == filters['event_id'])
    
    # Search filter
    if filters.get('search'):
        search_term = f"%{filters['search']}%"
        query = query.filter(
            or_(
                Guest.name.ilike(search_term),
                Guest.email.ilike(search_term),
                Guest.phone.ilike(search_term),
                Guest.role.ilike(search_term),
                Guest.company.ilike(search_term),
                Guest.tag.ilike(search_term)
            )
        )
    
    # Status filter
    if filters.get('status') and filters['status'] != 'all':
        query = query.filter(Guest.rsvp_status == filters['status'])
    
    # Tag filter
    if filters.get('tag') and filters['tag'] != 'all':
        query = query.filter(Guest.tag == filters['tag'])
    
    # Organization filter
    if filters.get('organization') and filters['organization'] != 'all':
        query = query.filter(Guest.organization == filters['organization'])
    
    # Role filter
    if filters.get('role') and filters['role'] != 'all':
        query = query.filter(Guest.role == filters['role'])
    
    return query

def build_events_query(filters: Dict[str, Any]):
    """Build query for events with filters"""
    query = Event.query
    
    # Search filter
    if filters.get('search'):
        search_term = f"%{filters['search']}%"
        query = query.filter(
            or_(
                Event.name.ilike(search_term),
                Event.description.ilike(search_term),
                Event.location.ilike(search_term)
            )
        )
    
    # Status filter
    if filters.get('status') and filters['status'] != 'all':
        query = query.filter(Event.status == filters['status'])
    
    # Date filter
    if filters.get('date') and filters['date'] != 'all':
        now = datetime.now()
        if filters['date'] == 'today':
            query = query.filter(Event.date == now.date())
        elif filters['date'] == 'week':
            week_start = now - timedelta(days=now.weekday())
            week_end = week_start + timedelta(days=6)
            query = query.filter(Event.date.between(week_start.date(), week_end.date()))
        elif filters['date'] == 'month':
            month_start = now.replace(day=1)
            next_month = month_start.replace(month=month_start.month + 1) if month_start.month < 12 else month_start.replace(year=month_start.year + 1, month=1)
            query = query.filter(Event.date.between(month_start.date(), (next_month - timedelta(days=1)).date()))
        elif filters['date'] == 'year':
            year_start = now.replace(month=1, day=1)
            year_end = now.replace(month=12, day=31)
            query = query.filter(Event.date.between(year_start.date(), year_end.date()))
    
    return query

def build_checkin_query(filters: Dict[str, Any]):
    """Build query for checked-in guests with filters"""
    query = Guest.query
    
    # Event filter
    if filters.get('event_id'):
        query = query.filter(Guest.event_id == filters['event_id'])
    
    # Search filter
    if filters.get('search'):
        search_term = f"%{filters['search']}%"
        query = query.filter(
            or_(
                Guest.name.ilike(search_term),
                Guest.email.ilike(search_term),
                Guest.phone.ilike(search_term),
                Guest.role.ilike(search_term),
                Guest.company.ilike(search_term),
                Guest.tag.ilike(search_term)
            )
        )
    
    # Status filter
    if filters.get('status') and filters['status'] != 'all':
        if filters['status'] == 'checked_in':
            query = query.filter(
                or_(
                    Guest.checkin_status == 'checked_in',
                    Guest.checkin_status == 'checked_out'
                )
            )
        elif filters['status'] == 'not_checked_in':
            query = query.filter(Guest.checkin_status == 'not_arrived')
    
    return query

def serialize_guest(guest: Guest) -> Dict[str, Any]:
    """Serialize guest object"""
    return {
        'id': guest.id,
        'name': guest.name,
        'title': guest.title,
        'role': guest.role,
        'organization': guest.organization,
        'tag': guest.tag,
        'email': guest.email,
        'phone': guest.phone,
        'rsvp_status': guest.rsvp_status,
        'checkin_status': guest.checkin_status,
        'event_content': guest.event_content,
        'created_at': guest.created_at.isoformat() if guest.created_at else None,
        'event_id': guest.event_id,
        'event_name': guest.event.name if guest.event else None
    }

def serialize_event(event: Event) -> Dict[str, Any]:
    """Serialize event object"""
    return {
        'id': event.id,
        'name': event.name,
        'description': event.description,
        'date': event.date.isoformat() if event.date else None,
        'time': event.time.isoformat() if event.time else None,
        'location': event.location,
        'venue_address': event.venue_address,
        'venue_map_url': event.venue_map_url,
        'dress_code': event.dress_code,
        'program_outline': event.program_outline,
        'max_guests': event.max_guests,
        'status': event.status,
        'created_at': event.created_at.isoformat() if event.created_at else None
    }

@batch_bp.route('/guests', methods=['POST'])
def batch_get_guests():
    """Batch get guests for multiple pages"""
    try:
        data = request.get_json()
        pages = data.get('pages', [])
        items_per_page = data.get('items_per_page', 10)
        filters = data.get('filters', {})
        
        if not pages:
            return jsonify({'error': 'No pages specified'}), 400
        
        # Generate cache key
        cache_key = get_cache_key('guests', {
            'pages': sorted(pages),
            'items_per_page': items_per_page,
            'filters': filters
        })
        
        # Check cache first
        cached_data = get_cached_data(cache_key)
        if cached_data:
            return jsonify(cached_data)
        
        # Build base query
        query = build_guests_query(filters)
        
        # Get total count
        total_items = query.count()
        total_pages = (total_items + items_per_page - 1) // items_per_page
        
        # Get data for requested pages
        result = {}
        for page in pages:
            if page < 1 or page > total_pages:
                result[page] = []
                continue
            
            offset = (page - 1) * items_per_page
            page_query = query.offset(offset).limit(items_per_page)
            guests = page_query.all()
            
            result[page] = [serialize_guest(guest) for guest in guests]
        
        response_data = {
            'data': result,
            'pagination': {
                'total_items': total_items,
                'total_pages': total_pages,
                'items_per_page': items_per_page,
                'loaded_pages': pages
            }
        }
        
        # Cache the result
        set_cached_data(cache_key, response_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in batch_get_guests: {e}")
        return jsonify({'error': str(e)}), 500

@batch_bp.route('/events', methods=['POST'])
def batch_get_events():
    """Batch get events for multiple pages"""
    try:
        data = request.get_json()
        pages = data.get('pages', [])
        items_per_page = data.get('items_per_page', 10)
        filters = data.get('filters', {})
        
        if not pages:
            return jsonify({'error': 'No pages specified'}), 400
        
        # Generate cache key
        cache_key = get_cache_key('events', {
            'pages': sorted(pages),
            'items_per_page': items_per_page,
            'filters': filters
        })
        
        # Check cache first
        cached_data = get_cached_data(cache_key)
        if cached_data:
            return jsonify(cached_data)
        
        # Build base query
        query = build_events_query(filters)
        
        # Get total count
        total_items = query.count()
        total_pages = (total_items + items_per_page - 1) // items_per_page
        
        # Get data for requested pages
        result = {}
        for page in pages:
            if page < 1 or page > total_pages:
                result[page] = []
                continue
            
            offset = (page - 1) * items_per_page
            page_query = query.offset(offset).limit(items_per_page)
            events = page_query.all()
            
            result[page] = [serialize_event(event) for event in events]
        
        response_data = {
            'data': result,
            'pagination': {
                'total_items': total_items,
                'total_pages': total_pages,
                'items_per_page': items_per_page,
                'loaded_pages': pages
            }
        }
        
        # Cache the result
        set_cached_data(cache_key, response_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in batch_get_events: {e}")
        return jsonify({'error': str(e)}), 500

@batch_bp.route('/checkin', methods=['POST'])
def batch_get_checkin():
    """Batch get checked-in guests for multiple pages"""
    try:
        data = request.get_json()
        pages = data.get('pages', [])
        items_per_page = data.get('items_per_page', 10)
        filters = data.get('filters', {})
        
        if not pages:
            return jsonify({'error': 'No pages specified'}), 400
        
        # Generate cache key
        cache_key = get_cache_key('checkin', {
            'pages': sorted(pages),
            'items_per_page': items_per_page,
            'filters': filters
        })
        
        # Check cache first
        cached_data = get_cached_data(cache_key)
        if cached_data:
            return jsonify(cached_data)
        
        # Build base query
        query = build_checkin_query(filters)
        
        # Get total count
        total_items = query.count()
        total_pages = (total_items + items_per_page - 1) // items_per_page
        
        # Get data for requested pages
        result = {}
        for page in pages:
            if page < 1 or page > total_pages:
                result[page] = []
                continue
            
            offset = (page - 1) * items_per_page
            page_query = query.offset(offset).limit(items_per_page)
            guests = page_query.all()
            
            result[page] = [serialize_guest(guest) for guest in guests]
        
        response_data = {
            'data': result,
            'pagination': {
                'total_items': total_items,
                'total_pages': total_pages,
                'items_per_page': items_per_page,
                'loaded_pages': pages
            }
        }
        
        # Cache the result
        set_cached_data(cache_key, response_data)
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in batch_get_checkin: {e}")
        return jsonify({'error': str(e)}), 500

@batch_bp.route('/stats', methods=['POST'])
def batch_get_stats():
    """Batch get statistics for multiple entities"""
    try:
        data = request.get_json()
        entities = data.get('entities', [])  # ['guests', 'events', 'checkin']
        filters = data.get('filters', {})
        
        if not entities:
            return jsonify({'error': 'No entities specified'}), 400
        
        result = {}
        
        for entity in entities:
            if entity == 'guests':
                query = build_guests_query(filters)
                guests = query.all()
                
                result['guests'] = {
                    'total': len(guests),
                    'accepted': len([g for g in guests if g.rsvp_status == 'accepted']),
                    'declined': len([g for g in guests if g.rsvp_status == 'declined']),
                    'pending': len([g for g in guests if g.rsvp_status == 'pending']),
                    'checked_in': len([g for g in guests if g.checkin_status in ['checked_in', 'checked_out']])
                }
                
            elif entity == 'events':
                query = build_events_query(filters)
                events = query.all()
                
                result['events'] = {
                    'total': len(events),
                    'upcoming': len([e for e in events if e.status == 'upcoming']),
                    'ongoing': len([e for e in events if e.status == 'ongoing']),
                    'completed': len([e for e in events if e.status == 'completed']),
                    'cancelled': len([e for e in events if e.status == 'cancelled'])
                }
                
            elif entity == 'checkin':
                query = build_checkin_query(filters)
                guests = query.all()
                
                result['checkin'] = {
                    'total': len(guests),
                    'checked_in': len([g for g in guests if g.checkin_status in ['checked_in', 'checked_out']]),
                    'not_checked_in': len([g for g in guests if g.checkin_status == 'not_arrived'])
                }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in batch_get_stats: {e}")
        return jsonify({'error': str(e)}), 500

@batch_bp.route('/cache/clear', methods=['POST'])
def clear_cache():
    """Clear batch cache"""
    try:
        global batch_cache
        batch_cache.clear()
        return jsonify({'message': 'Cache cleared successfully'})
    except Exception as e:
        print(f"Error clearing cache: {e}")
        return jsonify({'error': str(e)}), 500

@batch_bp.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    try:
        total_entries = len(batch_cache)
        total_size = sum(len(str(entry)) for entry in batch_cache.values())
        
        return jsonify({
            'total_entries': total_entries,
            'total_size_bytes': total_size,
            'cache_ttl_seconds': CACHE_TTL
        })
    except Exception as e:
        print(f"Error getting cache stats: {e}")
        return jsonify({'error': str(e)}), 500
