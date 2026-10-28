import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../life/js/life.js', import.meta.url), 'utf8');
const helperStart = source.indexOf('function topicFromHash(');
const helper = helperStart < 0 ? '' : source.slice(helperStart, source.indexOf('\nfunction route(){', helperStart));
const states = {house:'wasHousing', food:'wasFood', fun:'wasCulture'};
function watch(topic, hash) {
  const handlers = [], resets = [];
  const section = id => ({closest:()=>({id})});
  const elements = Object.fromEntries(Object.keys(states).flatMap(name => [
    ['tp-' + name, section('tp-' + name)], [name + '-detail', section('tp-' + name)]
  ]));
  const context = {location:{hash}, URL,
    Site:{decodeHash:value=>{try{return decodeURIComponent(value);}catch{return '';}}},
    document:{getElementById:id=>elements[id] || null},
    addEventListener:(_, handler)=>handlers.push(handler),
    sel:value=>resets.push(value), g:{classList:{remove:value=>resets.push(value)}},
    b:{setAttribute(){}}, bs:[{}], ks:['food'], pg:2, press(){}, tab:value=>resets.push(value)
  };
  const controller = source.match(new RegExp('var ' + states[topic] + '\\s*=[\\s\\S]+?\\n  *\\}\\);'))?.[0];
  assert.ok(controller, topic + ' reset controller exists');
  const foodHelper = topic === 'food' ? source.match(/function onFoodPage\(hash\)\{[^\n]+\}/)?.[0] || '' : '';
  vm.runInNewContext(helper + '\n' + foodHelper + '\n' + controller, context);
  return {resets, context, change:hash=>handlers.forEach(fn=>fn({newURL:'https://site.test/life/index.html' + hash}))};
}

for (const topic of Object.keys(states)) {
  for (const hash of ['#tp-' + topic, '#tips/' + topic, '#tips%2F' + topic, '#' + topic + '-detail']) {
    test(`${hash}: leaving a directly opened topic resets its selection`, () => {
      const state = watch(topic, hash);
      // The real router's replaceState normalizes the alias without emitting hashchange.
      state.context.location.hash = '#tp-' + topic;
      state.change(topic === 'food' ? '#tp-house' : '#tp-food');
      assert.equal(state.resets.length, 1);
    });
  }
  test(`${topic}: entering through an alias also arms the next departure reset`, () => {
    const state = watch(topic, '#overview');
    state.change('#tips/' + topic);
    assert.equal(state.resets.length, 0);
    state.change('#directions');
    assert.equal(state.resets.length, 1);
  });
}
