import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react'
import { formatDate } from '@/utils/generalFormatter';
import getUserValue from '@/utils/getuserValue';
import { Tab, Tabs } from '@mui/material';
import NodataTable from '@/components/other/nodataTable';

type FormExampleProps = {
    data: any;
    dataRow: any;
    open: boolean;
    onClose: () => void;
};

const ModalComment: React.FC<FormExampleProps> = ({
    open,
    onClose,
    data,
    dataRow
}) => {

    const userDT: any = getUserValue();

    const isShipper =
        userDT?.account_manage?.[0]?.user_type?.id === 3 ||
        userDT?.account_manage?.[0]?.user_type_id === 3;

    const [tabMain, setTabMain] = useState(0);

    // =====================================================
    // Reset tab ทุกครั้งที่เปิด Modal
    // =====================================================
    useEffect(() => {
        if (open) {
            setTabMain(0);
        }
    }, [open]);

    // =====================================================
    // Filter Comment จาก data ล่าสุดโดยตรง
    // ไม่ต้องเก็บ commentsShipper/commentsTso/commentsReason
    // เป็น state อีก
    // =====================================================
    const commentsShipper = useMemo(() => {
        return (Array.isArray(data) ? data : []).filter(
            (item: any) =>
                item?.query_shipper_nomination_type_comment_id === 1
        );
    }, [data]);

    const commentsTso = useMemo(() => {
        return (Array.isArray(data) ? data : []).filter(
            (item: any) =>
                item?.query_shipper_nomination_type_comment_id === 2
        );
    }, [data]);

    const commentsReason = useMemo(() => {
        return (Array.isArray(data) ? data : []).filter(
            (item: any) =>
                item?.query_shipper_nomination_type_comment_id === 3
        );
    }, [data]);

    // =====================================================
    // เลือก Comment ตาม Tab ปัจจุบัน
    //
    // TSO:
    // 0 = Shipper
    // 1 = TSO
    // 2 = Reasons
    //
    // Shipper:
    // 0 = Shipper
    // 1 = Reasons
    // =====================================================
    const comments = useMemo(() => {

        if (isShipper) {
            if (tabMain === 0) {
                return commentsShipper;
            }

            return commentsReason;
        }

        if (tabMain === 0) {
            return commentsShipper;
        }

        if (tabMain === 1) {
            return commentsTso;
        }

        return commentsReason;

    }, [
        tabMain,
        isShipper,
        commentsShipper,
        commentsTso,
        commentsReason
    ]);

    const handleChangeTabMain = (
        event: React.SyntheticEvent,
        newValue: number
    ) => {
        setTabMain(newValue);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="relative z-20"
        >
            <div
                className={[
                    "fixed inset-0 bg-black/45",
                    "transition-opacity duration-100 ease-out",
                    open
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                ].join(" ")}
            />

            <div className="fixed inset-0 z-10 flex items-center justify-center">
                <DialogPanel
                    transition
                    className="flex w-auto transform transition-all bg-white inset-0 rounded-[20px] text-left data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                >
                    <div className="flex flex-col items-center gap-2 p-9">

                        {/* =====================================================
                            HEADER
                        ===================================================== */}
                        <div className="w-[700px]">
                            <h2 className="text-xl font-bold text-[#00ADEF] mb-4 pb-3">
                                Comment
                            </h2>

                            <div className="mb-4 w-full">
                                <div className="grid grid-cols-4 text-sm font-semibold text-[#58585A]">
                                    <p>Nominations Code</p>
                                    <p>Contract Code</p>
                                    <p>Shipper Name</p>
                                </div>

                                <div className="grid grid-cols-4 text-sm font-light text-[#58585A]">
                                    <p>
                                        {dataRow?.nomination_code || ''}
                                    </p>

                                    <p>
                                        {dataRow?.contract_code?.contract_code || ''}
                                    </p>

                                    <p>
                                        {dataRow?.group?.name || ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* =====================================================
                            TAB
                        ===================================================== */}
                        <div className="w-[700px]">
                            <Tabs
                                value={tabMain}
                                onChange={handleChangeTabMain}
                                aria-label="comment tabs"
                                sx={{
                                    '& .Mui-selected': {
                                        color: '#00ADEF !important',
                                        fontWeight: 'bold !important',
                                    },
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#00ADEF !important',
                                        width:
                                            tabMain === 0
                                                ? '63px !important'
                                                : '55px !important',
                                        transform:
                                            tabMain === 0
                                                ? 'translateX(30%)'
                                                : 'translateX(39%)',
                                        bottom: '10px',
                                    },
                                    '& .MuiTab-root': {
                                        minWidth: 'auto !important',
                                    },
                                }}
                            >
                                {(isShipper
                                    ? ['Shipper', 'Reasons']
                                    : ['Shipper', 'TSO', 'Reasons']
                                ).map((label, index) => (
                                    <Tab
                                        key={label}
                                        label={label}
                                        id={`tab-${index}`}
                                        sx={{
                                            fontFamily: 'Tahoma !important',
                                            textTransform: 'none',
                                            padding: '8px 16px',
                                            minWidth: '50px',
                                            maxWidth: '100px',
                                            flexShrink: 0,
                                            color:
                                                tabMain === index
                                                    ? '#58585A'
                                                    : '#464255',
                                        }}
                                    />
                                ))}
                            </Tabs>
                        </div>

                        {/* =====================================================
                            COMMENTS
                        ===================================================== */}
                        <div
                            className={`mb-1 w-full ${
                                comments?.length >= 2
                                    ? 'max-h-[350px] overflow-y-auto'
                                    : ''
                            }`}
                        >
                            {(comments || []).map((item: any) => (
                                <div
                                    key={item?.id}
                                    className="w-full h-auto mb-2 p-2 border rounded-lg"
                                >
                                    <div className="flex flex-col p-2">

                                        <div className="mb-2 flex justify-between items-center">

                                            <div className="flex items-baseline gap-2">

                                                <span className="rounded-[20px] px-1">
                                                    <div
                                                        className="flex min-w-[180px] max-w-[250px] w-auto text-center justify-center rounded-full p-1 text-[#464255]"
                                                        style={{
                                                            backgroundColor:
                                                                String(
                                                                    item
                                                                        ?.query_shipper_nomination_status
                                                                        ?.color
                                                                )
                                                        }}
                                                    >
                                                        {
                                                            item
                                                                ?.query_shipper_nomination_status
                                                                ?.name
                                                        }
                                                    </div>
                                                </span>

                                                <span className="rounded-md bg-[#D3E6F8] px-4 font-semibold text-[#464255]">
                                                    {
                                                        item
                                                            ?.nomination_version
                                                            ?.version
                                                    }
                                                </span>

                                                <span className="font-light">
                                                    By{' '}
                                                    <span className="font-bold !text-[#58585A]">
                                                        {item?.create_by_account
                                                            ? `${
                                                                  item
                                                                      ?.create_by_account
                                                                      ?.first_name ||
                                                                  ''
                                                              } ${
                                                                  item
                                                                      ?.create_by_account
                                                                      ?.last_name ||
                                                                  ''
                                                              }`
                                                            : ''}
                                                    </span>
                                                </span>
                                            </div>

                                            <span className="text-gray-500">
                                                {formatDate(
                                                    item?.create_date
                                                )}
                                            </span>

                                        </div>

                                        <div className="flex justify-between items-center w-full border rounded-lg mb-2 p-4">
                                            <p className="flex items-center break-words text-ellipsis overflow-hidden">
                                                {item?.remark}
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            ))}

                            {comments?.length <= 0 && (
                                <NodataTable />
                            )}
                        </div>

                        {/* =====================================================
                            CLOSE
                        ===================================================== */}
                        <div className="w-full flex justify-end pt-8">
                            <button
                                onClick={onClose}
                                className="w-[167px] font-bold bg-[#00ADEF] text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
};

export default ModalComment;