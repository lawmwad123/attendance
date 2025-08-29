"""
Custom Casbin functions for ABAC attribute checking.
"""
import re
from typing import Dict, Any
from datetime import datetime, time


def keyMatch2(key1: str, key2: str) -> bool:
    """
    KeyMatch2 function for Casbin.
    Matches key1 against key2 pattern with wildcards.
    """
    if key2 == "*":
        return True
    
    # Convert key2 pattern to regex
    pattern = key2.replace("*", ".*")
    return bool(re.match(pattern, key1))


def checkAttributes(request: Dict[str, Any], policy: Dict[str, Any]) -> bool:
    """
    Check if request attributes match policy attributes.
    
    Args:
        request: Request attributes
        policy: Policy attributes
        
    Returns:
        bool: True if attributes match, False otherwise
    """
    # If no attributes in policy, allow
    if not any(policy.get(f"attr{i}") for i in range(1, 11)):
        return True
    
    # Check each attribute
    for i in range(1, 11):
        policy_attr = policy.get(f"attr{i}")
        if not policy_attr:
            continue
            
        request_attr = request.get(f"attr{i}")
        if not request_attr:
            continue
            
        # Check if attributes match
        if not _matchAttribute(policy_attr, request_attr):
            return False
    
    return True


def _matchAttribute(policy_attr: str, request_attr: str) -> bool:
    """
    Match a single attribute value against policy.
    
    Args:
        policy_attr: Policy attribute value
        request_attr: Request attribute value
        
    Returns:
        bool: True if attributes match, False otherwise
    """
    # Handle special cases
    if policy_attr == "*":
        return True
    
    # Handle time-based attributes
    if policy_attr.startswith("time:"):
        return _matchTimeAttribute(policy_attr, request_attr)
    
    # Handle numeric comparisons
    if policy_attr.startswith(">"):
        try:
            return float(request_attr) > float(policy_attr[1:])
        except (ValueError, TypeError):
            return False
    
    if policy_attr.startswith("<"):
        try:
            return float(request_attr) < float(policy_attr[1:])
        except (ValueError, TypeError):
            return False
    
    if policy_attr.startswith(">="):
        try:
            return float(request_attr) >= float(policy_attr[2:])
        except (ValueError, TypeError):
            return False
    
    if policy_attr.startswith("<="):
        try:
            return float(request_attr) <= float(policy_attr[2:])
        except (ValueError, TypeError):
            return False
    
    # Handle list attributes (comma-separated)
    if "," in policy_attr:
        policy_values = [v.strip() for v in policy_attr.split(",")]
        return request_attr in policy_values
    
    # Simple string comparison
    return policy_attr == request_attr


def _matchTimeAttribute(policy_attr: str, request_attr: str) -> bool:
    """
    Match time-based attributes.
    
    Args:
        policy_attr: Policy time attribute (e.g., "time:09:00-17:00")
        request_attr: Request time attribute (e.g., "14:30")
        
    Returns:
        bool: True if time is within range, False otherwise
    """
    try:
        # Extract time range from policy
        time_range = policy_attr[5:]  # Remove "time:" prefix
        start_time_str, end_time_str = time_range.split("-")
        
        # Parse times
        start_time = datetime.strptime(start_time_str, "%H:%M").time()
        end_time = datetime.strptime(end_time_str, "%H:%M").time()
        request_time = datetime.strptime(request_attr, "%H:%M").time()
        
        # Check if request time is within range
        if start_time <= end_time:
            return start_time <= request_time <= end_time
        else:  # Crosses midnight
            return request_time >= start_time or request_time <= end_time
            
    except (ValueError, AttributeError):
        return False


def checkSchoolAccess(user_school_id: int, resource_school_id: int) -> bool:
    """
    Check if user has access to resources from a specific school.
    
    Args:
        user_school_id: User's school ID
        resource_school_id: Resource's school ID
        
    Returns:
        bool: True if access is allowed, False otherwise
    """
    return user_school_id == resource_school_id


def checkTimeBasedAccess(current_time: time, allowed_start: time, allowed_end: time) -> bool:
    """
    Check if current time is within allowed access window.
    
    Args:
        current_time: Current time
        allowed_start: Allowed start time
        allowed_end: Allowed end time
        
    Returns:
        bool: True if within allowed time window, False otherwise
    """
    if allowed_start <= allowed_end:
        return allowed_start <= current_time <= allowed_end
    else:  # Crosses midnight
        return current_time >= allowed_start or current_time <= allowed_end


def checkUserStatus(user_status: str, allowed_statuses: list) -> bool:
    """
    Check if user status is allowed.
    
    Args:
        user_status: User's current status
        allowed_statuses: List of allowed statuses
        
    Returns:
        bool: True if status is allowed, False otherwise
    """
    return user_status in allowed_statuses


def checkDepartmentAccess(user_department: str, resource_department: str) -> bool:
    """
    Check if user has access to resources from a specific department.
    
    Args:
        user_department: User's department
        resource_department: Resource's department
        
    Returns:
        bool: True if access is allowed, False otherwise
    """
    if not resource_department:
        return True  # No department restriction
    
    return user_department == resource_department


def checkOwnership(user_id: int, resource_owner_id: int) -> bool:
    """
    Check if user owns the resource.
    
    Args:
        user_id: User's ID
        resource_owner_id: Resource owner's ID
        
    Returns:
        bool: True if user owns the resource, False otherwise
    """
    return user_id == resource_owner_id
