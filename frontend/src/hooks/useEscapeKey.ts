import { useEffect } from 'react';

/**
 * Custom hook that triggers a callback when the Escape key is pressed.
 * @param onEscape Callback function to execute on Escape press
 * @param active Whether the listener should be active (default: true)
 */
export function useEscapeKey(onEscape: () => void, active: boolean = true) {
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEscape, active]);
}
