function safeCustomElement(tag, constructor, prototype) {
  prototype = prototype || constructor.prototype;
  var Element = function () {
    var result;
    if (typeof Reflect !== "undefined") {
      result = Reflect.construct(HTMLElement, [], new.target);
    } else {
      result = HTMLElement.apply(this, arguments);
    }
    constructor.apply(result, arguments);
    return result;
  };
  if (typeof HTMLElement !== undefined) {
    Element.prototype = Object.create(HTMLElement.prototype);
  }
  Object.getOwnPropertyNames(prototype).forEach(function (property) {
    Object.defineProperty(Element.prototype, property,
      Object.getOwnPropertyDescriptor(prototype, property));
  });
  if (typeof customElements !== "undefined") {
    customElements.define(tag, Element);
  }

  return Element;
}

safeCustomElement.supported = (typeof Reflect !== "undefined") &&
  (typeof HTMLElement !== undefined) &&
  (typeof customElements !== "undefined");

function getSortedEvents(eventsData) {
  return eventsData.items.filter(function (event) {
    return event.status !== 'cancelled';
  }).map(function (event) {
    var clone = Object.assign({}, event);
    var dateStr = event.start.dateTime || event.start.date;
    var date = new Date(dateStr);
    clone.start.time = date;
    return clone;
  }).sort(function (eventA, eventB) {
    return eventA.start.time - eventB.start.time;
  });
}

function getFirstEventIndexFromToday(sortedEvents) {
  var today = new Date().setHours(0, 0, 0, 0);
  return sortedEvents.findIndex(function (event) {
    return event.start.time > today;
  });
}
function getPastAndFutureEvents(sortedEvents) {
  var index = getFirstEventIndexFromToday(sortedEvents);
  if (index !== -1) {
    return {
      future: sortedEvents.slice(index),
      past: sortedEvents.slice(0, index)
    };
  } else {
    return {
      future: [],
      past: sortedEvents
    };
  }
}
function filterRecurringEvents(sortedEvents) {
  return sortedEvents.filter(function (event) {
    return !event.recurringEventId && event.status !== "cancelled";
  });
}

function getEvents(pastAndFutureEvents, count) {
  // older event start dates are at the start of both arrays
  var futureEvents = pastAndFutureEvents.future,
    pastEventsNeeded = count - futureEvents.length,
    past = pastAndFutureEvents.past;

  if (pastEventsNeeded >= past.length) {
    return past.concat(futureEvents);
  } else if (pastEventsNeeded > 0) {
    return past.slice(past.length - pastEventsNeeded)
      .concat(futureEvents);
  } else {
    return futureEvents.slice(0, count);
  }
}

function eventDescriptionHTMLGroupAndUrl(event) {
  var description = (event.description || '').trim();
  // var lines, last;
  // var isHTML = description.includes("<br>");
  // if (isHTML) {
  //   lines = description.split(/<br\/?>/);
  // } else {
  //   lines = description.split(/\r?\n/);
  // }
  // last = lines.pop() || '';
  var url = event.htmlLink;

  return {
    descriptionHTML: description,
    group: event.organizer.displayName,
    url: url
  };
}
// TODO: Detect user Locale and use other Locale functions to set key-without-value defaults
const defaultDateValuesWhenOnlyKeySpecified = {
  dateStyle: "full",
  timeStyle: "short",
  calendar: "gregory",
  dayPeriod: "short", // uses "long" if specified at all
  numberingSystem: "latn",
  hour12: true,
  hourCycle: "h12",
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric", // includes dayPeriod:short if 12 hour
  minute: "2-digit", // uses "numeric" when by itself
  second: "2-digit",
  timeZoneName: "short" // forces full date if used
};

// localesStr = "en-US" etc or space speparated list of valid tags
// optionsStr = "day month:short year:2-digit" space sepearted list of what the date output should include
function eventDate(eventStart, localesStr, optionsStr) {
  const date = new Date(eventStart.dateTime || eventStart.date);
  const locales = localesStr && localesStr.replace(/[^a-z0-9- ]/gi, "").split(" ");
  const options = optionsStr ? {} : (
    eventStart.dateTime ? {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    } : {
      month: "short",
      day: "numeric",
      year: "numeric"
    }
  );
  // "day month:short year:2-digit" -> { day: 'numeric', month: 'short', year: '2-digit' }
  optionsStr && optionsStr.replace(
    /\b([a-z0-9]+)(?::([a-z0-9-_/]+))?(\s|$)/gi,
    (_, key, val) => options[key] = val || defaultDateValuesWhenOnlyKeySpecified[key]
  ); // jshint ignore:line

  if (options.hour12) {
    options.hour12 = options.hour12 !== "false"; // to bool if set, favor true
  }

  return date.toLocaleString(locales || undefined, options);
}

function selectAllIncludeSelf(container, query) {
  const qsa = [...container.querySelectorAll(query)];
  if (container.matches && container.matches(query)) {
    qsa.push(container);
  }
  return qsa;
}

function setDateContent(container, query, value) {
  selectAllIncludeSelf(container, query).forEach(function (el) {
    el.textContent = eventDate(
      value,
      el.getAttribute("data-locales"),
      el.getAttribute("data-options")
    );
  });
}
function setTextContent(container, query, value) {
  selectAllIncludeSelf(container, query).forEach(function (el) {
    el.textContent = value;
  });
}
function setHtmlContent(container, query, value) {
  selectAllIncludeSelf(container, query).forEach(function (el) {
    el.innerHTML = value;
  });
}
function shorten(text) {
  if (text.length > 30) {
    return text.slice(0, 40) + "&mldr;";
  } else {
    return text;
  }
}

// from https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  // URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, function (all) {
    return '<a href="' + all + '" target="_blank">' + shorten(all) + '</a>';
  });

  // URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

  // Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

  return replacedText;
}

module.exports = safeCustomElement("calendar-events", function () {

}, {
  get apiKey() {
    return this.getAttribute("api-key");
  },
  get calendarId() {
    return this.getAttribute("calendar-id");
  },
  get showRecurring() {
    return this.hasAttribute("show-recurring");
  },
  get eventCount() {
    return parseInt(this.getAttribute("event-count"), 10) || 10;
  },
  readTemplates() {
    const defaultHTML = {
      pending: "<div class='calendar-events-pending'></div>",
      rejected: "<div class='calendar-events-rejected'><p>Sorry, events can't load right now.</p></div>",
      resolved: "<div class='calendar-events-resolved'><p>There are no events to show.</p></div>",
      event: `
        <div class="calendar-events-event">
          <div class="event-header">
            <div class="event-summary"><a class="event-url event-title"></a></div>
            <div class="event-group"></div>
            <div class="event-date"></div>
            <div class="event-location"></div>
            <div class="event-body"></div>
          </div>
          <div class="event-footer"><a class="event-url">View Event</a></div>
        </div>
      `
    };
    const templateChild = this.querySelector("template");
    const selectorPrefix = ".calendar-events-";
    const allParts = Object.keys(defaultHTML);
    const templates = {};

    allParts.forEach(part => {
      const customizedPart = templateChild && templateChild.content.querySelector(`${selectorPrefix}${part}`);
      templates[part] = customizedPart || (
        Object.assign(document.createElement("div"), { innerHTML: defaultHTML[part] }).firstElementChild
      );
    });

    // if there is a custom template but not specifying parts, assume all content is the "event" part
    const anyPartSelector = allParts.map(part => `${selectorPrefix}${part}`).join(", ");
    const anyPartCustomized = (templateChild && templateChild.content.querySelector(anyPartSelector));
    if (templateChild && !anyPartCustomized) {
      templates.event = templateChild.content;
    }

    return templates;
  },
  showTemplate(part) {
    this.innerHTML = ""; // this.replaceChildren() not supported well enough yet
    this.appendChild(this.templates[part].cloneNode(true));
  },
  connectedCallback: function () {
    this.templates = this.readTemplates();

    this.showTemplate("pending");

    var url = `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?key=${this.apiKey}`;
    this.promise = fetch(url).then(function (response) {
      return response.json();
    })
      .then(getSortedEvents)
      .then(function (sortedEvents) {
        if (this.showRecurring) {
          return sortedEvents;
        } else {
          return filterRecurringEvents(sortedEvents);
        }
      }.bind(this))
      .then(getPastAndFutureEvents)
      .then(this.showEvents.bind(this))
      .catch(function (err) {
        this.showTemplate("rejected");
        throw err;
      }.bind(this));
  },
  showEvents: function (pastAndFutureEvents) {
    if (!pastAndFutureEvents.future.length && !pastAndFutureEvents.past.length) {
      this.showTemplate("resolved");
      return;
    }
    const events = getEvents(pastAndFutureEvents, this.eventCount);

    const eventTemplate = this.templates.event;

    const elements = events.map((event) => {
      var container = eventTemplate.cloneNode(true);

      var metaData = eventDescriptionHTMLGroupAndUrl(event);

      selectAllIncludeSelf(container, "a.event-url").forEach(function (a) {
        a.href = metaData.url;
      });
      selectAllIncludeSelf(container, ".event-all-day").forEach(function (el) {
        el.setAttribute("data-all-day", !event.start.dateTime);
      });
      setTextContent(container, ".event-title", event.summary);
      setTextContent(container, ".event-group", metaData.group);
      setDateContent(container, ".event-date", event.start);

      const locatable = event.location || event.hangoutLink;
      locatable && setHtmlContent(container, ".event-location", linkify(locatable)); // jshint ignore:line

      setHtmlContent(container, ".event-body", metaData.descriptionHTML);

      return container;
    });

    // this.replaceChildren(...elements)
    this.innerHTML = ""; // delete pending state element
    elements.forEach(function (element) {
      this.appendChild(element);
    }.bind(this));
  }
});
