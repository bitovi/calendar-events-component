## @bitovi/calendar-events

The `@bitovi/calendar-events` package exports a `<calendar-events>`
custom element that lists events loaded from a google calendar.

Import the `calendar-events.js` file from `/dist/amd/`, `/dist/cjs/`, or `/dist/global/`

Use it by adding the custom element to your page:

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

The default html output for an event looks like the following:

```html
<calendar-events>
  <div class="calendar-events-event">
    <div class='event-header'>
      <div class='event-summary'><a class='event-url event-title'></a></div>
      <div class='event-group'></div>
      <div class='event-date'></div>
      <div class='event-location'></div>
      <div class='event-body'></div>
    </div>
    <div class='event-footer'><a class='event-url'>View Event</a></div>
  </div>
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

If you wrap your custom event template in a container with class `calendar-events-event`, you can specify custom templates for other states as well:

```html
<calendar-events>
  <template>
    <div class="calendar-events-event">
      <a class='event-url'>
        <h1 class='event-title'></h1>
        <p class='event-body'></p>
      </a>
    </div>
    <div class='calendar-events-pending'>Appears when the calendar API is fetching</div>
    <div class='calendar-events-rejected'><p>Appears when an error occured.</p></div>
    <div class='calendar-events-resolved'><p>Appears when there are no events to display.</p></div>
  </template>
</calendar-events>
```

Within the event template (`.calendar-events-event`), the following classes will allow the element to be updated with corresponding information about the event. The textContent of every tag matching the class is replaced.

`.event-title` - The title of the event (`event.summary` from the API response)

`.event-group` - The name of the Calendar the event was created under (`event.organizer.displayName`)

`.event-location` - The location field or hangout link, urls become links. (`event.location || event.hangoutLink`)

`.event-body` - The plain text of the description field. HTML descriptions not yet supported. (`event.description`)

`a.event-url` - Updates the href (must be an `a` tag in your template) as a link to the event itself. (`event.htmlLink`)

`.event-all-day` - adds a `data-all-day` attribute to the element with a value of true or false for styling purposes like hiding the time.

`.event-date` - The event's start date and time. (`event.start.dateTime || event.start.date`)

### .event-date locales and options

The replaced value of `.event-date` uses [date.toLocaleString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleString). The `locales` and `options` parameters are best documented under the [Intl.DateTimeFormat() constructor](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat).

By default, if the calendar start date does not include a time ("All Day" is checked) then the date shown in `.event-date` elements will be the result of calling `.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" })`

In the US, that might produce the string `Apr 7, 2023`. In Japan, it may return `2023年4月7日`. Order of the options does not matter.

By default, if the calendar start date also includes a time, the default options are:

```
month: "short",
day: "numeric",
year: "numeric",
hour: "numeric",
minute: "2-digit"
```

which may produce `Apr 7, 2023, 9:21 PM` in the US or `2023年4月7日 21:21` in Japan.

#### data-locales

To set a specific locale, pass a space separated list of locale tags like so:

`<span class="event-date" data-locales="en-US"></span>`

or

`<span class="event-date" data-locales="iu-Cans-CA es-PR"></span>`

the first tag in the list that's suported by the browser will be chosen.

#### data-options

Browsers do not support all combinations of [the possible options options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle) but many work as expected.

You can use the `data-options` attribute to customize the output.

Options in the mdn documentation linked above can be placed in the attribute in a space separated list to include them in the output.

```html
<span class="event-date" data-locales="en-US" data-options="month day weekday"></span>
<span class="event-date" data-locales="en-US" data-options="weekday"></span>
<span class="event-date" data-locales="en-US" data-options="year"></span>
<span class="event-date" data-locales="en-US" data-options="month"></span>
<span class="event-date" data-locales="en-US" data-options="day"></span>
<span class="event-date" data-locales="en-US" data-options="hour"></span>
<span class="event-date" data-locales="en-US" data-options="hour hourCycle:h24"></span>
<span class="event-date" data-locales="en-US" data-options="hour hour12:false"></span>
```

These are the most common combinations:
```
data-options="weekday year month day hour minute second"
data-options="weekday year month day"
data-options="year month day"
data-options="year month"
data-options="month day"
data-options="hour minute second"
data-options="hour minute"
```

Defaults are used for each option. To choose specifc variants of an option, add a semicolon immediately after the option property and its desired value imediately after that.

```html
<span class="event-date" data-options="month:short day:2-digit weekday:short"></span>

<span class="event-date" data-options="hour hourCycle:h24"></span>
<span class="event-date" data-options="hour hour12:false"></span>

<span class="event-date" data-options="weekday:long"></span>
<span class="event-date" data-options="weekday:short"></span>
<span class="event-date" data-options="weekday:narrow"></span>

<span class="event-date" data-options="year:numeric"></span>
<span class="event-date" data-options="year:2-digit"></span>

<span class="event-date" data-options="month:numeric"></span>
<span class="event-date" data-options="month:2-digit"></span>
<span class="event-date" data-options="month:long"></span>
<span class="event-date" data-options="month:short"></span>
<span class="event-date" data-options="month:narrow"></span>

<span class="event-date" data-options="day:numeric"></span>
<span class="event-date" data-options="day:2-digit"></span>
```
