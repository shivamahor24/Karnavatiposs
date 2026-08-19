import React, { useCallback, useEffect, useState } from "react";
import api from "../../lib/api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Search, Plus, Pencil, Trash2, Truck, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_SUPPLIER = { name: "", contact_person: "", phone: "", email: "", address: "", gstin: "" };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState(null); // null | { mode: "add" | "edit", data: {} }
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/inventory/suppliers");
      setSuppliers(data);
    } catch { toast.error("Failed to load suppliers"); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || (s.contact_person || "").toLowerCase().includes(q) || (s.gstin || "").toLowerCase().includes(q);
  });

  const openAdd = () => { setForm(EMPTY_SUPPLIER); setDialog({ mode: "add" }); };
  const openEdit = (s) => { setForm({ name: s.name, contact_person: s.contact_person || "", phone: s.phone || "", email: s.email || "", address: s.address || "", gstin: s.gstin || "" }); setDialog({ mode: "edit", id: s.id }); };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Supplier name is required"); return; }
    setBusy(true);
    try {
      if (dialog.mode === "add") {
        await api.post("/inventory/suppliers", form);
        toast.success("Supplier created");
      } else {
        await api.put(`/inventory/suppliers/${dialog.id}`, form);
        toast.success("Supplier updated");
      }
      setDialog(null); fetch();
    } catch (e) { toast.error(e?.response?.data?.detail || "Save failed"); }
    finally { setBusy(false); }
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Remove supplier "${name}"? This will soft-delete the supplier.`)) return;
    try {
      await api.delete(`/inventory/suppliers/${id}`);
      toast.success("Supplier removed");
      fetch();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <div className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{t("inv_module") || "Inventory Management"}</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{t("inv_suppliers") || "Suppliers"}</h1>
        </div>
        <Button onClick={openAdd} className="bg-terracota hover:bg-terracota-hover text-white">
          <Plus className="w-4 h-4 mr-2" /> Add Supplier
        </Button>
      </div>

      <div className="relative max-w-sm mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white" />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-border shadow-none">
          <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
          <div className="text-muted-foreground">No suppliers found. Add your first supplier.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="p-5 border-border shadow-none hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-forest-light flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-forest" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg">{s.name}</div>
                    {s.contact_person && <div className="text-xs text-muted-foreground">{s.contact_person}</div>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(s)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => remove(s.id, s.name)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                {s.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {s.phone}</div>}
                {s.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {s.email}</div>}
                {s.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {s.address}</div>}
                {s.gstin && <Badge variant="outline" className="text-[10px] mt-1">GSTIN: {s.gstin}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Truck className="w-5 h-5 text-forest" /> {dialog?.mode === "add" ? "Add Supplier" : "Edit Supplier"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" placeholder="e.g., ABC Trading Co." autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" placeholder="+91..." />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>GSTIN</Label>
              <Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} className="mt-1" placeholder="29ABCDE1234F1Z5" />
            </div>
            <Button onClick={save} disabled={busy} className="w-full bg-terracota hover:bg-terracota-hover text-white">
              {dialog?.mode === "add" ? "Create Supplier" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
