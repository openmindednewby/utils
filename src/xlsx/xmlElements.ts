export interface XmlElement {
  attrs: string;
  inner: string | undefined;
}

const NAME_END = /[\s/>]/;

/** Each element with the tag in document order, found by a linear indexOf scan; inner is undefined when self-closing. */
export function* xmlElements(xml: string, tag: string): Generator<XmlElement, void, undefined> {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  let at = xml.indexOf(open);
  while (at !== -1) {
    if (!NAME_END.test(xml.charAt(at + open.length))) {
      at = xml.indexOf(open, at + open.length);
      continue;
    }
    const end = xml.indexOf('>', at + open.length);
    if (end === -1) {
      return;
    }
    const selfClosing = xml.charAt(end - 1) === '/';
    const attrs = xml.slice(at + open.length, selfClosing ? end - 1 : end);
    if (selfClosing) {
      yield { attrs, inner: undefined };
      at = xml.indexOf(open, end + 1);
      continue;
    }
    const closeAt = xml.indexOf(close, end + 1);
    if (closeAt === -1) {
      return;
    }
    yield { attrs, inner: xml.slice(end + 1, closeAt) };
    at = xml.indexOf(open, closeAt + close.length);
  }
}
