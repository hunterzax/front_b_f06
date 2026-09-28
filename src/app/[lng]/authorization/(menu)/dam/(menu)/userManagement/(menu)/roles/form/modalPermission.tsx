import React, { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import Switch from '@mui/material/Switch';
import "@/app/globals.css";
import { postService } from '@/utils/postService';
import { toDayjs } from '@/utils/generalFormatter';

type RoleMgnProps = {
    open: boolean;
    handleClose: () => void;
    id: string;
    token: any;
    data: any;
    dataRole: any;
};

const RoleMgnModal: React.FC<RoleMgnProps> = ({
    open, handleClose, data, dataRole
}) => {
    const [items, setItems] = useState<any[]>(Array.isArray(data) ? data : []);

    // ------ ออล เลือกทั้งหมด ------
    const PERM_FIELDS = ["f_view", "f_create", "f_edit", "f_import", "f_export", "f_approved", "f_noti_inapp", "f_noti_email", "b_manage"] as const;

    // true ถ้าทุกฟิลด์ที่ไม่ disabled ถูกเปิดอยู่ทั้งหมด
    const isAllTableChecked = (itemsList: any[]) => {
        const list = Array.isArray(itemsList) ? itemsList : [];
        if (list.length === 0) return false;
        const enabledCells = list.flatMap((i: any) =>
            PERM_FIELDS.map(f => ({ f, v: i?.[f] }))
        ).filter((c: any) => c && c?.v !== 2);

        if (!enabledCells || enabledCells.length === 0) return false;
        return enabledCells.every((c: any) =>
            c?.f === "b_manage" ? Boolean(c?.v) : c?.v === 1
        );
    };

    const handleToggleAllTable = async (checked: boolean) => {
        // อัปเดต state ฝั่ง UI
        setItems((prev: any) => (Array.isArray(prev) ? prev : []).map((i: any) => {
            if (!i) return i;
            const next: any = { ...i };
            for (const f of PERM_FIELDS) {
                const v = i?.[f];
                if (v === 2) continue; // ข้าม disabled

                if (f === "b_manage") {
                    next[f] = checked; // boolean
                } else {
                    next[f] = checked ? 1 : 0; // 1/0
                }
            }
            return next;
        }));

        // ยิง bulk API ครั้งเดียว
        try {
            const ids = (Array.isArray(items) ? items : []).map((i: any) => i?.id).filter(Boolean);
            await postService('/master/account-manage/role-active-permission/bulk-table', {
                ids,
                fields: PERM_FIELDS,
                value: checked,
                skipDisabled: true, // คือจะ skip ตัวที่เป็น 2 (disable)
            });
        } catch (e) {
            // Error in bulk update
        }
    };

    // เลือกตัวเดียว
    const handleCheckboxChange = async (item: { id: any; }, field: string, value: any) => {
        if (!item?.id) return;
        const updatedItems = (Array.isArray(items) ? items : []).map((i: any) =>
            i?.id === item.id ? { ...i, [field]: field === 'b_manage' ? Boolean(value) : (value ? 1 : 0) } : i
        );
        setItems(updatedItems);

        const checked = value ? 1 : 0;
        const payload = {
            id: item.id,
            [field]: field === "b_manage" ? Boolean(value) : checked
        };
        try {
            await postService('/master/account-manage/role-active-permission', payload);
        } catch (error) {
            // Error updating API
        }
    };

    useEffect(() => {
        if (data) {
            setItems(Array.isArray(data) ? data : []);
        }
    }, [data]);

    const formatRoleDate = (dateVal: any) => {
        if (!dateVal) return '-';
        const d = toDayjs(dateVal);
        return d && typeof d.isValid === 'function' && d.isValid() ? d.format("DD/MM/YYYY") : '-';
    };

    const renderRows = (parentId: any, level = 0) => {
        const reName = (name: any) => {
            if (!name) return "";
            if (name === "OFO") {
                return "OFO/IF";
            } else if (name === "Intraday Balancing Report") {
                return "Intraday Balancing Management";
            } else if (name === "Intraday Balancing Report For Shipper") {
                return "Intraday Balancing Report";
            } else {
                return String(name);
            }
        };

        return (Array.isArray(items) ? items : [])
            .filter((item: any) => item && item?.menus?.parent === parentId)
            .map((item: any, index: number) => {
                if (!item) return null;
                const menuName = item?.menus?.name ?? '';
                return (
                    <React.Fragment key={item.menus?.id ?? index}>
                        <tr className='align-middle'>
                            <td className="border-b border-zinc-300 p-2 border-[#EBEBEB] bg-[#E4F2FB] text-[#464255]">
                                {level === 0 ? reName(menuName) : ""}
                            </td>
                            <td className="border-b border-zinc-300 p-2 border-[#EBEBEB] bg-[#3582D51A] text-[#464255]">
                                {level === 1 ? reName(menuName) : ""}
                            </td>
                            <td className="border-b border-zinc-300 p-2 border-[#EBEBEB] bg-[#E5F4F1] text-[#464255]">
                                {level === 2 ? reName(menuName) : ""}
                            </td>
                            <td className="border-b border-zinc-300 p-2 border-[#EBEBEB] bg-[#0DA2A21A] text-[#464255]">
                                {level === 3 ? reName(menuName) : ""}
                            </td>

                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_view === 1}
                                    disabled={item.f_view === 2}
                                    onChange={(e) => {
                                        handleCheckboxChange(item, "f_view", e.target.checked);
                                    }}
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_view === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_view === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_create === 1}
                                    disabled={item.f_create === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_create", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_create === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_create === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_edit === 1}
                                    disabled={item.f_edit === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_edit", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_edit === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_edit === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_import === 1}
                                    disabled={item.f_import === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_import", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_import === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_import === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_export === 1}
                                    disabled={item.f_export === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_export", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_export === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_export === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_approved === 1}
                                    disabled={item.f_approved === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_approved", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_approved === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_approved === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_noti_inapp === 1}
                                    disabled={item.f_noti_inapp === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_noti_inapp", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_noti_inapp === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_noti_inapp === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <input
                                    type="checkbox"
                                    checked={item.f_noti_email === 1}
                                    disabled={item.f_noti_email === 2}
                                    onChange={(e) =>
                                        handleCheckboxChange(item, "f_noti_email", e.target.checked)
                                    }
                                    className={`checkbox-custom w-4 h-4 rounded border-2 cursor-pointer 
                                    ${item.f_noti_email === 1 ? '!bg-[#00ADEF] !border-[#00ADEF]' : 'bg-gray-200 border-gray-300'} 
                                    ${item.f_noti_email === 2 ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </td>
                            <td className="border-b border-zinc-300 p-2 text-center align-middle">
                                <Switch
                                    checked={Boolean(item.b_manage)}
                                    onChange={(e) => {
                                        handleCheckboxChange(item, "b_manage", e.target.checked);
                                    }}
                                />
                            </td>
                        </tr>
                        {item.menus?.id != null ? renderRows(item.menus.id, level + 1) : null}
                    </React.Fragment>
                );
            });
    };

    return (
        <Dialog open={open} onClose={handleClose} className="relative z-50">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-[#000000] bg-opacity-45 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
            />
            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-6">
                    <DialogPanel
                        transition
                        className="flex transform transition-all inset-0 w-full max-w-[95%] sm:max-w-[93%] md:max-w-[90%] lg:max-w-[90%] rounded-[20px] text-left data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
                    >
                        <div className="flex flex-col items-center justify-center w-full">
                            <div className="max-h-[95vh] w-full overflow-y-auto scrollbar-hide">
                                <div className="flex flex-col items-center justify-center gap-4 p-4 sm:p-6 rounded-[20px] bg-[#ffffff]">
                                    <div className="w-full">
                                        <h2 className="text-lg sm:text-xl font-bold text-[#00ADEF] mb-4 pb-3">
                                            Role : {dataRole?.name ?? ''}
                                        </h2>

                                        <div className="mb-4 w-full sm:w-[75%]">
                                            <div className="grid grid-cols-[120px_120px_120px] text-xs sm:text-sm font-semibold gap-2 sm:gap-4">
                                                <p>User Type</p>
                                                <p>Start Date</p>
                                                <p>End Date</p>
                                            </div>

                                            <div className="grid grid-cols-[120px_120px_120px] text-xs sm:text-sm font-light gap-2 sm:gap-4">
                                                <p>{dataRole?.user_type?.name || '-'}</p>
                                                <p>{formatRoleDate(dataRole?.start_date)}</p>
                                                <p>{formatRoleDate(dataRole?.end_date)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-start items-start gap-3 pr-2 w-full">
                                        <label className="inline-flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={isAllTableChecked(items || [])}
                                                onChange={(e) => handleToggleAllTable(e.target.checked)}
                                                className="w-6 h-6 cursor-pointer"
                                            />
                                            <span className='font-semibold'>Select All </span>
                                        </label>
                                    </div>

                                    <div className="w-full h-[400px] sm:h-[600px] overflow-y-auto overflow-x-auto">
                                        <table className="table-auto w-full text-xs sm:text-sm rtl:text-right text-gray-500 whitespace-nowrap">
                                            <thead className="text-xs sm:text-sm text-[#ffffff] sticky top-0 z-10">
                                                <tr>
                                                    <th className="p-2 bg-[#3AB7EE] rounded-tl-lg text-center">Main Menu</th>
                                                    <th className="p-2 bg-[#3582D5] text-center">Menu</th>
                                                    <th className="p-2 bg-[#61C4B1] text-center">Sub Menu</th>
                                                    <th className="p-2 bg-[#0DA2A2] text-center">Secondary Submenu</th>

                                                    <th className="p-2 bg-[#1473A1]">View</th>
                                                    <th className="p-2 bg-[#1473A1]">Create</th>
                                                    <th className="p-2 bg-[#1473A1]">Edit</th>
                                                    <th className="p-2 bg-[#1473A1]">Import</th>
                                                    <th className="p-2 bg-[#1473A1]">Export</th>
                                                    <th className="p-2 bg-[#1473A1]">Approve</th>
                                                    <th className="p-2 bg-[#1473A1]">Notice Inapp</th>
                                                    <th className="p-2 bg-[#1473A1]">Notice Email</th>
                                                    <th className="p-2 bg-[#1473A1] rounded-tr-lg">Manage</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-[#ffffff]">{renderRows(0)}</tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default RoleMgnModal;