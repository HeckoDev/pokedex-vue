import { onMounted, onUnmounted, watch, type Ref } from 'vue';

/**
 * Composable to manage focus trap in modals for accessibility
 * Traps focus inside a container and handles keyboard navigation
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null>,
  isActive: Ref<boolean>,
  onClose?: () => void
) {
  let previouslyFocusedElement: HTMLElement | null = null;

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.value) return [];

    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(selector)
    ).filter((el) => {
      return (
        el.offsetParent !== null &&
        !el.hasAttribute('disabled') &&
        !el.getAttribute('aria-hidden')
      );
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isActive.value || !containerRef.value) return;

    // Handle Escape key
    if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
      return;
    }

    // Handle Tab key for focus trap
    if (e.key === 'Tab') {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const activate = () => {
    if (!containerRef.value) return;

    // Store currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus first focusable element in container
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  };

  const deactivate = () => {
    // Restore focus to previously focused element
    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      previouslyFocusedElement.focus();
    }
  };

  watch(isActive, (active) => {
    if (active) {
      // Use nextTick to ensure DOM is updated
      setTimeout(activate, 10);
    } else {
      deactivate();
    }
  });

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
    deactivate();
  });

  return {
    activate,
    deactivate,
  };
}
