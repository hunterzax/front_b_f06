import { useEffect } from "react";
import React, { useState } from 'react';
import TableSkeleton from '@/components/material_custom/DefaultSkeleton';
import { formatNumberFourDecimal, formatNumberThreeDecimal, formatNumberThreeDecimalNoComma, getContrastTextColor, validateWeekdaysByPoint } from '@/utils/generalFormatter';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { table_col_arrow_sort_style, table_header_style, table_row_style, table_sort_header_style } from "@/utils/styles";
import { handleSort } from "@/utils/sortTable";
import NodataTable from "@/components/other/nodataTable";
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import ModeEditOutlinedIcon from '@mui/icons-material/ModeEditOutlined';
import { NumericFormat } from "react-number-format";
import { Tune } from "@mui/icons-material"
import ColumnVisibilityPopover from "@/components/other/popOverShowHideCol";
import { Tab, Tabs } from "@mui/material";
import PaginationComponent from "@/components/other/globalPagination";
import { parseToNumber } from "@/utils/number";

const TableEachZone: React.FC<any> = ({ type, tableData, tableHeader, isLoading, userPermission, zoneText, nomVersionData, tempData, setTempData, tempDataAll, setTempDataAll, tempDataConcept, setTempDataConcept, areaMaster, entryExitMaster, setIsEdited, tabEntry, isAfterGasDay, readOnly, isDisableAction, dataNomCode, disableColumnAt, dataConceptPoint }) => {

    const [sortedData, setSortedData] = useState<any>([]);
    const [paginationData, setPaginationData] = useState<any[]>([]);
    const [tempDataOriginal, setTempDataOriginal] = useState<any>([]); // เอาไว้ set ตอน cancel
    const [tempDataOriginalConcept, setTempDataOriginalConcept] = useState<any>([]); // เอาไว้ set ตอน cancel
    const [tabMain, setTabMain] = useState(0);
    const [check, setCheck] = useState(false); // filter over val


    const inputClass = "text-[14px] block p-2 h-[37px] w-full border-[1px] bg-white border-[#9CA3AF] outline-none bg-opacity-100 focus:border-[#00ADEF] hover:!p-2 focus:!p-2";

    const [sortState, setSortState] = useState({ column: null, direction: null });

    // ===================== TABLE HEADER MAP =====================
    const dayMapping = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const startKey = 14;
    const endKey = 20;

    useEffect(() => {

        // ---------------- DATA TAB ENTRY / EXIT
        const hua_jai_bok_hai_long = validateWeekdaysByPoint(tabEntry || []);
        
        setTempData(hua_jai_bok_hai_long);
        setSortedData([...hua_jai_bok_hai_long]);

        // เก็บข้อมูลไม่ให้เปลี่ยนตามต้นฉบับ
        const masterData = JSON.parse(JSON.stringify(hua_jai_bok_hai_long));
        setTempDataOriginal(masterData);  // เก็บเป็น master (ห้ามเปลี่ยน)

        // ---------------- DATA TAB CONCEPT POINT
        const filteredDataConcept = (Array.isArray(tableData) ? tableData : []).filter(
            (item: any) => item && item?.zone_text === zoneText && item?.query_shipper_nomination_type_id !== 1
        );

        const withConceptPoint = filteredDataConcept.map((row: any) => {
            if (!row) return row;
            const t3 = typeof row?.data_temp2?.["3"] === 'string' ? row.data_temp2["3"].trim() : (row?.data_temp2?.["3"] ? String(row.data_temp2["3"]).trim() : '');
            const t4 = typeof row?.data_temp2?.["4"] === 'string' ? row.data_temp2["4"].trim() : (row?.data_temp2?.["4"] ? String(row.data_temp2["4"]).trim() : '');
            const t5 = typeof row?.data_temp2?.["5"] === 'string' ? row.data_temp2["5"].trim() : (row?.data_temp2?.["5"] ? String(row.data_temp2["5"]).trim() : '');

            const concept = t3 || t4 || t5 || null;

            return { ...row, concept_point_text: concept };
        });
        setTempDataConcept(withConceptPoint);

        // เก็บข้อมูลไม่ให้เปลี่ยนตามต้นฉบับ
        const masterDataTabConcept = JSON.parse(JSON.stringify(filteredDataConcept || []));
        setTempDataOriginalConcept(masterDataTabConcept);  // เก็บเป็น master (ห้ามเปลี่ยน)

    }, [tableData, zoneText]);

    const getArrowIcon = (column: string) => {
        return <div className={`${table_col_arrow_sort_style}`}>
            <ArrowDropUpIcon sx={{ fontSize: 18, opacity: sortState.column === column && sortState.direction === "asc" ? 1 : 0.4, }} />
            <ArrowDropDownIcon sx={{ fontSize: 18, opacity: sortState.column === column && sortState.direction === "desc" ? 1 : 0.4, }} />
        </div>
    };

    // ===================== EDIT BTN =====================
    const [isEditing, setIsEditing] = useState(false); // ถ้ากด edit isEditing จะเป็น true
    const [isEditedInRow, setIsEditedInRow] = useState(false); // ถ้าแก้ไขข้อมูลใน row จะเป็น true
    const [rowEditing, setRowEditing] = useState<any>(); // เก็บ id ของ record ที่ edit

    const handleEditClick = (rowId: any) => {
        if (!rowEditing || rowId === rowEditing) {
            setIsEditing(!isEditing);
        }

        setRowEditing(rowId);
    };

    const handleSaveClick = async () => {
        if (tabMain === 0) {
            const hua_jai_bok_hai_long = validateWeekdaysByPoint([...(tempData || [])]);
            setSortedData(hua_jai_bok_hai_long);
        } else {
            setSortedData([...(tempDataConcept || [])]);
        }

        // ส่งค่าทั้งหมด ทั้ง entry/exit และ concept point รวมกัน
        const mergedData = [...(tempData || []), ...(tempDataConcept || [])];
        setTemp(mergedData);

        setIsEdited(true); // Nom Code Detail > ปุ่ม submit จะ active ต่อเมื่อมีการ Edit ข้อมูลบางอย่าง https://app.clickup.com/t/86erwqc7q
        setIsEditing(false);
        setRowEditing(undefined);
    };

    const setTemp = (data: any) => {
        // ดักแค่เฉพาะ 3 tab EAST | WEST | EAST-WEST
        if (type === 'EAST' || type === 'WEST' || type === 'EAST-WEST') {
            const checked = (tempDataAll || []).find((item: any) => item?.type === type);
            if (!checked) {
                setTempDataAll((pre: any) => [...(pre || []), { type: type, items: data }]);
            } else {
                setTempDataAll((pre: any) => (pre || []).map((item: any) => item?.type === type ? { ...item, items: data } : item));
            }
        }
    };

    // #region handleCancelClick
    const handleCancelClick = () => {
        if (tabMain === 0) {
            setSortedData([...(tempDataOriginal || [])]); // เอาไว้ใช้ตอน cancel
        } else {
            setSortedData([...(tempDataOriginalConcept || [])]); // เอาไว้ใช้ตอน cancel
        }

        setIsEditing(!isEditing);
        setRowEditing(undefined);
    };

    // ############### COLUMN SHOW/HIDE ENTRY / EXIT ###############
    const initialColumnsTabEntryExit: any = [
        { key: 'supply_demand', label: 'Supply/Demand', visible: true },
        { key: 'area', label: 'Area', visible: true },
        { key: 'nomination_point', label: 'Nomination Point', visible: true },
        { key: 'unit', label: 'Unit', visible: true },
        { key: 'type', label: 'Type', visible: true },
        { key: 'entry_exit', label: 'Entry/Exit', visible: true },
        { key: 'wi', label: 'WI', visible: true },
        { key: 'hv', label: 'HV', visible: true },
        { key: 'sg', label: 'SG', visible: true },
        { key: 'sunday', label: 'Sunday', visible: true },
        { key: 'monday', label: 'Monday', visible: true },
        { key: 'tuesday', label: 'Tuesday', visible: true },
        { key: 'wednesday', label: 'Wednesday', visible: true },
        { key: 'thursday', label: 'Thursday', visible: true },
        { key: 'friday', label: 'Friday', visible: true },
        { key: 'saturday', label: 'Saturday', visible: true },
        { key: 'edit', label: 'Edit', visible: true },
    ];

    const initialColumnsTabConceptPoint: any = [
        { key: 'supply_demand', label: 'Supply/Demand', visible: true },
        { key: 'concept_id', label: 'Concept ID', visible: true },
        { key: 'unit', label: 'Unit', visible: true },
        { key: 'entry_exit', label: 'Entry/Exit', visible: true },
        { key: 'wi', label: 'WI', visible: true },
        { key: 'hv', label: 'HV', visible: true },
        { key: 'sg', label: 'SG', visible: true },
        { key: 'sunday', label: 'Sunday', visible: true },
        { key: 'monday', label: 'Monday', visible: true },
        { key: 'tuesday', label: 'Tuesday', visible: true },
        { key: 'wednesday', label: 'Wednesday', visible: true },
        { key: 'thursday', label: 'Thursday', visible: true },
        { key: 'friday', label: 'Friday', visible: true },
        { key: 'saturday', label: 'Saturday', visible: true },
        { key: 'edit', label: 'Edit', visible: true },
    ];

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const getInitialColumns = () => tabMain === 0 ? initialColumnsTabEntryExit : initialColumnsTabConceptPoint;

    const [columnVisibility, setColumnVisibility] = useState<any>(
        Object.fromEntries(getInitialColumns().map((column: any) => [column?.key, column?.visible]))
    );

    const handleTogglePopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const handleColumnToggle = (columnKey: string) => {
        setColumnVisibility((prev: any) => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    useEffect(() => {
        setColumnVisibility(
            Object.fromEntries(getInitialColumns().map((column: any) => [column?.key, column?.visible]))
        );

        if (tabMain == 0) {
            setSortedData(tempData)
        } else {
            setSortedData(tempDataConcept)
        }
    }, [tabMain]);

    // ############### SET DATA ###############
    const dayKeyMap: Record<number, string> = {
        14: "Sunday",
        15: "Monday",
        16: "Tuesday",
        17: "Wednesday",
        18: "Thursday",
        19: "Friday",
        20: "Saturday",
    };

    const setTempDataByTab = (currentTab: number, oldIndex: number, value: string, updateKey: any) => {
        const targetList = currentTab === 0 ? (tempData || []) : (tempDataConcept || []);
        const updateKeyNum = parseInt(updateKey);
        const dayField = dayKeyMap[updateKeyNum];

        targetList.forEach((item: any) => {
            if (item == null) return;
            if (item.old_index === oldIndex) {
                if (item.data_temp2) {
                    item.data_temp2[updateKey] = value;
                }
                if (dayField) {
                    item[dayField] = value;
                }
            }
        });

        setIsEditedInRow(true);
    };

    // ############### PAGINATION ###############
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        setItemsPerPage(itemsPerPage);
        setCurrentPage(1);
    };

    const handleChangeTabMain = (event: any, newValue: any) => {
        setTabMain(newValue);
    };

    useEffect(() => {
        if (check) {
            const res_x = filterSortDataOverVal(sortedData);
            setSortedData(res_x);
        } else {
            if (tabMain === 0) {
                setSortedData([...(tempData || [])]);
                setIsEditing(false);
            } else {
                setSortedData([...(tempDataConcept || [])]);
                setIsEditing(false);
            }
        }
    }, [check]);

    // Nom Detail ต้องการเพิ่ม Filter or Checkbox สำหรับกรองเฉพาะรายการสีแดง https://app.clickup.com/t/86etzcgte
    const filterSortDataOverVal = (sort_data: any) => {
        return (sort_data || []).filter((row: any) => {
            if (!row) return false;
            const dt = row.data_temp2;
            const no = row.newObj;

            // 1. WI: เช็คว่าค่าอยู่นอกช่วง min-max
            const wi = parseFloat(dt?.["11"]);
            const wiMin = parseFloat(no?.["11"]?.min);
            const wiMax = parseFloat(no?.["11"]?.max);
            const wiInvalid = Number.isFinite(wi) && Number.isFinite(wiMin) && Number.isFinite(wiMax) ? (wi < wiMin || wi > wiMax) : false;

            // 2. HV: เช็คว่าอยู่นอกช่วง min-max
            const hv = parseFloat(dt?.["12"]);
            const hvMin = parseFloat(no?.["12"]?.min);
            const hvMax = parseFloat(no?.["12"]?.max);
            const hvInvalid = Number.isFinite(hv) && Number.isFinite(hvMin) && Number.isFinite(hvMax) ? (hv < hvMin || hv > hvMax) : false;

            // 4-27: Sunday ถึง Saturday (index 14 ถึง 20)
            const hInvalid = Object.keys(dt || {})
                .filter((key) => {
                    const index = Number(key);
                    return Number.isInteger(index) && index >= 14 && index <= 37;
                })
                .some((key) => {
                    const val = Number(dt?.[key]);
                    const book = Number(no?.[key]?.valueBook);

                    // ถ้าอย่างใดอย่างหนึ่งไม่ใช่ตัวเลขที่ finite ให้ข้าม (ถือว่าไม่ invalid)
                    if (!Number.isFinite(val) || !Number.isFinite(book)) return false;

                    return val > book;
                });

            return wiInvalid || hvInvalid || hInvalid;
        });
    };

    const handleFilterOverVal = () => {
        setCheck(!check);
    };

    useEffect(() => {
        if (tabMain === 0) {
            setSortedData((tempData || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        } else {
            setSortedData((tempDataConcept || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
        }
    }, [tabMain, currentPage, itemsPerPage, zoneText, tempData, tempDataConcept]);


    const [dataCTvalidate, setDataCTvalidate] = useState<any[]>([]);

    useEffect(() => {
        const tableList = Array.isArray(tableData) ? tableData : [];
        const groupedMap = tableList.reduce((acc: any, item: any) => {
            if (!acc) acc = {};
            if (!item) return acc;
            const contractPoint = item?.contract_point_list?.[0]?.contract_point;
            if (!contractPoint) return acc;
            const key = `${contractPoint}|${item?.unit_text ?? ''}`;
            if (!acc[key]) {
                acc[key] = {
                    contractPoint,
                    unit: item?.unit_text,
                    data: []
                };
            }
            acc[key].data.push(item);
            return acc;
        }, {});

        const groupedBywarningLogHrWeeklyTemp: any = Object.values(groupedMap || {})
            .filter((f: any) => Boolean(f?.contractPoint))
            .map((d_: any) => {
                const dataList = Array.isArray(d_?.data) ? d_.data : [];
                return {
                    ...d_,
                    day: {
                        Sunday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Sunday ?? 0), 0),
                        Monday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Monday ?? 0), 0),
                        Thursday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Thursday ?? 0), 0),
                        Tuesday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Tuesday ?? 0), 0),
                        Wednesday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Wednesday ?? 0), 0),
                        Friday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Friday ?? 0), 0),
                        Saturday: dataList.reduce((accumulator: any, currentValue: any) => accumulator + parseToNumber(currentValue?.Saturday ?? 0), 0),
                    }
                };
            });
        setDataCTvalidate(groupedBywarningLogHrWeeklyTemp);
    }, [tableData]);

    useEffect(() => {
        setPaginationData((sortedData || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
    }, [sortedData])

    return (<div className="h-full">

        <div className={`relative h-[calc(100vh-180px)]  block rounded-t-md z-1 `}>

            <div className="pb-2 -ml-5">
                <Tabs
                    value={tabMain}
                    onChange={handleChangeTabMain}
                    aria-label="wrapped label tabs example"
                    sx={{
                        '& .Mui-selected': {
                            color: '#00ADEF !important',
                            fontWeight: 'bold !important',
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#00ADEF !important',
                            width: tabMain === 0 ? '90px !important' : '110px !important',
                            transform: tabMain === 0 ? 'translateX(30%)' : 'translateX(15%)',
                            bottom: '10px',
                        },
                        '& .MuiTab-root': {
                            minWidth: 'auto !important',
                        },
                    }}
                >
                    {['Entry/Exit', 'Concept Point'].map((label, index) => (
                        <Tab
                            key={label}
                            label={label}
                            id={`tab-${index}`}
                            sx={{
                                fontFamily: 'Tahoma !important',
                                textTransform: 'none',
                                padding: '8px 16px',
                                minWidth: '50px',
                                maxWidth: '140px',
                                flexShrink: 0,
                                color: tabMain === index ? '#58585A' : '#9CA3AF',
                            }}
                        />
                    ))}
                </Tabs>
            </div>

            <div className="flex items-center space-x-2 pb-4">
                <div onClick={handleTogglePopover}>
                    <Tune
                        className="cursor-pointer rounded-lg"
                        style={{ fontSize: "18px", color: '#2B2A87', borderRadius: '4px', width: '22px', height: '22px', border: '1px solid rgba(43, 42, 135, 0.4)' }}
                    />
                </div>

                <div className="flex gap-2 text-[#58585A] align-middle justify-center items-center">
                    <input
                        type="checkbox"
                        checked={check}
                        onChange={() => handleFilterOverVal()}
                        className="form-checkbox w-5 h-5 border rounded-[8px] accent-[#1473A1] focus:ring-[#1473A1] disabled:opacity-100 disabled:cursor-not-allowed "
                    />
                    {`Over Value`}
                </div>
            </div>

            {
                isLoading ?
                    <div className="h-[calc(100vh-290px)] overflow-y-auto">
                        <table className={`w-full text-sm text-left rtl:text-right text-gray-500 `}>
                            <thead className="text-xs text-[#ffffff] bg-[#1473A1] sticky top-0 z-10">
                                <tr className="h-20">

                                    {columnVisibility?.nomination_point && (
                                        <th scope="col" className={`sticky left-0 z-30 bg-[#1473A1] ${table_sort_header_style} min-w-[180px] `} onClick={() => handleSort("nomination_point_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`Nomination Point`}
                                            {getArrowIcon("nomination_point_text")}
                                        </th>
                                    )}

                                    {/* tabs concept point */}
                                    {columnVisibility?.concept_id && (
                                        <th scope="col"
                                            className={`sticky left-0 z-30 bg-[#1473A1] ${table_sort_header_style} min-w-[180px]`}
                                            onClick={() => handleSort("concept_point_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}
                                        >
                                            {`Concept ID`}
                                            {getArrowIcon("concept_point_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.unit && (
                                        <th scope="col" className={`sticky left-[180px] z-30 bg-[#1473A1] ${table_sort_header_style} min-w-[120px]`} onClick={() => handleSort("unit_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`Unit`}
                                            {getArrowIcon("unit_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.supply_demand && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px]`} onClick={() => handleSort("supply_demand_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`Supply/Demand`}
                                            {getArrowIcon("supply_demand_text")}
                                        </th>
                                    )}

                                    {/* tabs entry/exit */}
                                    {columnVisibility?.area && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px] text-center`} onClick={() => handleSort("area_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`Area`}
                                            {getArrowIcon("area_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.type && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px]`} onClick={() => handleSort("type_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`Type`}
                                            {getArrowIcon("type_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.entry_exit && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px]`} onClick={() => handleSort("entry_exit_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`Entry/Exit`}
                                            {getArrowIcon("entry_exit_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.wi && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px] text-center`} onClick={() => handleSort("wi_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`WI`}
                                            {getArrowIcon("wi_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.hv && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px] text-center`} onClick={() => handleSort("hv_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`HV`}
                                            {getArrowIcon("hv_text")}
                                        </th>
                                    )}

                                    {columnVisibility?.sg && (
                                        <th scope="col" className={`${table_sort_header_style} min-w-[120px] text-center`} onClick={() => handleSort("sg_text", sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}>
                                            {`SG`}
                                            {getArrowIcon("sg_text")}
                                        </th>
                                    )}

                                    {Object.entries(tableHeader[0].data_temp2.headData).filter(([key]) => parseInt(key) >= startKey && parseInt(key) <= endKey).map(([key, date]: any, index) => {
                                        const day = dayMapping[index] ?? '';
                                        const columnKey = day ? day.toLowerCase() : '';

                                        return (columnKey && columnVisibility?.[columnKey]) ? (
                                            <th
                                                key={key}
                                                scope="col"
                                                className={`${table_sort_header_style} min-w-[120px] text-center`}
                                                onClick={() => handleSort(day, sortState, setSortState, setSortedData, tabMain == 0 ? tempData : tempDataConcept)}
                                            >
                                                <div>{day}</div>
                                                <div>{date}</div>
                                                {getArrowIcon(day)}
                                            </th>
                                        ) : null;
                                    })
                                    }

                                    {columnVisibility?.edit && (
                                        <th scope="col" className={`${table_header_style} text-center`} >
                                            {`Edit`}
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    (paginationData || []).map((row: any, index: any) => {
                                        if (!row) return null;

                                        let isAllowNegativeForConceptPoint = false;
                                        if (tabMain === 1) {
                                            const conceptPointName = `${row?.concept_point_text ?? ''}`.trim().toUpperCase();
                                            isAllowNegativeForConceptPoint = (Array.isArray(dataConceptPoint) ? dataConceptPoint : []).some((item: any) => `${item?.concept_point ?? ''}`.trim().toUpperCase() === conceptPointName);
                                        }

                                        const wiValue = parseFloat(String(row?.data_temp2?.["11"] ?? "").replace(/,/g, ""));
                                        const wiMin = row?.newObj?.["11"]?.min;
                                        const wiMax = row?.newObj?.["11"]?.max;

                                        const shouldCheckWi = wiMin != null && wiMax != null;
                                        const isWiOutOfRange = shouldCheckWi && !isNaN(wiValue) && (wiValue < wiMin || wiValue > wiMax);

                                        const hvValue = parseFloat(String(row?.data_temp2?.["12"] ?? "").replace(/,/g, ""));
                                        const hvMin = row?.newObj?.["12"]?.min;
                                        const hvMax = row?.newObj?.["12"]?.max;

                                        const shouldCheckHv = hvMin != null && hvMax != null;
                                        const isHvOutOfRange = shouldCheckHv && !isNaN(hvValue) && (hvValue < hvMin || hvValue > hvMax);

                                        const filValiValue = (kt_: any): number => {
                                            const contractPoint = row?.contract_point_list?.[0]?.contract_point;
                                            const f_: any = (Array.isArray(dataCTvalidate) ? dataCTvalidate : []).find((f: any) => f?.contractPoint === contractPoint && f?.unit === row?.unit_text);
                                            
                                            return parseToNumber(f_?.day?.[kt_]) ?? Number.NaN;
                                        }

                                        const isOverSunday = tabMain !== 1 && Boolean(row?.newObj?.['14']?.valueBook) && (filValiValue("Sunday") > (parseToNumber(row?.newObj?.['14']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;
                                        const isOverMonday = tabMain !== 1 && Boolean(row?.newObj?.['15']?.valueBook) && (filValiValue("Monday") > (parseToNumber(row?.newObj?.['15']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;
                                        const isOverTuesday = tabMain !== 1 && Boolean(row?.newObj?.['16']?.valueBook) && (filValiValue("Tuesday") > (parseToNumber(row?.newObj?.['16']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;
                                        const isOverWednesday = tabMain !== 1 && Boolean(row?.newObj?.['17']?.valueBook) && (filValiValue("Wednesday") > (parseToNumber(row?.newObj?.['17']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;
                                        const isOverThursday = tabMain !== 1 && Boolean(row?.newObj?.['18']?.valueBook) && (filValiValue("Thursday") > (parseToNumber(row?.newObj?.['18']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;
                                        const isOverFriday = tabMain !== 1 && Boolean(row?.newObj?.['19']?.valueBook) && (filValiValue("Friday") > (parseToNumber(row?.newObj?.['19']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;
                                        const isOverSaturday = tabMain !== 1 && Boolean(row?.newObj?.['20']?.valueBook) && (filValiValue("Saturday") > (parseToNumber(row?.newObj?.['20']?.valueBook) || 0)) && !row?.reserve_balancing_gas_contract_id;

                                        return (
                                            <tr
                                                key={row?.id}
                                                className={`${table_row_style}`}
                                            >

                                                {columnVisibility?.nomination_point && (
                                                    <td className="sticky left-0  min-w-[180px] bg-[#ffffff] px-2 py-1 text-[#464255]">{row?.data_temp2?.["3"] ?? ''}</td>
                                                )}

                                                {columnVisibility?.concept_id && (
                                                    <td className="sticky left-0  min-w-[180px] bg-[#ffffff] px-2 py-1 text-[#464255]">
                                                        {row?.concept_point_text ?? ''}
                                                    </td>
                                                )}

                                                {columnVisibility?.unit && (
                                                    <td className="sticky left-[180px] bg-[#ffffff]  min-w-[120px] px-2 py-1 text-[#464255]">{row?.data_temp2?.["9"] ?? ''}</td>
                                                )}

                                                {columnVisibility?.supply_demand && (
                                                    <td className="px-2 py-1 text-[#464255] ">{row?.data_temp2?.["1"] ?? ''}</td>
                                                )}

                                                {columnVisibility?.area && (
                                                    <td className={`px-2 py-1 ${row?.status ? "text-[#464255]" : "text-[#9CA3AF]"} !justify-center items-center text-center flex`}>

                                                        {(() => {
                                                            const areaText = row?.area_text ? String(row.area_text).trim() : '';
                                                            const filter_area = (Array.isArray(areaMaster?.data) ? areaMaster.data : []).find((item: any) => item?.name === areaText);

                                                            return Number(filter_area?.entry_exit_id) === 2 ? (
                                                                <div
                                                                    className="flex justify-center items-center rounded-full p-1 text-[#464255]"
                                                                    style={{ backgroundColor: filter_area?.color, width: '40px', height: '40px', color: getContrastTextColor(filter_area?.color) }}
                                                                >
                                                                    {`${filter_area?.name ?? ''}`}
                                                                </div>
                                                            ) : Number(filter_area?.entry_exit_id) === 1 ? (
                                                                <div
                                                                    className="flex justify-center items-center rounded-lg p-1 text-[#464255]"
                                                                    style={{ backgroundColor: filter_area?.color, width: '40px', height: '40px', color: getContrastTextColor(filter_area?.color) }}
                                                                >
                                                                    {`${filter_area?.name ?? ''}`}
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </td>
                                                )}

                                                {columnVisibility?.type && (
                                                    <td className="px-2 py-1 text-[#464255]">{row?.data_temp2?.["6"] ?? ''}</td>
                                                )}

                                                {columnVisibility?.entry_exit && (
                                                    <td className="px-2 py-1  justify-center ">
                                                        {(() => {
                                                            const eeText = row?.data_temp2?.["10"] ? String(row.data_temp2["10"]).trim() : '';
                                                            const filter_entry_exit = (Array.isArray(entryExitMaster?.data) ? entryExitMaster.data : []).find((item: any) => item?.name === eeText);
                                                            return <div className="flex w-[100px] justify-center rounded-full p-1 text-[#464255]" style={{ backgroundColor: filter_entry_exit?.color }}>{`${filter_entry_exit?.name ?? ''}`}</div>;
                                                        })()}
                                                    </td>
                                                )}

                                                {columnVisibility?.wi && (
                                                    <td className={`px-2 py-1 text-[#464255] text-right ${isWiOutOfRange ? 'text-[#ED1B24]' : ''}`}>
                                                        {
                                                            isEditing && rowEditing == row?.old_index ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["11"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;

                                                                        setTempDataByTab(tabMain, row?.old_index, value, '11');
                                                                        setIsEditedInRow(true)
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={false}
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                row?.data_temp2?.["11"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["11"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["11"]?.toString()?.trim().replace(/,/g, ""))) : ""
                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.hv && (
                                                    <td className={`px-2 py-1 text-[#464255] text-right ${isHvOutOfRange ? 'text-[#ED1B24]' : ''}`}>
                                                        {
                                                            isEditing && rowEditing == row?.old_index ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["12"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '12');
                                                                        setIsEditedInRow(true)
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={false}
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                row?.data_temp2?.["12"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["12"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["12"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.sg && (
                                                    // <td className={`px-2 py-1 text-[#464255] text-right ${parseFloat(row?.data_temp2["13"]) > parseFloat(row?.newObj?.["13"]?.valueBook) ? 'text-[#ED1B24]' : ''}`}>
                                                    <td className={`px-2 py-1 text-[#464255] text-right`}>
                                                        {
                                                            isEditing && rowEditing == row?.old_index ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["13"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '13');
                                                                        setIsEditedInRow(true)
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={4}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={false}
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["13"] ? formatNumberThreeDecimal(row?.data_temp2["13"]) : ''
                                                                row?.data_temp2?.["13"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["13"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberFourDecimal(Number(row?.data_temp2?.["13"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.sunday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverSunday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(14) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["14"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '14');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["14"] ? formatNumberThreeDecimal(row?.data_temp2["14"]) : ''
                                                                row?.data_temp2?.["14"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["14"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["14"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.monday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverMonday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(15) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["15"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '15');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["15"] ? formatNumberThreeDecimal(row?.data_temp2["15"]) : ''
                                                                row?.data_temp2?.["15"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["15"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["15"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.tuesday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverTuesday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(16) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["16"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '16');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["16"] ? formatNumberThreeDecimal(row?.data_temp2["16"]) : ''
                                                                row?.data_temp2?.["16"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["16"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["16"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.wednesday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverWednesday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(17) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["17"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '17');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["17"] ? formatNumberThreeDecimal(row?.data_temp2["17"]) : ''
                                                                row?.data_temp2?.["17"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["17"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["17"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.thursday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverThursday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(18) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["18"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '18');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["18"] ? formatNumberThreeDecimal(row?.data_temp2["18"]) : ''
                                                                row?.data_temp2?.["18"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["18"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["18"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.friday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverFriday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(19) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["19"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '19');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                // row?.data_temp2["19"] ? formatNumberThreeDecimal(row?.data_temp2["19"]) : ''
                                                                row?.data_temp2?.["19"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["19"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["19"]?.toString()?.trim().replace(/,/g, ""))) : ""

                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.saturday && (
                                                    <td
                                                        className={`px-2 py-1 text-right ${isOverSaturday ? 'text-[#ED1B24]' : 'text-[#464255]'}`}
                                                    >
                                                        {
                                                            isEditing && rowEditing == row?.old_index && !disableColumnAt?.includes(20) ?
                                                                <NumericFormat
                                                                    value={row?.data_temp2?.["20"] || ''}
                                                                    onValueChange={(values) => {
                                                                        const { value } = values;
                                                                        setTempDataByTab(tabMain, row?.old_index, value, '20');
                                                                    }}
                                                                    thousandSeparator=","
                                                                    decimalScale={3}
                                                                    fixedDecimalScale={true}
                                                                    allowNegative={isAllowNegativeForConceptPoint} // concept point อนุญาติการใส่ค่าลบ
                                                                    className={`${inputClass} `}
                                                                    style={{ textAlign: "right", width: "100%" }}
                                                                />
                                                                :
                                                                row?.data_temp2?.["20"]?.toString()?.trim() && !isNaN(Number(row?.data_temp2?.["20"]?.toString()?.trim().replace(/,/g, ""))) ? formatNumberThreeDecimal(Number(row?.data_temp2?.["20"]?.toString()?.trim().replace(/,/g, ""))) : ""
                                                        }
                                                    </td>
                                                )}

                                                {columnVisibility?.edit && (
                                                    isEditing && rowEditing == row?.old_index ? (
                                                        <td className="px-2 py-1 min-w-[140px]">
                                                            <div className="flex gap-2 w-full">
                                                                <button
                                                                    onClick={() => {
                                                                        handleSaveClick();
                                                                    }}
                                                                    // disabled={!isEditedInRow} // Disable if isEditedInRow is false
                                                                    className={`flex w-[130px] h-[33px] px-4 py-2 rounded-[8px] items-center justify-center
                                                                ${isEditedInRow ? "bg-[#17AC6B] text-white cursor-pointer" : "bg-gray-400 text-gray-200 cursor-not-allowed"}`}
                                                                >
                                                                    <div className="gap-2 flex">
                                                                        {'Save Draft'}
                                                                        <CheckOutlinedIcon sx={{ fontSize: 18, color: '#ffffff' }} />
                                                                    </div>
                                                                </button>

                                                                <button
                                                                    onClick={() => handleCancelClick()}
                                                                    className={`flex w-[130px] h-[33px] bg-[#ffffff] border border-[#646464]  text-[#464255] px-4 py-2 rounded-[8px] items-center justify-center`}
                                                                >
                                                                    <div className="gap-2 flex">
                                                                        {'Cancel'}
                                                                        <CloseOutlinedIcon sx={{ fontSize: 18, color: '#464255' }} />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    ) : (
                                                        <td className="px-2 py-1 min-w-[140px]">
                                                            {(() => {
                                                                const isEditDisabled = Boolean(isDisableAction || Number(dataNomCode?.query_shipper_nomination_status?.id) === 4);
                                                                return (
                                                                    <div className="relative inline-flex justify-center items-center w-full">
                                                                        <ModeEditOutlinedIcon
                                                                            onClick={!isEditDisabled ? () => handleEditClick(row?.old_index) : undefined}
                                                                            className={`border-[1px] rounded-[4px] ${isEditDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                                            style={{
                                                                                fontSize: "18px",
                                                                                width: '22px',
                                                                                height: '22px',
                                                                                color: '#2B2A87',
                                                                                borderColor: '#DFE4EA'
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            })()}
                                                        </td>
                                                    )
                                                )}
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                    :
                    <TableSkeleton />
            }

            {
                isLoading && sortedData?.length == 0 && <NodataTable />
            }

            <ColumnVisibilityPopover
                open={open}
                anchorEl={anchorEl}
                setAnchorEl={setAnchorEl}
                columnVisibility={columnVisibility}
                handleColumnToggle={handleColumnToggle}
                // initialColumns={initialColumnsTabEntryExit}
                // initialColumns={visibleColumns}
                initialColumns={tabMain == 0 ? initialColumnsTabEntryExit : initialColumnsTabConceptPoint}

            />
        </div>

        <PaginationComponent
            // totalItems={100}
            // itemsPerPage={itemsPerPage}
            // currentPage={currentPage}
            totalItems={tabMain == 0 ? tempData?.length : tempDataConcept?.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
        />
    </div>


    )
}

export default TableEachZone;