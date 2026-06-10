// components/FocusLockedInput.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface FocusLockedInputProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  className?: string;
  isTextarea?: boolean;
  placeholder?: string;
  readOnly?: boolean; // <-- ADD THIS
}

export default function FocusLockedInput({ 
  initialValue, 
  onSave, 
  className = '', 
  isTextarea = false,
  placeholder = '',
  readOnly = false    // <-- ADD THIS
}: FocusLockedInputProps) {
  const [localValue, setLocalValue] = useState(initialValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(initialValue || '');
    }
  }, [initialValue, isFocused]);

  useEffect(() => {
    if (isTextarea && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localValue, isTextarea]);

  const handleCommit = () => {
    setIsFocused(false);
    if (localValue.trim() !== (initialValue || '').trim()) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommit();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  };

  if (isTextarea) {
    return (
      <textarea
        ref={textareaRef}
        value={localValue}
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={() => !readOnly && setIsFocused(true)}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className={className}
        style={{ overflow: 'hidden' }}
      />
    );
  }

  return (
    <input
      type="text"
      value={localValue}
      placeholder={placeholder}
      readOnly={readOnly} // <-- ADD THIS
      onFocus={() => !readOnly && setIsFocused(true)}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
}