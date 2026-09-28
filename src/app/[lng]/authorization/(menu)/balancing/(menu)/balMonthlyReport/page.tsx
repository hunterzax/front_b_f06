"use client";

import { useEffect, useState } from "react";
import ModalComponent from "@/components/other/ResponseModal";
import { InputSearch } from '@/components/other/SearchForm';
import { Tune } from "@mui/icons-material"
import { getService } from "@/utils/postService";
import SearchInput from "@/components/other/searchInput";
import { Tab, Tabs } from '@mui/material';
import { TabTable } from '@/components/other/tabPanel';
import TableReport from "./form/tableReport";
import TableDownload from "./form/tableDownload";
import BtnGeneral from "@/components/other/btnGeneral";
import BtnSearch from "@/components/other/btnSearch";
import BtnReset from "@/components/other/btnReset";
import getCookieValue from "@/utils/getCookieValue";
import useRestrictedPage from "@/utils/checkRestrictedPage";
import { decryptData } from "@/utils/encryptionData";
import getUserValue from "@/utils/getuserValue";
import BtnExport from "@/components/other/btnExport";
import { findRoleConfigByMenuName, formatDate, formatNumberFourDecimal, formatNumberFourDecimalNoComma, formatTime, generateUserPermission, sleep, toDayjs } from "@/utils/generalFormatter";
import PaginationComponent from "@/components/other/globalPagination";
import NodataTable from "@/components/other/nodataTable";
import { fetchAreaMaster } from "@/utils/store/slices/areaMasterSlice";
import { useAppDispatch } from "@/utils/store/store";
import { useFetchMasters } from "@/hook/fetchMaster";
import ColumnVisibilityPopover from "@/components/other/popOverShowHideCol";
import MonthYearPickaSearch from "@/components/library/dateRang/monthYearPicker";
import dayjs from 'dayjs';
import TableSkeleton from "@/components/material_custom/DefaultSkeleton";
import TableReportExpanded from "./form/tableReport_Expanded";


interface ClientProps {
    params: {
        lng: string;
    };
}

const ClientPage: React.FC<ClientProps> = () => {
    const userDT: any = getUserValue();
    const [tk, settk] = useState<boolean>(true);

    // ############### Check Authen ###############
    const token = getCookieValue("v4r2d9z5m3h0c1p0x7l");
    useRestrictedPage(token);

    // ############### PERMISSION ###############
    const [userPermission, setUserPermission] = useState<any>();
    let user_permission: any = typeof window !== 'undefined' ? (getCookieValue("k3a9r2b6m7t0x5w1s8j") || localStorage?.getItem("k3a9r2b6m7t0x5w1s8j")) : null;
    user_permission = user_permission ? decryptData(user_permission) : null;

    const getPermission = () => {
        try {
            let parsed_permission = user_permission;
            if (typeof parsed_permission === 'string') {
                parsed_permission = JSON.parse(parsed_permission); // Convert JSON string to object
            }

            const permission = findRoleConfigByMenuName('Monthly Report', userDT)
            if (permission) {
                setUserPermission(permission);
            } else if (parsed_permission?.role_config) {
                const updatedUserPermission = generateUserPermission(parsed_permission);
                setUserPermission(updatedUserPermission);
            }
        } catch (error) {
            // Failed to parse user_permission:
        }
    }


    //ใช้สำหรับแปลง data เข้า tableExpanded อันใหม่
    const transformDataExpanded = (data: any[]) => {
        let map: Record<string, any> = {};

        try {
            const isAllNull = (obj: any) => {
                if (!obj) return true;
                return Object.values(obj).every(
                    (v) => v === null || v === undefined
                );
            };

            (Array.isArray(data) ? data : []).forEach((item) => {
                const day = item?.gas_day;
                if (!day) return;

                if (!map[day]) {
                    map[day] = {
                        day,
                        value: [],
                        sum: {},
                    };
                }

                (Array.isArray(item?.data?.shipperData) ? item.data.shipperData : []).forEach((shipperData: any) => {
                    if (!shipperData) return;
                    const currentData = shipperData?.shipperAccumulated ?? shipperData?.shipperSummary ?? {};

                    // 🔥 filter null object
                    if (isAllNull(currentData)) return;

                    if (map[day]?.value) {
                        map[day].value.push({
                            key: shipperData?.shipperName ?? shipperData?.shipper ?? '',
                            data: currentData,
                        });
                    }
                });

                if (map[day]) {
                    map[day].sum = item?.data?.accumulated ?? item?.data?.summary ?? {};

                    if (Array.isArray(map[day].value)) {
                        map[day].value.sort((a: any, b: any) => {
                            return (a?.key ?? '').localeCompare(b?.key ?? '');
                        });
                    }
                }
            });
        } catch (error) {
            map = {};
        }

        return Object.values(map);
    };

    // ############### REDUX DATA ###############
    const { areaMaster } = useFetchMasters();
    const [forceRefetch, setForceRefetch] = useState(true);
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (forceRefetch || !areaMaster?.data) {
            dispatch(fetchAreaMaster());
        }

        // Reset forceRefetch after fetching
        if (forceRefetch) {
            setForceRefetch(false); // Reset the flag after triggering the fetch
        }
        getPermission();
    }, [dispatch, forceRefetch, areaMaster]); // Watch for forceRefetch changes

    // ############### FIELD SEARCH ###############
    const [key, setKey] = useState(0);
    const [isFilter, setIsFilter] = useState<any>(false);
    // const [srchGasDay, setSrchGasDay] = useState<any>(null);
    // const [srchGasDayTabDownlaod, setSrchGasDayTabDownlaod] = useState<any>(null);
    const [srchGasDay, setSrchGasDay] = useState<any>(dayjs().toISOString());
    const [srchGasDayTabDownlaod, setSrchGasDayTabDownlaod] = useState<any>(dayjs());
    const [srchShipperName, setSrchShipperName] = useState<any>([]);
    const [srchContractCode, setSrchContractCode] = useState('');
    const [dataContractFiltered, setDataContractFiltered] = useState<any[]>([])
    const [srchVersion, setSrchVersion] = useState('');
    const [urlForApprove, setUrlForApprove] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [disableApprove, setDisableApprove] = useState(true);
    const [filteredDataTable, setFilteredDataTable] = useState<any>([]);
    const [filteredDataTableExpanded, setFilteredDataTableExpanded] = useState<any>([]);
    const [dataSummary, setDataSummary] = useState<any>({});

    const handleFieldSearch = async (day: any) => {
        setIsLoading(false)
        setIsFilter(true)

        // TABLE REPORT
        // if (srchGasDay !== null && tabIndex == 0) {
        if (tabIndex == 0) {

            // const month = srchGasDay ? String(srchGasDay.getMonth() + 1).padStart(2, '0') : dayjs().format("MM");
            // const year = srchGasDay ? String(srchGasDay.getFullYear()) : dayjs().format("YYYY");
            const month = day ? String(dayjs(day).month() + 1).padStart(2, '0') : srchGasDay ? String(dayjs(srchGasDay).month() + 1).padStart(2, '0') : dayjs().format("MM");
            const year = day ? String(dayjs(day).year()) : srchGasDay ? String(dayjs(srchGasDay).year()) : dayjs().format("YYYY");
            setMonth(month)
            setYear(year)

            let new_url = `/master/balancing/balancing-monthly-report?skip=0&limit=100` // skip, limit fix ของ eviden
            let new_url_approve = `/master/balancing/balancing-monthly-report-approved?skip=0&limit=100`
            if (srchShipperName?.length > 1) {
                new_url += `&shipperIdList=${srchShipperName?.join(',')}`
                new_url_approve += `&shipperIdList=${srchShipperName?.join(',')}`

                // ถ้าไม่เลือก shipper ห้ามส่ง contract
                if (srchContractCode) {
                    new_url += `&contractCode=${srchContractCode}`
                    new_url_approve += `&contractCode=${srchContractCode}`
                }
            }
            else if (srchShipperName?.length === 1) {
                new_url += `&shipperId=${srchShipperName?.[0]}`
                new_url_approve += `&shipperId=${srchShipperName?.[0]}`

                // ถ้าไม่เลือก shipper ห้ามส่ง contract
                if (srchContractCode) {
                    new_url += `&contractCode=${srchContractCode}`
                    new_url_approve += `&contractCode=${srchContractCode}`
                }
            }
            new_url += `&month=${month}`
            new_url += `&year=${year}`
            new_url_approve += `&month=${month}`
            new_url_approve += `&year=${year}`
            setUrlForApprove(new_url_approve)

            const res_new_data = await getService(new_url.replace('#', 'HashNumberSign'));
            

            // เวอร์ชั่น expanded
            setDataExpanded(transformDataExpanded(res_new_data?.gasDayShipperData ?? []));
            setFilteredDataTableExpanded(transformDataExpanded(res_new_data?.gasDayShipperData ?? []));

            const setDataUseList: any[] = Array.isArray(res_new_data?.setDataUse) ? res_new_data.setDataUse : [];

            if (setDataUseList.length > 0) {
                if (srchShipperName?.length !== 1 && srchContractCode == '') {
                    const filter_summary = setDataUseList.filter((item: any) => item?.keys == "Summary");
                    const summaryFirst = filter_summary?.[0];
                    const summaryValues = Array.isArray(summaryFirst?.value) ? summaryFirst.value : [];
                    const find_data_sum = summaryValues.find((item: any) => item?.gas_day == 'sum');
                    setDataSummary(find_data_sum || {});

                    if (summaryFirst) {
                        const nonSumValues = summaryValues.filter((row: any) => row?.gas_day !== 'sum');
                        summaryFirst.value = nonSumValues;
                        const flatData = nonSumValues.map(({ gas_day, value }: any) => ({ gas_day, ...(value ?? {}) }));
                        setData(flatData);
                        setFilteredDataTable(flatData);
                    } else {
                        setData([]);
                        setFilteredDataTable([]);
                    }
                } else {
                    const type_report = res_new_data?.typeReport;
                    const filter_shipper_or_contract = setDataUseList.filter((item: any) => item?.keys == type_report);
                    const shipperFirst = filter_shipper_or_contract?.[0];
                    const shipperValues = Array.isArray(shipperFirst?.value) ? shipperFirst.value : [];
                    const find_data_sum = shipperValues.find((item: any) => item?.gas_day == 'sum');
                    setDataSummary(find_data_sum || {});

                    if (shipperFirst) {
                        const nonSumValues = shipperValues.filter((row: any) => row?.gas_day !== 'sum');
                        shipperFirst.value = nonSumValues;
                        const flatData = nonSumValues.map(({ gas_day, value }: any) => ({ gas_day, ...(value ?? {}) }));
                        setData(flatData);
                        setFilteredDataTable(flatData);
                    } else {
                        setData([]);
                        setFilteredDataTable([]);
                    }
                }

                if (srchShipperName?.length !== 1 || setDataUseList.length <= 0) {
                    setDisableApprove(true)
                } else {
                    setDisableApprove(false)
                }
            } else {
                setData([]);
                setFilteredDataTable([]);

                setDataSummary({})
                if (srchShipperName?.length !== 1) {
                    setDisableApprove(true)
                } else {
                    setDisableApprove(false)
                }
            }

            setIsFilter(true)
        } else { // table download
            const localDate = srchGasDayTabDownlaod ? toDayjs(srchGasDayTabDownlaod).format("MMMM YYYY") : toDayjs().format("MMMM YYYY");

            const result_2 = (dataTabDownloadOriginal || []).filter((item: any) => {
                if (srchShipperName?.length === dataShipper?.length || srchShipperName?.length === 0) {
                    return (
                        (srchGasDayTabDownlaod ? localDate == item?.monthText : true) &&
                        (srchContractCode ? srchContractCode == item?.contractCode : true)
                    );
                } else {
                    const typeReport = item?.jsonData ? (() => { try { return JSON.parse(item.jsonData)?.typeReport; } catch { return ''; } })() : '';
                    const shipperName = item?.contractCode ? item?.group?.id_name : (dataShipper?.find((f: any) => f?.id_name === typeReport)?.id_name || '')
                    const fShipper = srchShipperName?.find((f: any) => f === shipperName)
                    return (
                        (srchGasDayTabDownlaod ? localDate == item?.monthText : true) &&
                        (srchContractCode ? srchContractCode == item?.contractCode : true) &&
                        !!fShipper
                    );
                }
            });

            setDataTabDownload(result_2)
        }

        setTimeout(() => {
            setIsLoading(true)
        }, 500);
    };

    const handleReset = (tabIndexParam?: any) => {
        setIsLoading(false);

        setIsFilter(false)
        // setSrchGasDay(null);
        // setSrchGasDayTabDownlaod(null);
        setSrchContractCode('')
        setSrchShipperName([])
        setSrchVersion('')
        setUrlForApprove('')
        setDisableApprove(true)
        setSrchGasDay(dayjs())

        // setFilteredDataTable([]);
        // setFilteredDataTableExpanded([]);

        // เดิมโรงงาน
        // if (tabIndex == 1) {
        //     const localDate = toDayjs().format("MMMM");
        //     const fitered_current_month = dataTabDownloadOriginal.filter((item: any) => {
        //         return (
        //             (localDate ? localDate == item?.monthText : true)
        //         );
        //     });
        //     setDataTabDownload(fitered_current_month)
        // }

        // if (tabIndexParam == 1 || tabIndex == 1) {
        if (tabIndexParam == 1) {
            // const localDate = srchGasDayTabDownlaod ? toDayjs(srchGasDayTabDownlaod).format("MMMM YYYY") : toDayjs().format("MMMM YYYY");
            // const fitered_current_month = dataTabDownloadOriginal.filter((item: any) => {
            //     return (
            //         (srchGasDayTabDownlaod ? localDate == item?.monthText : true)
            //     );
            // });
            // setDataTabDownload(fitered_current_month)
            setDataTabDownload(dataTabDownloadOriginal)
            setTimeout(() => {
                setIsLoading(true);
            }, 500);

        } else {
            fetchDataTabChange()
        }
        setKey((prevKey) => prevKey + 1);
    };

    // const fetchShipperAndContract = async () => {
    //   const defaultMonth = dayjs().startOf('month')
    //   const gasDay = tabIndex == 0 ? srchGasDay : srchGasDayTabDownlaod
    //   const month = gasDay ? dayjs(gasDay).startOf('day') : defaultMonth
    //   let apiUrl = `/master/daily-adjustment/shipper-data?month=${month.isValid() ? month.format('YYYY-MM-DD') : defaultMonth.format('YYYY-MM-DD')}`
    //   const res_: any = await getService(apiUrl)
  
    //   if (res_ && Array.isArray(res_)) {
    //     setDataShipper(res_)
    //     if (userDT?.account_manage?.[0]?.user_type_id == 3) {
    //       const uniqueContract = res_.filter((f: any) => f?.id === userDT?.account_manage?.[0]?.group?.id)?.flatMap((fm: any) => fm?.contract_code)
    //       setDataContract(uniqueContract)
    //     } else {
    //       const uniqueContract = res_.flatMap((fm: any) => fm?.contract_code)
    //       setDataContract(uniqueContract)
    //     }
    //   }
    // }

    const fetchContractMaster = async () => {
    try {
        const res_contract_code_: any = await getService(
            `/master/capacity/pure-contract`
        )

        const res_contract_code = (
            Array.isArray(res_contract_code_)
                ? res_contract_code_
                : []
        ).filter(
            (item: any) =>
                item?.status_capacity_request_management_id !== 3
        )

        setDataContract(res_contract_code)
        setDataContractOriginal(res_contract_code)

        // สำคัญ
        return res_contract_code

    } catch (error) {
        console.error('fetchContractMaster error : ', error)

        setDataContract([])
        setDataContractOriginal([])

        return []
    }
}

    const fetchShipperAndContract = async () => {
        const defaultMonth = dayjs().startOf('month')
        const gasDay = tabIndex == 0 ? srchGasDay : srchGasDayTabDownlaod

        const month = gasDay
            ? dayjs(gasDay).startOf('day')
            : defaultMonth

        const apiUrl =
            `/master/daily-adjustment/shipper-data?month=${month.isValid()
                ? month.format('YYYY-MM-DD')
                : defaultMonth.format('YYYY-MM-DD')
            }`

        const res_: any = await getService(apiUrl)

        if (Array.isArray(res_)) {
            // ใช้ endpoint นี้สำหรับ Shipper เท่านั้น
            setDataShipper(res_)
        }
    }

    // ############### LIKE SEARCH ###############
    const handleSearch = (query: string) => {
        const queryLower = (query || '').replace(/\s+/g, '')?.toLowerCase().trim();

        // table report
        if (tabIndex == 0) {
            if (!queryLower) {
                setFilteredDataTable(dataTable);
                setFilteredDataTableExpanded(dataTableExpanded);
                return;
            }

            const searchData = (data: any[], queryStr: string) => {
                const qLower = (queryStr || '').toLowerCase().trim().replace(/\s+/g, "");

                const checkMatch = (item: any) => {
                    if (!item) return false;
                    return (
                        (item["Entry Point"] != null && item["Entry Point"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Exit"] != null && item["Exit"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Entry - Exit"] != null && item["Entry - Exit"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Fuel Gas"] != null && item["Fuel Gas"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Balancing Gas"] != null && item["Balancing Gas"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Change Min Inventory"] != null && item["Change Min Inventory"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Shrinkagate"] != null && item["Shrinkagate"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Commissioning"] != null && item["Commissioning"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Gas Vent"] != null && item["Gas Vent"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Other Gas"] != null && item["Other Gas"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Imbalance"] != null && item["Imbalance"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Acc. Imbqalance"] != null && item["Acc. Imbqalance"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||
                        (item["Min Inventory"] != null && item["Min Inventory"].toString().replace(/\s+/g, '').toLowerCase().includes(qLower)) ||

                        (formatNumberFourDecimal(item["Entry Point"]) ? String(formatNumberFourDecimal(item["Entry Point"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Exit"]) ? String(formatNumberFourDecimal(item["Exit"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Entry - Exit"]) ? String(formatNumberFourDecimal(item["Entry - Exit"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Fuel Gas"]) ? String(formatNumberFourDecimal(item["Fuel Gas"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Balancing Gas"]) ? String(formatNumberFourDecimal(item["Balancing Gas"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Change Min Inventory"]) ? String(formatNumberFourDecimal(item["Change Min Inventory"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Shrinkagate"]) ? String(formatNumberFourDecimal(item["Shrinkagate"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Commissioning"]) ? String(formatNumberFourDecimal(item["Commissioning"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Gas Vent"]) ? String(formatNumberFourDecimal(item["Gas Vent"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Other Gas"]) ? String(formatNumberFourDecimal(item["Other Gas"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Imbalance"]) ? String(formatNumberFourDecimal(item["Imbalance"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Acc. Imbqalance"]) ? String(formatNumberFourDecimal(item["Acc. Imbqalance"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimal(item["Min Inventory"]) ? String(formatNumberFourDecimal(item["Min Inventory"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||

                        (formatNumberFourDecimalNoComma(item["Entry Point"]) ? String(formatNumberFourDecimalNoComma(item["Entry Point"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Exit"]) ? String(formatNumberFourDecimalNoComma(item["Exit"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Entry - Exit"]) ? String(formatNumberFourDecimalNoComma(item["Entry - Exit"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Fuel Gas"]) ? String(formatNumberFourDecimalNoComma(item["Fuel Gas"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Balancing Gas"]) ? String(formatNumberFourDecimalNoComma(item["Balancing Gas"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Change Min Inventory"]) ? String(formatNumberFourDecimalNoComma(item["Change Min Inventory"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Shrinkagate"]) ? String(formatNumberFourDecimalNoComma(item["Shrinkagate"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Commissioning"]) ? String(formatNumberFourDecimalNoComma(item["Commissioning"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Gas Vent"]) ? String(formatNumberFourDecimalNoComma(item["Gas Vent"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Other Gas"]) ? String(formatNumberFourDecimalNoComma(item["Other Gas"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Imbalance"]) ? String(formatNumberFourDecimalNoComma(item["Imbalance"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Acc. Imbqalance"]) ? String(formatNumberFourDecimalNoComma(item["Acc. Imbqalance"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false) ||
                        (formatNumberFourDecimalNoComma(item["Min Inventory"]) ? String(formatNumberFourDecimalNoComma(item["Min Inventory"])).replace(/\s+/g, '').toLowerCase().includes(qLower) : false)
                    );
                };

                return (data || [])
                    .map((item: any) => {
                        if (checkMatch(item?.sum)) {
                            return item;
                        }

                        const filteredValue = (item?.value || []).filter((v: any) => {
                            return (
                                (v?.key && v.key.toLowerCase().includes(qLower)) ||
                                checkMatch(v?.data)
                            );
                        });

                        return {
                            ...item,
                            value: filteredValue,
                        };
                    })
                    .filter((item: any) => (item?.value?.length ?? 0) > 0);
            };

            const filtered = (dataTable || [])?.filter(
                (item: any) => {
                    if (!item) return false;
                    return (
                        (item?.gas_day && item.gas_day.replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Entry Point"] != null && item["Entry Point"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Exit"] != null && item["Exit"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Entry - Exit"] != null && item["Entry - Exit"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Fuel Gas"] != null && item["Fuel Gas"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Balancing Gas"] != null && item["Balancing Gas"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Change Min Inventory"] != null && item["Change Min Inventory"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Shrinkagate"] != null && item["Shrinkagate"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Commissioning"] != null && item["Commissioning"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Gas Vent"] != null && item["Gas Vent"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Other Gas"] != null && item["Other Gas"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Imbalance"] != null && item["Imbalance"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["ImbalancePercen"] != null && item["ImbalancePercen"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Acc. Imbqalance"] != null && item["Acc. Imbqalance"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.["Min Inventory"] != null && item["Min Inventory"].toString().replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||

                        (formatNumberFourDecimal(item?.["Entry Point"]) ? String(formatNumberFourDecimal(item["Entry Point"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Exit"]) ? String(formatNumberFourDecimal(item["Exit"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Entry - Exit"]) ? String(formatNumberFourDecimal(item["Entry - Exit"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Fuel Gas"]) ? String(formatNumberFourDecimal(item["Fuel Gas"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Balancing Gas"]) ? String(formatNumberFourDecimal(item["Balancing Gas"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Change Min Inventory"]) ? String(formatNumberFourDecimal(item["Change Min Inventory"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Shrinkagate"]) ? String(formatNumberFourDecimal(item["Shrinkagate"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Commissioning"]) ? String(formatNumberFourDecimal(item["Commissioning"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Gas Vent"]) ? String(formatNumberFourDecimal(item["Gas Vent"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Other Gas"]) ? String(formatNumberFourDecimal(item["Other Gas"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Imbalance"]) ? String(formatNumberFourDecimal(item["Imbalance"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["ImbalancePercen"]) ? String(formatNumberFourDecimal(item["ImbalancePercen"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Acc. Imbqalance"]) ? String(formatNumberFourDecimal(item["Acc. Imbqalance"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimal(item?.["Min Inventory"]) ? String(formatNumberFourDecimal(item["Min Inventory"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||

                        (formatNumberFourDecimalNoComma(item?.["Entry Point"]) ? String(formatNumberFourDecimalNoComma(item["Entry Point"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Exit"]) ? String(formatNumberFourDecimalNoComma(item["Exit"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Entry - Exit"]) ? String(formatNumberFourDecimalNoComma(item["Entry - Exit"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Fuel Gas"]) ? String(formatNumberFourDecimalNoComma(item["Fuel Gas"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Balancing Gas"]) ? String(formatNumberFourDecimalNoComma(item["Balancing Gas"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Change Min Inventory"]) ? String(formatNumberFourDecimalNoComma(item["Change Min Inventory"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Shrinkagate"]) ? String(formatNumberFourDecimalNoComma(item["Shrinkagate"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Commissioning"]) ? String(formatNumberFourDecimalNoComma(item["Commissioning"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Gas Vent"]) ? String(formatNumberFourDecimalNoComma(item["Gas Vent"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Other Gas"]) ? String(formatNumberFourDecimalNoComma(item["Other Gas"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Imbalance"]) ? String(formatNumberFourDecimalNoComma(item["Imbalance"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["ImbalancePercen"]) ? String(formatNumberFourDecimalNoComma(item["ImbalancePercen"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Acc. Imbqalance"]) ? String(formatNumberFourDecimalNoComma(item["Acc. Imbqalance"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false) ||
                        (formatNumberFourDecimalNoComma(item?.["Min Inventory"]) ? String(formatNumberFourDecimalNoComma(item["Min Inventory"])).replace(/\s+/g, '').toLowerCase().trim().includes(queryLower) : false)
                    );
                }
            );

            setFilteredDataTable(filtered);
            setFilteredDataTableExpanded(searchData(dataTableExpanded, queryLower));
        } else { // table download
            if (!queryLower) {
                setDataTabDownload(dataTabDownloadOriginal);
                return;
            }

            const filtered = (Array.isArray(dataTabDownloadOriginal) ? dataTabDownloadOriginal : [])?.filter(
                (item: any) => {
                    if (!item) return false;
                    const firstName = item?.create_by_account?.first_name ? String(item.create_by_account.first_name).trim() : '';
                    const lastName = item?.create_by_account?.last_name ? String(item.create_by_account.last_name).trim() : '';
                    const fullName = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');

                    return (
                        (item?.monthText && item.monthText.replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.contractCode && item.contractCode.replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.file && item.file.replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.version && item.version.replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (item?.typeReport && item.typeReport.replace(/\s+/g, '').toLowerCase().trim().includes(queryLower)) ||
                        (firstName && firstName.toLowerCase().replace(/\s+/g, '').includes(queryLower)) ||
                        (lastName && lastName.toLowerCase().replace(/\s+/g, '').includes(queryLower)) ||
                        (fullName && fullName.includes(queryLower)) ||
                        (item?.create_date && formatTime(item.create_date)?.toLowerCase().includes(queryLower)) ||
                        (item?.create_date && formatDate(item.create_date)?.replace(/\s+/g, '').toLowerCase().includes(queryLower))
                    );
                }
            );

            setDataTabDownload(filtered);
        }
    };

    // ############### DATA TABLE ###############
    const [tabIndex, setTabIndex] = useState(0);
    const [dataTable, setData] = useState<any>([]);
    const [dataTableExpanded, setDataExpanded] = useState<any>([]);
    const [resetForm, setResetForm] = useState<() => void | null>();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [dataContractOriginal, setDataContractOriginal] = useState<any>([]);
    const [dataContract, setDataContract] = useState<any>([]);
    const [dataShipper, setDataShipper] = useState<any>([]);
    const [dataTabDownloadOriginal, setDataTabDownloadOriginal] = useState<any>([]);
    const [dataTabDownload, setDataTabDownload] = useState<any>([]);
    const [dataVersion, setDataVersion] = useState<any>([]);

    const handleChange = (event: any, newValue: any) => {
        setTabIndex(newValue);
        handleReset(newValue);
    };
    

    const fetchData = async (contractMaster?: any[]) => {
        try {
            // ถ้า user เป็น shipper
            // https://app.clickup.com/t/86ert2k28 ตามที่คุยกัน หากเป็น shipper user ถ้ามี filter ชื่อ shipper ให้ค้างชื่อ shipper ตัวเองไว้เลย ไม่ต้องขึ้นเป็น dropdown ให้เลือก - ปรับทั้ง system
            if (userDT?.account_manage?.[0]?.user_type_id == 3) {
                setSrchShipperName(userDT?.account_manage?.[0]?.group?.id_name)
            }

            fetchShipperAndContract()
            // // Group (2 = TSO, 3 = Shipper, 4 = Other)
            // const res_shipper_name = await getService(`/master/account-manage/group-master?user_type=3`);
            // setDataShipper(res_shipper_name)

            // DATA SELECT VERSION
            const res_master_version = await getService(`/master/allocation/version-exe`);
            setDataVersion(res_master_version)

            // // DATA CONTRACT CODE
            // const res_contract_code: any = await getService(`/master/capacity/pure-contract`);
            // setDataContract(res_contract_code);
            // setDataContractOriginal(res_contract_code)

            // DATA TAB DOWNLOAD
            const res_tab_download = await getService(
                `/master/balancing/balancing-monthly-report-download`
            )

            const contractList = Array.isArray(contractMaster)
                ? contractMaster
                : Array.isArray(dataContractOriginal)
                    ? dataContractOriginal
                    : []

            // map shipper เข้า
            const updatedData = (
                Array.isArray(res_tab_download)
                    ? res_tab_download
                    : []
            ).map((item: any) => {

                const matchContract = contractList.find(
                    (itemx: any) =>
                        itemx?.contract_code === item?.contractCode
                )

                if (matchContract) {
                    return {
                        ...item,
                        group: matchContract?.group,
                        shipper_name: matchContract?.group?.name
                    }
                }

                return item
            })

            setDataTabDownloadOriginal(updatedData)
            setDataTabDownload(updatedData)

            // DATA MAIN
            let new_url = `/master/balancing/balancing-monthly-report?skip=0&limit=100` // skip, limit fix ของ eviden
            const monthx = dayjs().format('MM');   // 01‑12 มี 0 นำหน้า
            const yearx = dayjs().format('YYYY'); // 4 หลัก

            new_url += `&month=${monthx}`
            new_url += `&year=${yearx}`

            const res_new_data = await getService(new_url);

            // เวอร์ชั่น expanded
            setDataExpanded(transformDataExpanded(res_new_data?.gasDayShipperData ?? []));
            setFilteredDataTableExpanded(transformDataExpanded(res_new_data?.gasDayShipperData ?? []));
            setIsFilter(true)

            const setDataUseList: any[] = Array.isArray(res_new_data?.setDataUse) ? res_new_data.setDataUse : [];

            if (setDataUseList.length > 0) {
                const filter_summary = setDataUseList.filter((item: any) => item?.keys == "Summary");
                const summaryFirst = filter_summary?.[0];
                const summaryValues = Array.isArray(summaryFirst?.value) ? summaryFirst.value : [];
                const find_data_sum = summaryValues.find((item: any) => item?.gas_day == 'sum');
                setDataSummary(find_data_sum || {});

                if (summaryFirst) {
                    const nonSumValues = summaryValues.filter((row: any) => row?.gas_day !== 'sum');
                    summaryFirst.value = nonSumValues;
                    const flatData = nonSumValues.map(({ gas_day, value }: any) => ({ gas_day, ...(value ?? {}) }));
                    setData(flatData);
                    setFilteredDataTable(flatData);
                } else {
                    setData([]);
                    setFilteredDataTable([]);
                }
            } else {
                setData([]);
                setFilteredDataTable([]);
                setDataSummary({});
            }

            setTimeout(() => {
                setIsLoading(true);
            }, 500);
        } catch (err) {
            // setError(err.message);
        } finally {
            // setLoading(false);
        }
    };

    const fetchDataTabChange = async () => {
        try {
            setIsLoading(false);

            // DATA MAIN
            let new_url = `/master/balancing/balancing-monthly-report?skip=0&limit=100` // skip, limit fix ของ eviden
            const monthx = dayjs().format('MM');   // 01‑12 มี 0 นำหน้า
            const yearx = dayjs().format('YYYY');; // 4 หลัก
            

            new_url += `&month=${monthx}`
            new_url += `&year=${yearx}`

            const res_new_data = await getService(new_url);

            setDataExpanded(transformDataExpanded(res_new_data?.gasDayShipperData ?? []));
            setFilteredDataTableExpanded(transformDataExpanded(res_new_data?.gasDayShipperData ?? []));
            setIsFilter(true);

            const setDataUseList: any[] = Array.isArray(res_new_data?.setDataUse) ? res_new_data.setDataUse : [];

            if (setDataUseList.length > 0) {
                const filter_summary = setDataUseList.filter((item: any) => item?.keys == "Summary");
                const summaryFirst = filter_summary?.[0];
                const summaryValues = Array.isArray(summaryFirst?.value) ? summaryFirst.value : [];
                const find_data_sum = summaryValues.find((item: any) => item?.gas_day == 'sum');
                setDataSummary(find_data_sum || {});

                if (summaryFirst) {
                    const nonSumValues = summaryValues.filter((row: any) => row?.gas_day !== 'sum');
                    summaryFirst.value = nonSumValues;
                    const flatData = nonSumValues.map(({ gas_day, value }: any) => ({ gas_day, ...(value ?? {}) }));
                    setData(flatData);
                    setFilteredDataTable(flatData);
                } else {
                    setData([]);
                    setFilteredDataTable([]);
                }
            } else {
                setData([]);
                setFilteredDataTable([]);

                // เวอร์ชั่น expanded
                setDataExpanded([]);
                setFilteredDataTableExpanded([]);
                setDataSummary({});
            }

            setTimeout(() => {
                setIsLoading(true);
            }, 500);
        } catch (err) {
            // setError(err.message);
        } finally {
            // setLoading(false);
        }
    };

    const fetchDataDownload = async () => {
        // DATA TAB DOWNLOAD
        try {
            const res_tab_download = await getService(`/master/balancing/balancing-monthly-report-download`);
            // setDataTabDownloadOriginal(res_tab_download)
            // setDataTabDownload(res_tab_download)

            // map shipper เข้า 
            let updatedData = res_tab_download?.map((item: any) => {
                const matchContract = (dataContractOriginal || [])?.find((itemx: any) => itemx?.contract_code === item?.contractCode);
                if (matchContract) {
                    return {
                        ...item,
                        group: matchContract?.group,
                        shipper_name: matchContract?.group?.name
                    };
                }
                return item;
            });
            setDataTabDownloadOriginal(updatedData)
            setDataTabDownload(updatedData)

            settk(!tk);

        } catch (error) {
            setDataTabDownloadOriginal([])
            setDataTabDownload([])
        }
    }

useEffect(() => {
    const initData = async () => {
        const contractMaster = await fetchContractMaster()

        await fetchData(contractMaster)

        getPermission()
    }

    initData()
}, [resetForm])

    // ############# NEW MODAL CREATE/EDIT/VIEW  #############
    const [isModalSuccessOpen, setModalSuccessOpen] = useState(false);
    const handleCloseModal = () => setModalSuccessOpen(false);

    const [modalErrorMsg, setModalErrorMsg] = useState('');
    const [isModalErrorOpen, setModalErrorOpen] = useState(false);

    // ############# NEW MODAL CREATE/EDIT/VIEW  #############
    // const openApproveModal = (id: any, data: any) => {
    //     setIsLoading(false)
    //     setDisableApprove(true)

    //     approveMonthlyReport();

    //     setTimeout(() => { // ยื้อเวลาให้มันทำงานหน่อย
    //         fetchDataDownload();
    //     }, 2000);

    //     setTimeout(() => {
    //         setModalSuccessOpen(true);
    //         setIsLoading(true)
    //         setTabIndex(1)
    //     }, 1000);
    // };

    const openApproveModal = async (id: any, data: any) => {
        setIsLoading(false);
        setDisableApprove(true);

        try {
            const resApprove = await approveMonthlyReport();
            await sleep(800);
            await fetchDataDownload();

            setModalSuccessOpen(true);
            setTabIndex(1);

            await sleep(400);
            setIsLoading(true)
        } catch (err) {
            // approve failed
            // TODO: แจ้ง error ให้ผู้ใช้ เช่น toast/error state
        } finally {
            // approve ok
            settk(!tk);
            setIsLoading(true);
            setDisableApprove(false);
        }

        try {
            const res_tab_download = await getService(`/master/balancing/balancing-monthly-report-download`);
            // setDataTabDownloadOriginal(res_tab_download)
            // setDataTabDownload(res_tab_download)

            // map shipper เข้า 
            let updatedData = (Array.isArray(res_tab_download) ? res_tab_download : [])?.map((item: any) => {
                const matchContract = (Array.isArray(dataContractOriginal) ? dataContractOriginal : [])?.find((itemx: any) => itemx?.contract_code === item?.contractCode);
                if (matchContract) {
                    return {
                        ...item,
                        group: matchContract?.group,
                        shipper_name: matchContract?.group?.name
                    };
                }
                return item;
            });
            setDataTabDownloadOriginal(updatedData);
            setDataTabDownload(updatedData);

        } catch (error) {
        }

        setTimeout(() => {
            handleFieldSearch(null);
        }, 1000);
    };

    const approveMonthlyReport = async () => {
        // const res_approve = await getService(urlForApprove);
        return await getService(urlForApprove);
    };

    // ############### COLUMN SHOW/HIDE ###############
    const initialColumns: any = [
        { key: 'date', label: 'Date', visible: true },
        { key: 'entry_point', label: 'Entry Point', visible: true },
        { key: 'exit_point', label: 'Exit Point', visible: true },
        { key: 'entry_exit', label: 'Entry - Exit', visible: true },
        { key: 'fuel_gas', label: 'Fuel Gas', visible: true },
        { key: 'balancing_gas', label: 'Balancing Gas', visible: true },
        { key: 'change_min_inventory', label: 'Change Min Inventory', visible: true },
        { key: 'shrinkagate', label: 'Shrinkage', visible: true },
        { key: 'commissioning', label: 'Commissioning', visible: true },
        { key: 'gas_vent', label: 'Gas Vent', visible: true },
        { key: 'other_gas', label: 'Other Gas', visible: true },
        { key: 'imbalance', label: 'Imbalance', visible: true },
        { key: 'ImbalancePercen', label: 'Imbalance (%)', visible: true },
        { key: 'acc_imbalance', label: 'Acc. Imbalance', visible: true },
        { key: 'min_inventory', label: 'Min Inventory', visible: true },
        { key: 'instructed_flow', label: 'Instructed Flow', visible: true },
    ];

    const initialColumnsDownload: any = [
        { key: 'month', label: 'Month', visible: true },
        { key: 'group', label: 'Shipper Name', visible: true },
        { key: 'contract_code', label: 'Contract Code', visible: true },
        { key: 'file', label: 'File', visible: true },
        { key: 'report_version', label: 'Report Version', visible: true },
        { key: 'type_report', label: 'Type Report', visible: true },
        { key: 'approved_by', label: 'Approved by', visible: true },
        { key: 'download', label: 'Download', visible: true },
    ];

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const [columnVisibility, setColumnVisibility] = useState<any>(
        Object.fromEntries((initialColumns || [])?.map((column: any) => [column?.key, column?.visible]))
    );

    useEffect(() => {
        if (tabIndex == 0) {
            setColumnVisibility(Object.fromEntries((initialColumns || [])?.map((column: any) => [column?.key, column?.visible])))
        } else {
            setColumnVisibility(Object.fromEntries((initialColumnsDownload || [])?.map((column: any) => [column?.key, column?.visible])))
        }
    }, [tabIndex])

    const handleTogglePopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const handleColumnToggle = (columnKey: string) => {
        setColumnVisibility((prev: any) => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    // ############### PAGINATION ###############
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [paginatedData, setPaginatedData] = useState<any[]>([]);
    const [paginatedDataExpanded, setPaginatedDataExpanded] = useState<any[]>([]);
    const [paginatedDataDownload, setPaginatedDataDownload] = useState<any[]>([]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (itemsPerPage: number) => {
        setItemsPerPage(itemsPerPage);
        setCurrentPage(1);
    };

    useEffect(() => {
        if (filteredDataTable) {
            setPaginatedData(filteredDataTable?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
            // setPaginatedData(filteredDataTable)
        }

        if (tabIndex == 1) {
            setPaginatedDataDownload(dataTabDownload?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
        }
    }, [filteredDataTable, currentPage, itemsPerPage, dataTabDownload])

    useEffect(() => {
        if (filteredDataTableExpanded) {
            setPaginatedDataExpanded(filteredDataTableExpanded?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
        }
    }, [filteredDataTableExpanded, currentPage, itemsPerPage, dataTabDownload])

    useEffect(() => {
        fetchShipperAndContract();
    }, [srchGasDay, srchGasDayTabDownlaod]);

    // useEffect(() => {
    //     const dataContract_ = (Array.isArray(dataContract) ? dataContract : []).filter((item: any) => (Array.isArray(srchShipperName) && srchShipperName.length > 0 ? srchShipperName.includes(item?.group?.id_name) : true));

    //     const gasDay = tabIndex == 0 ? srchGasDay : srchGasDayTabDownlaod;
    //     const gasDayJs = toDayjs(gasDay);
    //     const fromDate = gasDayJs && gasDayJs.isValid() ? gasDayJs.startOf('month') : null;
    //     const toDate = gasDayJs && gasDayJs.isValid() ? gasDayJs.endOf('month') : null;

    //     const filteredContract =
    //         dataContract_?.filter((contract: any) => {
    //             if (!contract?.contract_start_date) return false;

    //             const contractStart = toDayjs(contract.contract_start_date);
    //             const contractEndDate = contract?.terminate_date || contract?.extend_deadline || contract?.contract_end_date;
    //             const contractEnd = contractEndDate ? toDayjs(contractEndDate).subtract(1, 'day') : null;

    //             if (!contractStart || !contractStart.isValid()) return false;

    //             // contract_start_date <= วันที่สิ้นสุดที่ค้นหา
    //             const startIsValid = !toDate || !contractStart.isAfter(toDate);

    //             // contract_end_date >= วันที่เริ่มต้นที่ค้นหา
    //             // ถ้า contract_end_date เป็น null ให้ถือว่าสัญญายังไม่สิ้นสุด
    //             const endIsValid = !fromDate || !contractEnd || !contractEnd.isValid() || !contractEnd.isBefore(fromDate);

    //             return startIsValid && endIsValid;
    //         }) || [];

    //     setDataContractFiltered(filteredContract);
    // }, [srchGasDay, srchGasDayTabDownlaod, tabIndex, srchShipperName, dataContract]);

    useEffect(() => {
        // =========================================================
        // 1. Contract ทั้งหมดจาก pure-contract
        // =========================================================
        let contracts = Array.isArray(dataContractOriginal)
            ? dataContractOriginal
            : []

        // =========================================================
        // 2. Filter Shipper
        // srchShipperName เก็บ id_name เช่น NGP-S01-001
        // =========================================================
        if (
            Array.isArray(srchShipperName) &&
            srchShipperName.length > 0
        ) {
            contracts = contracts.filter((contract: any) =>
                srchShipperName.includes(contract?.group?.id_name)
            )
        }

        // =========================================================
        // 3. หาเดือนตาม Tab ปัจจุบัน
        // =========================================================
        const gasDay =
            tabIndex === 0
                ? srchGasDay
                : srchGasDayTabDownlaod

        const gasDayJs = gasDay
            ? toDayjs(gasDay)
            : null

        const fromDate =
            gasDayJs && gasDayJs.isValid()
                ? gasDayJs.startOf('month')
                : null

        const toDate =
            gasDayJs && gasDayJs.isValid()
                ? gasDayJs.endOf('month')
                : null

        // =========================================================
        // 4. Filter อายุ Contract
        // =========================================================
        contracts = contracts.filter((contract: any) => {
            if (!contract || !contract?.contract_start_date) {
                return false
            }

            const contractStart = toDayjs(contract.contract_start_date)

            if (!contractStart || !contractStart.isValid()) {
                return false
            }

            const contractEndDate = contract.terminate_date || contract.extend_deadline || contract.contract_end_date

            const contractEnd = contractEndDate
                ? toDayjs(contractEndDate).subtract(1, 'day')
                : null

            // contract ต้องเริ่มก่อนหรือภายในเดือนที่ค้นหา
            const startIsValid =
                !toDate ||
                !contractStart.isAfter(toDate)

            // contract ต้องยังไม่หมดก่อนเดือนที่ค้นหา
            const endIsValid =
                !fromDate ||
                !contractEnd ||
                !contractEnd.isValid() ||
                !contractEnd.isBefore(fromDate)

            return startIsValid && endIsValid
        })

        // =========================================================
        // 5. Remove duplicate Contract Code
        // =========================================================
        const uniqueContracts = Array.from(
            new Map(
                contracts
                    .filter(
                        (contract: any) =>
                            contract?.contract_code
                    )
                    .map((contract: any) => [
                        contract.contract_code,
                        contract
                    ])
            ).values()
        )

        setDataContractFiltered(uniqueContracts)

    }, [
        srchGasDay,
        srchGasDayTabDownlaod,
        tabIndex,
        srchShipperName,
        dataContractOriginal
    ])

    useEffect(() => {
        if (tabIndex == 1) {
            const localDate = srchGasDayTabDownlaod ? toDayjs(srchGasDayTabDownlaod).format("MMMM YYYY") : toDayjs().format("MMMM YYYY");
            const fitered_current_month = dataTabDownloadOriginal.filter((item: any) => {
                return (
                    (srchGasDayTabDownlaod ? localDate == item?.monthText : true)
                );
            });
            setDataTabDownload(fitered_current_month);
        }
    }, [tabIndex]);
    


    return (
        <div className=" space-y-2">
            <div className="border-[#DFE4EA] border-[1px] p-4 rounded-xl flex flex-col sm:flex-row gap-2">
                <aside className="flex flex-wrap sm:flex-row gap-2 w-full">

                    {/* <MonthYearPickaSearch
                        key={"start" + key}
                        label={'Gas Month'}
                        placeHolder={'Select Gas Month'}
                        allowClear
                        min={dataTable?.date_balance}
                        isDefaultCurrentMonth={true}
                        // max={endOfMonth(new Date())} // เลือกได้สูงสุดคือ เดือนปีปัจจุบัน นับจากเดือน ที่ close ล่าสุด
                        // customWidth={200}
                        // customHeight={35}
                        onChange={(e: any) => {
                            // const formattedDate = dayjs(e).format('DD-MM-YYYY');
                            // setSrchGasDay(e ? formattedDate : null);
                            setSrchGasDay(e ? e : null)
                        }}
                    /> */}

                    {
                        tabIndex == 0 ?
                            <MonthYearPickaSearch
                                key={"start" + key}
                                label={'Gas Month'}
                                placeHolder={'Select Gas Month'}
                                allowClear
                                min={dataTable?.date_balance}
                                isDefaultCurrentMonth={false}
                                valueShow={srchGasDay}
                                onChange={(e: any) => {
                                    setSrchGasDay(e ? e : null)
                                }}
                            />
                            :
                            <MonthYearPickaSearch
                                key={"start" + key}
                                label={'Gas Month'}
                                placeHolder={'Select Gas Month'}
                                allowClear
                                min={dataTable?.date_balance}
                                isDefaultCurrentMonth={false}
                                valueShow={srchGasDayTabDownlaod}
                                onChange={(e: any) => {
                                    setSrchGasDayTabDownlaod(e ? e : null)
                                }}
                            />
                    }

                    {/* {
                        tabIndex == 0 && <InputSearch
                            id="searchShipper"
                            label="Shipper Name"
                            type="select"
                            value={srchShipperName}
                            // onChange={(e) => setSrchShipper(e.target.value)}
                            isDisabled={userDT?.account_manage?.[0]?.user_type_id == 3 ? true : false}
                            onChange={(e) => {
                                setSrchContractCode('')
                                if (e.target.value == undefined) {
                                    setSrchShipperName('')
                                } else {
                                    setSrchShipperName(e.target.value)
                                }
                            }}
                            options={dataShipper
                                ?.filter((item: any) => // เห็นแค่ชื่อตัวเอง
                                    userDT?.account_manage?.[0]?.user_type_id == 3 ? item?.id === userDT?.account_manage?.[0]?.group?.id : true
                                )
                                .map((item: any) => ({
                                    value: item.id_name,
                                    label: item.name,
                                }))
                            }
                        />
                    } */}

                    {
                        // tabIndex == 0 && 
                        <InputSearch
                            id="searchShipper"
                            label="Shipper Name"
                            // type="select"
                            type="select-multi-checkbox"
                            value={srchShipperName}
                            onChange={(e: any) => {
                                if (e.target.value == undefined) {
                                    if (srchShipperName) {
                                        setSrchContractCode('')
                                    }
                                    setSrchShipperName([])
                                } else {
                                    if (e.target.value != srchShipperName) {
                                        setSrchContractCode('')
                                    }
                                setSrchShipperName(e.target.value)
                                }
                            }}
                            options={(Array.isArray(dataShipper) ? dataShipper : [])?.filter((item: any) => {
                                if (!item) return false;
                                let isShipper = true;
                                let isActive = true;
                                if (userDT?.account_manage?.[0]?.user_type_id == 3) {
                                    isShipper = item?.id === userDT?.account_manage?.[0]?.group?.id;
                                }

                                if (srchGasDay) {
                                    const gasDayjs = toDayjs(srchGasDay);
                                    if (item?.start_date && gasDayjs && gasDayjs.isValid()) {
                                        isActive = isActive && gasDayjs.isSameOrAfter(toDayjs(item.start_date));
                                    }

                                    if (item?.end_date && gasDayjs && gasDayjs.isValid()) {
                                        isActive = isActive && gasDayjs.isBefore(toDayjs(item.end_date));
                                    }
                                }

                                if (srchGasDayTabDownlaod) {
                                    const gasDayjs = toDayjs(srchGasDayTabDownlaod);
                                    if (item?.start_date && gasDayjs && gasDayjs.isValid()) {
                                        isActive = isActive && gasDayjs.isSameOrAfter(toDayjs(item.start_date));
                                    }

                                    if (item?.end_date && gasDayjs && gasDayjs.isValid()) {
                                        isActive = isActive && gasDayjs.isBefore(toDayjs(item.end_date));
                                    }
                                }

                                return isShipper && isActive;
                            }).map((item: any) => ({
                                value: item?.id_name ?? '',
                                label: item?.name ?? '',
                            }))
                            }
                        />
                    }

                    {/* <InputSearch
                        id="searchVersion"
                        label="Version"
                        type="select"
                        value={srchVersion}
                        onChange={(e) => setSrchVersion(e.target.value)}
                        options={dataVersion?.map((item: any) => ({
                            value: item?.execute_timestamp,
                            label: dayjs(item?.execute_timestamp * 1000).format('DD/MM/YYYY HH:mm')
                        }))}
                    /> */}

                    <InputSearch
                        id="searchContractCode"
                        label="Contract Code"
                        type="select"
                        value={srchContractCode}
                        isDisabled={Array.isArray(srchShipperName) && srchShipperName?.length < 1}
                        onChange={(e) => setSrchContractCode(e.target.value)}
                        // options={dataContract
                        //     ?.filter((f:any) => f?.status_capacity_request_management_id !== 3)
                        //     ?.filter((contract: any) => {
                        //     let isShipper = true;
                        //     let isActive = true;
                        //     if (srchShipperName?.length > 0) {
                        //         isShipper = srchShipperName?.includes(contract?.group?.id_name)
                        //     }

                        //     const endDate = contract.terminate_date ?? contract.extend_deadline ?? contract.contract_end_date
                        //     if (tabIndex == 0 && srchGasDay) {
                        //         const gasDayMonth = toDayjs(srchGasDay).startOf("month")
                        //         if (contract.contract_start_date) {
                        //             const contractStartMonth = toDayjs(
                        //                 contract.contract_start_date
                        //             ).startOf("month");

                        //             isActive =
                        //                 isActive &&
                        //                 gasDayMonth.isSameOrAfter(
                        //                     contractStartMonth,
                        //                     "month"
                        //                 );
                        //         }

                        //         if (endDate) {
                        //             const contractEndMonth = toDayjs(endDate).subtract(1, "day").startOf(
                        //                 "month"
                        //             );

                        //             isActive =
                        //                 isActive &&
                        //                 (
                        //                     gasDayMonth.isSame(
                        //                         contractEndMonth,
                        //                         "month"
                        //                     ) ||
                        //                     gasDayMonth.isBefore(
                        //                         contractEndMonth,
                        //                         "month"
                        //                     )
                        //                 );
                        //         }
                        //     }

                        //     if (tabIndex == 1 && srchGasDayTabDownlaod) {
                        //         const gasDayDownloadMonth = toDayjs(
                        //             srchGasDayTabDownlaod
                        //         ).startOf("month");

                        //         if (contract?.contract_start_date) {
                        //             const contractStartMonth = toDayjs(
                        //                 contract.contract_start_date
                        //             ).startOf("month");

                        //             // เดือนค้นหา ต้องเท่ากับหรือหลังเดือนเริ่มสัญญา
                        //             isActive =
                        //                 isActive &&
                        //                 gasDayDownloadMonth.isSameOrAfter(
                        //                     contractStartMonth,
                        //                     "month"
                        //                 );
                        //         }

                        //         if (endDate) {
                        //             const contractEndMonth = toDayjs(endDate).subtract(1, "day").startOf(
                        //                 "month"
                        //             );

                        //             // เดือนค้นหา ต้องเท่ากับหรือก่อนเดือนสิ้นสุดสัญญา
                        //             isActive =
                        //                 isActive &&
                        //                 (
                        //                     gasDayDownloadMonth.isSame(
                        //                         contractEndMonth,
                        //                         "month"
                        //                     ) ||
                        //                     gasDayDownloadMonth.isBefore(
                        //                         contractEndMonth,
                        //                         "month"
                        //                     )
                        //                 );
                        //         }
                        //     }

                        //     return isShipper && isActive
                        // })
                        // ?.map((item: any) => ({ // กรอง contract ตาม shipper
                        //     value: item?.contract_code,
                        //     label: item?.contract_code
                        // }))
                        options={dataContractFiltered?.map((item: any) => ({ // กรอง contract ตาม shipper
                            value: item?.contract_code,
                            label: item?.contract_code
                        }))
                        }
                    // options={dataContract?.filter((contract: any) => srchShipperName !== '' ? contract?.group?.id_name === srchShipperName : true).map((item: any) => ({ // กรอง contract ตาม shipper
                    //     value: item?.contract_code,
                    //     label: item?.contract_code
                    // }))}
                    />

                    <BtnSearch handleFieldSearch={()=> handleFieldSearch(null)} />
                    <BtnReset handleReset={handleReset} />
                </aside>

                <aside className="mt-auto ml-1 w-full sm:w-auto ">
                    <div className="flex flex-wrap gap-2 justify-end">
                        <BtnGeneral
                            textRender={"Approve"}
                            iconNoRender={true}
                            bgcolor={"#C8FFD7"}
                            generalFunc={() => openApproveModal('x', 'x')}
                            disable={disableApprove} // Active เมื่อ filter Gas Month และ Shipper Name
                            can_create={userPermission ? userPermission?.f_approved : false}
                        />
                    </div>
                </aside>
            </div>

            <Tabs
                value={tabIndex}
                onChange={handleChange}
                aria-label="tabs"
                sx={{
                    marginBottom: "-19px !important",
                    "& .MuiTabs-indicator": {
                        display: "none", // Remove the underline
                    },
                    "& .Mui-selected": {
                        color: "#58585A !important",
                    },
                }}
            >
                {
                    ["Report", "Download"]?.map((label, index) => (
                        <Tab
                            key={label}
                            label={label}
                            id={`tab-${index}`}
                            sx={{
                                fontFamily: "Tahoma !important",
                                border: "0.5px solid",
                                borderColor: "#DFE4EA",
                                borderBottom: "none",
                                borderTopLeftRadius: "9px",
                                borderTopRightRadius: "9px",
                                textTransform: "none",
                                padding: "8px 16px",
                                backgroundColor: tabIndex === index ? "#FFFFFF" : "#9CA3AF1A",
                                color: tabIndex === index ? "#58585A" : "#9CA3AF",
                                "&:hover": {
                                    backgroundColor: "#F3F4F6",
                                },
                            }}
                        />
                    ))
                }
            </Tabs>

            <div className="border-[#DFE4EA] border-[1px] p-2 rounded-tl-none rounded-tr-lg shadow-sm">
                <div>
                    <div className=" text-sm flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between pb-4">
                        <div onClick={handleTogglePopover}>
                            <Tune
                                className="cursor-pointer rounded-lg"
                                style={{ fontSize: "18px", color: '#2B2A87', borderRadius: '4px', width: '22px', height: '22px', border: '1px solid rgba(43, 42, 135, 0.4)' }}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                            <SearchInput onSearch={handleSearch} />
                            {
                                tabIndex == 0 &&
                                <BtnExport
                                    textRender={"Export"}
                                    data={filteredDataTable}
                                    path="balancing/balancing-monthly-report"
                                    can_export={userPermission ? userPermission?.f_export : false}
                                    columnVisibility={columnVisibility}
                                    initialColumns={initialColumns}
                                    disable={srchShipperName?.length === 0 || srchShipperName?.length === 1 || (srchShipperName?.length === dataShipper?.length) ? (isFilter ? false : true) : true}
                                    specificMenu={'balancing-monthly-report'}
                                    specificData={{
                                        "skip": 0, //fix
                                        "limit": 100,  //fix
                                        "month": month ? month : dayjs().format("MM"),
                                        "year": year ? year : dayjs().format("YYYY"),
                                        "shipperId": srchShipperName, //NGP-S01-001
                                        "contractCode": srchContractCode !== '' ? srchContractCode : "Summary" // Summary หรือ 2025-CNF-002 .....
                                    }}
                                />
                            }

                            {
                                tabIndex == 1 && <BtnExport
                                    textRender={"Export"}
                                    data={dataTabDownload}
                                    path="balancing/balancing-monthly-report-download"
                                    can_export={userPermission ? userPermission?.f_export : false}
                                    columnVisibility={columnVisibility}
                                    initialColumns={initialColumnsDownload}
                                    specificMenu={'balancing-monthly-report-download'}
                                    disable={dataTabDownload?.length > 0 ? false : true}
                                    specificData={{
                                        "idAr": dataTabDownload?.flatMap((item: any) => item?.id)
                                    }}
                                />
                            }

                        </div>
                    </div>
                </div>

                {
                    isLoading ?
                        !isFilter && tabIndex == 0 ? <NodataTable textRender={'Please select filter to view the information.'} /> : <>
                            <TabTable value={tabIndex} index={0}>
                                {/* <TableReport
                                    tableData={paginatedData}
                                    allData={filteredDataTable}
                                    currentPage={currentPage}
                                    itemsPerPage={itemsPerPage}
                                    dataSummary={dataSummary}
                                    isLoading={isLoading}
                                    columnVisibility={columnVisibility}
                                    userPermission={userPermission}
                                    areaMaster={areaMaster}
                                /> */}

                                <TableReportExpanded
                                    tableData={paginatedDataExpanded}
                                    allData={filteredDataTableExpanded}
                                    currentPage={currentPage}
                                    itemsPerPage={itemsPerPage}
                                    dataSummary={dataSummary}
                                    isLoading={isLoading}
                                    columnVisibility={columnVisibility}
                                    userPermission={userPermission}
                                    areaMaster={areaMaster}
                                />
                            </TabTable>
                        </>
                        : <TableSkeleton />
                }

                <TabTable value={tabIndex} index={1}>
                    <TableDownload
                        // tableData={dataTable}
                        // tableData={dataTabDownload}
                        // tableData={dataTabDownload ? paginatedDataDownload : []}
                        tableData={paginatedDataDownload ? paginatedDataDownload : []}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        setModalErrorMsg={setModalErrorMsg}
                        setModalErrorOpen={setModalErrorOpen}
                        columnVisibility={columnVisibility}
                        userPermission={userPermission}
                        dataShipper={dataShipper}
                    />
                </TabTable>
            </div>

            <PaginationComponent
                // totalItems={tabIndex == 0 ? filteredDataTable ? filteredDataTable?.length : [] : dataTabDownload?.length}
                totalItems={tabIndex == 0 ? filteredDataTableExpanded ? filteredDataTableExpanded?.length : [] : dataTabDownload?.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            <ModalComponent
                open={isModalSuccessOpen}
                handleClose={handleCloseModal}
                title="Approved"
                description="Your report has been approved."
            />

            <ModalComponent
                open={isModalErrorOpen}
                handleClose={() => {
                    setModalErrorOpen(false);
                    if (resetForm) resetForm();
                }}
                title="Failed"
                description={
                    <div>
                        {
                            typeof modalErrorMsg === 'string' && modalErrorMsg.includes('<br/>') ?
                                <ul className="text-start list-disc">
                                    {
                                        modalErrorMsg.split('<br/>').map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))
                                    }
                                </ul>
                                :
                                <div className="text-center">
                                    {modalErrorMsg ?? ''}
                                </div>
                        }
                    </div>
                }
                stat="error"
            />

            <ColumnVisibilityPopover
                open={open}
                anchorEl={anchorEl}
                setAnchorEl={setAnchorEl}
                columnVisibility={columnVisibility}
                handleColumnToggle={handleColumnToggle}
                initialColumns={tabIndex == 0 ? initialColumns : initialColumnsDownload}
            />

        </div>
    )
}

export default ClientPage;