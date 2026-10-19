import React, { useMemo } from "react";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
} from "@headlessui/react";
import { useEffect, useState } from "react";
import { formatDate } from "@/utils/generalFormatter";
import { InputSearch } from "@/components/other/SearchForm";
import { Button } from "@material-tailwind/react";
import { Add } from "@mui/icons-material";
import Spinloading from "@/components/other/spinLoading";
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AppTable from "@/components/table/AppTable";
import { ColumnDef, Row, SortingState, VisibilityState } from "@tanstack/react-table";
import { getService, postService } from "@/utils/postService";
import Spinloading2 from "@/components/other/spinLoading2";

type FormExampleProps = {
    open: boolean;
    typeConceptData: any[];
    shipperGroupData: any[];
    conceptPointData: any[];
    actionBy: any;
    setModalSuccessMsg: any;
    setModalSuccessOpen: any;
    setModalErrorMsg: any;
    setModalErrorOpen: any;
    onClose: () => void;
};

const ModalLimit: React.FC<FormExampleProps> = ({
    open,
    typeConceptData = [],
    shipperGroupData = [],
    conceptPointData = [],
    actionBy,
    setModalSuccessMsg,
    setModalSuccessOpen,
    setModalErrorMsg,
    setModalErrorOpen,
    onClose,
}) => {
    const [srchShipper, setSrchShipper] = useState('');
    const [srchConceptPointType, setSrchConceptPointType] = useState<any>([]);
    const [srchConceptPoint, setSrchConceptPoint] = useState<any>([]);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isTableLoading, setIsTableLoading] = useState<boolean>(true);

    const [dataTable, setDataTable] = useState<any[]>([]);
    const [editedDataTable, setEditedDataTable] = useState<any[]>([]);
    const [filteredDataTable, setFilteredDataTable] = useState<any[]>([]);
    
    // ############### COLUMN SHOW/HIDE ###############
    const initialColumns: any = [
      { key: 'group.name', label: 'Shipper Name', visible: true },
      { key: 'concept_point.concept_point', label: 'Concept Point', visible: true },
      { key: 'create_by', label: 'Created by', visible: true },
      { key: 'deleted_by', label: 'Deleted by', visible: true }
    ];

    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            {
                accessorKey: "concept_point.concept_point",
                header: "Concept Point",
                enableSorting: true,
                cell: ({ getValue, row }: { getValue: () => any, row: Row<any> }) => {
                    const value = getValue()
                    return (
                        <div>{value ? value : ''}</div>
                    )
                },
            },
            {
                accessorKey: "concept_point.type_concept_point.name",
                header: "Type",
                width: 250,
                enableSorting: true,
                cell: ({ getValue, row }: { getValue: () => any, row: Row<any> }) => {
                    const value = getValue()
                    return (
                        <div>{value ? value : ''}</div>
                    )
                },
            },
            {
                accessorKey: "create_by",
                header: "Created by",
                
                enableSorting: true,
                accessorFn: (row) => `${`${row?.create_by_account?.first_name} ` || ''}${row?.create_by_account?.last_name} ${row?.create_date ? formatDate(row?.create_date) : ''}`,
                cell: (info) => {
                    const row: any = info?.row?.original
                    return (
                        <div>
                            <span className={`text-[#464255]`}>{row?.create_by_account?.first_name} {row?.create_by_account?.last_name}</span>
                            <div className="text-gray-500 text-xs">{row?.create_date ? formatDate(row?.create_date) : ''}</div>
                        </div>
                    )
                }
            },
            {
                accessorKey: "action",
                id: 'actions',
                header: "Action",
                align: 'center',
                enableSorting: false,
                size: 100,
                cell: (info) => {
                    const row: any = info?.row?.original;
                    return (
                        <DeleteOutlineOutlinedIcon
                            className={`text-[#EA6060] bg-[#ffffff] border border-[#DFE4EA] rounded-md p-1 cursor-pointer`}
                            onClick={() => setEditedDataTable(editedDataTable.filter((item: any) => item.concept_point_id != row.concept_point_id || item.group_id?.toString() != srchShipper))}
                        />
                    )
                }
            },
        ], [editedDataTable, srchShipper]
    )

    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 1000,
    });

    const addLimit = () => {
        let newList = [...editedDataTable]
        srchConceptPoint.map((item: any) => {
            const existinglist = dataTable.filter((existingData: any) => existingData.group_id?.toString() == srchShipper && existingData.concept_point_id?.toString() == item)
            if(existinglist.length > 0){
                newList.push(...existinglist)
            }
            else{
                newList.push({
                    id: undefined,
                    group_id: Number(srchShipper),
                    concept_point_id: Number(item),
                    concept_point: conceptPointData.find((conceptPoint: any) => conceptPoint.id?.toString() == item),
                    group: shipperGroupData.find((group: any) => group.id?.toString() == srchShipper),
                    create_by: actionBy?.id,
                    create_by_account: actionBy,
                    create_date: new Date(),
                    create_date_num: new Date().getTime()
                })
            }
        })

        setSrchConceptPoint([])
        setEditedDataTable(newList)
    }

    const handleFormSubmit = async () => {
        if (isLoading) return;
        setIsLoading(true)
        let dataMap = {
            limitData: editedDataTable.map((item: any) => ({
                group_id: item.group_id,
                concept_point_id: item.concept_point_id
            }))
        };
        
        let statusCode = 200;
        const res_period = await postService(
            '/master/asset/limit-concept-point-manage',
            dataMap,
            (status: number) => {
                statusCode = status
            }
        );
        const statusCode2 = res_period?.response?.data?.statusCode || res_period?.response?.data?.status || res_period?.status || res_period?.statusCode || res_period?.code || res_period?.response?.status || statusCode;
        const errorMsg2 = res_period?.response?.data?.error || res_period?.data?.error || res_period?.response?.error || res_period?.error;

        if (statusCode2 != 200 && statusCode2 != 201) {
            setModalErrorMsg(errorMsg2 || '');
            setModalErrorOpen(true)
        } else {
            setModalSuccessMsg('Concept Point Limit has been updated.')
            setModalSuccessOpen(true);
            handleClose();
        }
        setIsLoading(false)

    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setSrchShipper('');
            setSrchConceptPoint([]);
            setSrchConceptPointType([]);
            setDataTable([]);
            setEditedDataTable([]);
            setFilteredDataTable([]);
        }, 200);
    }

    //load data
    useEffect(() => {
        if (open) {
            setIsTableLoading(false);
            getService(`/master/asset/limit-concept-point`).then((limit_concept_point_data: any) => {
                if(Array.isArray(limit_concept_point_data)) {
                    setDataTable(limit_concept_point_data);
                    setEditedDataTable(limit_concept_point_data);
                }
            }).finally(() => {
                setIsTableLoading(true);
            })
        }
    }, [open]);

    useEffect(() => {
        if(srchShipper){
            setFilteredDataTable(editedDataTable
                .filter((item: any) => item.group_id?.toString() == srchShipper && (
                    (Array.isArray(srchConceptPointType) && srchConceptPointType.length > 0) ?
                    srchConceptPointType.includes(item.concept_point?.type_concept_point_id?.toString() || '') :
                    true
                ))
                .sort((a: any, b: any) => (a.concept_point?.concept_point || '').localeCompare(b.concept_point?.concept_point || ''))
            );
        }
        else{
            setFilteredDataTable([]);
        }
    }, [editedDataTable, srchShipper, srchConceptPointType]);


    useEffect(() => {
      console.log('srchConceptPointType : ', srchConceptPointType);
    }, [srchConceptPointType])
    
    useEffect(() => {
      console.log('conceptPointData : ', conceptPointData);
    }, [conceptPointData])
    

    return (
        <>

            <Dialog open={open} onClose={handleClose} className="relative z-20">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-[#000000] bg-opacity-45 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
                />
                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                            transition
                            className="flex transform transition-all inset-0 rounded-lg text-left data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in  data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                        >

                            <div className="flex inset-0 items-center justify-center ">
                                <div className="flex flex-col items-center justify-center gap-2 rounded-md w-[80vw]">
                                    <Spinloading spin={isLoading} rounded={20} />
                                    <div
                                        className="bg-white p-8 rounded-[20px] shadow-lg w-full max-w"
                                    >
                                        <h2 className="text-xl font-bold text-[#00ADEF] mb-4 pb-5">Concept Point Limit</h2>

                                        <div className="">
                                            <div className="grid grid-cols-2 gap-2 items-center">
                                                <div className="min-w-0">
                                                    <InputSearch
                                                        id="inputShipperName"
                                                        label="Shipper Name"
                                                        type="select"
                                                        showRequire={true}
                                                        value={srchShipper}
                                                        onChange={(e) => {
                                                            const value: any = e.target.value;
                                                            setSrchShipper(value)
                                                            setSrchConceptPointType(typeConceptData.map((item: any) => item?.id?.toString()))
                                                            setSrchConceptPoint([])
                                                            setEditedDataTable(dataTable)
                                                        }}
                                                        options={shipperGroupData.map((item: any) => ({
                                                            value: item.id?.toString(),
                                                            label: item.name
                                                        }))}
                                                        isFullWidth={true}
                                                        // customWidth={210}
                                                        // customWidthPopup={210}
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <InputSearch
                                                        id="inputTypeConcept"
                                                        label="Type Concept Point"
                                                        type="select-multi-checkbox"
                                                        value={srchConceptPointType}
                                                        onChange={(e) => {
                                                            setSrchConceptPointType(e.target.value)
                                                            setSrchConceptPoint([])
                                                        }}
                                                        options={typeConceptData.map((item: any) => ({
                                                            value: item.id?.toString(),
                                                            label: item.name
                                                        }))}
                                                        isFullWidth={true}
                                                        // customWidth={210}
                                                        // customWidthPopup={210}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2 mt-2">
                                                <div className="flex-1 min-w-0">
                                                    <InputSearch
                                                        id="inputConcept"
                                                        label="Concept Point"
                                                        type="select-multi-checkbox"
                                                        showRequire={false}
                                                        value={srchConceptPoint}
                                                        onChange={(e) => {
                                                            setSrchConceptPoint(e.target.value)
                                                        }}
                                                        // options={
                                                        //     conceptPointData
                                                        //     .filter((item: any) => {
                                                        //         let isType = true
                                                        //         let isNotExists = true
                                                        //         if((srchConceptPointType || []).length == 0){
                                                        //             isType = (srchConceptPointType || []).includes(item?.type_concept_point_id?.toString())
                                                        //         }
                                                                
                                                        //         isNotExists = !editedDataTable.some((existingData: any) => existingData.group_id?.toString() == srchShipper && existingData.concept_point?.concept_point == item.concept_point)

                                                        //         return isType && isNotExists
                                                        //     })
                                                        //     .sort((a: any, b: any) => (a.concept_point || '').localeCompare(b.concept_point || ''))
                                                        //     .map((item: any) => ({
                                                        //         value: item?.id?.toString(),
                                                        //         label: item.concept_point
                                                        //     })
                                                        // )}
                                                        options={
                                                            conceptPointData
                                                                .filter((item: any) => {
                                                                    const isType =
                                                                        (srchConceptPointType || []).length > 0 &&
                                                                        srchConceptPointType.includes(
                                                                            item?.type_concept_point_id?.toString()
                                                                        );

                                                                    const isNotExists = !editedDataTable.some(
                                                                        (existingData: any) =>
                                                                            existingData.group_id?.toString() === srchShipper &&
                                                                            existingData.concept_point_id?.toString() === item.id?.toString()
                                                                    );

                                                                    return isType && isNotExists;
                                                                })
                                                                .sort((a: any, b: any) =>
                                                                    (a.concept_point || '').localeCompare(
                                                                        b.concept_point || ''
                                                                    )
                                                                )
                                                                .map((item: any) => ({
                                                                    value: item?.id?.toString(),
                                                                    label: item?.concept_point
                                                                }))
                                                        }
                                                        isFullWidth={true}
                                                        // customWidth={210}
                                                        // customWidthPopup={210}
                                                    />
                                                </div>
                                                
                                                <Button
                                                    variant="outlined"
                                                    className={`flex items-center justify-center px-2 h-[40px] w-[40px] bg-[#24AB6A] border-none mt-auto ${(srchConceptPoint || []).length == 0 && 'bg-[#B6B6B6]'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    onClick={addLimit}
                                                    disabled={(srchConceptPoint || []).length == 0}
                                                >
                                                    <Add style={{ fontSize: "16px", color: "#fff" }} />
                                                </Button>
                                            </div>

                                            <AppTable
                                                data={filteredDataTable}
                                                columns={columns}
                                                exportBtn={
                                                    <div></div>
                                                }
                                                initialColumns={Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible]))}
                                                onColumnVisibilityChange={(columnKey: any) => {}}
                                                onFilteredDataChange={(filteredData: any) => {}}
                                                isLoading={isTableLoading}
                                                pagination={pagination}
                                                setPagination={setPagination}
                                                // manualPagination={true}
                                                filter={false}
                                                totalItems={0}
                                                showPagesize={false}
                                                fixHeight={false}
                                                maxTableHeight={"max-h-[45dvh]"}
                                                // sorting={sorting}
                                                // setSorting={(next) => {
                                                //     setSorting(next);
                                                //     setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                                // }}
                                                // onQueryChange={handleQueryOnChange}
                                                // onQueryKeyDown={handleQueryKeyPress}
                                                // onQueryBlur={handleQueryKeyPress}
                                            />
                                        </div>

                                        <div className="flex justify-end pt-6">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="w-[167px] font-light bg-slate-100 text-black py-2 rounded-lg hover:bg-rose-500 focus:outline-none focus:bg-rose-500"
                                            >
                                                Cancel
                                            </button>

                                            {/* ถ้า filteredDataTable.length <= 0 disable ปุ่ม */}
                                            <button
                                                type="submit"
                                                onClick={handleFormSubmit}
                                                className={`w-[167px] font-light py-2 rounded-lg focus:outline-none ${!srchShipper ? "bg-gray-400 cursor-not-allowed" : "bg-[#00ADEF] text-white hover:bg-blue-600 focus:bg-blue-600"}`}
                                                disabled={!srchShipper}
                                            >
                                                Save
                                            </button>

                                        </div>
                                    </div>
                                </div>
                            </div>



                        </DialogPanel>
                    </div >
                </div >
            </Dialog >
        </>
        
    );
};

export default ModalLimit;
