import React from 'react';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDate = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const buildWeeks = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return [];
  }

  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const weeks = [];
  let week = new Array(7).fill(null);

  const startDay = start.getDay();
  for (let i = 0; i < startDay; i += 1) {
    week[i] = null;
  }

  let current = new Date(start);
  while (current <= end) {
    week[current.getDay()] = new Date(current);
    if (current.getDay() === 6) {
      weeks.push(week);
      week = new Array(7).fill(null);
    }
    current.setDate(current.getDate() + 1);
  }

  if (week.some((day) => day !== null)) {
    weeks.push(week);
  }

  return weeks;
};

const CalendarHeatmap = ({
  startDate,
  endDate,
  values = [],
  showWeekdayLabels = false,
  classForValue = () => '',
  titleForValue,
  tooltipDataAttrs,
}) => {
  const valueMap = new Map();
  values.forEach((value) => {
    if (!value || !value.date) {
      return;
    }
    const date = value.date instanceof Date ? value.date : new Date(value.date);
    valueMap.set(toDateKey(date), value);
  });

  const weeks = buildWeeks(startDate, endDate);

  return (
    <div className="calendar-heatmap">
      {showWeekdayLabels && (
        <div className="calendar-heatmap__weekday-labels">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="calendar-heatmap__weekday">
              {label}
            </div>
          ))}
        </div>
      )}
      <div className="calendar-heatmap__grid">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="calendar-heatmap__week">
            {week.map((date, dayIndex) => {
              const dateKey = date ? toDateKey(date) : null;
              const value = dateKey ? valueMap.get(dateKey) : null;
              const resolvedClass = date ? classForValue(value) : 'color-empty';
              const tooltipAttrs = date && tooltipDataAttrs ? tooltipDataAttrs(value) : {};
              const title = date && titleForValue ? titleForValue(value) : '';

              return (
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`calendar-heatmap__day ${resolvedClass}`}
                  data-date={dateKey || undefined}
                  title={title}
                  aria-label={title || dateKey || 'No data'}
                  role="img"
                  {...tooltipAttrs}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarHeatmap;
