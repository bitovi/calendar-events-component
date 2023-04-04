// jshint ignore: start
var QUnit = require('steal-qunit');
var CalendarEvents = require('./calendar-events');

const fixture = document.getElementById('qunit-fixture')
const select = fixture.querySelector.bind(fixture)
const selectAll = fixture.querySelectorAll.bind(fixture)

const globalFetch = (typeof fetch !== "undefined") && fetch
QUnit.module('calendar-events', {
  beforeEach: function () {
    globalThis.fetch = () => Promise.resolve({ json: () => googleCalendarAPIResponse })
  },
  afterEach: function (assert) {
    globalThis.fetch = globalFetch
  }
})

const dateShapeRx = {
  "Apr 18, 2023, 6:30 PM": /^[^\s\d]+ \d{1,2}, \d{4}(?:,| at) \d{1,2}:\d{2} ..$/, // safari says "...2023 at 6..."
  "Tue, Apr 04": /^[a-z]{3}, [a-z]{3} \d\d$/i,
}

QUnit.test('Initialized the plugin', function () {
  QUnit.equal(typeof CalendarEvents, 'function');
})

QUnit.test('Component mounts, requests, renders, and uses default event template', async assert => {
  let lastFetchedUrl = ''

  globalThis.fetch = (url) => {
    lastFetchedUrl = url
    return Promise.resolve({ json: () => googleCalendarAPIResponse })
  }

  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    ></calendar-events>
  `
  const el = select("calendar-events")
  assert.ok(el, "el inserted")
  assert.ok(el.promise, "el promises")
  assert.equal(
    lastFetchedUrl,
    "https://www.googleapis.com/calendar/v3/calendars/" +
    "jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com" +
    "/events?key=AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns",
    "requests correct url based on the custom element attributes"
  )

  assert.equal(await el.promise.then(() => "READY"), "READY", "Response rendered")

  assert.equal(el.childElementCount, 3, "3 events")

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(eventEls.length, 3, "default template applied")
  assert.equal(eventEls[2], el.lastElementChild, "correct depth: calendar-events > event-instances")
})

QUnit.test('Component correctly uses default pending and resolved templates', async assert => {
  globalThis.fetch = (url) => {
    return Promise.resolve({ json: () => ({ items: [] }) }) // resolve with no items
  }
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    ></calendar-events>
  `
  const el = select("calendar-events")
  assert.ok(el, "el inserted")
  assert.ok(el.promise, "el promises")

  assert.ok(select(".calendar-events-pending"), "pending exists before resolved")
  assert.equal(selectAll("*").length, 2, "1 element inside custom element only")

  assert.equal(await el.promise.then(() => "READY"), "READY", "Response rendered")

  assert.equal(selectAll("*").length, 3, "2 elements total inside custom element after resolved")
  assert.equal(el.textContent, "There are no events to show.", "correct resolved but empty template used")

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(eventEls.length, 0, "no events rendered")
})

QUnit.test('Component correctly uses default rejected template', async assert => {
  globalThis.fetch = (url) => {
    return Promise.reject({})
  }
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    ></calendar-events>
  `
  const el = select("calendar-events")
  assert.ok(el, "el inserted")
  assert.ok(el.promise, "el promises")

  assert.ok(select(".calendar-events-pending"), "pending exists before rejected")

  assert.equal(await el.promise.catch(() => "READY"), "READY", "Response rendered")

  assert.equal(selectAll("*").length, 3, "3 elements total after rejected")
  assert.equal(el.textContent, "Sorry, events can't load right now.", "correct rejected template used")

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(eventEls.length, 0, "no events rendered")
})

QUnit.test('Component correctly parses and injects event data into the default event template', async assert => {
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    ></calendar-events>
  `
  await select("calendar-events").promise

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(eventEls.length, 3, "default template applied")

  assert.equal(
    eventEls[1].querySelector(".event-title").innerHTML,
    "JS.Chi April Meetup - JavaScript Lightning Talks",
    "title information correctly parsed & inserted"
  )

  assert.equal(
    eventEls[1].querySelector(".event-group").innerHTML,
    "Bitovi Community",
    "group information correctly parsed & inserted"
  )

  // TODO: this assertion might fail outside of the US because locales isn't specified
  assert.equal(
    dateShapeRx["Apr 18, 2023, 6:30 PM"].test(
      eventEls[1].querySelector(".event-date").innerHTML
    ),
    true,
    `date information (${eventEls[1].querySelector(".event-date").innerHTML}) correctly parsed & inserted`
  )

  assert.equal(
    eventEls[1].querySelector(".event-location").innerHTML,
    "29 N Upper Wacker Dr, Chicago, IL 60606, USA",
    "location information correctly parsed & inserted"
  )

  assert.equal(
    eventEls[1].querySelector(".event-body").innerHTML,
    "IN PERSON ChicagoJS Meetup<br><br>See all the details and RSVP here:&nbsp;<a href=\"https://www.google.com/url?q=https://www.meetup.com/js-chi/events/288515502/&amp;sa=D&amp;source=calendar&amp;ust=1680538571058455&amp;usg=AOvVaw1Uqtg1pPsvsyv6sfG4NFK7\" target=\"_blank\">https://www.meetup.com/js-chi/events/288515502/</a>",
    "body information correctly parsed & inserted"
  )

  assert.equal(
    eventEls[1].querySelector("a.event-url").href,
    "https://www.google.com/calendar/event?eid=N2ZjbHY2NTJmdTlydTg2NnZhbmpsOG1vaTEganVwaXRlcmpzLmNvbV9nMjd2Y2szNm5pZmJucXJna2N0a29hbnFiNEBn",
    "url information correctly parsed & inserted"
  )
})

/* custom templates */
QUnit.test('Component correctly uses custom pending and resolved templates', async assert => {
  globalThis.fetch = (url) => {
    return Promise.resolve({ json: () => ({ items: [] }) }) // resolve with no items
  }
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    >
      <template>
        <span class="calendar-events-pending custom">Hi, ily.</span>
        <span class="calendar-events-resolved custom">Ily2.</span>
      </template>
    </calendar-events>
  `
  const el = select("calendar-events")

  assert.ok(select("span.calendar-events-pending.custom"), "custom pending exists before resolved")
  assert.equal(el.textContent, "Hi, ily.", "custom pending template used")
  assert.equal(selectAll("*").length, 2)

  assert.equal(await el.promise.then(() => "READY"), "READY", "Response rendered")

  assert.ok(select("span.calendar-events-resolved.custom"), "custom resolved used")
  assert.equal(el.textContent, "Ily2.", "custom pending template used")
  assert.equal(selectAll("*").length, 2)

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(eventEls.length, 0, "no events rendered")
})

QUnit.test('Component correctly uses custom rejected template', async assert => {
  globalThis.fetch = (url) => {
    return Promise.reject({})
  }
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    >
      <template>
        <span class="calendar-events-event custom"><b>event</b></span>
        <span class="calendar-events-rejected custom">oh no.</span>
      </template>
    </calendar-events>
  `
  const el = select("calendar-events")

  assert.ok(select(".calendar-events-pending"), "default pending exists before rejected")

  assert.equal(await el.promise.catch(() => "READY"), "READY", "Response rendered")

  assert.equal(el.textContent, "oh no.", "correct custom rejected template used")
  assert.equal(selectAll("*").length, 2)

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(eventEls.length, 0, "no events rendered")
})

QUnit.test('Component correctly uses custom template for events when parts aren\'t specified', async assert => {
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    >
      <template>
        <span class="event-title custom"></span>
        <span class="event-group custom"></span>
        <span class="event-title custom duplicate">duplicate</span>
      </template>
    </calendar-events>
  `

  assert.ok(select(".calendar-events-pending"), "default pending exists before resolved")

  const el = select("calendar-events")

  await el.promise

  assert.equal(
    el.querySelectorAll(".event-title.custom")[2].innerHTML,
    "JS.Chi April Meetup - JavaScript Lightning Talks",
    "title information correctly parsed & inserted"
  )
  assert.equal(
    el.querySelectorAll(".event-title.custom")[3].innerHTML,
    "JS.Chi April Meetup - JavaScript Lightning Talks",
    "title information correctly parsed & inserted"
  )

  assert.equal(
    el.querySelectorAll(".event-group.custom")[1].innerHTML,
    "Bitovi Community",
    "group information correctly parsed & inserted"
  )

  assert.equal(selectAll("calendar-events > *").length, 9)
})

QUnit.test('Component correctly uses custom template part for events', async assert => {
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="3"
      show-recurring
    >
      <template>
        <div class="calendar-events-event">
          <span class="event-title"></span>
          <span class="event-group"></span>
          <span class="event-title duplicate">duplicate</span>
        </div>
        <span class="calendar-events-pending">Hi, ily.</span>
      </template>
    </calendar-events>
  `

  const el = select("calendar-events")

  assert.ok(select("span.calendar-events-pending"), "custom pending exists before resolved")
  assert.equal(el.textContent, "Hi, ily.", "custom pending template used")

  await el.promise

  assert.equal(
    el.querySelectorAll(".event-title")[2].innerHTML,
    "JS.Chi April Meetup - JavaScript Lightning Talks",
    "title information correctly parsed & inserted"
  )
  assert.equal(
    el.querySelectorAll(".event-title")[3].innerHTML,
    "JS.Chi April Meetup - JavaScript Lightning Talks",
    "title information correctly parsed & inserted"
  )

  assert.equal(
    el.querySelectorAll(".event-group")[1].innerHTML,
    "Bitovi Community",
    "group information correctly parsed & inserted"
  )

  assert.equal(selectAll("calendar-events > *").length, 3)
})

QUnit.test('event-all-day class works', async assert => {
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="100"
      show-recurring
    >
      <template>
        <div class="calendar-events-event event-all-day">
          <span class="event-title"></span>
          <span class="event-group"></span>
        </div>
      </template>
    </calendar-events>
  `

  const el = select("calendar-events")

  await el.promise

  assert.equal(selectAll(".event-all-day[data-all-day=true]").length, 9, "data-all-day appeneded with correct value")
  assert.equal(selectAll(".event-all-day[data-all-day=false]").length, 91, "data-all-day appeneded with correct value")
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
QUnit.test('Component correctly uses custom event-date field and its variants', async assert => {
  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="1"
      show-recurring
    >
      <template>
        <div class="calendar-events-event">
          <span class="event-date" data-locales="en-US"></span>
          <span class="event-date" data-locales="en-US" data-options="month:short day:2-digit weekday:short"></span>
          <span class="event-date" data-locales="en-US" data-options="weekday"></span>
          <span class="event-date" data-locales="en-US" data-options="year"></span>
          <span class="event-date" data-locales="en-US" data-options="month"></span>
          <span class="event-date" data-locales="en-US" data-options="day"></span>
          <span class="event-date" data-locales="en-US" data-options="hour"></span>
          <span class="event-date" data-locales="en-US" data-options="hour hourCycle:h24"></span>
          <span class="event-date" data-locales="en-US" data-options="hour hour12:false"></span>
          <span class="event-date" data-locales="en-US" data-options="hour minute"></span>
          <span class="event-date" data-locales="en-US" data-options="dayPeriod"></span>
          <span class="event-date" data-locales="en-US" data-options="minute"></span>
          <span class="event-date" data-locales="en-US" data-options="second"></span>
          <span class="event-date" data-locales="en-US" data-options="weekday:long"></span>
          <span class="event-date" data-locales="en-US" data-options="weekday:short"></span>
          <span class="event-date" data-locales="en-US" data-options="weekday:narrow"></span>
          <span class="event-date" data-locales="en-US" data-options="year:numeric"></span>
          <span class="event-date" data-locales="en-US" data-options="year:2-digit"></span>
          <span class="event-date" data-locales="en-US" data-options="month:numeric"></span>
          <span class="event-date" data-locales="en-US" data-options="month:2-digit"></span>
          <span class="event-date" data-locales="en-US" data-options="month:long"></span>
          <span class="event-date" data-locales="en-US" data-options="month:short"></span>
          <span class="event-date" data-locales="en-US" data-options="month:narrow"></span>
          <span class="event-date" data-locales="en-US" data-options="day:numeric"></span>
          <span class="event-date" data-locales="en-US" data-options="day:2-digit"></span>
        </div>
      </template>
    </calendar-events>
  `

  const el = select("calendar-events")

  await el.promise

  const dateEls = selectAll(".event-date")

  assert.equal(
    dateShapeRx["Apr 18, 2023, 6:30 PM"].test(
      dateEls[0].innerHTML
    ),
    true,
    `date information (${dateEls[0].innerHTML}) correctly parsed & inserted`
  )
  assert.equal(
    dateShapeRx["Tue, Apr 04"].test(
      dateEls[1].innerHTML
    ),
    true,
    `date information (${dateEls[1].innerHTML}) correctly parsed & inserted`
  )
  assert.equal(el.querySelector('[data-options="weekday"]').innerHTML, "Tue", "weekday by itself works")
  assert.equal(el.querySelector('[data-options="year"]').innerHTML, "2023", "year by itself works")
  assert.equal(el.querySelector('[data-options="month"]').innerHTML, "Apr", "month by itself works")
  assert.equal(el.querySelector('[data-options="day"]').innerHTML, "4", "day by itself works")
  assert.equal(el.querySelector('[data-options="hour"]').innerHTML, "12 PM", "hour by itself works by auto appending AM/PM")
  assert.equal(el.querySelector('[data-options="hour hourCycle:h24"]').innerHTML, "12", "hour hourCycle:h24 works")
  assert.equal(el.querySelector('[data-options="hour hour12:false"]').innerHTML, "12", "hour hour12:false works")
  assert.equal(el.querySelector('[data-options="hour minute"]').innerHTML, "12:00 PM", "hour minute works")

  // None of these work well when used alone:
  // const dayPeriod = dateEls[10].innerHTML
  // const minute = dateEls[11].innerHTML
  // const second = dateEls[12].innerHTML
  // assert.equal(dayPeriod, "PM", "dayPeriod (AM/PM) works")
  // assert.equal(minute, "00", "minute by itself works")
  // assert.equal(second, "00", "second by itself works")

  // we might want to consider hacking in our own homebrew variants like:
  // hour without dayPeriod auto attached, dayPaeriod (AM/PM) by itself, minute:2-digit by itself, timeZoneName alone

  assert.equal(el.querySelector('[data-options="weekday:long"]').innerHTML, "Tuesday", "weekday:long by itself works")
  assert.equal(el.querySelector('[data-options="weekday:short"]').innerHTML, "Tue", "weekday:short by itself works")
  assert.equal(el.querySelector('[data-options="weekday:narrow"]').innerHTML, "T", "weekday:narrow by itself works")
  assert.equal(el.querySelector('[data-options="year:numeric"]').innerHTML, "2023", "year:numeric by itself works")
  assert.equal(el.querySelector('[data-options="year:2-digit"]').innerHTML, "23", "year:2-digit by itself works")
  assert.equal(el.querySelector('[data-options="month:numeric"]').innerHTML, "4", "month:numeric by itself works")
  assert.equal(el.querySelector('[data-options="month:2-digit"]').innerHTML, "04", "month:2-digit by itself works")
  assert.equal(el.querySelector('[data-options="month:long"]').innerHTML, "April", "month:long by itself works")
  assert.equal(el.querySelector('[data-options="month:short"]').innerHTML, "Apr", "month:short by itself works")
  assert.equal(el.querySelector('[data-options="month:narrow"]').innerHTML, "A", "month:narrow by itself works")
  assert.equal(el.querySelector('[data-options="day:numeric"]').innerHTML, "4", "day:numeric by itself works")
  assert.equal(el.querySelector('[data-options="day:2-digit"]').innerHTML, "04", "day:2-digit by itself works")
})

QUnit.test('Component correctly handles html descriptions', async assert => {
  const onlyHTMLEvents = googleCalendarAPIResponse.items.filter(ev => (ev.description || '').indexOf("<") > -1)
  globalThis.fetch = () => { return Promise.resolve({ json: () => ({ items: onlyHTMLEvents }) }) }

  let tagCount = 0
  const descriptions = onlyHTMLEvents.map(x => {
    tagCount += [...x.description.matchAll(/<\w/g)].length
    return x.description
  })
  console.log(descriptions)

  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="30"
      show-recurring
    >
      <template>
        <div class="calendar-events-event event-body"></div>
      </template>
    </calendar-events>
  `
  const el = select("calendar-events")

  await el.promise

  const eventEls = selectAll(".calendar-events-event")
  assert.equal(descriptions.length, 23, "expected number (23) of html descriptions in the data")
  assert.equal(eventEls.length, descriptions.length, `${descriptions.length} events printed with html embeded`)
  assert.equal(tagCount, 129, "expected number (129) of embeded html tags in the data")
  assert.equal(selectAll(".calendar-events-event *").length, tagCount, `all ${tagCount} embeded html elements rendered`)
  // test link hrefs aren't mangled
})

/*
  .event-location // needs tests, does link substitution stuff, had a bug
  .event-body // need to test plaintext too
  a.event-url
*/
