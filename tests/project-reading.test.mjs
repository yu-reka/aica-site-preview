import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../stories/js/project-reading.js', import.meta.url), 'utf8');
function render(text, rich = false) {
  let result;
  const paragraph = {
    textContent: text, children: rich ? [{}] : [], attributes: [{name:'class', value:'pjph-t'}],
    replaceWith(node) { result = node; },
  };
  const element = tag => ({tag, children:[], setAttribute(){}, append(child){this.children.push(child);}});
  vm.runInNewContext(source, {document:{
    querySelectorAll: () => [paragraph], querySelector: () => null, createElement: element,
  }});
  return result && Array.from(result.children[0].children, node => node.textContent);
}

test('published inline bullets and line-based dot, dash and number lists render every item', () => {
  for (const text of [
    '• 첫째 • 둘째 • 셋째 • 넷째',
    '• 첫째 • 둘째\n• 셋째 • 넷째',
    '· 첫째\n· 둘째\n· 셋째\n· 넷째',
    '- 첫째\n- 둘째\n- 셋째\n- 넷째',
    '1. 첫째\n2. 둘째\n3. 셋째\n4. 넷째',
    '1) 첫째\r\n2) 둘째\r\n3) 셋째\r\n4) 넷째',
    '• 첫째\n· 둘째\n- 셋째\n4. 넷째',
  ]) assert.deepEqual(render(text), ['첫째','둘째','셋째','넷째']);
});

test('sentence punctuation, wrapped lines and markup-looking text are preserved', () => {
  assert.deepEqual(render('- YouTube·TikTok 및 AI-based 기능\n줄이 이어집니다.\n- <img src=x onerror=alert(1)>'),
    ['YouTube·TikTok 및 AI-based 기능\n줄이 이어집니다.', '<img src=x onerror=alert(1)>']);
  for (const text of ['브랜드·업종 - 콘셉트 1. 소개\n일반 문단', '1.5초 영상\n2.0초 영상', '- 단일 항목']) {
    assert.equal(render(text), undefined);
  }
  assert.equal(render('· 하나\n· 둘', true), undefined);
});
