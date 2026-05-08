import React from 'react';
import { Sparkles } from 'lucide-react';

interface AssistantButtonProps {
  onClick: () => void;
}

const AssistantButton: React.FC<AssistantButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Open shopping assistant"
      className="
        fixed z-50 left-4 bottom-28
        md:left-6 md:bottom-6
        bg-gray-900 text-white
        w-14 h-14 rounded-full
        flex items-center justify-center
        shadow-lg hover:shadow-xl
        hover:bg-gray-700
        active:scale-95
        transition-all duration-200
      "
    >
      <Sparkles className="w-6 h-6" />
    </button>
  );
};

export default AssistantButton;
