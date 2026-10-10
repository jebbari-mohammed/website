// Check the @graph shape required by JSON-LD 1.1. This is a syntax
// check, not a complete JSON-LD processor or a Google rich-result eligibility test.
export function invalidGraphValues(value, location = '$') {
  const errors = [];

  function visit(node, pointer) {
    if (Array.isArray(node)) {
      node.forEach((child, index) => visit(child, `${pointer}[${index}]`));
      return;
    }
    if (!node || typeof node !== 'object') return;

    if (Object.hasOwn(node, '@graph')) {
      const graph = node['@graph'];
      const members = Array.isArray(graph) ? graph : [graph];
      if (members.some((member) => !member || typeof member !== 'object' || Array.isArray(member))) {
        errors.push(`${pointer}.@graph must be an object or an array of objects; nested arrays and scalar members are invalid`);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      // An @json literal holds ordinary JSON, not further structured-data nodes.
      if (key === '@value' && node['@type'] === '@json') continue;
      visit(child, `${pointer}.${key}`);
    }
  }

  visit(value, location);
  return errors;
}
