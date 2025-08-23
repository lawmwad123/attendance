import os
import uuid
import aiofiles
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image
import io
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import FileResponse

from app.core.config import settings


class FileUploadService:
    """Service for handling file uploads, specifically profile images."""
    
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.profile_images_dir = self.upload_dir / settings.PROFILE_IMAGES_DIR
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure upload directories exist."""
        self.upload_dir.mkdir(exist_ok=True)
        self.profile_images_dir.mkdir(exist_ok=True)
    
    async def validate_image_file(self, file: UploadFile) -> None:
        """Validate uploaded image file."""
        if not file.content_type in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
            )
        
        # Check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)
        
        if file_size > settings.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size {file_size} bytes exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes"
            )
        
        # Reset file pointer for further processing
        await file.seek(0)
    
    async def process_and_save_profile_image(
        self, 
        file: UploadFile, 
        user_id: int,
        school_id: int
    ) -> str:
        """
        Process and save profile image with resizing and optimization.
        
        Args:
            file: Uploaded file
            user_id: User ID for filename generation
            school_id: School ID for organization
            
        Returns:
            str: Relative path to saved image
        """
        # Validate file
        await self.validate_image_file(file)
        
        # Read file content
        content = await file.read()
        
        # Process image with PIL
        try:
            image = Image.open(io.BytesIO(content))
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Resize image if it's too large
            image = self._resize_image(image)
            
            # Generate unique filename
            file_extension = self._get_file_extension(file.filename)
            filename = f"profile_{school_id}_{user_id}_{uuid.uuid4().hex}{file_extension}"
            file_path = self.profile_images_dir / filename
            
            # Save optimized image
            image.save(
                file_path,
                quality=settings.IMAGE_QUALITY,
                optimize=True
            )
            
            # Return relative path for database storage
            return str(file_path.relative_to(self.upload_dir))
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to process image: {str(e)}"
            )
    
    def _resize_image(self, image: Image.Image) -> Image.Image:
        """Resize image to fit within maximum dimensions while maintaining aspect ratio."""
        width, height = image.size
        
        if width <= settings.IMAGE_MAX_WIDTH and height <= settings.IMAGE_MAX_HEIGHT:
            return image
        
        # Calculate new dimensions
        ratio = min(settings.IMAGE_MAX_WIDTH / width, settings.IMAGE_MAX_HEIGHT / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        
        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    def _get_file_extension(self, filename: str) -> str:
        """Get file extension from filename."""
        return Path(filename).suffix.lower()
    
    async def delete_profile_image(self, image_path: str) -> bool:
        """Delete profile image file."""
        try:
            file_path = self.upload_dir / image_path
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception:
            return False
    
    def get_image_url(self, image_path: str) -> str:
        """Get URL for profile image."""
        if not image_path:
            return ""
        return f"/uploads/{image_path}"
    
    async def serve_image(self, image_path: str) -> Optional[FileResponse]:
        """Serve image file."""
        try:
            file_path = self.upload_dir / image_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(
                    path=file_path,
                    media_type=self._get_media_type(file_path.suffix)
                )
            return None
        except Exception:
            return None
    
    def _get_media_type(self, extension: str) -> str:
        """Get media type from file extension."""
        media_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp'
        }
        return media_types.get(extension.lower(), 'image/jpeg')


# Global instance
file_upload_service = FileUploadService()
