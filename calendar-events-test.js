var QUnit = require('steal-qunit');
var CalendarEvents = require('./calendar-events');

QUnit.module('calendar-events');

QUnit.test('Initialized the plugin', function(){
  QUnit.equal(typeof CalendarEvents, 'function');
});
