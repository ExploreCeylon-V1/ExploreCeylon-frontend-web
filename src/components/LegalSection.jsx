/**
 * Renders one numbered section of a legal document (Terms of Service,
 * Privacy Policy). Shared by TermsPage and PrivacyPage so both documents
 * get identical heading hierarchy and spacing.
 *
 * `blocks` is an ordered list of:
 *   { type: "p", text }          — a paragraph
 *   { type: "subheading", text } — an h3 sub-heading within the section
 *   { type: "list", items }      — a bulleted list (items may be JSX nodes)
 */
export default function LegalSection({ number, title, blocks }) {
  return (
    <section aria-labelledby={`section-${number}`} className="mb-10 last:mb-0">
      <h2
        id={`section-${number}`}
        className="text-xl font-bold text-gray-900 mb-3 scroll-mt-24"
      >
        {number}. {title}
      </h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
        {blocks.map((block, i) => {
          if (block.type === "p") {
            return <p key={i}>{block.text}</p>;
          }
          if (block.type === "subheading") {
            return (
              <h3 key={i} className="text-sm font-bold text-gray-800 pt-2">
                {block.text}
              </h3>
            );
          }
          if (block.type === "list") {
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-5">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          return null;
        })}
      </div>
    </section>
  );
}
