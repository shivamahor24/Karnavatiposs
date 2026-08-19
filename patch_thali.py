import re

with open("frontend/src/components/ThaliBuilder.jsx", "r") as f:
    content = f.read()

# 1. State changes
content = content.replace(
    'const [breadConsumed, setBreadConsumed] = useState(0);',
    'const [breadConsumed, setBreadConsumed] = useState(0);\n  const [thaliQty, setThaliQty] = useState(1);'
)

content = content.replace(
    'setPicks({});',
    'setPicks({});\n      setThaliQty(1);'
)

# 2. toggle -> addPick / removePick
old_toggle = """  const toggle = (catId, itemName, max) => {
    setPicks((p) => {
      const cur = p[catId] || [];
      if (cur.includes(itemName)) return { ...p, [catId]: cur.filter((x) => x !== itemName) };
      if (cur.length >= max) {
        // replace oldest
        return { ...p, [catId]: [...cur.slice(1), itemName] };
      }
      return { ...p, [catId]: [...cur, itemName] };
    });
  };"""

new_toggle = """  const handleQtyChange = (delta) => {
    setThaliQty((prev) => {
      const next = Math.max(1, prev + delta);
      // Scale bread
      if (thali?.included_bread_count) {
         setBreadConsumed(thali.included_bread_count * next);
      }
      // Trim picks if needed
      setPicks(p => {
         const np = { ...p };
         let changed = false;
         (thali.thali_groups || []).forEach(g => {
            const max = g.count * next;
            if ((np[g.category_id] || []).length > max) {
               np[g.category_id] = np[g.category_id].slice(-max);
               changed = true;
            }
         });
         return changed ? np : p;
      });
      return next;
    });
  };

  const addPick = (catId, itemName, max) => {
    setPicks((p) => {
      const cur = p[catId] || [];
      if (cur.length >= max) {
        return { ...p, [catId]: [...cur.slice(1), itemName] };
      }
      return { ...p, [catId]: [...cur, itemName] };
    });
  };

  const removePick = (catId, itemName) => {
    setPicks((p) => {
      const cur = p[catId] || [];
      const idx = cur.lastIndexOf(itemName);
      if (idx === -1) return p;
      const nextArr = [...cur];
      nextArr.splice(idx, 1);
      return { ...p, [catId]: nextArr };
    });
  };"""
content = content.replace(old_toggle, new_toggle)

# 3. allFilled and includedBread
content = content.replace(
    'const allFilled = groups.every((g) => (picks[g.category_id] || []).length === g.count);',
    'const allFilled = groups.every((g) => (picks[g.category_id] || []).length === g.count * thaliQty);'
)
content = content.replace(
    'const includedBread = thali.included_bread_count || 0;',
    'const includedBread = (thali.included_bread_count || 0) * thaliQty;'
)

# 4. onAdd qty
content = content.replace(
    'qty: 1,',
    'qty: thaliQty,'
)

# 5. Header UI
old_header = """        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-tight">
            {thali.name} <span className="text-terracota font-mono text-lg">₹{thali.price}</span>
          </DialogTitle>
          <DialogDescription>
            {thali.thali_extras ? <span>{t("includes")}: <span className="text-foreground">{thali.thali_extras}</span></span> : t("pick_todays_items")}
          </DialogDescription>
        </DialogHeader>"""

new_header = """        <DialogHeader className="mb-2">
          <div className="flex items-start justify-between pr-8">
            <div>
              <DialogTitle className="font-display text-2xl tracking-tight">
                {thali.name} <span className="text-terracota font-mono text-lg ml-2">₹{thali.price * thaliQty}</span>
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                {thali.thali_extras ? <span>{t("includes")}: <span className="text-foreground">{thali.thali_extras}</span></span> : t("pick_todays_items")}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Quantity</span>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded bg-white shadow-sm border border-slate-200" onClick={() => handleQtyChange(-1)} disabled={thaliQty <= 1}>−</Button>
                <span className="font-mono font-bold text-base w-6 text-center">{thaliQty}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded bg-white shadow-sm border border-slate-200" onClick={() => handleQtyChange(1)}>+</Button>
              </div>
            </div>
          </div>
        </DialogHeader>"""
content = content.replace(old_header, new_header)

# 6. Group counts
content = content.replace(
    '{chosen.length} / {g.count} {t("picked")}',
    '{chosen.length} / {g.count * thaliQty} {t("picked")}'
)

content = content.replace(
    'chosen.length === g.count',
    'chosen.length === g.count * thaliQty'
)

# 7. Grid items rendering
old_grid = """                    {items.map((it) => {
                      const selected = chosen.includes(it.name);
                      return (
                        <button key={it.id} type="button"
                          onClick={() => toggle(g.category_id, it.name, g.count)}
                          data-testid={`thali-pick-${it.id}`}
                          className={`tap-scale text-left p-3 rounded-md border transition-all ${
                            selected
                              ? "border-terracota bg-terracota-light text-foreground"
                              : "border-border bg-white hover:border-terracota/50"
                          }`}>
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                              <span>{it.name}</span>
                              {it.current_stock !== undefined && it.current_stock !== null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  it.current_stock <= 0 
                                    ? "bg-red-50 text-red-600 border border-red-200" 
                                    : it.current_stock <= (it.reorder_level || 5) 
                                    ? "bg-amber-50 text-amber-700 border border-amber-200" 
                                    : "bg-slate-50 text-slate-600 border border-slate-200"
                                }`}>
                                  {it.current_stock % 1 !== 0 ? it.current_stock.toFixed(3) : it.current_stock} kg
                                </span>
                              )}
                            </span>
                            {selected && <Check className="w-4 h-4 text-terracota shrink-0" />}
                          </div>
                        </button>
                      );
                    })}"""

new_grid = """                    {items.map((it) => {
                      const countInChosen = chosen.filter(x => x === it.name).length;
                      const maxQty = g.count * thaliQty;
                      return (
                        <div key={it.id}
                          onClick={() => addPick(g.category_id, it.name, maxQty)}
                          data-testid={`thali-pick-${it.id}`}
                          className={`cursor-pointer tap-scale text-left p-3 rounded-md border transition-all ${
                            countInChosen > 0
                              ? "border-terracota bg-terracota-light text-foreground"
                              : "border-border bg-white hover:border-terracota/50"
                          }`}>
                          <div className="flex items-start justify-between gap-1.5 min-h-[24px]">
                            <span className="text-sm font-semibold flex items-center gap-1.5 flex-wrap flex-1">
                              <span>{it.name}</span>
                              {it.current_stock !== undefined && it.current_stock !== null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                  it.current_stock <= 0 
                                    ? "bg-red-50 text-red-600 border border-red-200" 
                                    : it.current_stock <= (it.reorder_level || 5) 
                                    ? "bg-amber-50 text-amber-700 border border-amber-200" 
                                    : "bg-slate-50 text-slate-600 border border-slate-200"
                                }`}>
                                  {it.current_stock % 1 !== 0 ? it.current_stock.toFixed(3) : it.current_stock} kg
                                </span>
                              )}
                            </span>
                            {countInChosen > 0 && (
                              <div className="flex items-center gap-2 bg-white rounded-md border border-terracota/30 px-1 py-0.5" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => removePick(g.category_id, it.name)} className="w-6 h-6 flex items-center justify-center text-terracota hover:bg-terracota/10 rounded">
                                  −
                                </button>
                                <span className="font-bold text-sm text-terracota w-3 text-center">{countInChosen}</span>
                                <button type="button" onClick={() => addPick(g.category_id, it.name, maxQty)} className="w-6 h-6 flex items-center justify-center text-terracota hover:bg-terracota/10 rounded">
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}"""
content = content.replace(old_grid, new_grid)

with open("frontend/src/components/ThaliBuilder.jsx", "w") as f:
    f.write(content)
