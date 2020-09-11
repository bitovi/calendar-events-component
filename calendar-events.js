function safeCustomElement(tag, constructor, prototype){
	prototype = prototype || constructor.prototype;
	var Element = function(){
		var result;
		if(typeof Reflect !== "undefined") {
			result = Reflect.construct(HTMLElement, [], new.target);
		} else {
			result = HTMLElement.apply(this, arguments);
		}
		constructor.apply(result, arguments);
		return result;
	};
	if(typeof HTMLElement !== undefined) {
		Element.prototype = Object.create(HTMLElement.prototype);
	}
	Object.getOwnPropertyNames(prototype).forEach(function(property){
		Object.defineProperty(Element.prototype, property,
			Object.getOwnPropertyDescriptor(prototype, property));
	});
	if(typeof customElements !== "undefined") {
		customElements.define(tag, Element);
	}

	return Element;
}

safeCustomElement.supported = (typeof Reflect !== "undefined") &&
	(typeof HTMLElement !== undefined) &&
	(typeof customElements !== "undefined");

function todayDate(){
	var date = new Date();
	date.setHours(0);
	date.setMinutes(0);
	date.setMilliseconds(0);
	date.setMilliseconds(0);
	return date;
}

function getSortedEvents(eventsData){
	return eventsData.items.filter(function(event) {
		return event.status !== 'cancelled';
	}).map(function(event){
		var clone = Object.assign({}, event);
		var dateStr = event.start.dateTime || event.start.date;
		var date = new Date(dateStr);
		clone.start.time = date;
		return clone;
	}).sort(function(eventA, eventB){
		return eventA.start.time - eventB.start.time;
	});
}

function getFirstEventIndexFromToday(sortedEvents){
	var today = todayDate();
	return sortedEvents.findIndex(function(event){
		return event.start.time > today;
	});
}
function getPastAndFutureEvents(sortedEvents) {
	var index = getFirstEventIndexFromToday(sortedEvents);
	if(index !== -1) {
		return {
			future: sortedEvents.slice(index),
			past: sortedEvents.slice(0,index)
		};
	} else {
		return {
			future: [],
			past: sortedEvents
		};
	}
}
function filterRecurringEvents(sortedEvents){
	return sortedEvents.filter(function(event){
		return !event.recurringEventId && event.status !== "cancelled";
	});
}

function getEvents(pastAndFutureEvents, count) {
	var futureEvents = pastAndFutureEvents.future.length,
		pastEventsNeeded = count - futureEvents,
		past = pastAndFutureEvents.past;

	if(pastEventsNeeded > 0) {
		return past.slice(past.length - pastEventsNeeded)
			.concat(pastAndFutureEvents.future);
	} else {
		return pastAndFutureEvents.future.slice(0, count);
	}
}

function eventDescriptionHTMLGroupAndUrl(event) {
	var description = (event.description || '').trim();
	var lines, last;
	var isHTML = description.includes("<br>");
	if( isHTML ) {
		lines = description.split(/<br\/?>/);
	} else {
		lines = description.split(/\r?\n/);
	}
	last = lines.pop() || '';
	var url = event.htmlLink;


	return {
		descriptionHTML : description,
		group: event.organizer.displayName,
		url: url
	};
}


function eventDate(event) {
	var startDate = event.start.date;
	var startDateTime = event.start.dateTime;
	var date;
	if (startDateTime) {
		date = new Date(startDateTime);
		return date.toLocaleString(undefined, {month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});

		//return datetime.format('MMM Do, YYYY — h:mma');
	} else if (startDate) {
		date = new Date(startDate);
		return date.toLocaleString(undefined, {month: "short", day: "numeric", year: "numeric"});
	}
}

function setTextContent(container, query, value) {
	container.querySelectorAll(query).forEach(function(el){
		el.textContent = value;
	});
}
function setHtmlContent(container, query, value) {
	container.querySelectorAll(query).forEach(function(el){
		el.innerHTML = value;
	});
}
function shorten(text){
	if(text.length > 30) {
		return text.slice(0,40)+"&mldr;";
	} else {
		return text;
	}
}

// from https://stackoverflow.com/questions/37684/how-to-replace-plain-urls-with-links
function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, function(all){
		return '<a href="'+all+'" target="_blank">'+shorten(all)+'</a>';
	});

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

function defaultTemplate(){
	var container = document.createElement("div");
	container.innerHTML = "<div class='event-header'>"+
		"<div class='event-summary'><a class='event-url event-title'></a></div>"+
		"<div class='event-group'></div>"+
		"<div class='event-date'></div>"+
		"<div class='event-location'></div>"+
		"<div class='event-body'></div>"+
	"</div>"+
	"<div class='event-footer'><a class='event-url'>View Event</a></div>";
	var frag = document.createDocumentFragment();
	frag.appendChild(container);
	return frag;
}



module.exports = safeCustomElement("calendar-events", function(){

}, {
	get apiKey(){
		return this.getAttribute("api-key");
	},
	get calendarId(){
		return this.getAttribute("calendar-id");
	},
	get showRecurring(){
		return this.hasAttribute("show-recurring");
	},
	get eventCount(){
		return parseInt( this.getAttribute("event-count"), 10) || 10;
	},
	connectedCallback: function(){
		var template = this.querySelector("template");
		this.template = template ? template.content : defaultTemplate();
		this.innerHTML = "<div class='calendar-events-pending'></div>";
		var url = "https://www.googleapis.com/calendar/v3/calendars/"+
			this.calendarId+"/events?key="+this.apiKey;
		fetch( url ).then(function(response){
				return response.json();
		})
		.then(getSortedEvents)
		.then(function(sortedEvents){
			if(this.showRecurring) {
				return sortedEvents;
			} else {
				return filterRecurringEvents( sortedEvents );
			}
		}.bind(this))
		.then(getPastAndFutureEvents)
		.then(this.showEvents.bind(this))
		.catch(function(err){
			this.innerHTML = "<div class='calendar-events-rejected'>"+
				"<p>Sorry, events can't load right now.</p>"+
				"</div>";
			throw err;
		}.bind(this));

	},
	showEvents: function(getPastAndFutureEvents){
		if(!getPastAndFutureEvents.future.length &&
			!getPastAndFutureEvents.past.length) {

			this.innerHTML = "<div class='calendar-events-resolved'>"+
				"<p>There are no events to show.</p>"+
				"</div>";
			return;
		}
		var events = getEvents(getPastAndFutureEvents, this.eventCount);

		var elements = events.map( function( event ) {
			var container = this.template.cloneNode(true);
			container.firstElementChild.classList.add("calendar-events-event");


			var metaData = eventDescriptionHTMLGroupAndUrl(event);

			container.querySelectorAll("a.event-url").forEach(function(a){
				a.href = metaData.url;
			});
			setTextContent(container, ".event-title",  event.summary);
			setTextContent(container, ".event-group",  metaData.group);
			setTextContent(container, ".event-date",  eventDate(event) );
			setHtmlContent(container, ".event-location",  linkify(event.location || event.hangoutLink) );

			setHtmlContent(container, ".event-body",  metaData.descriptionHTML );

			return container;
		}.bind(this) );
		elements.forEach(function(element){
			this.appendChild(element);
		}.bind(this));
	}
});
