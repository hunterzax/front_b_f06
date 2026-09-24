import { useEffect } from "react";
import React, { FC, useState } from 'react';
import { fillMissingUpdateByAccount, formatDate, formatDateNoTime, formatDateTimeSec, formatNumber, getContrastTextColor } from '@/utils/generalFormatter';

import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { table_col_arrow_sort_style, table_header_style, table_row_style, table_sort_header_style } from "@/utils/styles";
import { handleSort } from "@/utils/sortTable";
interface TableProps {
    tableData: any;
    isLoading?: any;
    columnVisibility?: any;
}

const TableZoneHistory: React.FC<TableProps> = ({ tableData, isLoading, columnVisibility }) => {
     

    const [sortState, setSortState] = useState({ column: null, direction: null });
    const [sortedData, setSortedData] = useState<any>([]);

    // useEffect(() => {
    //     if (tableData && tableData.length > 0) {
    //         setSortedData(tableData);
    //     } else {
    //         setSortedData([]);
    //     }
    // }, [tableData]);

    useEffect(() => {
        if (tableData && tableData.length > 0) {
            const normalized = fillMissingUpdateByAccount(tableData);
            setSortedData(normalized);
        } else {
            setSortedData([]);
        }
    }, [tableData]);

    const getArrowIcon = (column: string) => {
        return <div className={`${table_col_arrow_sort_style}`}>
            <ArrowDropUpIcon sx={{ fontSize: 18, opacity: sortState.column === column && sortState.direction === "asc" ? 1 : 0.4, }} />
            <ArrowDropDownIcon sx={{ fontSize: 18, opacity: sortState.column === column && sortState.direction === "desc" ? 1 : 0.4, }} />
        </div>
    };

    return (
        <div className={`h-[calc(100vh-500px)] overflow-y-auto block  rounded-t-md relative z-1`}>

            <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-xs text-[#ffffff] bg-[#1473A1] sticky top-0 z-10">
                    <tr className="h-9">

                        {columnVisibility.entry_exit && (
                            <th scope="col" className={`${table_sort_header_style} text-center`} onClick={() => handleSort("entry_exit_id", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`Entry / Exit`}
                                {getArrowIcon("entry_exit_id")}
                            </th>
                        )}

                        {columnVisibility.zone_name && (
                            <th scope="col" className={`${table_sort_header_style}  text-center`} onClick={() => handleSort("name", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`Zone Name`}
                                {getArrowIcon("name")}
                            </th>
                        )}

                        {columnVisibility.description && (
                            <th scope="col" className={`${table_sort_header_style}`} onClick={() => handleSort("description", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`Description`}
                                {getArrowIcon("description")}
                            </th>
                        )}

                        {columnVisibility.start_date && (
                            <th scope="col" className={`${table_sort_header_style}`} onClick={() => handleSort("start_date", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`Start Date`}
                                {getArrowIcon("start_date")}
                            </th>
                        )}

                        {columnVisibility.end_date && (
                            <th scope="col" className={`${table_sort_header_style}`} onClick={() => handleSort("end_date", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`End Date`}
                                {getArrowIcon("end_date")}
                            </th>
                        )}

                        {columnVisibility.created_by && (
                            <th scope="col" className={`${table_sort_header_style}`} onClick={() => handleSort("create_by_account.first_name", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`Created by`}
                                {getArrowIcon("create_by_account.first_name")}
                            </th>
                        )}

                        {columnVisibility.updated_by && (
                            <th scope="col" className={`${table_sort_header_style}`} onClick={() => handleSort("update_by_account.first_name", sortState, setSortState, setSortedData, fillMissingUpdateByAccount(tableData))}>
                                {`Updated by`}
                                {getArrowIcon("update_by_account.first_name")}
                            </th>
                        )}

                    </tr>
                </thead>

                <tbody>
                    {sortedData && sortedData?.map((row: any, index: any) => (
                        <tr
                            key={row?.id}
                            className={`${table_row_style}`}
                        >
                            {columnVisibility.entry_exit && (
                                <td className="px-2 py-1 justify-center ">
                                    {row?.entry_exit &&
                                        <div className="flex justify-center items-center">
                                            <div className="flex w-auto min-w-[100px] max-w-[150px] justify-center rounded-full p-1 text-[#464255]" style={{ backgroundColor: row?.entry_exit?.color }}>
                                                {`${row?.entry_exit?.name}`}
                                            </div>
                                        </div>
                                    }
                                </td>
                            )}

                            {columnVisibility.zone_name && (
                                <td className="px-2 py-1 justify-center ">
                                    {row?.name &&
                                        <div className="flex justify-center items-center">
                                            <div className="flex w-[90%] max-w-[200px] justify-center rounded-full p-1 text-[#464255]" style={{ backgroundColor: row?.color, color: getContrastTextColor(row?.color) }}>
                                                {`${row?.name}`}
                                            </div>
                                        </div>
                                    }
                                </td>
                            )}

                            {columnVisibility.description && (
                                <td className="px-2 py-1 text-[#464255] w-[450px]">{row?.description ? row?.description : ''}</td>
                            )}

                            {columnVisibility.start_date && (
                                <td className="px-2 py-1 text-[#464255]">{row?.start_date ? formatDateNoTime(row?.start_date) : ''}</td>
                            )}

                            {columnVisibility.end_date && (
                                <td className="px-2 py-1 text-[#0DA2A2]">{row?.end_date ? formatDateNoTime(row?.end_date) : ''}</td>
                            )}

                            {columnVisibility.created_by && (
                                <td className="px-2 py-1 text-[#464255]">
                                    <div>
                                        <span className="text-[#464255]">{row?.create_by_account?.first_name} {row?.create_by_account?.last_name}</span>
                                        <div className="text-gray-500 text-xs">{formatDate(row?.create_date)}</div>
                                    </div>
                                </td>
                            )}

                            {columnVisibility.updated_by && (
                                <td className="px-2 py-1 text-[#464255]">
                                    <div>
                                        <span className="text-[#464255]">{row?.update_by_account?.first_name} {row?.update_by_account?.last_name}</span>
                                        <div className="text-gray-500 text-xs">{row?.update_date ? formatDateTimeSec(row?.update_date) : ''}</div>
                                    </div>
                                </td>
                            )}

                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    )
}

export default TableZoneHistory;