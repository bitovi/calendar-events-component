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


## HTML

The default html output looks like the following:

```html
<calendar-events>
	<div class='event-header'>
		<div class='event-summary'><a class='event-url event-title'></a></div>
		<div class='event-group'></div>
		<div class='event-date'></div>
		<div class='event-location'></div>
		<div class='event-body'></div>
	</div>
	<div class='event-footer'><a class='event-url'>View Event</a></div>
	...
</calendar-events>
```

You can customize it by adding it to a `<template>` within your page:

```html
<calendar-events>
	<template>
		<a class='event-url'>
			<h1 class='event-title'></h1>
			<p class='event-body'></p>
		</a>
	</template>
</calendar-events>
```
