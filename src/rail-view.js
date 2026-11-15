import {createRailTOC} from './rail-toc.js';
import {createRailReader} from './rail-reader.js';

let instance = 0;

// Both the reading page and the standalone HTML mount this same pair of surfaces.
export function mountRailView({railHost, readerHost, config, prefix='rail', externalBinding, onChange, onDemoEnd}) {
  const namespace = prefix + '-' + (++instance);
  let items = config.items, linked = Boolean(config.linked), selected = items[0].id;
  let binding = externalBinding, headings = new Map(), reader;
  const viewport = document.createElement('div');
  viewport.className = 'rail-reading';
  viewport.setAttribute('role','region');
  viewport.setAttribute('aria-label','章节正文');
  const content = document.createElement('div');
  content.className = 'rail-reading-content';
  viewport.append(content);
  readerHost.append(viewport);

  function writeLinks(element, text) {
    // Only recognise explicit HTTPS links; keep all other editable text literal.
    let start=0;
    for(const match of text.matchAll(/\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)/g)) {
      const url=URL.canParse(match[2]) ? new URL(match[2]) : null;
      if(!url || url.protocol!=='https:' || url.username || url.password)continue;
      element.append(text.slice(start,match.index));
      const link=document.createElement('a');
      link.href=url.href;
      link.target='_blank';
      link.rel='noopener noreferrer';
      link.textContent=match[1];
      element.append(link);
      start=match.index+match[0].length;
    }
    element.append(text.slice(start));
  }
  function writeBody(section, text) {
    const chunks = String(text || '').split(/^\x60\x60\x60[^\n]*\n?/gm);
    chunks.forEach((chunk,index)=>{
      if(index % 2) {
        const pre=document.createElement('pre'), code=document.createElement('code');
        code.textContent=chunk.trimEnd(); pre.append(code); section.append(pre);
      } else {
        for (const paragraph of chunk.split(/\n\s*\n/)) {
          if(!paragraph.trim())continue;
          const lines=paragraph.trim().split('\n');
          if(lines.every(line=>line.startsWith('- '))) {
            const list=document.createElement('ul');
            list.className='reading-links';
            for(const line of lines) {
              const item=document.createElement('li');
              const [label,...detail]=line.slice(2).split(') · ');
              writeLinks(item,detail.length ? label+')' : label);
              if(detail.length) {
                const meta=document.createElement('small');
                meta.textContent=detail.join(') · ');
                item.append(meta);
              }
              list.append(item);
            }
            section.append(list);
          } else {
            const p=document.createElement('p');
            writeLinks(p,paragraph.trim());
            section.append(p);
          }
        }
      }
    });
  }
  function render() {
    const scroll = viewport.scrollTop;
    headings.clear();
    viewport.classList.toggle('is-linked',linked);
    if(linked) viewport.tabIndex=0; else viewport.removeAttribute('tabindex');
    const fragment = document.createDocumentFragment();
    for(const item of items) {
      if(!linked && item.id !== selected)continue;
      const section = document.createElement('section');
      section.className = 'rail-reading-section';
      const h = document.createElement('h' + (2 + Number(item.level)));
      h.id = namespace + '-' + item.id;
      h.textContent = item.title;
      section.append(h); writeBody(section,item.body);
      headings.set(item.id,h); fragment.append(section);
    }
    content.replaceChildren(fragment);
    viewport.scrollTop = linked ? scroll : 0;
  }
  function pick({index,id,source}) {
    selected=id;
    if(linked) reader?.select(id); else render();
    onChange?.({id,index,source});
  }
  function read(id,index,progress) {
    const changed = selected !== id;
    selected=id;
    rail.setActive(progress,{source:'reading',sectionIndex:index});
    if (changed) onChange?.({id,index,source:'reading'});
  }
  render();
  const rail = createRailTOC(railHost, {
    items,title:config.title,linked,onSelect:pick,onDemoEnd,
    visibilityRoot:railHost.closest('main') || railHost.parentElement,
    onFreezeChange:frozen=>reader?.setPaused(frozen)
  });
  const localBinding = {container:viewport, resolve:id=>headings.get(id)};
  reader = createRailReader({...localBinding,...binding,items,linked,offset:96,
    ignoreInput:railHost,onRead:read});
  if(linked) reader.select(selected);
  return {
    select(value){
      const index=typeof value==='number'?value:items.findIndex(row=>row.id===value);
      if(!Number.isInteger(index)||!items[index])return;
      rail.setActive(index); pick({index,id:items[index].id,source:'api'});
    },
    setTitle(title){ rail.setTitle(title); },
    setItems(next){
      rail.setItems(next); items=next; selected=items[rail.getActive()].id;
      render(); reader.setItems(next);
    },
    setLinked(value){
      if(linked===Boolean(value))return;
      linked=Boolean(value);render();rail.setLinked(linked);
      reader.setLinked(linked);if(linked)reader.select(selected);
    },
    setPaused(value){rail.setPaused(value);},
    setDemo(value){rail.setDemo(value);},
    setRate(rate){rail.setRate(rate);reader.setRate(rate);},
    connect(next){
      binding=next;
      reader.connect(binding?{container:window,...binding}:localBinding);
    },
    destroy(){reader.destroy();rail.destroy();viewport.remove();}
  };
}
