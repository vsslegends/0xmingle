import { linkify } from "@/lib/attachments";

export function RichText({ text, dark }: { text: string; dark: boolean }) {
  return (
    <p>
      {linkify(text).map((part, i) =>
        part.t === "link" ? (
          <a
            key={i}
            href={part.v}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={dark ? "underline decoration-black/40 break-all" : "text-cyan-300 underline break-all"}
          >
            {part.v}
          </a>
        ) : (
          <span key={i}>{part.v}</span>
        ),
      )}
    </p>
  );
}
