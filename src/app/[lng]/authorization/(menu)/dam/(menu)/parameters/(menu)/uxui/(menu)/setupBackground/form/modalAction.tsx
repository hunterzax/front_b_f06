import React, { useEffect, useRef, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
} from "@headlessui/react";
import { uploadFileService } from "@/utils/postService";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import Spinloading from "@/components/other/spinLoading";

type FormData = {
    url: string;
    file?: FileList;
};

type FormExampleProps = {
    mode?: "create" | "edit" | "view";
    data?: Partial<FormData>;
    open: boolean;
    onClose: () => void;
    onSubmit: SubmitHandler<FormData>;
    setResetForm: (reset: () => void) => void;
};

const REQUIRED_WIDTH = 1920;
const REQUIRED_HEIGHT = 1080;
const MAX_SIZE_MB = 10;

const ModalAction: React.FC<FormExampleProps> = ({
    mode = "create",
    data = {},
    open,
    onClose,
    onSubmit,
    setResetForm,
}) => {
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<any>({
        defaultValues: data,
    });

    const [fileName, setFileName] = useState("No file Choose");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    /*
     * แยก register ออกมา เพราะเราต้องใช้ ref ของ react-hook-form
     * ร่วมกับ fileInputRef ของเราเอง
     */
    const {
        ref: registerFileRef,
        ...fileRegister
    } = register("file", {
        validate: () => {
            /*
             * Edit mode:
             * ถ้ามี URL เดิมอยู่แล้ว ไม่จำเป็นต้องเลือกไฟล์ใหม่
             */
            if (
                mode === "edit" &&
                (previewUrl || data?.url)
            ) {
                return true;
            }

            if (!previewUrl) {
                return "Please Choose File";
            }

            return true;
        },
    });

    useEffect(() => {
        if (mode === "edit" || mode === "view") {
            const url = data?.url || "";

            setValue("url", url);

            if (url) {
                setFileName(url);
                setPreviewUrl(url);
            }
        } else {
            setValue("url", "");
            setFileName("No file Choose");
            setPreviewUrl(null);
        }
    }, [data, mode, setValue]);

    useEffect(() => {
        if (open === false) {
            const timer = setTimeout(() => {
                handleClose();
                clearErrors();
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [open]);

    useEffect(() => {
        setResetForm(() => reset);
    }, [reset, setResetForm]);

    /*
     * อ่าน Width / Height จริงของรูป
     */
    const getImageDimensions = (
        file: File
    ): Promise<{ width: number; height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);

            img.onload = () => {
                const width = img.naturalWidth;
                const height = img.naturalHeight;

                URL.revokeObjectURL(objectUrl);

                resolve({
                    width,
                    height,
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Cannot read image dimensions."));
            };

            img.src = objectUrl;
        });
    };

    /*
     * ล้าง file input
     * เพื่อให้ user สามารถเลือกไฟล์เดิมซ้ำได้
     */
    const clearFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) {
            setFileName("No file Choose");
            setPreviewUrl(null);
            setValue("url", "");
            return;
        }

        /*
         * ==============================
         * 1. ตรวจประเภทไฟล์
         * ==============================
         */
        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/jpg",
        ];

        if (!allowedTypes.includes(file.type)) {
            setFileName("Invalid file type.");

            setError("file", {
                type: "manual",
                message: "Please upload JPG, JPEG or PNG only.",
            });

            setPreviewUrl(null);
            setValue("url", "");
            clearFileInput();

            return;
        }

        /*
         * ==============================
         * 2. ตรวจขนาดไฟล์ไม่เกิน 10MB
         * ==============================
         */
        const maxSizeInBytes =
            MAX_SIZE_MB * 1024 * 1024;

        if (file.size > maxSizeInBytes) {
            setFileName(
                `The file is larger than ${MAX_SIZE_MB} MB.`
            );

            setError("file", {
                type: "manual",
                message: `The file is larger than ${MAX_SIZE_MB} MB.`,
            });

            setPreviewUrl(null);
            setValue("url", "");
            clearFileInput();

            return;
        }

        try {
            /*
             * ==============================
             * 3. ตรวจ Resolution
             * ต้อง 1920 × 1080 เท่านั้น
             * ==============================
             */
            const { width, height } =
                await getImageDimensions(file);

            console.log("Image dimensions:", {
                width,
                height,
            });

            if (
                width !== REQUIRED_WIDTH ||
                height !== REQUIRED_HEIGHT
            ) {
                setFileName(
                    `Invalid image size: ${width} x ${height}px`
                );

                setError("file", {
                    type: "manual",
                    message:
                        `Invalid image size. ` +
                        `Required ${REQUIRED_WIDTH} x ${REQUIRED_HEIGHT}px, ` +
                        `but uploaded image is ${width} x ${height}px.`,
                });

                setPreviewUrl(null);
                setValue("url", "");

                clearFileInput();

                return;
            }

            /*
             * ผ่าน validation ทั้งหมด
             */
            clearErrors("file");
            setFileName(file.name);

            /*
             * ==============================
             * 4. Upload
             * ==============================
             */
            setIsLoading(true);

            const response: any =
                await uploadFileService(
                    "/files/uploadimage/",
                    file
                );

            const uploadedUrl =
                response?.file?.url;

            if (!uploadedUrl) {
                throw new Error(
                    "Upload response does not contain file URL."
                );
            }

            setValue("url", uploadedUrl, {
                shouldValidate: true,
                shouldDirty: true,
            });

            setPreviewUrl(uploadedUrl);

            clearErrors("file");

        } catch (error) {
            console.error(
                "Upload image error:",
                error
            );

            /*
             * ถ้ามี error ที่เรา set ไว้จาก resolution
             * ไม่จำเป็นต้อง override
             */
            setError("file", {
                type: "manual",
                message:
                    "Unable to upload image. Please try again.",
            });

            setPreviewUrl(null);
            setValue("url", "");
            clearFileInput();

        } finally {
            setIsLoading(false);
        }
    };

    const handleButtonClick = () => {
        if (
            mode !== "view" &&
            fileInputRef.current
        ) {
            fileInputRef.current.click();
        }
    };

    const handleRemoveImage = (
        e?: React.MouseEvent
    ) => {
        e?.preventDefault();
        e?.stopPropagation();

        setFileName("No file Choose");
        setPreviewUrl(null);
        setValue("url", "");

        clearFileInput();

        clearErrors("file");
    };

    const handleClose = () => {
        setFileName("No file Choose");
        setPreviewUrl(null);

        clearFileInput();

        /*
         * ถ้า create ให้ล้าง URL ด้วย
         */
        if (mode === "create") {
            setValue("url", "");
        }
    };

    const handleDialogClose = () => {
        handleClose();
        clearErrors();
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            className="relative z-20"
        >
            <DialogBackdrop
                transition
                className="
                    fixed inset-0
                    bg-[#000000]
                    bg-opacity-45
                    transition-opacity
                    data-[closed]:opacity-0
                    data-[enter]:duration-300
                    data-[leave]:duration-200
                    data-[enter]:ease-out
                    data-[leave]:ease-in
                "
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div
                    className="
                        flex min-h-full
                        items-end
                        justify-center
                        p-4
                        text-center
                        sm:items-center
                        sm:p-0
                    "
                >
                    <DialogPanel
                        transition
                        className="
                            flex
                            transform
                            transition-all
                            inset-0
                            rounded-lg
                            text-left
                            data-[closed]:translate-y-4
                            data-[closed]:opacity-0
                            data-[enter]:duration-300
                            data-[leave]:duration-200
                            data-[enter]:ease-out
                            data-[leave]:ease-in
                            data-[closed]:sm:translate-y-0
                            data-[closed]:sm:scale-95
                        "
                    >
                        <Spinloading
                            spin={isLoading}
                            rounded={20}
                        />

                        <div className="flex inset-0 items-center justify-center">
                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    gap-2
                                    rounded-md
                                "
                            >
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="
                                        bg-white
                                        p-8
                                        rounded-[20px]
                                        shadow-lg
                                        !w-[600px]
                                    "
                                >
                                    {/* ============================
                                        TITLE
                                    ============================ */}
                                    <h2
                                        className="
                                            text-xl
                                            font-bold
                                            text-[#00ADEF]
                                            mb-4
                                            pb-3
                                        "
                                    >
                                        {mode === "create"
                                            ? "Upload Image"
                                            : mode === "edit"
                                            ? "Edit Image"
                                            : "View Image"}
                                    </h2>

                                    {/* ============================
                                        PREVIEW
                                    ============================ */}
                                    <div
                                        className="
                                            p-4
                                            rounded-[12px]
                                            w-full
                                            h-[200px]
                                            bg-[#FFFFFF]
                                            border-dashed
                                            border-[#CDCDCD]
                                            border-[2px]
                                            flex
                                            flex-col
                                            justify-center
                                            items-center
                                            text-center
                                        "
                                    >
                                        {previewUrl ? (
                                            <div
                                                className="
                                                    relative
                                                    flex
                                                    justify-center
                                                    items-center
                                                    h-full
                                                "
                                                onMouseEnter={() =>
                                                    setIsHovered(true)
                                                }
                                                onMouseLeave={() =>
                                                    setIsHovered(false)
                                                }
                                            >
                                                <img
                                                    className="
                                                        max-w-[300px]
                                                        max-h-[160px]
                                                        object-contain
                                                    "
                                                    src={previewUrl}
                                                    alt="Uploaded Preview"
                                                />

                                                {isHovered &&
                                                    mode !== "view" && (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleRemoveImage
                                                            }
                                                            className="
                                                                absolute
                                                                top-1/2
                                                                left-1/2
                                                                transform
                                                                -translate-x-1/2
                                                                -translate-y-1/2
                                                                bg-[#58585A]
                                                                hover:bg-[#333333]
                                                                text-white
                                                                w-[40px]
                                                                h-[40px]
                                                                rounded-full
                                                                flex
                                                                justify-center
                                                                items-center
                                                                cursor-pointer
                                                            "
                                                        >
                                                            <CloseOutlinedIcon
                                                                sx={{
                                                                    fontSize:
                                                                        "20px",
                                                                }}
                                                            />
                                                        </button>
                                                    )}
                                            </div>
                                        ) : (
                                            <img
                                                className="
                                                    w-[140px]
                                                    h-auto
                                                "
                                                src="/assets/image/upload_bg.png"
                                                alt="Upload Icon"
                                            />
                                        )}
                                    </div>

                                    {/* ============================
                                        DESCRIPTION
                                    ============================ */}
                                    <div
                                        className="
                                            text-[#1473A1]
                                            text-xs
                                            pt-2
                                        "
                                    >
                                        Supports: JPG, PNG
                                        {" "}
                                        <span className="font-bold">
                                            (Required exactly 1920 x 1080px)
                                        </span>
                                        {" "}
                                        Max {MAX_SIZE_MB} MB
                                    </div>

                                    {/* ============================
                                        INPUT FILE
                                    ============================ */}
                                    {mode !== "view" && (
                                        <div>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,image/jpeg,image/png"

                                                {...fileRegister}

                                                ref={(element) => {
                                                    /*
                                                     * ref ของ react-hook-form
                                                     */
                                                    registerFileRef(
                                                        element
                                                    );

                                                    /*
                                                     * ref ของ component
                                                     */
                                                    fileInputRef.current =
                                                        element;
                                                }}

                                                onChange={(
                                                    e
                                                ) => {
                                                    /*
                                                     * ให้ RHF รับ onChange ก่อน
                                                     */
                                                    fileRegister.onChange(
                                                        e
                                                    );

                                                    /*
                                                     * แล้วค่อย validation ของเรา
                                                     */
                                                    handleFileChange(
                                                        e
                                                    );
                                                }}

                                                className="hidden"
                                            />

                                            {/* FILE NAME */}
                                            {fileName !==
                                                "No file Choose" && (
                                                <div
                                                    className="
                                                        mt-2
                                                        text-[13px]
                                                        text-gray-500
                                                        break-all
                                                    "
                                                >
                                                    {fileName}
                                                </div>
                                            )}

                                            {/* UPLOAD BUTTON */}
                                            <div className="w-full pt-2">
                                                <button
                                                    type="button"
                                                    className="
                                                        w-full
                                                        font-bold
                                                        bg-[#17AC6B]
                                                        hover:bg-[#09995b]
                                                        text-white
                                                        py-2
                                                        rounded-lg
                                                        focus:outline-none
                                                        duration-200
                                                        ease-in-out
                                                        disabled:opacity-50
                                                        disabled:cursor-not-allowed
                                                    "
                                                    onClick={
                                                        handleButtonClick
                                                    }
                                                    disabled={
                                                        isLoading
                                                    }
                                                >
                                                    Upload
                                                </button>
                                            </div>

                                            {/* ERROR */}
                                            {errors?.file && (
                                                <p
                                                    className="
                                                        text-red-500
                                                        text-[14px]
                                                        mt-1
                                                    "
                                                >
                                                    {errors?.file
                                                        ?.message
                                                        ? String(
                                                              errors
                                                                  ?.file
                                                                  ?.message
                                                          )
                                                        : "Please Choose File"}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* ============================
                                        BUTTONS
                                    ============================ */}
                                    <div className="flex justify-end gap-2 pt-6">
                                        {mode === "view" ? (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleDialogClose
                                                }
                                                className="
                                                    w-[167px]
                                                    font-light
                                                    bg-[#00ADEF]
                                                    text-white
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-blue-600
                                                    focus:outline-none
                                                    focus:bg-blue-600
                                                "
                                            >
                                                Close
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={
                                                    handleDialogClose
                                                }
                                                className="
                                                    w-[167px]
                                                    font-light
                                                    bg-slate-100
                                                    text-black
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-rose-500
                                                    focus:outline-none
                                                    focus:bg-rose-500
                                                "
                                            >
                                                Cancel
                                            </button>
                                        )}

                                        {mode !== "view" && (
                                            <button
                                                type="submit"
                                                disabled={
                                                    isLoading
                                                }
                                                className="
                                                    w-[167px]
                                                    font-bold
                                                    bg-[#00ADEF]
                                                    text-white
                                                    py-2
                                                    rounded-lg
                                                    hover:bg-blue-600
                                                    focus:outline-none
                                                    focus:bg-blue-600
                                                    disabled:opacity-50
                                                    disabled:cursor-not-allowed
                                                "
                                            >
                                                {mode ===
                                                "create"
                                                    ? "Add"
                                                    : "Save"}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
};

export default ModalAction;