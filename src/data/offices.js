export const OFFICE_SLOTS = Object.freeze([
  { id: "taiwei", name: "太尉", level: 5, keyOffice: true, initial: "neutral" },
  { id: "situ", name: "司徒", level: 5, keyOffice: true, initial: "vacant" },
  { id: "shangshuling", name: "尚書令", level: 4, keyOffice: true, initial: "neutral" },
  { id: "zuopuye", name: "左僕射", level: 3, keyOffice: true, initial: "vacant" },
  { id: "youpushe", name: "右僕射", level: 3, keyOffice: true, initial: "vacant" },
  { id: "libushangshu", name: "吏部尚書", level: 2, keyOffice: false, initial: "neutral" },
  { id: "liecaoshangshu-1", name: "列曹尚書", level: 2, keyOffice: false, initial: "vacant" },
  { id: "liecaoshangshu-2", name: "列曹尚書", level: 2, keyOffice: false, initial: "neutral" },
  { id: "jizhou-cishi", name: "冀州刺史", level: 2, keyOffice: false, initial: "vacant" },
  { id: "yongzhou-cishi", name: "雍州刺史", level: 2, keyOffice: false, initial: "neutral" },
  { id: "court-entry-1", name: "朝官", level: 1, keyOffice: false, initial: "vacant" },
  { id: "court-entry-2", name: "朝官", level: 1, keyOffice: false, initial: "vacant" },
]);

export function createOfficeBoard() {
  return OFFICE_SLOTS.map((office) => ({
    ...office,
    holder:
      office.initial === "neutral"
        ? { type: "neutral" }
        : null,
  }));
}
