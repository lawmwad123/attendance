#!/usr/bin/env python3
"""
Initialize Casbin RBAC + ABAC system with default policies.
"""
import asyncio
import sys
import os

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_factory
from app.core.casbin import get_casbin_manager
from app.models.user import User, UserRole
from sqlalchemy import select


async def init_casbin_system():
    """Initialize the Casbin RBAC + ABAC system."""
    print("🚀 Initializing Casbin RBAC + ABAC system...")
    
    try:
        # Initialize Casbin manager (this will create tables and load default policies)
        print("📋 Loading default policies...")
        
        # Get the Casbin manager instance
        casbin_manager = get_casbin_manager()
        
        # The CasbinManager constructor already loads default policies
        # We just need to ensure it's properly initialized
        if casbin_manager.enforcer:
            print("✅ Casbin enforcer initialized successfully")
        else:
            print("❌ Failed to initialize Casbin enforcer")
            return False
        
        # Add user roles to Casbin
        print("👥 Setting up user roles...")
        async with async_session_factory() as db:
            # Get all users and add their roles to Casbin
            stmt = select(User)
            result = await db.execute(stmt)
            users = result.scalars().all()
            
            for user in users:
                # Add user role to Casbin
                user_id = str(user.id)
                role = user.role.value.lower()
                
                success = casbin_manager.add_user_role(user_id, role)
                if success:
                    print(f"  ✅ Added role '{role}' to user {user.email}")
                else:
                    print(f"  ⚠️  Failed to add role '{role}' to user {user.email}")
        
        print("🎉 Casbin RBAC + ABAC system initialized successfully!")
        print("\n📊 System Overview:")
        print(f"  • Total policies: {len(casbin_manager.get_policies())}")
        print(f"  • Role hierarchy: admin > teacher > parent")
        print(f"  • Resource types: page, feature, api")
        print(f"  • Actions: read, write, full, limited")
        
        print("\n🔐 Default Permissions:")
        print("  • Admins: Full access to all resources")
        print("  • Teachers: Limited access to attendance, students, analytics")
        print("  • Parents: Read access to attendance, gate pass approval")
        print("  • Security: Gate pass verification, visitor management")
        print("  • Students: Limited access (for future mobile app)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error initializing Casbin system: {e}")
        return False


async def test_permissions():
    """Test the permission system with sample requests."""
    print("\n🧪 Testing permission system...")
    
    test_cases = [
        {
            "role": "admin",
            "resource_type": "page",
            "resource": "settings",
            "action": "read",
            "description": "Admin reading settings page"
        },
        {
            "role": "teacher",
            "resource_type": "page",
            "resource": "settings",
            "action": "read",
            "description": "Teacher reading settings page"
        },
        {
            "role": "parent",
            "resource_type": "page",
            "resource": "settings",
            "action": "read",
            "description": "Parent reading settings page"
        },
        {
            "role": "admin",
            "resource_type": "feature",
            "resource": "attendance_management",
            "action": "full",
            "description": "Admin full access to attendance management"
        },
        {
            "role": "teacher",
            "resource_type": "feature",
            "resource": "attendance_management",
            "action": "limited",
            "description": "Teacher limited access to attendance management"
        },
        {
            "role": "parent",
            "resource_type": "feature",
            "resource": "attendance_management",
            "action": "full",
            "description": "Parent full access to attendance management (should fail)"
        }
    ]
    
    casbin_manager = get_casbin_manager()
    for test_case in test_cases:
        has_permission = casbin_manager.check_permission(
            role=test_case["role"],
            resource_type=test_case["resource_type"],
            resource=test_case["resource"],
            action=test_case["action"]
        )
        
        status = "✅ GRANTED" if has_permission else "❌ DENIED"
        print(f"  {status} - {test_case['description']}")


async def main():
    """Main function."""
    print("🔐 Casbin RBAC + ABAC System Initialization")
    print("=" * 50)
    
    # Initialize the system
    success = await init_casbin_system()
    
    if success:
        # Test permissions
        await test_permissions()
        
        print("\n🎯 Next Steps:")
        print("  1. Access the permissions management interface at /permissions")
        print("  2. Review and customize policies as needed")
        print("  3. Test permissions using the test interface")
        print("  4. Monitor permission checks in application logs")
    else:
        print("\n❌ Initialization failed. Please check the error messages above.")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
