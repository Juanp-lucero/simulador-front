import { TestBed } from '@angular/core/testing';
import { AiText, parseAiText } from './ai-text';

describe('parseAiText', () => {
  it('splits headings, bullets and paragraphs and strips Markdown marks', () => {
    const blocks = parseAiText('## Resumen\n**Riesgos:**\n- Margen **bajo** el techo\n1. Revisar `velocidad`\n\nTexto normal.');
    expect(blocks).toEqual([
      { kind: 'heading', text: 'Resumen' },
      { kind: 'heading', text: 'Riesgos' },
      { kind: 'bullet', text: 'Margen bajo el techo' },
      { kind: 'bullet', text: 'Revisar velocidad' },
      { kind: 'paragraph', text: 'Texto normal.' },
    ]);
  });

  it('never renders model output as HTML', () => {
    const fixture = TestBed.createComponent(AiText);
    fixture.componentRef.setInput('text', '<img src=x onerror=alert(1)> hola');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toContain('<img');
  });
});
