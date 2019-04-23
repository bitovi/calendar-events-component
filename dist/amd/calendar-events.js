/*@bitovi/calendar-events@0.0.5#calendar-events*/
define('@bitovi/calendar-events', function (require, exports, module) {
    function safeCustomElement(tag, constructor, prototype) {
        prototype = prototype || constructor.prototype;
        var Element = function () {
            var result;
            if (typeof Reflect !== 'undefined') {
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
            Object.defineProperty(Element.prototype, property, Object.getOwnPropertyDescriptor(prototype, property));
        });
        if (typeof customElements !== 'undefined') {
            customElements.define(tag, Element);
        }
        return Element;
    }
    safeCustomElement.supported = typeof Reflect !== 'undefined' && typeof HTMLElement !== undefined && typeof customElements !== 'undefined';
    function todayDate() {
        var date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setMilliseconds(0);
        date.setMilliseconds(0);
        return date;
    }
    function getSortedEvents(eventsData) {
        return eventsData.items.map(function (event) {
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
        var today = todayDate();
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
            return !event.recurringEventId && event.status !== 'cancelled';
        });
    }
    function getEvents(pastAndFutureEvents, count) {
        var futureEvents = pastAndFutureEvents.future.length, pastEventsNeeded = count - futureEvents, past = pastAndFutureEvents.past;
        if (pastEventsNeeded > 0) {
            return past.slice(past.length - pastEventsNeeded).concat(pastAndFutureEvents.future);
        } else {
            return pastAndFutureEvents.future.slice(0, count);
        }
    }
    function eventLastDescriptionLineSplit(event) {
        var description = (event.description || '').trim();
        var lines = description.split(/\r?\n/);
        var lastLine = lines.length ? lines[lines.length - 1] : '';
        return lastLine.split(': ', 2);
    }
    function eventUrl(event) {
        var lastLineSplit = eventLastDescriptionLineSplit(event);
        return (lastLineSplit[1] || '').trim();
    }
    function eventGroup(event) {
        var lastLineSplit = eventLastDescriptionLineSplit(event);
        return (lastLineSplit[0] || '').trim();
    }
    function eventDate(event) {
        var startDate = event.start.date;
        var startDateTime = event.start.dateTime;
        var date;
        if (startDateTime) {
            date = new Date(startDateTime);
            return date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        } else if (startDate) {
            date = new Date(startDate);
            return date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }
    function setTextContent(container, query, value) {
        container.querySelectorAll(query).forEach(function (el) {
            el.textContent = value;
        });
    }
    function defaultTemplate() {
        var container = document.createElement('div');
        container.innerHTML = '<div class=\'event-header\'>' + '<div class=\'event-summary\'><a class=\'event-url event-title\'></a></div>' + '<div class=\'event-group\'></div>' + '<div class=\'event-date\'></div>' + '<div class=\'event-location\'></div>' + '<div class=\'event-body\'></div>' + '</div>' + '<div class=\'event-footer\'><a class=\'event-url\'>View Event</a></div>';
        var frag = document.createDocumentFragment();
        frag.appendChild(container);
        return frag;
    }
    module.exports = safeCustomElement('calendar-events', function () {
    }, {
        get apiKey() {
            return this.getAttribute('api-key');
        },
        get calendarId() {
            return this.getAttribute('calendar-id');
        },
        get showRecurring() {
            return this.hasAttribute('show-recurring');
        },
        get eventCount() {
            return parseInt(this.getAttribute('event-count'), 10) || 10;
        },
        connectedCallback: function () {
            var template = this.querySelector('template');
            this.template = template ? template.content : defaultTemplate();
            this.innerHTML = '<div class=\'calendar-events-pending\'></div>';
            var url = 'https://www.googleapis.com/calendar/v3/calendars/' + this.calendarId + '/events?key=' + this.apiKey;
            fetch(url).then(function (response) {
                return response.json();
            }).then(getSortedEvents).then(function (sortedEvents) {
                if (this.showRecurring) {
                    return sortedEvents;
                } else {
                    return filterRecurringEvents(sortedEvents);
                }
            }.bind(this)).then(getPastAndFutureEvents).then(this.showEvents.bind(this)).catch(function (err) {
                this.innerHTML = '<div class=\'calendar-events-rejected\'>' + '<p>Sorry, events can\'t load right now.</p>' + '</div>';
                throw err;
            }.bind(this));
        },
        showEvents: function (getPastAndFutureEvents) {
            if (!getPastAndFutureEvents.future.length && !getPastAndFutureEvents.past.length) {
                this.innerHTML = '<div class=\'calendar-events-resolved\'>' + '<p>There are no events to show.</p>' + '</div>';
                return;
            }
            var events = getEvents(getPastAndFutureEvents, this.eventCount);
            var elements = events.map(function (event) {
                var container = this.template.cloneNode(true);
                container.firstElementChild.classList.add('calendar-events-event');
                container.querySelectorAll('a.event-url').forEach(function (a) {
                    a.href = eventUrl(event);
                });
                setTextContent(container, '.event-title', event.summary);
                setTextContent(container, '.event-group', eventGroup(event));
                setTextContent(container, '.event-date', eventDate(event));
                setTextContent(container, '.event-location', event.location);
                setTextContent(container, '.event-body', (event.description || '').trim());
                return container;
            }.bind(this));
            elements.forEach(function (element) {
                this.appendChild(element);
            }.bind(this));
        }
    });
});