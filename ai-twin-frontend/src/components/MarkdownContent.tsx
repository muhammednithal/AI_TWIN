import Markdown from 'react-markdown';
export function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="markdown">
      <Markdown
        disallowedElements={['img']}
        components={{
          a: ({ href, children: label }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  );
}
