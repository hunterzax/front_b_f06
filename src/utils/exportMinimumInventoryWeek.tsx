// exportMinInventoryWeekly.ts
import XLSX from 'xlsx-js-style';

// ฟังชั่นนี้ถ้าข้อมูลมาเป็น null หรือ undefined ไม่ต้องแทน 0 ให้ว่างไปเลย ตรง total ก็รวมเท่าที่มีพอ
type Weekly = {
    nomination_code: string;
    gas_day: string;            // "DD/MM/YYYY"
    group: string;              // Shipper Name
    contract_code: string;      // Contract Code
    minInven: number | null | undefined;
    exchangeMinInven: number | null | undefined;
    data: any
};

type ZoneBlock = {
    zone: string;
    zoneObj?: { id: number; name: string; color?: string };
    groupedByWeekly: Weekly[];
};

const ddmmyyyyToDate = (s: string) => {
    const [d, m, y] = s.split('/').map(Number);
    return new Date(y, m - 1, d);
};

const weekday = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long' }); // Sunday, Monday, ...

// สไตล์พื้นฐาน
const borderAll = {
    top: { style: 'thin', color: { rgb: 'FFFFFF' } },
    left: { style: 'thin', color: { rgb: 'FFFFFF' } },
    right: { style: 'thin', color: { rgb: 'FFFFFF' } },
    bottom: { style: 'thin', color: { rgb: 'FFFFFF' } },
};

const thTopStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: '2B6886' } },
};

const thTotalStyle = {
    font: { bold: true, color: { rgb: '58585A' } },
    alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: 'D2F2FF' } },
    border: borderAll,
};

const thDateStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: '2B6886' } },
};
const thSubStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    fill: { fgColor: { rgb: '00ADEF' } },
};
const tdStyle = {
    alignment: { horizontal: 'right', vertical: 'center' },
    border: borderAll,
    numFmt: '#,##0.000', // ทศนิยมสามตำแหน่ง
};
const tdLeft = {
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderAll,
};
const tdRight = tdStyle;

const toNum = (v: any): number | undefined => {
    if (v == null || v === '') return undefined;
    if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;

    const n = parseFloat(String(v).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : undefined;
};

// ---- main exporter ----
export function exportMinInventoryWeekly(
    data: ZoneBlock[],
    fileName = 'Minimum_Inventory_Summary.xlsx'
) {

    // 1) unique+sort date keys
    const dateSet = new Set<string>();
    (data || []).forEach(z => (z?.groupedByWeekly || []).forEach(g => { if (g?.gas_day) dateSet.add(g.gas_day); }));
    const dateKeys = Array.from(dateSet).sort(
        (a, b) => +ddmmyyyyToDate(a) - +ddmmyyyyToDate(b)
    );

    // 2) shape rows -> one row per (shipper, contract, zone)
    type Row = {
        shipper: string;
        contract: string;
        zone: string;
        byDate: Record<string, { min?: number; ex?: number; total?: number }>;
    };

    const rows: Row[] = [];
    for (const z of (data || [])) {
        const map: any = new Map<string, Row>();
        for (const rec of (z?.groupedByWeekly || [])) {
            const key = `${rec?.group}|${rec?.contract_code}`;
            if (!map.has(key)) {
                map.set(key, {
                    shipper: rec?.group,
                    contract: rec?.contract_code,
                    zone: z?.zone,
                    byDate: {},
                });
            }
            const r = map.get(key)!;

            const minVal = toNum(rec?.data?.[0]?.value);
            const exVal = toNum(rec?.data?.[1]?.value);

            let totalVal: number | undefined;
            if (minVal != null || exVal != null) {
                totalVal = (minVal ?? 0) + (exVal ?? 0);
            }

            if (rec?.gas_day) {
                r.byDate[rec?.gas_day] = { min: minVal, ex: exVal, total: totalVal };
            }

        }
        rows.push(...map.values());
    }

    // 3) create sheet
    const ws: XLSX.WorkSheet = {};
    let R = 0;
    const set = (r: number, c: number, v: any, s?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        ws[addr] = { v, t: typeof v === 'number' ? 'n' : 's', s };
    };
    const setNumOrBlank = (r: number, c: number, v?: number) => {
        if (typeof v === 'number') set(r, c, v, tdStyle);
        else set(r, c, '', tdStyle);
    };

    const fixedHeaders = ['Shipper Name', 'Contract Code', 'Zone'];
    const fixedCols = fixedHeaders.length;

    // คอลัมน์สำหรับช่วงวัน
    const firstDateCol = fixedCols;
    const lastDateCol = fixedCols + dateKeys.length * 3 - 1;
    // คอลัมน์ “Total” รวมทั้งสัปดาห์
    const totalCol = lastDateCol + 1;

    // 3.1 top header row
    for (let i = 0; i < fixedCols; i++) set(R, i, fixedHeaders[i], thTopStyle);
    set(R, firstDateCol, 'Minimum Inventory Summary (MMBTU)', thTopStyle);
    set(R, totalCol, 'Total', thTopStyle);

    if (!ws['!merges']) ws['!merges'] = [];
    // merge fixed left headers (3 แถว)
    for (let i = 0; i < fixedCols; i++) {
        ws['!merges'].push({ s: { r: 0, c: i }, e: { r: 2, c: i } });
    }
    // merge block ของวัน
    ws['!merges'].push({ s: { r: 0, c: firstDateCol }, e: { r: 0, c: lastDateCol } });
    // merge “Total” คอลัมน์รวมสัปดาห์ ลงมา 3 แถวหัว
    ws['!merges'].push({ s: { r: 0, c: totalCol }, e: { r: 2, c: totalCol } });

    // 3.2 date header row
    R += 1;
    for (let i = 0; i < fixedCols; i++) set(R, i, '', thTopStyle);
    dateKeys.forEach((d, idx) => {
        const col = fixedCols + idx * 3;
        const dObj = ddmmyyyyToDate(d);
        set(R, col, `${weekday(dObj)}\n${d}`, thDateStyle);
        ws['!merges']!.push({ s: { r: R, c: col }, e: { r: R, c: col + 2 } });
    });
    // totalCol แถวนี้ไม่ต้องเซ็ต เพราะ merge ไว้แล้ว

    // 3.3 sub headers row (min/ex/total)
    R += 1;
    for (let i = 0; i < fixedCols; i++) set(R, i, '', thTopStyle);
    dateKeys.forEach((_, idx) => {
        const base = fixedCols + idx * 3;
        set(R, base + 0, 'Change Min Inventory', thSubStyle);
        set(R, base + 1, 'Exchange Min Inventory', thSubStyle);
        set(R, base + 2, 'Total', thSubStyle);
    });
    // totalCol แถวนี้ก็เว้น (merge แล้ว)

    // 4) data rows
    const dataStartRow = R + 1;
    R = dataStartRow;

    rows.forEach(row => {
        set(R, 0, row.shipper, tdLeft);
        set(R, 1, row.contract, tdLeft);
        set(R, 2, row.zone, tdLeft);

        let rowGrandTotal = 0;
        dateKeys.forEach((d, idx) => {
            const base = fixedCols + idx * 3;
            const cell = row.byDate[d] ?? {};
            setNumOrBlank(R, base + 0, cell.min);
            setNumOrBlank(R, base + 1, cell.ex);
            setNumOrBlank(R, base + 2, cell.total);
            if (typeof cell.total === 'number') rowGrandTotal += cell.total;
        });

        set(R, totalCol, rowGrandTotal, { ...tdRight, numFmt: '#,##0.000' });
        R++;
    });

    // 5) TOTAL row (summary)
    const totalRow = R;
    set(totalRow, 0, 'TOTAL', { ...thTotalStyle, alignment: { horizontal: 'left', vertical: 'center' } });
    set(totalRow, 1, '', thTotalStyle);
    set(totalRow, 2, '', thTotalStyle);

    let grandOfGrand = 0;
    dateKeys.forEach((d, idx) => {
        const base = fixedCols + idx * 3;
        let sumMin = 0, sumEx = 0, sumTotal = 0;
        rows.forEach(r => {
            const cell = r.byDate[d];
            if (!cell) return;
            if (typeof cell.min === 'number') sumMin += cell.min;
            if (typeof cell.ex === 'number') sumEx += cell.ex;
            if (typeof cell.total === 'number') sumTotal += cell.total;
        });
        set(totalRow, base + 0, sumMin, { ...thTotalStyle, numFmt: '#,##0.000' });
        set(totalRow, base + 1, sumEx, { ...thTotalStyle, numFmt: '#,##0.000' });
        set(totalRow, base + 2, sumTotal, { ...thTotalStyle, numFmt: '#,##0.000' });
        grandOfGrand += sumTotal;
    });

    set(totalRow, totalCol, grandOfGrand, { ...thTotalStyle, numFmt: '#,##0.000' });

    // 6) column widths
    const colWidths: any[] = [{ wch: 16 }, { wch: 15 }, { wch: 10 }];
    dateKeys.forEach(() => {
        colWidths.push({ wch: 13 }, { wch: 16 }, { wch: 10 }); // Min / Exchange / Total
    });
    colWidths.push({ wch: 12 }); // weekly Total (ฝั่งขวาสุด)
    ws['!cols'] = colWidths;

    // 7) sheet range
    const maxRow = totalRow;
    const maxCol = totalCol;
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });

    // 8) write file
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Weekly Summary');
    XLSX.writeFile(wb, fileName);
}
