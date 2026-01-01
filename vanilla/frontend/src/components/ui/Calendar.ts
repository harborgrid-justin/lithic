/* eslint-disable react/require-render-return */
/**
 * Calendar Component
 */

import { Component } from '../base/Component';
import { createElement } from '../../utils/dom';
import { formatDate } from '../../utils/format';

export interface CalendarProps {
  selectedDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  onChange?: (date: Date) => void;
}

interface CalendarState {
  currentMonth: Date;
  selectedDate: Date | null;
}

export class Calendar extends Component<CalendarProps, CalendarState> {
  constructor(props: CalendarProps) {
    super(props, {
      currentMonth: props.selectedDate || new Date(),
      selectedDate: props.selectedDate || null,
    });
  }

  protected getClassName(): string {
    return 'calendar';
  }

  protected render(): void {
    this.element.innerHTML = '';
    this.element.className = this.getClassName();

    const header = this.createHeader();
    this.element.appendChild(header);

    const weekdays = this.createWeekdays();
    this.element.appendChild(weekdays);

    const days = this.createDays();
    this.element.appendChild(days);
  }

  private createHeader(): HTMLElement {
    const header = createElement('div', {
      className: 'calendar-header',
    });

    const prevBtn = createElement('button', {
      className: 'calendar-nav-btn',
      innerHTML: '‹',
      events: {
        click: () => this.changeMonth(-1),
      },
    });

    const title = createElement('div', {
      className: 'calendar-title',
      textContent: formatDate(this.state.currentMonth, {
        year: 'numeric',
        month: 'long',
      }),
    });

    const nextBtn = createElement('button', {
      className: 'calendar-nav-btn',
      innerHTML: '›',
      events: {
        click: () => this.changeMonth(1),
      },
    });

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    return header;
  }

  private createWeekdays(): HTMLElement {
    const weekdays = createElement('div', {
      className: 'calendar-weekdays',
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    days.forEach((day) => {
      const dayEl = createElement('div', {
        className: 'calendar-weekday',
        textContent: day,
      });
      weekdays.appendChild(dayEl);
    });

    return weekdays;
  }

  private createDays(): HTMLElement {
    const daysContainer = createElement('div', {
      className: 'calendar-days',
    });

    const year = this.state.currentMonth.getFullYear();
    const month = this.state.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Previous month days
    for (let i = 0; i < startDay; i++) {
      const day = createElement('div', {
        className: 'calendar-day calendar-day-other',
      });
      daysContainer.appendChild(day);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayEl = this.createDay(date);
      daysContainer.appendChild(dayEl);
    }

    return daysContainer;
  }

  private createDay(date: Date): HTMLElement {
    const classes = ['calendar-day'];

    const isSelected = this.state.selectedDate &&
      this.isSameDay(date, this.state.selectedDate);

    const isToday = this.isSameDay(date, new Date());
    const isDisabled = this.isDateDisabled(date);

    if (isSelected) classes.push('calendar-day-selected');
    if (isToday) classes.push('calendar-day-today');
    if (isDisabled) classes.push('calendar-day-disabled');

    const day = createElement('div', {
      className: classes.join(' '),
      textContent: String(date.getDate()),
      events: {
        click: () => !isDisabled && this.handleDateClick(date),
      },
    });

    return day;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  private isDateDisabled(date: Date): boolean {
    if (this.props.minDate && date < this.props.minDate) {
      return true;
    }

    if (this.props.maxDate && date > this.props.maxDate) {
      return true;
    }

    if (this.props.disabledDates) {
      return this.props.disabledDates.some((d) => this.isSameDay(d, date));
    }

    return false;
  }

  private handleDateClick(date: Date): void {
    this.setState({ selectedDate: date });

    if (this.props.onChange) {
      this.props.onChange(date);
    }
  }

  private changeMonth(delta: number): void {
    const newMonth = new Date(this.state.currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    this.setState({ currentMonth: newMonth });
  }

  public getSelectedDate(): Date | null {
    return this.state.selectedDate;
  }

  public setSelectedDate(date: Date): void {
    this.setState({ selectedDate: date, currentMonth: date });
  }
}

export default Calendar;
