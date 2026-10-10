// Check unaliased root @graph values and graph nodes against JSON-LD 1.1.
// Do not interpret ordinary property payloads: a local or remote context can
// coerce them to @json literals. This is not a full JSON-LD processor or a
// Google rich-result eligibility test.
export function invalidGraphValues(value, location = '$') {
  const errors = [];

  function visit(node, pointer) {
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, `${pointer}[${index}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;

    if (!Object.hasOwn(node, '@graph')) return;
    const graph = node['@graph'];
    const members = Array.isArray(graph) ? graph : [graph];
    if (members.some((member) => !member || typeof member !== 'object' || Array.isArray(member))) {
      errors.push(`${pointer}.@graph must be an object or an array of objects; nested arrays and scalar members are invalid`);
    }
    visit(graph, `${pointer}.@graph`);
  }

  visit(value, location);
  return errors;
}
