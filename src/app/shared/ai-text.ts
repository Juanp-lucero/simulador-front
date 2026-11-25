import { Component, computed, input } from '@angular/core';

export interface TextBlock { kind: 'heading' | 'bullet' | 'paragraph'; text: string; }

/**
 * Turns the light Markdown that Groq answers with into blocks. The text is
 * rendered with interpolation only, never as HTML.
 */
export function parseAiText(text: string): TextBlock[] {
  const clean = (value: string) => value.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
  const blocks: TextBlock[] = [];
  for (const raw of (text ?? '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (heading) blocks.push({ kind: 'heading', text: clean(heading[1]) });
    else if (bullet) blocks.push({ kind: 'bullet', text: clean(bullet[1]) });
    else if (/^\*\*[^*]+\*\*:?$/.test(line)) blocks.push({ kind: 'heading', text: clean(line).replace(/:$/, '') });
    else blocks.push({ kind: 'paragraph', text: clean(line) });
  }
  return blocks.filter(block => block.text);
}

@Component({
  selector: 'app-ai-text',
  template: `
    <div class="ai-text">
      @for (block of blocks(); track $index) {
        @switch (block.kind) {
          @case ('heading') { <h3>{{ block.text }}</h3> }
          @case ('bullet') { <p class="ai-bullet">{{ block.text }}</p> }
          @default { <p>{{ block.text }}</p> }
        }
      }
    </div>
  `,
})
export class AiText {
  readonly text = input.required<string>();
  readonly blocks = computed(() => parseAiText(this.text()));
}
