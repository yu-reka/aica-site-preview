/* Public API content: inert markup, permitted URLs, and early resource failure signal. */
(function () {
  'use strict';
  var status = { storiesApiFailed: false };
  window.AicaPublicContentStatus = status;
  function onError(event) {
    var target = event.target;
    if (!target || target.tagName !== 'SCRIPT' || !target.src) return;
    try { if (/\/api\/public\/stories\.js$/.test(new URL(target.src, document.baseURI).pathname)) status.storiesApiFailed = true; }
    catch (_) {}
  }
  window.addEventListener('error', onError, true);
  document.addEventListener('DOMContentLoaded', function () { window.removeEventListener('error', onError, true); });

  function safeUrl(value, image) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw || /[\u0000-\u001f\u007f]/.test(raw)) return '';
    try {
      var url = new URL(raw, document.baseURI);
      if (/^https?:$/.test(url.protocol)) return raw;
      if (!image && /^(mailto:|tel:)$/.test(url.protocol)) return raw;
    } catch (_) {}
    return '';
  }
  var htmlTags = new Set('p br strong b em i u s small span a ul ol li blockquote code pre sup sub mark div'.split(' '));
  var svgTags = new Set('svg g defs path rect circle ellipse line polyline polygon text tspan title desc lineargradient radialgradient stop clippath mask pattern use'.split(' '));
  var svgAttrs = new Set('xmlns viewbox preserveaspectratio class id x y x1 y1 x2 y2 cx cy r rx ry width height d points transform fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-dasharray stroke-dashoffset stroke-opacity opacity font-family font-size font-weight text-anchor dominant-baseline dx dy gradientunits gradienttransform offset stop-color stop-opacity clip-path clip-rule mask patternunits patterntransform role aria-hidden aria-label focusable'.split(' '));
  function clean(html, svg) {
    var template = document.createElement('template');
    template.innerHTML = String(html == null ? '' : html);
    function visit(parent) {
      Array.from(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 8) { node.remove(); return; }
        if (node.nodeType !== 1) return;
        var tag = node.localName.toLowerCase();
        var allowed = svg ? svgTags.has(tag) && node.namespaceURI === 'http://www.w3.org/2000/svg' : htmlTags.has(tag) && node.namespaceURI === 'http://www.w3.org/1999/xhtml';
        if (!allowed) {
          if (!svg && node.namespaceURI === 'http://www.w3.org/1999/xhtml' && !/^(script|style|iframe|object|embed|template|noscript)$/.test(tag)) { visit(node); node.replaceWith.apply(node, Array.from(node.childNodes)); }
          else node.remove();
          return;
        }
        Array.from(node.attributes).forEach(function (attr) {
          var name = attr.name.toLowerCase(), value = attr.value;
          if (svg) {
            var localReference = (name === 'href' || name === 'xlink:href') && /^#[A-Za-z_][\w:.-]*$/.test(value);
            if ((!svgAttrs.has(name) && !localReference) || (/url\s*\(/i.test(value) && !/^url\(#[A-Za-z_][\w:.-]*\)$/.test(value))) node.removeAttribute(attr.name);
          } else if (tag === 'a' && name === 'href') {
            var href = safeUrl(value, false); if (href) node.setAttribute('href', href); else node.removeAttribute(attr.name);
          } else if (name !== 'class' && name !== 'title') node.removeAttribute(attr.name);
        });
        if (!svg && tag === 'a') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noopener noreferrer'); }
        visit(node);
      });
    }
    visit(template.content);
    if (svg && (template.content.children.length !== 1 || template.content.firstElementChild.localName !== 'svg')) return '';
    return template.innerHTML;
  }
  window.AicaPublicContent = { url: safeUrl, html: function (value) { return clean(value, false); }, svg: function (value) { return clean(value, true); } };
})();
