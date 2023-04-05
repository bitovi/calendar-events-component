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

const eventSkel = {
  kind: "calendar#event",
  etag: '"3031026261682000"',
  id: "2mag0ad2crcv9rmujah0hvek6q",
  status: "confirmed",
  htmlLink: "https://www.google.com/calendar/event?eid=Mm1hZzBhZDJjcmN2OXJtdWphaDBodmVrNnEganVwaXRlcmpzLmNvbV9nMjd2Y2szNm5pZmJucXJna2N0a29hbnFiNEBn",
  created: "2021-03-05T00:54:10.000Z",
  updated: "2021-03-05T00:54:53.841Z",
  summary: "Love, try to love.",
  creator: { email: "in@bit.testdata", displayName: "Jane Ori" },
  organizer: { email: "b4@gro.testdata", self: true, displayName: "title goes here" },
  start: { date: new Date().toISOString() },
  end: { date: new Date().toISOString() },
  description: "https://www.youtube.com/watch?v=cGgVoqr78gk",
  transparency: "transparent",
  iCalUID: "6q@goo.testdata",
  sequence: 0,
  eventType: "default"
}
const createEvent = (title, description, start) => {
  return Object.assign({}, eventSkel, {
    organizer: { email: "b4@gro.testdata", self: true, displayName: title },
    description,
    start: start || eventSkel.start
  })
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
QUnit.test('Component correctly uses custom event-date field and its variants', async assert => {
  globalThis.fetch = () => Promise.resolve({
    json: () => ({
      items: [
        createEvent("test event-date", `Test Description 1`, { dateTime: new Date("Apr 7, 2023, 6:30 PM").toISOString() }),
        createEvent("test event-date", `Test Description 2`, { date: new Date("Tue, Apr 18, 2023").toISOString() })
      ]
    })
  })

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
  assert.equal(el.querySelector('[data-options="weekday"]').innerHTML, "Fri", "weekday by itself works")
  assert.equal(el.querySelector('[data-options="year"]').innerHTML, "2023", "year by itself works")
  assert.equal(el.querySelector('[data-options="month"]').innerHTML, "Apr", "month by itself works")
  assert.equal(el.querySelector('[data-options="day"]').innerHTML, "7", "day by itself works")
  assert.equal(el.querySelector('[data-options="hour"]').innerHTML, "6 PM", "hour by itself works by auto appending AM/PM")
  assert.equal(el.querySelector('[data-options="hour hourCycle:h24"]').innerHTML, "18", "hour hourCycle:h24 works")
  assert.equal(el.querySelector('[data-options="hour hour12:false"]').innerHTML, "18", "hour hour12:false works")
  assert.equal(el.querySelector('[data-options="hour minute"]').innerHTML, "6:30 PM", "hour minute works")

  // None of these work well when used alone:
  // const dayPeriod = dateEls[10].innerHTML
  // const minute = dateEls[11].innerHTML
  // const second = dateEls[12].innerHTML
  // assert.equal(dayPeriod, "PM", "dayPeriod (AM/PM) works")
  // assert.equal(minute, "00", "minute by itself works")
  // assert.equal(second, "00", "second by itself works")

  // we might want to consider hacking in our own homebrew variants like:
  // hour without dayPeriod auto attached, dayPaeriod (AM/PM) by itself, minute:2-digit by itself, timeZoneName alone

  assert.equal(el.querySelector('[data-options="weekday:long"]').innerHTML, "Friday", "weekday:long by itself works")
  assert.equal(el.querySelector('[data-options="weekday:short"]').innerHTML, "Fri", "weekday:short by itself works")
  assert.equal(el.querySelector('[data-options="weekday:narrow"]').innerHTML, "F", "weekday:narrow by itself works")
  assert.equal(el.querySelector('[data-options="year:numeric"]').innerHTML, "2023", "year:numeric by itself works")
  assert.equal(el.querySelector('[data-options="year:2-digit"]').innerHTML, "23", "year:2-digit by itself works")
  assert.equal(el.querySelector('[data-options="month:numeric"]').innerHTML, "4", "month:numeric by itself works")
  assert.equal(el.querySelector('[data-options="month:2-digit"]').innerHTML, "04", "month:2-digit by itself works")
  assert.equal(el.querySelector('[data-options="month:long"]').innerHTML, "April", "month:long by itself works")
  assert.equal(el.querySelector('[data-options="month:short"]').innerHTML, "Apr", "month:short by itself works")
  assert.equal(el.querySelector('[data-options="month:narrow"]').innerHTML, "A", "month:narrow by itself works")
  assert.equal(el.querySelector('[data-options="day:numeric"]').innerHTML, "7", "day:numeric by itself works")
  assert.equal(el.querySelector('[data-options="day:2-digit"]').innerHTML, "07", "day:2-digit by itself works")
})

QUnit.test('Component correctly handles html descriptions', async assert => {
  const onlyHTMLEvents = googleCalendarAPIResponse.items.filter(ev => (ev.description || '').indexOf("<") > -1)
  globalThis.fetch = () => { return Promise.resolve({ json: () => ({ items: onlyHTMLEvents }) }) }

  let tagCount = 0
  const descriptions = onlyHTMLEvents.map(x => {
    tagCount += [...x.description.matchAll(/<\w/g)].length
    return x.description
  })
  // console.log(descriptions)

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
})

QUnit.test('Component correctly handles data-find', async assert => {
  globalThis.fetch = () => Promise.resolve({
    json: () => ({
      items: [
        createEvent("test data-find", `
          Test Description 1\u003cbr\u003e
          \u003ca href="http://bitovi.com/join-our-event?invitedBy=Heather"\u003eRegister for the event here.\u003c/a\u003e
          \u003ca href="http://bitovi.com/services/augmented-ui-consulting?leadGenTrackingFromEventId=222077"\u003e
            Join the queue for augmented-ui consulting!
          \u003c/a\u003e
          \u003ca href="https://i.imgur.com/i7eZZ5X.jpg"\u003eAndrew's meme of the event.\u003c/a\u003e
          \u003ca href="https://i.imgur.com/i7eZZ5X.jpg"\u003eThis is-found.\u003c/a\u003e
          \u003ca href="about:404"\u003eBAD register LINK\u003c/a\u003e
        `),
        createEvent("test data-find", `
          Test Description 2
        `)
      ]
    })
  })

  fixture.innerHTML = `
    <calendar-events
      api-key="AIzaSyBsNpdGbkTsqn1BCSPQrjO9OaMySjK5Sns"
      calendar-id="jupiterjs.com_g27vck36nifbnqrgkctkoanqb4@group.calendar.google.com"
      event-count="30"
      show-recurring
    >
      <template>
        <div class="calendar-events-event">
          <h1 class="event-title"></h1>

          <a href="http://bitovi.com/" data-find="Register" data-cut></a>

          <img data-find="meme" data-cut>

          <div class="event-body"></div>

          <a data-find="augmented-ui">High Tech, Low Effort. The future is augmented.</a>
          <a data-find="register" data-cut>Only empty tags get textContent updated, so this text won't change.</a>
          <a data-find="not-found is-found" data-cut>multiple terms work</a>

          <img data-find="not-found">
          <img src="#" data-find="not-found" alt="data-find els with default values stick around when not found">
          <a data-find="not-found">like tears in the rain</a>
          <a class="event-url" data-find="not-found">Still Here, saved by event url</a>
          <a class="event-url" data-find="meme">Found url overrides event url</a>
        </div>
      </template>
    </calendar-events>
  `
  const el = select("calendar-events")

  await el.promise

  const eventEls = selectAll(".calendar-events-event")
  const registerURL = "http://bitovi.com/join-our-event?invitedBy=Heather"
  const registerFound = eventEls[0].querySelectorAll("[data-find='register' i]")

  assert.equal(registerFound.length, 2, "find register links still present")
  assert.equal(registerFound[0].href, registerURL, "register was found and the href was copied correctly")
  assert.equal(registerFound[0].textContent, "Register for the event here.", "register textContent was copied correctly")
  assert.equal(registerFound[1].href, registerURL, "register was found and the href was copied correctly twice")
  assert.equal(registerFound[1].textContent, "Only empty tags get textContent updated, so this text won't change.", "textContent was correctly NOT copied")
  assert.equal(eventEls[0].querySelector(".event-body a[href='" + registerURL + "']"), null, "register link removed from event-body")

  const augURL = "http://bitovi.com/services/augmented-ui-consulting?leadGenTrackingFromEventId=222077"
  const augFound = eventEls[0].querySelectorAll("[data-find='augmented-ui' i]")

  assert.equal(augFound.length, 1, "find augmented-ui link still present")
  assert.equal(augFound[0].href, augURL, "augmented-ui link was found and the href was copied correctly")
  assert.equal(augFound[0].textContent, "High Tech, Low Effort. The future is augmented.", "augmented-ui link text correctly NOT updated")
  assert.equal(eventEls[0].querySelectorAll(".event-body a[href='" + augURL + "']").length, 1, "augmented-ui link not removed from event-body because it was found by an element without data-cut")

  const memeURL = "https://i.imgur.com/i7eZZ5X.jpg"
  const memeFound = eventEls[0].querySelectorAll("[data-find='meme' i]")
  assert.equal(memeFound[0].src, memeURL, "meme link was found and the src was updated correctly")
  assert.equal(memeFound[0].alt, "Andrew's meme of the event.", "meme alt updated correctly")
  assert.equal(memeFound[1].href, memeURL, "meme link was found and the href overrode event-url correctly")

  const multiFind = eventEls[0].querySelectorAll("[data-find~='is-found' i]")
  assert.equal(multiFind[0].href, memeURL, "multi data-find works")

  assert.equal(eventEls[0].querySelectorAll("img[data-find='not-found' i]").length, 1, "only one data-find not-found img remains")
  assert.equal(eventEls[0].querySelectorAll("a[data-find='not-found' i]").length, 1, "only one data-find not-found link remains")
  assert.equal(eventEls[0].querySelector("a[data-find='not-found' i]").href, eventSkel.htmlLink, "data-find not-found link remains because it is also event-url")

  assert.equal(eventEls[1].querySelectorAll("[data-find].event-url").length, 2, "only 2 of 4 remaining data-find els exist because they fell back to event-urls in the template; event supplied no matches")
  assert.equal(eventEls[1].querySelectorAll("[data-find]").length, 4, "only 2 of 4 remaining data-find els exist because of default urls in the template; event supplied no matches")
})

/*
  .event-location // needs tests, does link substitution stuff, had a bug
  .event-body // need to test plaintext too
*/
