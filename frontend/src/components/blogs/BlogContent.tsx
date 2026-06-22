import type { BlogContentBlock } from "@/lib/types/blog";

type BlogContentProps = {
  content: BlogContentBlock[];
};

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose-blog space-y-5">
      {content.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className="mt-8 text-xl font-bold text-foreground first:mt-0"
              >
                {block.text}
              </h2>
            );
          case "list":
            return (
              <ul
                key={index}
                className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted"
              >
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "paragraph":
          default:
            return (
              <p
                key={index}
                className="text-base leading-relaxed text-muted"
              >
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}
