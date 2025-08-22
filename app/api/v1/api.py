from fastapi import APIRouter

from app.api.v1.endpoints import auth, schools, users, students, attendance, gate_pass

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(schools.router, prefix="/schools", tags=["schools"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(gate_pass.router, prefix="/gate-pass", tags=["gate-pass"]) 