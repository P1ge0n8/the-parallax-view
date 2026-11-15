const MIN_ITEMS = 1;
const MAX_ITEMS = 12;
let nextId = 0;

export function mountRailEditor(host, {config, onChange}) {
  let current = config;
  let selected = current.items[0].id;
  const panel = document.createElement('div');
  panel.className = 'rail-editor';
  panel.innerHTML = `
    <label>目录标题<input name="directory-title" type="text" autocomplete="off"></label>
    <div class="rail-editor__section">
      <label>编辑条目<select name="item"></select></label>
      <div class="rail-editor__order" role="group" aria-label="调整条目顺序">
        <button type="button" data-action="up" aria-label="上移条目" title="上移">↑</button>
        <button type="button" data-action="down" aria-label="下移条目" title="下移">↓</button>
      </div>
    </div>
    <div class="rail-editor__fields">
      <label>条目标题<input name="item-title" type="text" autocomplete="off"></label>
      <label>层级<select name="level"><option value="0">一级</option><option value="1">二级</option><option value="2">三级</option></select></label>
      <label>段落<textarea name="body" rows="3"></textarea></label>
    </div>
    <div class="rail-editor__actions" role="group" aria-label="管理条目">
      <button type="button" data-action="add">＋ 添加条目</button>
      <button type="button" data-action="remove">移除条目</button>
    </div>
    <span class="rail-editor__status" role="status" aria-live="polite"></span>`;
  host.append(panel);

  const picker = panel.querySelector('[name="item"]');
  const level = panel.querySelector('[name="level"]');
  const title = panel.querySelector('[name="item-title"]');
  const heading = panel.querySelector('[name="directory-title"]');
  const body = panel.querySelector('[name="body"]');
  const status = panel.querySelector('[role="status"]');
  const buttons = Object.fromEntries(Array.from(panel.querySelectorAll('[data-action]'), b => [b.dataset.action, b]));
  const events = new AbortController();
  const listeners = {signal: events.signal};

  function put(field, value) {
    // A synchronous onChange may call sync() while an IME is composing.
    if (field.value !== value) field.value = value;
  }

  function render() {
    const {items} = current;
    let index = items.findIndex(item => item.id === selected);
    if (index < 0) { index = 0; selected = items[0].id; }
    const item = items[index];
    for (const [i, entry] of items.entries()) {
      const text = String(i + 1).padStart(2, '0') + '   ' + (entry.title || '未命名条目');
      let option = picker.options[i];
      if (!option) { option = new Option(); picker.add(option); }
      option.value = entry.id;
      if (option.text !== text) option.text = text;
    }
    while (picker.length > items.length) picker.remove(picker.length - 1);
    put(picker, selected);
    put(heading, current.title);
    put(title, item.title);
    put(level, String(item.level));
    put(body, item.body || '');
    buttons.up.disabled = index === 0;
    buttons.down.disabled = index === items.length - 1;
    buttons.add.disabled = items.length >= MAX_ITEMS;
    buttons.remove.disabled = items.length <= MIN_ITEMS;
  }

  function update(nextConfig) {
    current = nextConfig;
    render();
    onChange?.(current);
  }

  function updateItem(field, value) {
    const items = current.items.map(item => item.id === selected ? {...item, [field]:value} : item);
    update({...current, items});
  }

  heading.addEventListener('input', () => update({...current, title:heading.value}), listeners);
  title.addEventListener('input', () => updateItem('title', title.value), listeners);
  body.addEventListener('input', () => updateItem('body', body.value), listeners);
  level.addEventListener('change', () => updateItem('level', Number(level.value)), listeners);
  picker.addEventListener('change', () => { selected = picker.value; render(); }, listeners);

  panel.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const items = current.items.slice();
    const index = items.findIndex(item => item.id === selected);
    if (action === 'add') {
      if (items.length >= MAX_ITEMS) return;
      do { selected = 'chapter-' + (++nextId); } while (items.some(item => item.id === selected));
      items.splice(index + 1, 0, {id:selected, title:'新章节', level:items[index].level, body:''});
      update({...current, items});
      status.textContent = '已添加条目';
      title.focus(); title.select();
    } else if (action === 'remove') {
      if (items.length <= MIN_ITEMS) return;
      items.splice(index, 1);
      selected = items[Math.min(index, items.length - 1)].id;
      update({...current, items});
      status.textContent = '已移除条目';
      picker.focus();
    } else {
      const to = index + (action === 'up' ? -1 : 1);
      if (to < 0 || to >= items.length) return;
      [items[index], items[to]] = [items[to], items[index]];
      update({...current, items});
      status.textContent = '已移动至第 ' + (to + 1) + ' 项';
      if (button.disabled) picker.focus();
    }
  }, listeners);

  render();
  return {
    sync(config) { current = config; render(); },
    destroy() { events.abort(); panel.remove(); }
  };
}
