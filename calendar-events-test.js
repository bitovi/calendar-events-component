import QUnit from 'steal-qunit';
import plugin from './calendar-events';

QUnit.module('calendar-events');

QUnit.test('Initialized the plugin', function(){
  QUnit.equal(typeof plugin, 'function');
  QUnit.equal(plugin(), 'This is the calendar-events plugin');
});
