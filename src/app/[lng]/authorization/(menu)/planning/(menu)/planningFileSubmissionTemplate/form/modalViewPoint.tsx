import React from 'react';
import { Dialog, DialogPanel } from '@headlessui/react'
type FormExampleProps = {
    data: any;
    open: boolean;
    onClose: () => void;
};

const ModalViewPoint: React.FC<FormExampleProps> = ({
    open,
    onClose,
    data,
}) => {

    // clear state when closes
    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} className="relative z-20">
            {/* <div className="fixed inset-0 bg-[#000000] bg-opacity-45 transition-opacity" /> */}
            <div className={["fixed inset-0 bg-black/45", "transition-opacity duration-100 ease-out", open ? "opacity-100" : "opacity-0 pointer-events-none"].join(" ")} />
            <div className="fixed inset-0 z-10 flex items-center justify-center">
                <DialogPanel
                    transition
                    className="flex w-auto transform transition-all bg-white inset-0 rounded-[20px] text-left data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95"
                >
                    <div className="flex flex-col items-center gap-2 p-8">
                        <div className="w-[400px]">
                            <h2 className="text-xl font-bold text-[#00ADEF] mb-4 pb-3">{`View Nomination Point`}</h2>
                        </div>

                        <div className="mb-4 w-[100%] border-[1px] border-[#dfdfdf] p-3 rounded-md">
                            <div className='text-[#58585A] font-bold text-[14px]'>
                                All Nomination Point ({data?.length})
                            </div>
                            <div className='text-[#58585A] font-light text-[14px] max-h-[40dvh] overflow-y-auto'>
                                {
                                    (data || [])
                                    .sort((a: any, b: any) => (a?.nomination_point?.nomination_point || '').toLowerCase().localeCompare((b?.nomination_point?.nomination_point || '').toLowerCase()))
                                    .map((item: any, index: number) => (
                                        <div
                                            key={index}
                                            className="relative w-fit h-[35px] p-2 text-[13px] text-[#58585A] break-all"
                                        >
                                            {item?.nomination_point?.nomination_point || ''}
                                        </div>
                                    ))
                                }
                            </div>

                        </div>

                        <div className="w-full flex justify-end pt-8">
                            <button
                                onClick={handleClose}
                                className="w-[167px] font-bold bg-[#00ADEF] text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600">
                                {'Close'}
                            </button>
                        </div>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>

    );
};

export default ModalViewPoint;