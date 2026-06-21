import ReactMarkdown from "react-markdown";

/**
 * Renderiza el contenido de un mensaje de chat interpretando Markdown básico
 * (negrita, listas, etc.) en lugar de mostrar los asteriscos en crudo.
 * Los estilos están pensados para encajar en burbujas de chat oscuras y claras.
 */
export default function ChatMarkdown({ texto }: { texto: string }) {
  return (
    <div className="space-y-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="leading-6">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="ml-4 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="ml-4 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-6">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded bg-black/20 px-1 py-0.5 text-xs">
              {children}
            </code>
          ),
        }}
      >
        {texto}
      </ReactMarkdown>
    </div>
  );
}
