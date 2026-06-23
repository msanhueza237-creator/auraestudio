'use strict';

import { AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
        onClick={loading ? undefined : onClose}
      />
      
      {/* Content modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 border border-brand-border animate-scale-in">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
            <AlertTriangle className="w-5.5 h-5.5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
            <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-brand-border hover:bg-brand-light text-stone-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
