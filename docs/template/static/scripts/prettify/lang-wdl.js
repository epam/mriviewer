PR.registerLangHandler(
  PR.createSimpleLexer([
    [PR.PR_PLAIN,         /^[\t\n\r \xA0]+/, null, '\t\n\r \xA0'],
    [PR.PR_STRING,        /^\"(?:[^\"\\]|\\[\s\S])*(?:\"|$)/, null, '"'],
    [PR.PR_STRING,        /^\'(?:[^\'\\]|\\[\s\S])*(?:\'|$)/, null, "'"],
  ], [
    [PR.PR_KEYWORD,       /^\b(?:workflow|task|call|scatter|command|output)\b/, null],
    [PR.PR_TYPE,          /^\b(?:File|String)\b/, null],
    [PR.PR_PLAIN,         /^[A-Z][A-Z0-9]?(?:\$|%)?/i, null],
  ]),
  ['wdl']);
