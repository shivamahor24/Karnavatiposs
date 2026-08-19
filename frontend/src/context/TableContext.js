/**
 * TableContext.js
 * Manages per-table independent cart state.
 * Each table slot keeps: cart items, customerName, discount, tokenNo, status.
 * Status: "empty" | "occupied" | "pending"
 * Follows the same Context pattern as AuthContext.js.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "pos_table_orders";
const PENDING_STORAGE_KEY = "pos_pending_orders";

function makeEmptySlot() {
  return {
    cart: [],
    customerName: "",
    discount: 0,
    description: "",
    tokenNo: null,
    status: "empty",
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(tableOrders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tableOrders));
  } catch {}
}

function loadPendingFromStorage() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePendingToStorage(pending) {
  try {
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pending));
  } catch {}
}

const TableContext = createContext(null);

export function TableProvider({ children, tableCount = 5 }) {
  const [tableOrders, setTableOrders] = useState(() => loadFromStorage());
  const [pendingOrders, setPendingOrders] = useState(() => loadPendingFromStorage());
  const [activeTableId, setActiveTableIdState] = useState(null);

  useEffect(() => {
    saveToStorage(tableOrders);
  }, [tableOrders]);

  useEffect(() => {
    savePendingToStorage(pendingOrders);
  }, [pendingOrders]);

  const getSlot = useCallback((tableId) => {
    return tableOrders[tableId] || makeEmptySlot();
  }, [tableOrders]);

  const setActiveTable = useCallback((tableId) => {
    setActiveTableIdState(tableId);
  }, []);

  const setTableCart = useCallback((tableId, cart) => {
    setTableOrders(prev => {
      const slot = prev[tableId] || makeEmptySlot();
      const status = cart.length === 0 ? "empty" : (slot.status === "pending" ? "pending" : "occupied");
      return { ...prev, [tableId]: { ...slot, cart, status } };
    });
  }, []);

  const updateTableSlot = useCallback((tableId, patch) => {
    setTableOrders(prev => {
      const slot = prev[tableId] || makeEmptySlot();
      return { ...prev, [tableId]: { ...slot, ...patch } };
    });
  }, []);

  const holdTable = useCallback((tableId) => {
    setTableOrders(prev => {
      const slot = prev[tableId] || makeEmptySlot();
      if (slot.cart.length === 0) return prev;
      return { ...prev, [tableId]: { ...slot, status: "pending" } };
    });
    setActiveTableIdState(null);
  }, []);

  const resumeTable = useCallback((tableId) => {
    setActiveTableIdState(tableId);
    setTableOrders(prev => {
      const slot = prev[tableId] || makeEmptySlot();
      return { ...prev, [tableId]: { ...slot, status: slot.cart.length > 0 ? "occupied" : "empty" } };
    });
  }, []);

  const clearTable = useCallback((tableId) => {
    setTableOrders(prev => ({ ...prev, [tableId]: makeEmptySlot() }));
    if (activeTableId === tableId) setActiveTableIdState(null);
  }, [activeTableId]);

  // Standalone / Parcel Pending Orders
  const addPendingOrder = useCallback((order) => {
    const id = order.id || `pending-${Date.now()}`;
    const entry = {
      ...order,
      id,
      createdAt: order.createdAt || new Date().toISOString(),
    };
    setPendingOrders(prev => [entry, ...prev]);
    return entry;
  }, []);

  const removePendingOrder = useCallback((id) => {
    setPendingOrders(prev => prev.filter(p => p.id !== id));
  }, []);

  const tableStatuses = React.useMemo(() => {
    const result = {};
    for (let i = 1; i <= tableCount; i++) {
      const id = String(i);
      const slot = tableOrders[id] || makeEmptySlot();
      result[id] = {
        status: slot.status,
        itemCount: slot.cart.reduce((s, item) => s + (item.qty || item.quantity || 0), 0),
        cart: slot.cart,
      };
    }
    return result;
  }, [tableOrders, tableCount]);

  const activeSlot = activeTableId ? (tableOrders[activeTableId] || makeEmptySlot()) : null;

  return (
    <TableContext.Provider value={{
      tableCount,
      tableOrders,
      pendingOrders,
      activeTableId,
      activeSlot,
      tableStatuses,
      getSlot,
      setActiveTable,
      setTableCart,
      updateTableSlot,
      holdTable,
      resumeTable,
      clearTable,
      addPendingOrder,
      removePendingOrder,
    }}>
      {children}
    </TableContext.Provider>
  );
}

const defaultFallback = {
  tableCount: 5,
  tableOrders: {},
  pendingOrders: [],
  activeTableId: null,
  activeSlot: makeEmptySlot(),
  tableStatuses: {},
  getSlot: () => makeEmptySlot(),
  setActiveTable: () => {},
  setTableCart: () => {},
  updateTableSlot: () => {},
  holdTable: () => {},
  resumeTable: () => {},
  clearTable: () => {},
  addPendingOrder: () => {},
  removePendingOrder: () => {},
};

export function useTable() {
  const ctx = useContext(TableContext);
  if (!ctx) return defaultFallback;
  return ctx;
}
