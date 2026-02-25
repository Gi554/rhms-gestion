import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-lg",
    description
}) {
    // Prevent scrolling behind modal when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className={cn(
                    "bg-white rounded-[2.5rem] shadow-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-white flex flex-col max-h-[90vh]",
                    maxWidth
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h3>
                        {description && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl hover:bg-white text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
