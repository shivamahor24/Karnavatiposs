import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Search,
  Banknote,
  CreditCard,
  Smartphone,
  Printer,
  ChefHat,
  ShoppingCart,
  X,
  Soup,
  UtensilsCrossed,
  Package,
  Sparkles,
  Flame,
  Leaf,
  Clock,
  XCircle,
  FileText,
  Save,
  Check,
  Tag,
  Trash2,
  ArrowRight,
  Eye,
  PauseCircle,
  ArrowLeft,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { printReceipt } from "../lib/receipt";
import ThaliBuilder from "../components/ThaliBuilder";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { useCart } from "../lib/useCart";
import { CartLine } from "../components/CartLine";
import { MenuTile } from "../components/MenuTile";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import ReceiptPreview from "../components/ReceiptPreview";
import { offlineStorage } from "../lib/offlineStorage";
import { syncQueue } from "../lib/syncQueue";
import { useOnlineStatus } from "../lib/offlineManager";
import { getCurrentToken, incrementToken } from "../lib/tokenManager";
import { useTable } from "../context/TableContext";
import TableGrid from "../components/TableGrid";

// Horizontal category tabs requested
// const CATEGORY_TABS = [
//   "ALL ITEMS",
//   "THALI",
//   "SABJI",
//   "DAL",
//   "RICE",
//   "BREAD",
//   "DRINKS",
// ];



export default function Billing() {
  const [categories, setCategories] = useState([]);
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeCat, setActiveCat] = useState("ALL ITEMS");
  const [search, setSearch] = useState("");
  const [thaliFor, setThaliFor] = useState(null);
  const [activeTab, setActiveTab] = useState("cart"); // "cart" or "receipt"
  const [menuMode, setMenuMode] = useState("dining"); // No auto-selected menu mode by default
  const [showCartMobile, setShowCartMobile] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [currentToken, setCurrentToken] = useState(getCurrentToken());
  const [isSaving, setIsSaving] = useState(false);

  // Description / Note state
  const [orderDescription, setOrderDescription] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [showDescModal, setShowDescModal] = useState(false);

  // Dialog states for Cancel & Pending
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Category drill-down: null = top-level dashboard, string = selected top-level cat id
  const [activeCatDrillId, setActiveCatDrillId] = useState(null);

  // TableContext
  const {
    tableCount,
    tableStatuses,
    activeTableId,
    activeSlot,
    pendingOrders,
    getSlot,
    setActiveTable,
    setTableCart,
    updateTableSlot,
    holdTable,
    resumeTable,
    clearTable,
    addPendingOrder,
    removePendingOrder,
  } = useTable();

  // Sync cart and description with active table slot
  useEffect(() => {
    if (activeTableId) {
      const slot = activeSlot;
      if (slot) {
        setCart(slot.cart || []);
        setDiscount(slot.discount || 0);
        setCustomerName(slot.customerName || "");
        setOrderDescription(slot.description || "");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTableId]);

  // Write cart back to TableContext when it changes (and a table is active)
  const prevCartRef = useRef(null);
  useEffect(() => {
    if (activeTableId && prevCartRef.current !== null) {
      setTableCart(activeTableId, cart);
    }
    prevCartRef.current = cart;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, activeTableId]);

  const cgstRate = useMemo(() => {
    return settings?.cgst_rate ?? (settings?.gst_rate ? settings.gst_rate / 2 : 2.5);
  }, [settings]);

  const sgstRate = useMemo(() => {
    return settings?.sgst_rate ?? (settings?.gst_rate ? settings.gst_rate / 2 : 2.5);
  }, [settings]);

  // Compute Dining Menu and Parcel Menu lists from SINGLE SOURCE OF TRUTH
  const { diningItems, parcelItems } = useMemo(() => {
    const apiMenuList = Array.isArray(menu) ? menu : [];

    const checkIsThali = (item, catName) => {
      if (item.is_thali) return true;
      const c = (catName || item.category_name || item.category || "").toUpperCase();
      return c === "THALI";
    };

    const getEffectiveMenuType = (item, isThali) => {
      const type = item.menuType || item.menu_type;
      if (type && ["dining", "parcel", "both"].includes(type.toLowerCase())) {
        return type.toLowerCase();
      }
      return isThali ? "both" : "parcel";
    };

    // Single source map keying by item name (case-insensitive) to prevent duplicates
    const itemsMap = new Map();



    if (apiMenuList.length > 0) {
      apiMenuList.forEach((m) => {
        const catObj = Array.isArray(categories) ? categories.find(c => c.id === m.category_id) : null;
        const catName = catObj ? catObj.name.toUpperCase() : (m.category ? m.category.toUpperCase() : "GENERAL");
        const isThali = checkIsThali(m, catName);
        const menuType = getEffectiveMenuType(m, isThali);
        const key = m.name ? m.name.toLowerCase().trim() : m.id;

        itemsMap.set(key, {
          ...m,
          category_name: catName,
          category: catName,
          is_thali: isThali,
          menuType,
          menu_type: menuType,
          available: m.available !== false,
        });
      });
    }

    // SINGLE SOURCE ARRAY OF ALL UNIQUE ITEMS
    const singleSourceItems = Array.from(itemsMap.values());

    // Filter Dining Menu items from the SAME single source array:
    // Sirf items/thalis with menuType "dining" || "both"
    const dList = singleSourceItems.filter((item) => {
      const type = (item.type || item.menuType || item.menu_type || "").toLowerCase();
      return type === "dining" || type === "both";
    });

    // Filter Parcel Menu items from the SAME single source array:
    // Sirf items/thalis with menuType "parcel" || "both"
    const pList = singleSourceItems.filter((item) => {
      const type = (item.type || item.menuType || item.menu_type || "").toLowerCase();
      return type === "parcel" || type === "both";
    });

    return { diningItems: dList, parcelItems: pList };
  }, [menu, categories]);

  const menuItems = useMemo(() => {
    const map = new Map();
    diningItems.forEach((i) => map.set(i.id, i));
    parcelItems.forEach((i) => map.set(i.id, i));
    return Array.from(map.values());
  }, [diningItems, parcelItems]);

  const hasLoadedCart = useRef(false);
  const tokenAssignedRef = useRef(false);

  // Reset tokenAssignedRef when cart becomes empty
  useEffect(() => {
    if (cart.length === 0) {
      tokenAssignedRef.current = false;
    }
  }, [cart.length]);

  // 1. Remove default cart items on load & listen for token reset
  useEffect(() => {
    setCart([]);
    const handleTokenReset = () => {
      setCurrentToken(getCurrentToken());
      tokenAssignedRef.current = false;
    };
    window.addEventListener("tokenReset", handleTokenReset);
    return () => window.removeEventListener("tokenReset", handleTokenReset);
  }, []);

  // 5. Storage control
  useEffect(() => {
    if (menuItems.length > 0 && !hasLoadedCart.current) {
      try {
        const storageCart = JSON.parse(localStorage.getItem("cart")) || [];
        const validCart = storageCart.filter((item) =>
          menuItems.some((m) => m.id === item.id)
        );
        setCart(validCart);
        hasLoadedCart.current = true;
      } catch (e) {
        console.warn("Storage control loading exception:", e);
      }
    }
  }, [menuItems]);

  // Persist cart to localStorage when it changes, but only after initial load from storage
  useEffect(() => {
    if (hasLoadedCart.current) {
      try {
        localStorage.setItem("cart", JSON.stringify(cart));
      } catch (e) {
        console.warn("Failed to save cart to storage:", e);
      }
    }
  }, [cart]);

  const { user } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const isOnline = useOnlineStatus();

  const addToCart = useCallback((item) => {
    console.log("Adding item:", item);

    const isThali = Boolean(
      item.is_thali ||
      item.category === "THALI" ||
      item.category_name === "THALI" ||
      (item.name && item.name.toLowerCase().includes("thali"))
    );

    // Enforce strict menu type matching for all items (including Thalis)
    const itemType = (item.type || item.menuType || item.menu_type || "").toLowerCase();
    if (menuMode && itemType) {
      if (itemType !== "both" && itemType !== menuMode) {
        console.warn(`Mismatch: Item type '${itemType}' does not match selected menu mode '${menuMode}'`);
        return;
      }
    }

    // Open Thali Rules & Customization modal for Thali items
    if (isThali) {
      setThaliFor(item);
      return;
    }

    if (cart.length === 0 && !tokenAssignedRef.current) {
      tokenAssignedRef.current = true;
      const nextTok = incrementToken();
      setCurrentToken(nextTok);
    }

    let parsedPrice = item.price;
    if (typeof parsedPrice === "string") {
      parsedPrice = parseFloat(parsedPrice.replace(/[^\d.]/g, "")) || 0;
    }

    const itemCategory = isThali ? "THALI" : (item.category_name || item.category || "GENERAL");

    const targetMode = menuMode || (itemType && itemType !== "both" ? itemType : "dining");

    // Per-item GST: if item has gst_enabled, use item_gst_rate; otherwise use global GST setting
    const itemHasGst = item.gst_enabled === true;
    const itemGstRate = itemHasGst ? (Number(item.item_gst_rate) || 0) : (cgstRate + sgstRate);
    const itemCgstRate = itemHasGst ? itemGstRate / 2 : cgstRate;
    const itemSgstRate = itemHasGst ? itemGstRate / 2 : sgstRate;

    // Both dining & parcel use raw parsedPrice (base price), with GST computed separately
    const finalPrice = parsedPrice;

    setCart((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + 1, qty: i.qty + 1, price: finalPrice, basePrice: parsedPrice, menuType: targetMode, category: itemCategory }
            : i
        );
      }
      return [...prev, {
        id: item.id,
        _key: item.id,
        name: item.name,
        price: finalPrice,
        basePrice: parsedPrice,
        category: itemCategory,
        is_thali: isThali,
        menuType: targetMode,
        quantity: 1,
        qty: 1,
        gst_enabled: itemHasGst,
        item_gst_rate: itemGstRate,
        cgst_rate: itemCgstRate,
        sgst_rate: itemSgstRate,
        rules: item.rules || null,
        thali_groups: item.thali_groups || item.thali_rules || item.rules || null,
        thali_selections: item.thali_selections || item.selections || null,
        thali_extras: item.thali_extras || item.extras || "",
        fixedInclusions: item.fixedInclusions || item.thali_extras || item.extras || "",
        sub_items: item.sub_items || item.subItems || item.included_items || item.includedItems || null,
        addons: item.addons || item.add_ons || item.addOns || null,
        included_items: item.included_items || item.includedItems || null,
        extra_bread: item.extra_bread || 0,
        extra_bread_charge: item.extra_bread_charge || 0,
      }];
    });

    toast.success(`Added ${item.name}`, {
      duration: 1500,
      icon: isThali ? "🍽️" : "📦",
    });
  }, [cart.length, menuMode, cgstRate, sgstRate]);

  const addLine = useCallback((line) => {
    const itemId = line.menu_item_id || line.id;

    if (cart.length === 0 && !tokenAssignedRef.current) {
      tokenAssignedRef.current = true;
      const nextTok = incrementToken();
      setCurrentToken(nextTok);
    }

    setCart((prev) => {
      const selectionsStr = JSON.stringify(line.thali_selections || {});
      const extrasStr = line.thali_extras || "";
      const lineMatchKey = `${itemId}-${selectionsStr}-${extrasStr}`;

      const existing = prev.find(
        (i) =>
          i._matchKey === lineMatchKey ||
          (i.id === itemId &&
            JSON.stringify(i.thali_selections || {}) === selectionsStr &&
            (i.thali_extras || "") === extrasStr)
      );

      if (existing) {
        return prev.map((i) =>
          i === existing
            ? {
              ...i,
              quantity: i.quantity + line.qty,
              qty: i.qty + line.qty,
              extra_bread: (i.extra_bread || 0) + (line.extra_bread || 0),
              extra_bread_charge: (i.extra_bread_charge || 0) + (line.extra_bread_charge || 0),
            }
            : i
        );
      }

      const uniqueKey = `${itemId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let rawPrice = line.price;
      if (typeof rawPrice === "string") {
        rawPrice = parseFloat(rawPrice.replace(/[^\d.]/g, "")) || 0;
      }
      const finalPrice = rawPrice;

      return [
        ...prev,
        {
          id: itemId,
          _key: uniqueKey,
          _matchKey: lineMatchKey,
          menu_item_id: itemId,
          name: line.name,
          price: finalPrice,
          basePrice: rawPrice,
          category: "THALI",
          is_thali: true,
          quantity: line.qty,
          qty: line.qty,
          rules: line.rules || null,
          thali_groups: line.thali_groups || line.thali_rules || null,
          thali_selections: line.thali_selections,
          thali_extras: line.thali_extras,
          fixedInclusions: line.fixedInclusions || line.thali_extras || "",
          sub_items: line.sub_items || line.subItems || line.included_items || line.includedItems || null,
          addons: line.addons || line.add_ons || line.addOns || null,
          included_items: line.included_items || line.includedItems || null,
          bread_consumed: line.bread_consumed,
          extra_bread: line.extra_bread,
          extra_bread_charge: line.extra_bread_charge,
          current_stock: line.current_stock,
        },
      ];
    });
  }, [cart.length]);

  const updateQty = useCallback((keyOrId, delta) => {
    setCart((prev) =>
      prev.map((i) =>
        (i._key === keyOrId || i.id === keyOrId)
          ? { ...i, quantity: Math.max(1, i.quantity + delta), qty: Math.max(1, i.qty + delta) }
          : i
      )
    );
  }, []);

  const removeLine = useCallback((keyOrId) => {
    setCart((prev) => prev.filter((i) => i._key !== keyOrId && i.id !== keyOrId));
  }, []);

  const clear = useCallback(() => {
    setCart([]);
    setDiscount(0);
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const lineItemTotal = item.price * item.quantity;
      const extraBreadTotal = (item.extra_bread_charge || 0) * item.quantity;
      return sum + lineItemTotal + extraBreadTotal;
    }, 0);
  }, [cart]);

  const isParcel = menuMode === "parcel";

  const cgst = useMemo(() => {
    return cart.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      const extraTotal = (item.extra_bread_charge || 0) * item.quantity;
      const gross = lineTotal + extraTotal;
      const cRate = item.cgst_rate !== undefined ? item.cgst_rate : cgstRate;
      const sRate = item.sgst_rate !== undefined ? item.sgst_rate : sgstRate;
      const totalRate = cRate + sRate;

      if (isParcel) {
        if (totalRate > 0) {
          const base = gross / (1 + totalRate / 100);
          const taxAmt = gross - base;
          return sum + taxAmt * (cRate / totalRate);
        }
        return sum;
      } else {
        return sum + gross * (cRate / 100);
      }
    }, 0);
  }, [cart, cgstRate, sgstRate, isParcel]);

  const sgst = useMemo(() => {
    return cart.reduce((sum, item) => {
      const lineTotal = item.price * item.quantity;
      const extraTotal = (item.extra_bread_charge || 0) * item.quantity;
      const gross = lineTotal + extraTotal;
      const cRate = item.cgst_rate !== undefined ? item.cgst_rate : cgstRate;
      const sRate = item.sgst_rate !== undefined ? item.sgst_rate : sgstRate;
      const totalRate = cRate + sRate;

      if (isParcel) {
        if (totalRate > 0) {
          const base = gross / (1 + totalRate / 100);
          const taxAmt = gross - base;
          return sum + taxAmt * (sRate / totalRate);
        }
        return sum;
      } else {
        return sum + gross * (sRate / 100);
      }
    }, 0);
  }, [cart, cgstRate, sgstRate, isParcel]);

  const gst = useMemo(() => {
    return cgst + sgst;
  }, [cgst, sgst]);

  const total = useMemo(() => {
    if (isParcel) {
      return Math.max(0, subtotal - discount);
    } else {
      return Math.max(0, subtotal + gst - discount);
    }
  }, [subtotal, gst, discount, isParcel]);

  const refresh = useCallback(async () => {
    // Clear temporary local storage items
    try {
      localStorage.removeItem("pos_offline_menu");
      localStorage.removeItem("menuItems");
      localStorage.removeItem("temp_menu_items");
    } catch (e) {
      console.warn("Local storage cleanup exception:", e);
    }

    try {
      const [c, m, s] = await Promise.all([
        api.get("/categories"),
        api.get("/menu"),
        api.get("/settings"),
      ]);

      setCategories(c.data);
      setMenu(m.data);
      setSettings(s.data);

      offlineStorage.saveCategories(c.data);
      offlineStorage.saveMenu(m.data);
      offlineStorage.saveSettings(s.data);

      if (
        s.data &&
        s.data.language &&
        !localStorage.getItem("pos_language")
      ) {
        changeLanguage(s.data.language);
      }
    } catch (e) {
      console.log("Loaded clean default POS data.");
    }
  }, [changeLanguage]);

  useEffect(() => {
    refresh();
  }, [refresh]);



  // Excluded from category selector (these are mode toggles with their own controls below)
  const EXCLUDED_CATEGORY_NAMES = useMemo(() => new Set([
    "DINING MENU",
    "PARCEL MENU",
    "DINING",
    "PARCEL",
  ]), []);

  // Dynamic list of configured food categories with "All" at the beginning (excluding mode toggles)
  const displayCategories = useMemo(() => {
    const list = [{ id: "ALL", name: "All" }];
    const seen = new Set(["ALL", ...EXCLUDED_CATEGORY_NAMES]);
    (categories || []).forEach((c) => {
      const normalized = (c?.name || "").trim().toUpperCase();
      if (c && c.name && !seen.has(normalized)) {
        seen.add(normalized);
        list.push({ id: c.id, name: c.name });
      }
    });
    return list;
  }, [categories, EXCLUDED_CATEGORY_NAMES]);

  // Category slider ref & scroll state for 2-row navigation
  const categoryScrollRef = useRef(null);
  const [canScrollCatLeft, setCanScrollCatLeft] = useState(false);
  const [canScrollCatRight, setCanScrollCatRight] = useState(false);

  const updateCategoryScrollState = useCallback(() => {
    const el = categoryScrollRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth + 2;
      setCanScrollCatLeft(el.scrollLeft > 5);
      setCanScrollCatRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(updateCategoryScrollState, 100);
    const el = categoryScrollRef.current;
    if (!el) return () => clearTimeout(timer);

    const handleScroll = () => updateCategoryScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateCategoryScrollState);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateCategoryScrollState);
    };
  }, [updateCategoryScrollState, displayCategories]);

  // Auto-scroll selected category into view if needed
  useEffect(() => {
    if (!categoryScrollRef.current) return;
    const timer = setTimeout(() => {
      const activeBtn = categoryScrollRef.current?.querySelector("[data-selected='true']");
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeCat]);

  const slideCategoriesLeft = useCallback(() => {
    if (categoryScrollRef.current) {
      const scrollAmount = Math.max(180, (categoryScrollRef.current.clientWidth - 40) * 0.8);
      categoryScrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  }, []);

  const slideCategoriesRight = useCallback(() => {
    if (categoryScrollRef.current) {
      const scrollAmount = Math.max(180, (categoryScrollRef.current.clientWidth - 40) * 0.8);
      categoryScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  }, []);

  // Filter list by category tab & search query
  const filterList = useCallback((list) => {
    const q = search.trim().toLowerCase();
    const targetCat = (activeCat || "ALL").trim().toUpperCase();

    return list.filter((item) => {
      let matchCat = false;
      if (targetCat === "ALL ITEMS" || targetCat === "ALL") {
        matchCat = true;
      } else {
        const itemCatObj = Array.isArray(categories) ? categories.find(c => c.id === item.category_id) : null;
        const itemCatName = (itemCatObj ? itemCatObj.name : (item.category_name || item.category || "")).toUpperCase();
        const isThaliItem = Boolean(
          item.is_thali ||
          itemCatName === "THALI" ||
          (item.name && item.name.toLowerCase().includes("thali"))
        );

        if (targetCat === "THALI") {
          matchCat = isThaliItem;
        } else {
          const parentCatObj = itemCatObj && itemCatObj.parent_id
            ? categories.find(c => c.id === itemCatObj.parent_id)
            : null;
          const parentCatName = parentCatObj ? parentCatObj.name.toUpperCase() : "";

          matchCat =
            itemCatName === targetCat ||
            parentCatName === targetCat ||
            (item.category_id && String(item.category_id) === String(activeCat));
        }
      }

      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.category_name && item.category_name.toLowerCase().includes(q));

      return matchCat && matchSearch && item.available !== false;
    });
  }, [search, activeCat, categories]);

  const filteredDining = useMemo(() => filterList(diningItems), [filterList, diningItems]);
  const filteredParcel = useMemo(() => filterList(parcelItems), [filterList, parcelItems]);
  const allFilteredItems = useMemo(() => filterList(Array.isArray(menu) ? menu : []), [filterList, menu]);
  const activeFilteredCategoryItems = useMemo(
    () => (menuMode === "dining" ? filteredDining : menuMode === "parcel" ? filteredParcel : allFilteredItems),
    [menuMode, filteredDining, filteredParcel, allFilteredItems]
  );

  const showGlobalMenus = true;

  const checkout = useCallback(async (mode) => {
    if (!cart.length) {
      toast.error(t("no_items_in_cart") || "Please add items to the order");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    const currentToken = getCurrentToken();
    const payload = {
      order_type: menuMode || "dining",
      items: cart.map((item) => ({
        menu_item_id: item.id || item.menu_item_id,
        name: item.name,
        price: item.price,
        qty: item.qty || item.quantity,
        cgst_rate: item.cgst_rate ?? cgstRate,
        sgst_rate: item.sgst_rate ?? sgstRate,
        tax_rate: (item.cgst_rate ?? cgstRate) + (item.sgst_rate ?? sgstRate),
        is_thali: item.is_thali || item.category === "THALI",
        rules: item.rules || null,
        thali_groups: item.thali_groups || item.thali_rules || item.rules || null,
        thali_selections: item.thali_selections || item.selections || null,
        thali_extras: item.thali_extras || item.extras || "",
        fixedInclusions: item.fixedInclusions || item.thali_extras || item.extras || "",
        sub_items: item.sub_items || item.subItems || item.included_items || item.includedItems || null,
        addons: item.addons || item.add_ons || item.addOns || null,
        included_items: item.included_items || item.includedItems || null,
        extra_bread: item.extra_bread || 0,
        extra_bread_charge: item.extra_bread_charge || 0,
      })),
      discount: discount,
      payment_mode: mode,
      customer_name: customerName.trim() || undefined,
      notes: orderDescription.trim() || undefined,
      description: orderDescription.trim() || undefined,
      token_no: currentToken,
    };

    if (!isOnline) {
      const queued = syncQueue.enqueue(payload);
      const offlineOrder = {
        receipt_no: queued.id,
        order_type: menuMode || "dining",
        items: payload.items,
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        tax: gst,
        cgst_rate: cgstRate,
        sgst_rate: sgstRate,
        discount: discount,
        total: total,
        payment_mode: mode,
        customer_name: customerName,
        notes: orderDescription.trim() || undefined,
        description: orderDescription.trim() || undefined,
        created_at: new Date().toISOString(),
        _offline: true,
        token_no: currentToken,
      };
      toast.warning(`Offline order saved locally. Will sync when online.`);
      if (settings?.auto_print !== false) {
        printReceipt({ order: offlineOrder, settings, menuMode });
      }
      clear();
      setCustomerName("");
      setOrderDescription("");
      setShowCartMobile(false);
      if (activeTableId) clearTable(activeTableId);
      setIsSaving(false);
      return;
    }

    try {
      const { data } = await api.post("/orders", payload);
      toast.success(`${t("checkout_success")} · #${data.receipt_no} · ₹${data.total}`);
      if (settings?.auto_print !== false) {
        try {
          await printReceipt({ order: { ...data, notes: orderDescription }, settings, menuMode });
        } catch (printErr) {
          console.error("Auto-print error after checkout:", printErr);
        }
      }
      clear();
      setCustomerName("");
      setOrderDescription("");
      setShowCartMobile(false);
      if (activeTableId) clearTable(activeTableId);
      refresh();
    } catch (e) {
      if (!e.response) {
        syncQueue.enqueue(payload);
        toast.warning(`Server unreachable — order queued for sync.`);
        clear();
        setCustomerName("");
        setOrderDescription("");
        setShowCartMobile(false);
        if (activeTableId) clearTable(activeTableId);
      } else {
        const detail = e?.response?.data?.detail;
        let msg = t("checkout_failed");
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
        } else if (detail) {
          msg = JSON.stringify(detail);
        } else if (e?.message) {
          msg = e.message;
        }
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [cart, isSaving, subtotal, gst, total, discount, isOnline, settings, clear, refresh, customerName, t, cgst, cgstRate, menuMode, sgst, sgstRate, activeTableId, clearTable, orderDescription]);

  // Combined list of pending tables and standalone pending orders
  const pendingTableList = useMemo(() => {
    return Object.entries(tableStatuses || {})
      .filter(([_, slot]) => slot.status === "pending" && slot.cart && slot.cart.length > 0)
      .map(([id, slot]) => ({
        id: `table-${id}`,
        tableId: id,
        type: "table",
        title: `Table ${id}`,
        cart: slot.cart,
        itemCount: slot.itemCount,
        description: getSlot ? getSlot(id)?.description || "" : "",
        customerName: getSlot ? getSlot(id)?.customerName || "" : "",
        discount: getSlot ? getSlot(id)?.discount || 0 : 0,
      }));
  }, [tableStatuses, getSlot]);

  const allPendingList = useMemo(() => {
    const standalone = (pendingOrders || []).map(p => ({
      id: p.id,
      type: "parcel",
      title: p.customerName ? `Parcel (${p.customerName})` : `Parcel #${p.token_no || "Order"}`,
      cart: p.cart || [],
      itemCount: (p.cart || []).reduce((s, item) => s + (item.qty || item.quantity || 0), 0),
      description: p.description || p.notes || "",
      customerName: p.customerName || "",
      discount: p.discount || 0,
      total: p.total,
      createdAt: p.createdAt,
      rawOrder: p,
    }));
    return [...pendingTableList, ...standalone];
  }, [pendingTableList, pendingOrders]);

  const totalPendingCount = allPendingList.length;

  // 1. Pending Order Handler
  const handlePendingOrder = useCallback(() => {
    if (cart.length === 0) {
      if (totalPendingCount > 0) {
        setShowPendingModal(true);
      } else {
        toast.info("No active items in cart and no pending orders.");
      }
      return;
    }

    if (activeTableId) {
      updateTableSlot(activeTableId, {
        description: orderDescription,
        discount,
        customerName,
      });
      holdTable(activeTableId);
      clear();
      setOrderDescription("");
      setCustomerName("");
      toast.success(`Table ${activeTableId} order moved to Pending`, { icon: "⏳" });
    } else {
      addPendingOrder({
        cart,
        discount,
        customerName,
        description: orderDescription,
        menuMode,
        token_no: currentToken,
        total,
      });
      clear();
      setOrderDescription("");
      setCustomerName("");
      toast.success("Parcel order moved to Pending", { icon: "⏳" });
    }
  }, [cart, activeTableId, orderDescription, discount, customerName, totalPendingCount, updateTableSlot, holdTable, addPendingOrder, menuMode, currentToken, total, clear]);

  // 2. Cancel Order Handler
  const handleCancelClick = useCallback(() => {
    if (cart.length === 0) {
      toast.info("Cart is already empty.");
      return;
    }
    setShowCancelConfirm(true);
  }, [cart.length]);

  const handleConfirmCancel = useCallback(() => {
    clear();
    setOrderDescription("");
    setCustomerName("");
    if (activeTableId) clearTable(activeTableId);
    setShowCancelConfirm(false);
    toast.info("Active bill cancelled.", { icon: "🗑️" });
  }, [clear, activeTableId, clearTable]);

  // 3. Save Order Handler (SAVE ONLY — ORDER HISTORY ONLY, NO PRINTING)
  const handleSaveOrder = useCallback(async () => {
    if (!cart.length) {
      toast.error(t("no_items_in_cart") || "Please add items to the order");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    const currentToken = getCurrentToken();
    const payload = {
      order_type: menuMode || "dining",
      items: cart.map((item) => ({
        menu_item_id: item.id || item.menu_item_id,
        name: item.name,
        price: item.price,
        qty: item.qty || item.quantity,
        cgst_rate: item.cgst_rate ?? cgstRate,
        sgst_rate: item.sgst_rate ?? sgstRate,
        tax_rate: (item.cgst_rate ?? cgstRate) + (item.sgst_rate ?? sgstRate),
        is_thali: item.is_thali || item.category === "THALI",
        rules: item.rules || null,
        thali_groups: item.thali_groups || item.thali_rules || item.rules || null,
        thali_selections: item.thali_selections || item.selections || null,
        thali_extras: item.thali_extras || item.extras || "",
        fixedInclusions: item.fixedInclusions || item.thali_extras || item.extras || "",
        sub_items: item.sub_items || item.subItems || item.included_items || item.includedItems || null,
        addons: item.addons || item.add_ons || item.addOns || null,
        included_items: item.included_items || item.includedItems || null,
        extra_bread: item.extra_bread || 0,
        extra_bread_charge: item.extra_bread_charge || 0,
      })),
      discount: discount,
      payment_mode: paymentMethod || "cash",
      customer_name: customerName.trim() || undefined,
      notes: orderDescription.trim() || undefined,
      description: orderDescription.trim() || undefined,
      token_no: currentToken,
    };

    if (!isOnline) {
      syncQueue.enqueue(payload);
      toast.success("Order saved successfully (offline).", { icon: "💾" });
      clear();
      setCustomerName("");
      setOrderDescription("");
      setShowCartMobile(false);
      if (activeTableId) clearTable(activeTableId);
      setIsSaving(false);
      return;
    }

    try {
      const { data } = await api.post("/orders", payload);
      toast.success("Order saved successfully.", { icon: "💾" });
      // STRICTLY NO PRINTING: do not trigger printReceipt or window.print
      clear();
      setCustomerName("");
      setOrderDescription("");
      setShowCartMobile(false);
      if (activeTableId) clearTable(activeTableId);
      refresh();
    } catch (e) {
      if (!e.response) {
        syncQueue.enqueue(payload);
        toast.warning("Server unreachable — order saved locally for sync.", { icon: "💾" });
        clear();
        setCustomerName("");
        setOrderDescription("");
        setShowCartMobile(false);
        if (activeTableId) clearTable(activeTableId);
      } else {
        const detail = e?.response?.data?.detail;
        let msg = "Failed to save order";
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
        } else if (detail) {
          msg = JSON.stringify(detail);
        } else if (e?.message) {
          msg = e.message;
        }
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    cart,
    isSaving,
    t,
    menuMode,
    cgstRate,
    sgstRate,
    discount,
    paymentMethod,
    customerName,
    orderDescription,
    isOnline,
    clear,
    activeTableId,
    clearTable,
    refresh,
  ]);

  // 4. Save & Print Handler (Saves order and prints receipt)
  const handleSaveAndPrint = useCallback(async () => {
    if (isSaving) return;
    await checkout(paymentMethod || "cash");
  }, [checkout, paymentMethod, isSaving]);

  // Resume Pending Order
  const handleResumePendingOrder = useCallback((pendingItem) => {
    if (pendingItem.type === "table" && pendingItem.tableId) {
      resumeTable(pendingItem.tableId);
      setShowPendingModal(false);
      toast.success(`Resumed Table ${pendingItem.tableId} order`, { icon: "🍽️" });
    } else if (pendingItem.rawOrder) {
      const ord = pendingItem.rawOrder;
      setCart(ord.cart || []);
      setDiscount(ord.discount || 0);
      setCustomerName(ord.customerName || "");
      setOrderDescription(ord.description || "");
      if (ord.menuMode) setMenuMode(ord.menuMode);
      removePendingOrder(pendingItem.id);
      setShowPendingModal(false);
      toast.success("Resumed pending parcel order", { icon: "🍽️" });
    }
  }, [resumeTable, removePendingOrder]);

  return (
    <div className="h-full grid grid-cols-12 gap-2.5 sm:gap-3 lg:gap-4 bg-[#FAF7F2] p-1 sm:p-2 overflow-hidden billing-responsive-scale container billing-page-container">
      {/* Main Section: Food Menus */}
      <div className="col-span-7 sm:col-span-7 lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col h-full min-h-0 bg-[#FFFDF9] rounded-3xl shadow-sm border border-[#F2E8DC] p-3 sm:p-6 overflow-hidden main-content menu-section">

        {/* Header & Search */}
        <div className="flex flex-col gap-3 pb-3.5 border-b border-[#F5EFE6]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#FF6B00]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Thali billing counter </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Tab to bill
              </h1>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-52 md:w-60 lg:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                data-testid="menu-search"
                placeholder="Search food items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-9 bg-white border-[#EFE5DA] focus:border-[#FF6B00] rounded-xl text-slate-800 shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 1. Dining / Parcel Selection — Major Categories (ABOVE) */}
          <div className="flex items-center gap-3 pt-0.5 pb-3 border-b border-[#F5EFE6]">
            <button
              onClick={() => setMenuMode("dining")}
              data-testid="toggle-dining-menu"
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all duration-200 border flex items-center gap-2 select-none active:scale-95 shadow-2xs ${
                menuMode === "dining"
                  ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-700 border-[#EFE5DA] hover:bg-[#FFF5ED] hover:text-[#FF6B00]"
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Dining Menu</span>
            </button>

            <button
              onClick={() => setMenuMode("parcel")}
              data-testid="toggle-parcel-menu"
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all duration-200 border flex items-center gap-2 select-none active:scale-95 shadow-2xs ${
                menuMode === "parcel"
                  ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/20"
                  : "bg-white text-slate-700 border-[#EFE5DA] hover:bg-[#FFF5ED] hover:text-[#FF6B00]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Parcel Menu</span>
            </button>
          </div>

          {/* 2. Food Categories — Multiple Categories (BELOW) */}
          <div
            className="relative flex items-center gap-2 w-full select-none pt-1"
            data-testid="pos-category-container"
          >
            {/* Left Slide Button (Only rendered when scrolled right) */}
            {canScrollCatLeft && (
              <button
                type="button"
                onClick={slideCategoriesLeft}
                aria-label="Previous categories"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 shadow-2xs bg-white text-slate-700 border-[#EFE5DA] hover:bg-[#FFF5ED] hover:text-[#FF6B00] hover:border-orange-300 active:scale-90 cursor-pointer"
                title="Previous categories"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            {/* 2-Row Scrollable Categories Grid */}
            <div
              ref={categoryScrollRef}
              className="flex-1 overflow-x-auto no-scrollbar scroll-smooth py-1"
              data-testid="pos-category-bar"
            >
              <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-x-2.5 gap-y-2">
                {displayCategories.map((cat) => {
                  const isSelected =
                    (cat.id === "ALL" && (activeCat === "ALL ITEMS" || activeCat === "ALL" || !activeCat)) ||
                    activeCat.toUpperCase() === cat.name.toUpperCase() ||
                    activeCat === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-selected={isSelected ? "true" : "false"}
                      onClick={() => {
                        if (cat.id === "ALL") {
                          setActiveCat("ALL ITEMS");
                        } else {
                          setActiveCat(cat.name);
                        }
                      }}
                      data-testid={`cat-btn-${cat.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap border select-none shrink-0 shadow-2xs active:scale-95 flex items-center justify-center h-8 sm:h-8.5 ${
                        isSelected
                          ? "bg-[#FF6B00] text-white border-[#FF6B00] shadow-md shadow-orange-500/25 font-extrabold scale-[1.02]"
                          : "bg-white text-slate-700 border-[#EFE5DA] hover:bg-[#FFF5ED] hover:text-[#FF6B00] hover:border-orange-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Slide Button */}
            <button
              type="button"
              onClick={slideCategoriesRight}
              disabled={!canScrollCatRight}
              aria-label="Next categories"
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200 shadow-2xs ${
                canScrollCatRight
                  ? "bg-white text-slate-700 border-[#EFE5DA] hover:bg-[#FFF5ED] hover:text-[#FF6B00] hover:border-orange-300 active:scale-90 cursor-pointer"
                  : "bg-slate-100/70 text-slate-300 border-slate-200/50 opacity-30 cursor-not-allowed pointer-events-none"
              }`}
              title="Next categories"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content: Dining Menu & Parcel Menu */}
        <div className="flex-1 min-h-0 overflow-y-auto pt-5 pr-1 space-y-8 scroll-behavior-smooth">

          {/* ALL ITEMS SECTION (WHEN NEITHER DINING NOR PARCEL MODE TOGGLE IS ACTIVE) */}
          {/* {showGlobalMenus && !menuMode && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00]">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                    All Items
                  </h2>
                </div>
                <span className="text-xs font-bold text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                  {allFilteredItems.length} Items Available
                </span>
              </div>

              {allFilteredItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-[#EFE5DA] rounded-2xl bg-white/60 text-sm">
                  No items match "{search || activeCat}"
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                  data-testid="all-items-grid"
                >
                  {allFilteredItems.map((item) => (
                    <MenuTile
                      key={item.id}
                      item={item}
                      onClick={() => addToCart(item)}
                    />
                  ))}
                </div>
              )}
            </section>
          )} */}

          {/* SECTION 1: DINING MENU (ONLY visible for ALL ITEMS or THALI) */}
          {showGlobalMenus && menuMode === "dining" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B00]">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                    Dining Menu
                  </h2>
                </div>
                <span className="text-xs font-bold text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                  {filteredDining.length} Items Available
                </span>
              </div>

              {filteredDining.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-[#EFE5DA] rounded-2xl bg-white/60 text-sm">
                  No Dining items match "{search || activeCat}"
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                  data-testid="dining-menu-grid"
                >
                  {filteredDining.map((item) => (
                    <MenuTile
                      key={item.id}
                      item={item}
                      menuMode={menuMode}
                      gstRate={cgstRate + sgstRate}
                      onClick={() => addToCart(item)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION 2: PARCEL MENU (ONLY visible for ALL ITEMS or THALI) */}
          {showGlobalMenus && menuMode === "parcel" && (
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-100 text-amber-700">
                    <Package className="w-4 h-4" />
                  </div>
                  <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight">
                    Parcel Menu
                  </h2>
                </div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                  {filteredParcel.length} Items Available
                </span>
              </div>

              {filteredParcel.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-[#EFE5DA] rounded-2xl bg-white/60 text-sm">
                  No Parcel items match "{search || activeCat}"
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                  data-testid="parcel-menu-grid"
                >
                  {filteredParcel.map((item) => (
                    <MenuTile
                      key={item.id}
                      item={item}
                      menuMode={menuMode}
                      gstRate={cgstRate + sgstRate}
                      onClick={() => addToCart(item)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SPECIFIC CATEGORY VIEW (FOR SABJI, DAL, RICE, BREAD, DRINKS) */}
          {!showGlobalMenus && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                  {activeCat}
                </h2>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                  {activeFilteredCategoryItems.length} Items
                </span>
              </div>

              {activeFilteredCategoryItems.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-[#EFE5DA] rounded-2xl bg-white/60 text-sm">
                  No items match "{search || activeCat}"
                </div>
              ) : (
                <div
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                  data-testid="category-menu-grid"
                >
                  {activeFilteredCategoryItems.map((item) => (
                    <MenuTile
                      key={item.id}
                      item={item}
                      menuMode={menuMode}
                      gstRate={cgstRate + sgstRate}
                      onClick={() => addToCart(item)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Mobile Cart Backdrop */}
      {showCartMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setShowCartMobile(false)}
        />
      )}

      {/* Active Bill Sidebar Column */}
      <div className={`cart-panel cart-section
        fixed inset-y-0 right-0 z-40
        w-full
        transform transition-transform duration-300
        sm:relative sm:translate-x-0 sm:inset-auto
        col-span-5 sm:col-span-5 lg:col-span-4 xl:col-span-4 2xl:col-span-3
        sm:w-auto
        bg-[#FFFDF9]
        rounded-[32px]
        shadow-sm
        border
        border-[#F4E6D7]
        overflow-hidden
        flex flex-col
        ${showCartMobile ? "translate-x-0" : "max-sm:translate-x-full"}`}
      >
        {/* Orange Header */}
        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-[#FF8A3D] to-[#FF6B00] text-white">
          <div className="absolute top-4 right-2 w-12 h-12 rounded-full bg-white/15 pointer-events-none" />
          <div className="absolute top-16 right-6 w-10 h-10 rounded-full bg-white/15 pointer-events-none" />
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-white/90">
              ACTIVE BILL
            </div>
            <div className="font-display text-lg font-extrabold mt-0.5">
              {cart.length} {cart.length === 1 ? "Line in Order" : "Lines in Order"}
            </div>
          </div>
          <div className="mt-3">
            <div className="bg-white/10 text-white/90 rounded-xl px-3 h-9 flex items-center text-xs select-none">
              <span>Token No: <span className="font-extrabold text-white ml-1">#{currentToken}</span></span>
            </div>
          </div>
        </div>

        {/* Tabs: CART LIST & RECEIPT PREVIEW */}
        <div className="flex border-b border-[#F4E6D7] bg-white">
          <button
            onClick={() => setActiveTab("cart")}
            className={`flex-1 py-3 text-xs font-extrabold tracking-wider border-b-2 text-center transition-all select-none ${activeTab === "cart"
              ? "border-[#FF6B00] text-[#FF6B00] bg-[#FFFBF7]"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            CART LIST
          </button>
          <button
            onClick={() => setActiveTab("receipt")}
            className={`flex-1 py-3 text-xs font-extrabold tracking-wider border-b-2 text-center transition-all select-none ${activeTab === "receipt"
              ? "border-[#FF6B00] text-[#FF6B00] bg-[#FFFBF7]"
              : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
          >
            RECEIPT PREVIEW
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "cart" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 cart-items">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto min-h-[220px]">
                <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF6B00] shadow-2xs">
                  <ShoppingCart className="w-8 h-8 stroke-[1.75]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-extrabold text-slate-800">
                    Your Cart is Empty
                  </h3>
                  <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
                    Click '+' on any Dining or Parcel food card to add items to bill.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((line) => (
                <CartLine
                  key={line._key || line.id}
                  line={line}
                  onInc={() => updateQty(line._key || line.id, 1)}
                  onDec={() => updateQty(line._key || line.id, -1)}
                  onRemove={() => removeLine(line._key || line.id)}
                  onEditThali={(thaliLine) => setThaliFor(thaliLine)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            <ReceiptPreview
              cart={cart}
              totals={{ subtotal, cgst, sgst, tax: gst, total, discount }}
              settings={settings}
              customerName={customerName}
              notes={orderDescription}
              tokenNo={currentToken}
              menu={menuItems}
              menuMode={menuMode}
            />
          </div>
        )}

        {/* Pricing Summary & Checkout Buttons */}
        <div className="p-3.5 border-t border-[#F5EFE6] bg-[#FFFDF9] space-y-2.5">
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-700">Discount</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-slate-400 text-xs">₹</span>
                <Input
                  type="number"
                  min="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 h-7 text-right font-mono text-xs bg-white border-[#F4E6D7] rounded-lg focus:border-[#FF6B00]"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-base font-extrabold text-slate-900 pt-2 border-t border-dashed border-slate-200">
              <span>Total</span>
              <span className="font-mono text-xl font-black text-[#FF6B00]">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Client Requested 5 Action Buttons: [ Pending Order ] [ Cancel ] [ Save ] [ Save & Print ] [ Add Desc ] */}
          <div className="space-y-1.5 pt-1" data-testid="pos-action-button-group">
            {/* Top row: 3 compact buttons */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* 1. Pending Order */}
              <button
                type="button"
                data-testid="btn-pending-order"
                onClick={handlePendingOrder}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all border select-none active:scale-95 shadow-2xs ${
                  totalPendingCount > 0
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-white text-slate-700 border-[#E5D7C5] hover:bg-[#FFF8F2] hover:text-[#FF6B00] hover:border-orange-300"
                }`}
                title={totalPendingCount > 0 ? `${totalPendingCount} pending orders available` : "Put order into pending status or retrieve pending orders"}
              >
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span className="truncate">
                  Pending Order{totalPendingCount > 0 ? ` (${totalPendingCount})` : ""}
                </span>
              </button>

              {/* 2. Cancel */}
              <button
                type="button"
                data-testid="btn-cancel-order"
                onClick={handleCancelClick}
                className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all border select-none active:scale-95 shadow-2xs bg-white text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                title="Cancel current active order"
              >
                <XCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span className="truncate">Cancel</span>
              </button>

              {/* 5. Add Desc */}
              <button
                type="button"
                data-testid="btn-add-desc"
                onClick={() => {
                  setTempDescription(orderDescription);
                  setShowDescModal(true);
                }}
                className={`flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all border select-none active:scale-95 shadow-2xs ${
                  orderDescription.trim()
                    ? "bg-orange-50 text-[#FF6B00] border-orange-300 ring-1 ring-orange-400/40"
                    : "bg-white text-slate-700 border-[#E5D7C5] hover:bg-[#FFF8F2] hover:text-[#FF6B00] hover:border-orange-300"
                }`}
                title={orderDescription ? `Note: ${orderDescription}` : "Add description or notes to this order"}
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-[#FF6B00]" />
                <span className="truncate">
                  {orderDescription.trim() ? "Desc (Set)" : "Add Desc"}
                </span>
              </button>
            </div>

            {/* Bottom row: Save & Save & Print */}
            <div className="grid grid-cols-2 gap-1.5">
              {/* 3. Save */}
              <button
                type="button"
                data-testid="btn-save-order"
                onClick={handleSaveOrder}
                disabled={isSaving}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all border select-none active:scale-95 shadow-2xs ${
                  isSaving
                    ? "opacity-60 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                    : "bg-white text-slate-700 border-[#E5D7C5] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300"
                }`}
                title="Save order to Order History without printing"
              >
                <Save className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>

              {/* 4. Save & Print */}
              <button
                type="button"
                data-testid="btn-save-and-print"
                onClick={handleSaveAndPrint}
                disabled={isSaving}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-extrabold tracking-wider transition-all select-none active:scale-95 shadow-md shadow-orange-500/25 ${
                  isSaving
                    ? "opacity-60 cursor-not-allowed bg-slate-400 text-white"
                    : "bg-gradient-to-r from-[#FF8A3D] to-[#FF6B00] text-white hover:brightness-105"
                }`}
                title="Save order and print receipt"
              >
                <Printer className="w-3.5 h-3.5 shrink-0 text-white" />
                <span>{isSaving ? "Printing..." : "Save & Print"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thali Builder Modal */}
      {thaliFor && (
        <ThaliBuilder
          thaliItem={thaliFor}
          menu={menu}
          categories={categories}
          onClose={() => setThaliFor(null)}
          onAdd={handleAddThaliOrder}
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Active Order"
        message="Are you sure you want to cancel the current order? This will discard all items in the cart."
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep Order"
        variant="destructive"
      />

      {/* Add Description / Notes Modal */}
      <Dialog open={showDescModal} onOpenChange={setShowDescModal}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6 border border-[#F4E6D7] shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6B00] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">Order Description &amp; Notes</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Add instructions, customer requests, or table remarks.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Suggestions</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Less Spicy",
                  "Jain / No Onion Garlic",
                  "Extra Roti",
                  "Parcel Packed",
                  "Urgent / Fast",
                  "Table Window"
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setTempDescription(prev => prev ? `${prev}, ${chip}` : chip);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-[#FF6B00] hover:border-orange-200 border border-slate-200/80 transition-all font-medium active:scale-95"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Textarea */}
            <div>
              <textarea
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                placeholder="Type order description or special notes here..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-slate-50 border border-[#E5D7C5] focus:bg-white focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] outline-none resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setTempDescription("")}
              className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowDescModal(false)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderDescription(tempDescription);
                  if (activeTableId) {
                    updateTableSlot(activeTableId, { description: tempDescription });
                  }
                  setShowDescModal(false);
                  toast.success(tempDescription.trim() ? "Order description updated" : "Description cleared");
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#FF6B00] text-white hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20"
              >
                Save Note
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Orders Retrieval Modal */}
      <Dialog open={showPendingModal} onOpenChange={setShowPendingModal}>
        <DialogContent className="max-w-lg bg-white rounded-2xl p-6 border border-[#F4E6D7] shadow-xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Pending Orders ({allPendingList.length})
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Select an order to resume billing or complete payment.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
            {allPendingList.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                No orders are currently pending.
              </div>
            ) : (
              allPendingList.map((p) => {
                const subtotalAmt = p.cart.reduce((sum, item) => sum + (item.price * (item.qty || item.quantity || 1)), 0);
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-[#FFFBF7] transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">{p.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                          Pending
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {p.cart.map(i => `${i.qty || 1}x ${i.name}`).join(", ")}
                      </p>
                      {p.description && (
                        <p className="text-[11px] text-[#FF6B00] italic truncate">
                          Note: {p.description}
                        </p>
                      )}
                      <div className="text-xs font-extrabold text-slate-900">
                        ₹{(p.total || subtotalAmt).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResumePendingOrder(p)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF6B00] text-white hover:bg-orange-600 transition-all shadow-xs"
                      >
                        Resume
                      </button>
                      {p.type === "parcel" && (
                        <button
                          type="button"
                          onClick={() => removePendingOrder(p.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete pending order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowPendingModal(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function handleAddThaliOrder(orderItemPayload) {
    addLine(orderItemPayload);
    toast.success(`Added ${orderItemPayload.name} to bill`, { icon: "🍽️" });
    setThaliFor(null);
  }
}
