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

/*@bitovi/calendar-events@0.0.3#calendar-events*/
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
                var container = document.createElement('div');
                container.innerHTML = '<div class=\'header\'>' + '<div class=\'event-title\'><a></a></div>' + '<div class=\'event-group\'></div>' + '<div class=\'event-date\'></div>' + '<div class=\'event-location\'></div>' + '<div class=\'event-body\'></div>' + '</div>' + '<div class=\'event-footer\'><a>View Event</a></div>';
                container.classList.add('calendar-events-event');
                var summaryA = container.querySelector('.event-title a');
                var footerA = container.querySelector('.event-footer a');
                summaryA.textContent = event.summary;
                summaryA.href = footerA.href = eventUrl(event);
                container.querySelector('.event-group').textContent = eventGroup(event);
                container.querySelector('.event-date').textContent = eventDate(event);
                container.querySelector('.event-location').textContent = event.location;
                container.querySelector('.event-body').textContent = (event.description || '').trim();
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