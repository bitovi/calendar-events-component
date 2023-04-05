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

`.event-body` - The content of the description field. Linebreaks in plaintext converted into br tags. (`event.description`)

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

Defaults are used for each option. To choose specifc variants of an option, add a colon immediately after the option property and its desired value imediately after that.

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

### data-find

Copy text and urls from links in the event's description (.event-body) into other parts of the template.

Given this event description:

QA Con 2023 [register here](https://bitovi.com) if you wish.
[Check out Andrew's meme of the day here](https://i.imgur.com/i7eZZ5X.jpg).

the following event template

```html
<calendar-events>
  <template>
    <div class="calendar-events-event">
      <a data-find="register"></a>
      <img data-find="meme">

      <p class='event-body'></p>
      <a data-find="register">Register Here!</a>
    </div>
  </template>
</calendar-events>
```

would produce:

```html
<div class="calendar-events-event">
  <a data-find="register" href="https://bitovi.com">register here</a>
  <img data-find="meme" src="https://i.imgur.com/i7eZZ5X.jpg" alt="Check out Andrew's meme of the day here">

  <p class='event-body'>
    QA Con 2023 <a href="https://bitovi.com">register here</a> if you wish.<br>
    <a href="https://i.imgur.com/i7eZZ5X.jpg">Check out Andrew's meme of the day here</a>.
  </p>
  <a data-find="register" href="https://bitovi.com">Register Here!</a>
</div>
```

if you want the copied data to be removed from the event-body, add `data-cut` flag to the `data-find` elements:

```html
<calendar-events>
  <template>
    <div class="calendar-events-event">
      <a data-find="register" data-cut></a>
      <img data-find="meme" data-cut>

      <p class='event-body'></p>
      <a data-find="register">Register Here!</a>
    </div>
  </template>
</calendar-events>
```

becomes:

```html
<div class="calendar-events-event">
  <a data-find="register" href="https://bitovi.com">register here</a>
  <img data-find="meme" src="https://i.imgur.com/i7eZZ5X.jpg" alt="Check out Andrew's meme of the day here">

  <p class='event-body'>
    QA Con 2023  if you wish.<br>
    .
  </p>
  <a data-find="register" href="https://bitovi.com">Register Here!</a>
</div>
```

Coordinate with your marketing team on what keywords your templates can expect to find in the link text within your event descriptions.

Using either above template, if the event description was instead:

"2077 DLC marketing campaign starts in June!"

the result would be:

```html
<div class="calendar-events-event">
  <p class='event-body'>
    2077 DLC marketing campaign starts in June!
  </p>
</div>
```

(any links without an `href` or images without a `src` are removed from the output)

You can specify default `href` / `src` attributes in the template, `data-find` will override them if found, otherwise the defaults will remain in the final output.

If a link in the template uses the `.event-url` class AND `data-find`, the event url will act as a default href value and only be overwritten if data-find matched. If not matched, the link will remain in the output with the event-url.

Default textContent of a link will NOT be overwritten by `data-find`.

Default alt text of an image WILL be overwritten by `data-find`.

Finally, if your marketing team wants to be more flexible with their link text in the event descriptions, you can specify multiple find terms in your template with a space-separated-list of terms:

```html
...
<a data-find="register registration"></a>
...
```

There should not be more than one link in the event's description whose text contains a `data-find` query term (case insensitive), but if there is, only the first one is used.
