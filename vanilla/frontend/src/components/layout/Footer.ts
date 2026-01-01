/* eslint-disable react/require-render-return */
/**
 * Footer Layout Component
 */

import { Component } from '../base/Component';
import { createElement } from '../../utils/dom';

export interface FooterProps {
  copyright?: string;
  links?: { label: string; url: string }[];
}

export class Footer extends Component<FooterProps, {}> {
  constructor(props: FooterProps) {
    super(props, {});
  }

  protected getClassName(): string {
    return 'footer';
  }

  protected render(): void {
    this.element.innerHTML = '';
    this.element.className = this.getClassName();

    const container = createElement('div', {
      className: 'footer-container',
    });

    const copyright = createElement('div', {
      className: 'footer-copyright',
      textContent: this.props.copyright || `© ${new Date().getFullYear()} Lithic Healthcare. All rights reserved.`,
    });

    container.appendChild(copyright);

    if (this.props.links && this.props.links.length > 0) {
      const links = createElement('div', {
        className: 'footer-links',
      });

      this.props.links.forEach((link) => {
        const linkEl = createElement('a', {
          className: 'footer-link',
          textContent: link.label,
          attributes: {
            href: link.url,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        });
        links.appendChild(linkEl);
      });

      container.appendChild(links);
    }

    this.element.appendChild(container);
  }
}

export default Footer;
