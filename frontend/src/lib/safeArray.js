// safeArray.js
// Ensures any value is always a safe array. Prevents .map/.filter crashes.
export const safeArray = (val) => (Array.isArray(val) ? val : []);
export const safeObject = (val) => (val && typeof val === "object" && !Array.isArray(val) ? val : {});
