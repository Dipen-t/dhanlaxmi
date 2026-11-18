"use client";

import { useMemo, useState } from "react";

type EventTimePickerProps = {
  defaultValue?: string | null;
  label?: string;
  required?: boolean;
  onChange?: (value: string) => void;
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

export function EventTimePicker({ defaultValue, label = "Event time", required = true, onChange }: EventTimePickerProps) {
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

  function updateTime(nextHour: string, nextMinute: string, nextPeriod: string) {
    setHour(nextHour);
    setMinute(nextMinute);
    setPeriod(nextPeriod);
    if (!nextHour || !nextMinute || !nextPeriod) {
      onChange?.("");
      return;
    }
    const hour24 = Number(nextHour) % 12 + (nextPeriod === "PM" ? 12 : 0);
    onChange?.(`${String(hour24).padStart(2, "0")}:${nextMinute}`);
  }

  const savedMinuteIsCustom = initial.minute && Number(initial.minute) % 5 !== 0;
  const minutes = [
    ...(savedMinuteIsCustom ? [initial.minute] : []),
    ...Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0")),
  ].filter((value, index, values) => values.indexOf(value) === index);

  const selectClass =
    "min-h-11 min-w-0 rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/30";

  return (
    <fieldset data-delivery-timing={!required || undefined}>
      <legend className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </legend>
      {onChange ? null : <input type="hidden" name="eventTime" value={eventTime} />}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
        <label className="min-w-0">
          <span className="sr-only">Hour</span>
          <select
            required={required || Boolean(hour || minute || period)}
            aria-label="Event hour"
            value={hour}
            onChange={(event) => updateTime(event.target.value, minute, period)}
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
            required={required || Boolean(hour || minute || period)}
            aria-label="Event minutes"
            value={minute}
            onChange={(event) => updateTime(hour, event.target.value, period)}
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
            required={required || Boolean(hour || minute || period)}
            aria-label="AM or PM"
            value={period}
            onChange={(event) => updateTime(hour, minute, event.target.value)}
            className={`w-full ${selectClass}`}
          >
            <option value="">AM/PM</option>
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </label>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {required ? "Shared with vendors as a simple time, for example 7:30 PM." : "Leave empty to send the order’s meal name."}
      </p>
      {!required && (hour || minute || period) ? (
        <button type="button" onClick={() => updateTime("", "", "")} className="mt-1 min-h-11 rounded-lg px-2 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Clear timing
        </button>
      ) : null}
    </fieldset>
  );
}
