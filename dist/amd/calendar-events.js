/*@bitovi/calendar-events-component@0.1.0#calendar-events*/
define(function (require, exports, module) {
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
            return !event.recurringEventId && event.status !== 'cancelled';
        });
    }
    function getEvents(pastAndFutureEvents, count) {
        var futureEvents = pastAndFutureEvents.future, pastEventsNeeded = count - futureEvents.length, past = pastAndFutureEvents.past;
        if (pastEventsNeeded >= past.length) {
            return past.concat(futureEvents);
        } else if (pastEventsNeeded > 0) {
            return past.slice(past.length - pastEventsNeeded).concat(futureEvents);
        } else {
            return futureEvents.slice(0, count);
        }
    }
    function eventDescriptionHTMLGroupAndUrl(event) {
        var description = (event.description || '').trim();
        var url = event.htmlLink;
        return {
            descriptionHTML: description,
            group: event.organizer.displayName,
            url: url
        };
    }
    const defaultDateValuesWhenOnlyKeySpecified = {
        dateStyle: 'full',
        timeStyle: 'short',
        calendar: 'gregory',
        dayPeriod: 'short',
        numberingSystem: 'latn',
        hour12: true,
        hourCycle: 'h12',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    };
    function eventDate(eventStart, localesStr, optionsStr) {
        const date = new Date(eventStart.dateTime || eventStart.date);
        const locales = localesStr && localesStr.replace(/[^a-z0-9- ]/gi, '').split(' ');
        const options = optionsStr ? {} : eventStart.dateTime ? {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        } : {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        };
        optionsStr && optionsStr.replace(/\b([a-z0-9]+)(?::([a-z0-9-_/]+))?(\s|$)/gi, (_, key, val) => options[key] = val || defaultDateValuesWhenOnlyKeySpecified[key]);
        if (options.hour12) {
            options.hour12 = options.hour12 !== 'false';
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
            el.textContent = eventDate(value, el.getAttribute('data-locales'), el.getAttribute('data-options'));
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
    function dataFindThenCutOrCopy(container, dataFindRegEx) {
        selectAllIncludeSelf(container, 'a.event-body, .event-body a').forEach(function (link) {
            const found = link.textContent.match(dataFindRegEx);
            if (found) {
                selectAllIncludeSelf(container, `a[data-find~="${ found[0] }" i]:not([data-found])`).forEach(function (finder) {
                    finder.href = link.href;
                    finder.textContent = finder.textContent || link.textContent.trim();
                    if (finder.hasAttribute('data-cut')) {
                        link.remove();
                    }
                    finder.setAttribute('data-found', found[0]);
                });
                selectAllIncludeSelf(container, `img[data-find~="${ found[0] }" i]:not([data-found])`).forEach(function (finder) {
                    finder.src = link.href;
                    finder.alt = link.textContent.trim();
                    if (finder.hasAttribute('data-cut')) {
                        link.remove();
                    }
                    finder.setAttribute('data-found', found[0]);
                });
            }
        });
        selectAllIncludeSelf(container, `[data-find][data-found]`).forEach(function (finder) {
            finder.removeAttribute('data-found');
        });
        selectAllIncludeSelf(container, 'a:not([href]), a[href=\'\'], img:not([src]), img[src=\'\']').forEach(function (lostNotFound) {
            lostNotFound.remove();
        });
    }
    function shorten(text) {
        if (text.length > 30) {
            return text.slice(0, 40) + '&mldr;';
        } else {
            return text;
        }
    }
    function linkify(inputText) {
        var replacedText, replacePattern1, replacePattern2, replacePattern3;
        replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        replacedText = inputText.replace(replacePattern1, function (all) {
            return '<a href="' + all + '" target="_blank">' + shorten(all) + '</a>';
        });
        replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
        replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
        replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
        return replacedText;
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
        readTemplates() {
            const defaultHTML = {
                pending: '<div class=\'calendar-events-pending\'></div>',
                rejected: '<div class=\'calendar-events-rejected\'><p>Sorry, events can\'t load right now.</p></div>',
                resolved: '<div class=\'calendar-events-resolved\'><p>There are no events to show.</p></div>',
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
            const templateChild = this.querySelector('template');
            const selectorPrefix = '.calendar-events-';
            const allParts = Object.keys(defaultHTML);
            const templates = {};
            allParts.forEach(part => {
                const customizedPart = templateChild && templateChild.content.querySelector(`${ selectorPrefix }${ part }`);
                templates[part] = customizedPart || Object.assign(document.createElement('div'), { innerHTML: defaultHTML[part] }).firstElementChild;
            });
            const anyPartSelector = allParts.map(part => `${ selectorPrefix }${ part }`).join(', ');
            const anyPartCustomized = templateChild && templateChild.content.querySelector(anyPartSelector);
            if (templateChild && !anyPartCustomized) {
                templates.event = templateChild.content;
            }
            return templates;
        },
        showTemplate(part) {
            this.innerHTML = '';
            this.appendChild(this.templates[part].cloneNode(true));
        },
        connectedCallback: function () {
            this.templates = this.readTemplates();
            this.showTemplate('pending');
            var url = `https://www.googleapis.com/calendar/v3/calendars/${ this.calendarId }/events?key=${ this.apiKey }`;
            this.promise = fetch(url).then(function (response) {
                return response.json();
            }).then(getSortedEvents).then(function (sortedEvents) {
                if (this.showRecurring) {
                    return sortedEvents;
                } else {
                    return filterRecurringEvents(sortedEvents);
                }
            }.bind(this)).then(getPastAndFutureEvents).then(this.showEvents.bind(this)).catch(function (err) {
                this.showTemplate('rejected');
                throw err;
            }.bind(this));
        },
        showEvents: function (pastAndFutureEvents) {
            if (!pastAndFutureEvents.future.length && !pastAndFutureEvents.past.length) {
                this.showTemplate('resolved');
                return;
            }
            const events = getEvents(pastAndFutureEvents, this.eventCount);
            const eventTemplate = this.templates.event;
            const findTerms = selectAllIncludeSelf(eventTemplate, '[data-find]').map(finder => finder.getAttribute('data-find').trim().replace(/\s+/g, '|')).join('|');
            const dataFindRegEx = findTerms && new RegExp(`\\b(?:${ findTerms })\\b`, 'i');
            const elements = events.map(event => {
                var container = eventTemplate.cloneNode(true);
                var metaData = eventDescriptionHTMLGroupAndUrl(event);
                selectAllIncludeSelf(container, 'a.event-url').forEach(function (a) {
                    a.href = metaData.url;
                });
                selectAllIncludeSelf(container, '.event-all-day').forEach(function (el) {
                    el.setAttribute('data-all-day', !event.start.dateTime);
                });
                setTextContent(container, '.event-title', event.summary);
                setTextContent(container, '.event-group', metaData.group);
                setDateContent(container, '.event-date', event.start);
                const locatable = event.location || event.hangoutLink;
                locatable && setHtmlContent(container, '.event-location', linkify(locatable));
                setHtmlContent(container, '.event-body', metaData.descriptionHTML);
                findTerms && dataFindThenCutOrCopy(container, dataFindRegEx);
                return container;
            });
            this.innerHTML = '';
            elements.forEach(function (element) {
                this.appendChild(element);
            }.bind(this));
        }
    });
});