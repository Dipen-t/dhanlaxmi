"use client";

import { useMemo, useState } from "react";

type EventTimePickerProps = {
  defaultValue?: string | null;
};

function parseTime(value: string | null | undefined) {
  const match = value?.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return { hour: "", minute: "", period: "" };

  const hour24 = Number(match[1]);
  return {
    hour: String(hour24 % 12 || 12),
    minute: match[2],
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

export function EventTimePicker({ defaultValue }: EventTimePickerProps) {
  const initial = useMemo(() => parseTime(defaultValue), [defaultValue]);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);

  const eventTime = useMemo(() => {
    if (!hour || !minute || !period) return "";
    const hour12 = Number(hour);
    const hour24 = period === "PM" ? (hour12 % 12) + 12 : hour12 % 12;
    return `${String(hour24).padStart(2, "0")}:${minute}`;
  }, [hour, minute, period]);

  const savedMinuteIsCustom = initial.minute && Number(initial.minute) % 5 !== 0;
  const minutes = [
    ...(savedMinuteIsCustom ? [initial.minute] : []),
    ...Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0")),
  ].filter((value, index, values) => values.indexOf(value) === index);

  const selectClass =
    "min-h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-foreground">
        Event time
      </legend>
      <input type="hidden" name="eventTime" value={eventTime} />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <label className="min-w-0">
          <span className="sr-only">Hour</span>
          <select
            required
            aria-label="Event hour"
            value={hour}
            onChange={(event) => setHour(event.target.value)}
            className={`w-full ${selectClass}`}
          >
            <option value="">Hour</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0">
          <span className="sr-only">Minutes</span>
          <select
            required
            aria-label="Event minutes"
            value={minute}
            onChange={(event) => setMinute(event.target.value)}
            className={`w-full ${selectClass}`}
          >
            <option value="">Minutes</option>
            {minutes.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0">
          <span className="sr-only">AM or PM</span>
          <select
            required
            aria-label="AM or PM"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className={`w-full ${selectClass}`}
          >
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </label>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        Shared with vendors as a simple time, for example 7:30 PM.
      </p>
    </fieldset>
  );
}
