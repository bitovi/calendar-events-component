/*[process-shim]*/
(function(global, env) {
	// jshint ignore:line
	if (typeof process === "undefined") {
		global.process = {
			argv: [],
			cwd: function() {
				return "";
			},
			browser: true,
			env: {
				NODE_ENV: env || "development"
			},
			version: "",
			platform:
				global.navigator &&
				global.navigator.userAgent &&
				/Windows/.test(global.navigator.userAgent)
					? "win"
					: ""
		};
	}
})(
	typeof self == "object" && self.Object == Object
		? self
		: typeof process === "object" &&
		  Object.prototype.toString.call(process) === "[object process]"
			? global
			: window,
	"development"
);

/*[global-shim-start]*/
(function(exports, global, doEval) {
	// jshint ignore:line
	var origDefine = global.define;

	var get = function(name) {
		var parts = name.split("."),
			cur = global,
			i;
		for (i = 0; i < parts.length; i++) {
			if (!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val) {
		var parts = name.split("."),
			cur = global,
			i,
			part,
			next;
		for (i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if (!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod) {
		if (!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, default: true };
		for (var p in mod) {
			if (!esProps[p]) return false;
		}
		return true;
	};

	var hasCjsDependencies = function(deps) {
		return (
			deps[0] === "require" && deps[1] === "exports" && deps[2] === "module"
		);
	};

	var modules =
		(global.define && global.define.modules) ||
		(global._define && global._define.modules) ||
		{};
	var ourDefine = (global.define = function(moduleName, deps, callback) {
		var module;
		if (typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for (i = 0; i < deps.length; i++) {
			args.push(
				exports[deps[i]]
					? get(exports[deps[i]])
					: modules[deps[i]] || get(deps[i])
			);
		}
		// CJS has no dependencies but 3 callback arguments
		if (hasCjsDependencies(deps) || (!deps.length && callback.length)) {
			module = { exports: {} };
			args[0] = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args[1] = module.exports;
			args[2] = module;
		}
		// Babel uses the exports and module object.
		else if (!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if (deps[1] === "module") {
				args[1] = module;
			}
		} else if (!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if (globalExport && !get(globalExport)) {
			if (useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	});
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function() {
		// shim for @@global-helpers
		var noop = function() {};
		return {
			get: function() {
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load) {
				doEval(__load.source, global);
			}
		};
	});
})(
	{},
	typeof self == "object" && self.Object == Object
		? self
		: typeof process === "object" &&
		  Object.prototype.toString.call(process) === "[object process]"
			? global
			: window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*@bitovi/calendar-events@0.0.7#calendar-events*/
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
    function eventDescriptionHTMLGroupAndUrl(event) {
        var description = (event.description || '').trim();
        var lines, last;
        var isHTML = description.includes('<br>');
        if (isHTML) {
            lines = description.split(/<br\/?>/);
        } else {
            lines = description.split(/\r?\n/);
        }
        last = lines.pop() || '';
        var parts = last.split(': ', 2), url;
        if (isHTML) {
            var div = document.createElement('div');
            div.innerHTML = parts[1];
            if (div.firstElementChild) {
                url = div.firstElementChild.href;
            } else {
                url = parts[1];
            }
        } else {
            url = parts[1];
        }
        return {
            descriptionHTML: !isHTML ? linkify(lines.join('<br>')) : lines.join('<br>'),
            group: parts[0],
            url: url
        };
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
    function setHtmlContent(container, query, value) {
        container.querySelectorAll(query).forEach(function (el) {
            el.innerHTML = value;
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
                var metaData = eventDescriptionHTMLGroupAndUrl(event);
                container.querySelectorAll('a.event-url').forEach(function (a) {
                    a.href = metaData.url;
                });
                setTextContent(container, '.event-title', event.summary);
                setTextContent(container, '.event-group', metaData.group);
                setTextContent(container, '.event-date', eventDate(event));
                setHtmlContent(container, '.event-location', linkify(event.location || ''));
                setHtmlContent(container, '.event-body', metaData.descriptionHTML);
                return container;
            }.bind(this));
            elements.forEach(function (element) {
                this.appendChild(element);
            }.bind(this));
        }
    });
});
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : (typeof process === "object" && Object.prototype.toString.call(process) === "[object process]") ? global : window);