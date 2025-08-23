import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useAppDispatch } from '../../hooks/redux';
import { updateUser } from '../../store/slices/authSlice';
import { useAppSelector } from '../../hooks/redux';
import { 
  Camera, 
  Upload, 
  X, 
  User,
  Loader2,
  Trash2
} from 'lucide-react';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  userId: number;
  userName: string;
  onImageUpdate?: (imageUrl: string) => void;
}

const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImageUrl,
  userId,
  userName,
  onImageUpdate
}) => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Debug: Log when user data changes
  useEffect(() => {
    console.log('User data changed:', { 
      userProfileImage: user?.profile_image, 
      currentImageUrl,
      userId,
      fullUser: user
    });
  }, [user?.profile_image, currentImageUrl, userId, user]);

  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadProfileImage(file),
    onSuccess: async (data) => {
      console.log('Upload success data:', data);
      toast.success('Profile image uploaded successfully!');
      setPreviewUrl(null);
      
      // Refresh user data from backend
      try {
        const updatedUser = await api.getCurrentUser();
        console.log('Updated user data:', updatedUser);
        
        // Update user in Redux store
        dispatch(updateUser(updatedUser));
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Call callback if provided
      if (onImageUpdate) {
        onImageUpdate(data.image_url);
      }
    },
    onError: (error: any) => {
      console.error('Error uploading image:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to upload image. Please try again.';
      toast.error(errorMessage);
      setPreviewUrl(null);
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.deleteProfileImage(),
    onSuccess: async () => {
      toast.success('Profile image deleted successfully!');
      
      // Refresh user data from backend
      try {
        const updatedUser = await api.getCurrentUser();
        console.log('Updated user data after delete:', updatedUser);
        
        // Update user in Redux store
        dispatch(updateUser(updatedUser));
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Call callback if provided
      if (onImageUpdate) {
        onImageUpdate('');
      }
    },
    onError: (error: any) => {
      console.error('Error deleting image:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to delete image. Please try again.';
      toast.error(errorMessage);
    },
  });

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadMutation.mutate(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDeleteImage = () => {
    if (confirm('Are you sure you want to delete your profile image?')) {
      deleteMutation.mutate();
    }
  };

  const getImageUrl = () => {
    // Use user data from Redux if available, otherwise fall back to prop
    const imagePath = user?.profile_image || currentImageUrl;
    console.log('getImageUrl called:', { 
      previewUrl, 
      imagePath, 
      userProfileImage: user?.profile_image,
      currentImageUrl,
      fullUser: user 
    });
    if (previewUrl) return previewUrl;
    if (imagePath) {
      // Use the static file serving URL
      const imageUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/uploads/${imagePath}`;
      console.log('Generated image URL:', imageUrl);
      return imageUrl;
    }
    return null;
  };

  const getInitials = () => {
    const names = userName.split(' ');
    return names.map(name => name.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Profile Image Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          {getImageUrl() ? (
            <img
              src={getImageUrl()!}
              alt={`${userName}'s profile`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          
          {/* Fallback initials */}
          <div className={`w-full h-full flex items-center justify-center text-3xl font-bold text-gray-600 ${getImageUrl() ? 'hidden' : ''}`}>
            {getInitials()}
          </div>
        </div>

        {/* Upload/Delete buttons */}
        <div className="absolute -bottom-2 -right-2 flex space-x-2">
          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="p-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            title="Upload new image"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>

          {/* Delete button */}
          {(user?.profile_image || currentImageUrl) && (
            <button
              onClick={handleDeleteImage}
              disabled={deleteMutation.isPending}
              className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              title="Delete image"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`w-full max-w-md p-6 border-2 border-dashed rounded-lg text-center transition-colors ${
          isDragging
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop an image here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Supports JPEG, PNG, WebP • Max 5MB
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
};

export default ProfileImageUpload;
