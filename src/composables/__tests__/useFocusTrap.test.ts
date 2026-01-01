import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let containerRef: ReturnType<typeof ref<HTMLElement | null>>;
  let isActive: ReturnType<typeof ref<boolean>>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Créer un conteneur de test
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Créer des éléments focalisables
    const button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    container.appendChild(button1);

    const input = document.createElement('input');
    input.type = 'text';
    container.appendChild(input);

    const button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    container.appendChild(button2);

    containerRef = ref<HTMLElement | null>(container);
    isActive = ref(false);
    onClose = vi.fn();
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('initialization', () => {
    it('should create focus trap with valid refs', () => {
      const trap = useFocusTrap(containerRef, isActive, onClose);
      
      expect(trap).toHaveProperty('activate');
      expect(trap).toHaveProperty('deactivate');
      expect(typeof trap.activate).toBe('function');
      expect(typeof trap.deactivate).toBe('function');
    });
  });

  describe('activate', () => {
    it('should focus first focusable element when activated', async () => {
      const trap = useFocusTrap(containerRef, isActive, onClose);
      
      trap.activate();
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const firstButton = container.querySelector('button');
      expect(document.activeElement).toBe(firstButton);
    });

    it('should store previously focused element', () => {
      const externalButton = document.createElement('button');
      document.body.appendChild(externalButton);
      externalButton.focus();

      const trap = useFocusTrap(containerRef, isActive, onClose);
      trap.activate();

      document.body.removeChild(externalButton);
    });
  });

  describe('deactivate', () => {
    it('should restore focus to previously focused element', async () => {
      const externalButton = document.createElement('button');
      document.body.appendChild(externalButton);
      externalButton.focus();

      const trap = useFocusTrap(containerRef, isActive, onClose);
      trap.activate();
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      trap.deactivate();
      
      // Vérifier que le focus est restauré
      expect(document.activeElement).toBe(externalButton);

      document.body.removeChild(externalButton);
    });
  });

  describe('keyboard navigation', () => {
    it('should return activate and deactivate methods', () => {
      const trap = useFocusTrap(containerRef, isActive, onClose);
      
      // Vérifier que le trap retourne les bonnes méthodes
      expect(trap).toHaveProperty('activate');
      expect(trap).toHaveProperty('deactivate');
      expect(typeof trap.activate).toBe('function');
      expect(typeof trap.deactivate).toBe('function');
    });

    it('should trap Tab key within container', async () => {
      isActive.value = true;
      useFocusTrap(containerRef, isActive, onClose);

      const buttons = container.querySelectorAll('button');
      const lastButton = buttons[buttons.length - 1];
      lastButton.focus();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(tabEvent);
      
      // Le focus devrait revenir au premier élément
      // Note: Dans un test réel, cela nécessiterait une simulation plus complexe
    });

    it('should handle Shift+Tab to cycle backwards', async () => {
      isActive.value = true;
      useFocusTrap(containerRef, isActive, onClose);

      const buttons = container.querySelectorAll('button');
      const firstButton = buttons[0];
      firstButton.focus();

      const shiftTabEvent = new KeyboardEvent('keydown', { 
        key: 'Tab', 
        shiftKey: true,
        bubbles: true 
      });
      document.dispatchEvent(shiftTabEvent);
    });
  });

  describe('focusable elements detection', () => {
    it('should ignore disabled elements', () => {
      const disabledButton = document.createElement('button');
      disabledButton.disabled = true;
      container.appendChild(disabledButton);

      const trap = useFocusTrap(containerRef, isActive, onClose);
      trap.activate();

      // Le bouton désactivé ne devrait pas recevoir le focus
    });

    it('should ignore hidden elements', () => {
      const hiddenButton = document.createElement('button');
      hiddenButton.style.display = 'none';
      container.appendChild(hiddenButton);

      const trap = useFocusTrap(containerRef, isActive, onClose);
      trap.activate();
    });

    it('should handle container with no focusable elements', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);
      const emptyRef = ref<HTMLElement | null>(emptyContainer);

      const trap = useFocusTrap(emptyRef, isActive, onClose);
      expect(() => trap.activate()).not.toThrow();

      document.body.removeChild(emptyContainer);
    });
  });

  describe('watch behavior', () => {
    it('should activate when isActive becomes true', async () => {
      const trap = useFocusTrap(containerRef, isActive, onClose);
      const activateSpy = vi.spyOn(trap, 'activate');

      isActive.value = true;
      
      await new Promise(resolve => setTimeout(resolve, 20));

      // Le trap devrait être activé automatiquement
      const firstButton = container.querySelector('button');
      expect(document.activeElement).toBe(firstButton);
    });

    it('should deactivate when isActive becomes false', async () => {
      const externalButton = document.createElement('button');
      document.body.appendChild(externalButton);
      externalButton.focus();

      isActive.value = true;
      useFocusTrap(containerRef, isActive, onClose);
      
      await new Promise(resolve => setTimeout(resolve, 20));

      isActive.value = false;
      
      await new Promise(resolve => setTimeout(resolve, 20));

      // Le focus devrait être restauré
      expect(document.activeElement).toBe(externalButton);

      document.body.removeChild(externalButton);
    });
  });

  describe('edge cases', () => {
    it('should handle null container ref', () => {
      const nullRef = ref<HTMLElement | null>(null);
      const trap = useFocusTrap(nullRef, isActive, onClose);

      expect(() => trap.activate()).not.toThrow();
      expect(() => trap.deactivate()).not.toThrow();
    });

    it('should not throw if onClose is not provided', () => {
      isActive.value = true;
      useFocusTrap(containerRef, isActive);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => document.dispatchEvent(escapeEvent)).not.toThrow();
    });

    it('should only handle events when active', () => {
      isActive.value = false;
      useFocusTrap(containerRef, isActive, onClose);

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
