/**
 * DOM Utility Functions for Vanilla TypeScript
 */

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string | string[];
    id?: string;
    attributes?: Record<string, string | undefined>;
    children?: (HTMLElement | string)[];
    innerHTML?: string;
    textContent?: string;
    events?: Record<string, EventListener>;
    dataset?: Record<string, string>;
  },
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag);

  if (options) {
    // Set className
    if (options.className) {
      if (Array.isArray(options.className)) {
        element.classList.add(...options.className);
      } else {
        element.className = options.className;
      }
    }

    // Set ID
    if (options.id) {
      element.id = options.id;
    }

    // Set attributes
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        if (value !== undefined) {
          element.setAttribute(key, value);
        }
      });
    }

    // Set dataset
    if (options.dataset) {
      Object.entries(options.dataset).forEach(([key, value]) => {
        element.dataset[key] = value;
      });
    }

    // Set innerHTML
    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }

    // Set textContent
    if (options.textContent) {
      element.textContent = options.textContent;
    }

    // Add children
    if (options.children) {
      options.children.forEach((child) => {
        if (typeof child === "string") {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      });
    }

    // Add event listeners
    if (options.events) {
      Object.entries(options.events).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
      });
    }
  }

  return element;
};

export const querySelector = <T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document,
): T | null => {
  return parent.querySelector<T>(selector);
};

export const querySelectorAll = <T extends HTMLElement>(
  selector: string,
  parent: Document | HTMLElement = document,
): T[] => {
  return Array.from(parent.querySelectorAll<T>(selector));
};

export const addClass = (element: HTMLElement, ...classes: string[]): void => {
  element.classList.add(...classes);
};

export const removeClass = (
  element: HTMLElement,
  ...classes: string[]
): void => {
  element.classList.remove(...classes);
};

export const toggleClass = (element: HTMLElement, className: string): void => {
  element.classList.toggle(className);
};

export const hasClass = (element: HTMLElement, className: string): boolean => {
  return element.classList.contains(className);
};

export const setAttribute = (
  element: HTMLElement,
  attributes: Record<string, string>,
): void => {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

export const removeAttribute = (
  element: HTMLElement,
  ...attributes: string[]
): void => {
  attributes.forEach((attr) => element.removeAttribute(attr));
};

export const show = (element: HTMLElement): void => {
  element.style.display = "";
  removeClass(element, "hidden");
};

export const hide = (element: HTMLElement): void => {
  element.style.display = "none";
  addClass(element, "hidden");
};

export const toggle = (element: HTMLElement): void => {
  if (element.style.display === "none" || hasClass(element, "hidden")) {
    show(element);
  } else {
    hide(element);
  }
};

export const empty = (element: HTMLElement): void => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export const remove = (element: HTMLElement): void => {
  element.parentNode?.removeChild(element);
};

export const on = (
  element: HTMLElement | Window | Document,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions,
): void => {
  element.addEventListener(event, handler, options);
};

export const off = (
  element: HTMLElement | Window | Document,
  event: string,
  handler: EventListener,
  options?: EventListenerOptions,
): void => {
  element.removeEventListener(event, handler, options);
};

export const trigger = (
  element: HTMLElement,
  eventName: string,
  detail?: any,
): void => {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(event);
};

export const delegate = (
  parent: HTMLElement,
  selector: string,
  event: string,
  handler: (e: Event, target: HTMLElement) => void,
): void => {
  parent.addEventListener(event, (e) => {
    const target = (e.target as HTMLElement).closest(selector);
    if (target && parent.contains(target as Node)) {
      handler(e, target as HTMLElement);
    }
  });
};

export const ready = (callback: () => void): void => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

export const insertBefore = (
  newElement: HTMLElement,
  referenceElement: HTMLElement,
): void => {
  referenceElement.parentNode?.insertBefore(newElement, referenceElement);
};

export const insertAfter = (
  newElement: HTMLElement,
  referenceElement: HTMLElement,
): void => {
  referenceElement.parentNode?.insertBefore(
    newElement,
    referenceElement.nextSibling,
  );
};

export const closest = <T extends HTMLElement>(
  element: HTMLElement,
  selector: string,
): T | null => {
  return element.closest<T>(selector);
};

export const matches = (element: HTMLElement, selector: string): boolean => {
  return element.matches(selector);
};

export const getOffset = (
  element: HTMLElement,
): { top: number; left: number } => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
  };
};

export const scrollTo = (
  element: HTMLElement,
  options?: ScrollIntoViewOptions,
): void => {
  element.scrollIntoView(options);
};

export const isVisible = (element: HTMLElement): boolean => {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
};

export const sanitizeHtml = (html: string): string => {
  const div = document.createElement("div");
  div.textContent = html;
  return div.innerHTML;
};

const domUtils = {
  createElement,
  querySelector,
  querySelectorAll,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setAttribute,
  removeAttribute,
  show,
  hide,
  toggle,
  empty,
  remove,
  on,
  off,
  trigger,
  delegate,
  ready,
  insertBefore,
  insertAfter,
  closest,
  matches,
  getOffset,
  scrollTo,
  isVisible,
  sanitizeHtml,
};

export default domUtils;
