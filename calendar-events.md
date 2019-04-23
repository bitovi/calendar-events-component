## @bitovi/calendar-events

The `@bitovi/calendar-events` package exports a `<calendar-events>`
custom element that lists events loaded from a google calendar.

Use it like:

```html
<calendar-events
	api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
	calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
	event-count="3"
	show-recurring
></calendar-events>
```

## Attributes

### api-key

`required`

Set this to a google api key.

### calendar-id

`required`

The calendar whose events will be displayed.

### event-count

The total number of events to display. This defaults to `10`.

### show-recurring

If present, this will include recurring events.
