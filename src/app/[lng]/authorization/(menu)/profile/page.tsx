"use client";
import { useState } from "react";
import getUserValue from "@/utils/getuserValue";
import { patchService } from "@/utils/postService";
import UploadIcon from '@mui/icons-material/Upload';
import ModalAction from "./form/modalAction";
import ModalComponent from "@/components/other/ResponseModal";
import { useRouter } from "next/navigation";
import ArrowBackIos from '@mui/icons-material/ArrowBackIosOutlined';
import { decryptData, encryptData } from "@/utils/encryptionData";
import DefaultProfileAvatar from "@/components/other/DefaultProfileAvatar";

interface ClientProps {
    params: {
        lng: string;
    };
}

const ClientPage: React.FC<ClientProps> = () => {
    const router = useRouter();

    const userDT: any = getUserValue();
    let userSignature: any = null;
    try {
        const storedSig = typeof window !== 'undefined' ? localStorage.getItem("sigUrl") : null;
        userSignature = storedSig ? decryptData(storedSig) : null;
    } catch (e) {
        userSignature = null;
    }

    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [formOpen, setFormOpen] = useState(false);
    const [fileUrl, setFileUrl] = useState('');

    const inputClass = "text-sm block md:w-full text-[#262626] p-2 ps-5 pe-10 !bg-[#DFE4EA] h-[40px] rounded-lg border-[1px] bg-white border-[#DFE4EA] outline-none bg-opacity-100 focus:border-[#00ADEF]";

    const [isModalSuccessOpen, setModalSuccessOpen] = useState(false);
    const handleCloseModal = () => setModalSuccessOpen(false);
    const [resetForm, setResetForm] = useState<(() => void) | null>(null);
    const fdInterface: any = {
        document_name: '',
        file: '',
        description: '',
        role: [],
    };
    const [formData, setFormData] = useState(fdInterface);

    const handleFormSubmit = async (data: any) => {
        if (!data) return;
        const patchData = {
            signature: data?.url
        };
        setFileUrl(data?.url || '');
        if (typeof window !== 'undefined' && data?.url) {
            localStorage.setItem("sigUrl", encryptData(data.url));
        }

        switch (formMode) {
            case "create":
                try {
                    await patchService(`/master/account-manage/signature/${userDT?.id}`, patchData);
                    setModalSuccessOpen(true);
                } catch (error) {
                    // Error updating signature
                }
                setFormOpen(false);
                break;
            case "edit":
                setFormOpen(false);
                setModalSuccessOpen(true);
                break;
        }
        if (resetForm) resetForm();
    };

    const openCreateForm = () => {
        setFormMode('create');
        setFormData(fdInterface);
        setFormOpen(true);
    };

    const fullName = [userDT?.first_name, userDT?.last_name].filter(Boolean).join(" ").trim();
    const signatureSrc = fileUrl || userSignature || userDT?.signature || '';

    return (
        <>
            <div
                className="underline text-[#333333] px-4 cursor-pointer"
                onClick={() => router.back()}
            >
                <ArrowBackIos style={{ fontSize: "14px" }} /> Back
            </div>
            <div className="flex w-full inset-0 items-center justify-center -mt-10">
                <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-md">

                    <div className="grid grid-cols-2 gap-4 pt-4 w-[800px]">
                        <div className="col-span-2 flex items-center space-x-4">
                            <DefaultProfileAvatar
                                width={30}
                                height={30}
                                className="w-[100px] h-[100px] bg-cover rounded-full"
                            />
                            <div>
                                <div className="font-bold text-[20px]">
                                    {fullName}
                                </div>
                                <div className="text-[16px] py-1">
                                    {userDT?.email ?? ''}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="first_name"
                                className="block mb-2 text-sm font-light text-[#000000]"
                            >
                                First Name
                            </label>
                            <input
                                id="first_name"
                                type="text"
                                value={userDT?.first_name ?? ''}
                                readOnly={true}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="last_name"
                                className="block mb-2 text-sm font-light text-[#000000]"
                            >
                                Last Name
                            </label>
                            <input
                                id="last_name"
                                type="text"
                                value={userDT?.last_name ?? ''}
                                readOnly={true}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-2 text-sm font-light text-[#000000]"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="text"
                                value={userDT?.email ?? ''}
                                readOnly={true}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="comp_group"
                                className="block mb-2 text-sm font-light text-[#000000]"
                            >
                                Company/Group Name
                            </label>
                            <input
                                id="comp_group"
                                type="text"
                                value={userDT?.account_manage?.[0]?.group?.name ?? ''}
                                readOnly={true}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <div>
                                <label
                                    htmlFor="e_sig"
                                    className="block mb-2 pt-3 text-sm font-light text-[#000000]"
                                >
                                    E-Signature
                                </label>
                                <img
                                    id="e_sig"
                                    src={signatureSrc}
                                    alt="E-Signature"
                                    className="h-[100px] w-[200px] object-contain border rounded-[6px] bg-white"
                                />
                            </div>
                            <div className="pt-5">
                                <label className="bg-[#E8F3F6] text-[#1473A1] items-center font-light rounded-[6px] text-sm text-justify px-5 py-3 cursor-pointer" onClick={openCreateForm}>
                                    Upload <UploadIcon />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-full justify-end pt-6">
                        <button
                            type="submit"
                            onClick={() => { setModalSuccessOpen(true) }}
                            className="w-[167px] h-[44px] font-bold bg-[#00ADEF] text-white py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:bg-blue-600"
                        >
                            Save
                        </button>
                    </div>
                </div>

                <ModalAction
                    mode={formMode}
                    data={formData}
                    open={formOpen}
                    onClose={() => {
                        setFormOpen(false);
                        if (resetForm) {
                            setTimeout(() => {
                                resetForm();
                            }, 200);
                        }
                    }}
                    onSubmit={handleFormSubmit}
                    setResetForm={setResetForm}
                />

                <ModalComponent
                    open={isModalSuccessOpen}
                    handleClose={handleCloseModal}
                    title="Success"
                    description="Your Profile has been updated."
                />

            </div>
        </>
    );
};

export default ClientPage;
