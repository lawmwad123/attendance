import React from 'react';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'danger';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  showCancel = true,
  showConfirm = true,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirm: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
        };
      case 'warning':
        return {
          confirm: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
        };
      case 'success':
        return {
          confirm: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
        };
      default:
        return {
          confirm: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          cancel: 'bg-gray-200 hover:bg-gray-300 text-gray-900'
        };
    }
  };

  const buttonStyles = getButtonStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 sm:mx-0 sm:h-10 sm:w-10">
                {getIcon()}
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            {showConfirm && (
              <button
                type="button"
                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto ${buttonStyles.confirm}`}
                onClick={handleConfirm}
              >
                {confirmText}
              </button>
            )}
            {showCancel && (
              <button
                type="button"
                className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 sm:mt-0 sm:w-auto ${buttonStyles.cancel}`}
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
