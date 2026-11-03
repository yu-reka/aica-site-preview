import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const uiSource=readFileSync(new URL('../../common/js/ui.js',import.meta.url),'utf8');
// Keep each behavior test's DOM spies and execute the real shared primitives.
export function installRuntime(context = {}){
  const shared={document:context.document,matchMedia:context.matchMedia||context.window?.matchMedia};
  vm.runInNewContext(uiSource,shared);
  context.SiteUI=Object.assign(shared.SiteUI,context.SiteUI);
  context.Site=Object.assign({decodeHash:shared.SiteUI.decodeHash,reduce:shared.matchMedia ? shared.matchMedia('(prefers-reduced-motion: reduce)').matches : false},context.Site);
  return context;
}
export function runInNewContext(code,context,options){return vm.runInNewContext(code,installRuntime(context),options);}
export function runInContext(code,context,options){installRuntime(context);return vm.runInContext(code,context,options);}
