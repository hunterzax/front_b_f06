import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import CustomerLogo from "@/components/other/CustomerLogo";
import { motion } from "framer-motion";
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  useMatches,
  KBarResults,
  ActionImpl,
  useKBar,
} from "kbar";
import Profile from "../headers/Profile";
import AppMenu from "../headers/AppMenu";
import Notifys from "../headers/Notifys";
// import KMenu from "../headers/KMenu";
import HomeBack from "../headers/HomeBack";
import BreadcrumbsMenu from "../headers/BreadcrumbsMenu";
import tempMenu from "../headers/tempMenu";
import NavMenu from "./NavMenu";
import WaitingListAppMenu from "../headers/WaitingListAppMenu";
import UserGuide from "../headers/UserGuide";
import { getService } from "@/utils/postService";
import getUserValue from "@/utils/getuserValue";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";

function LayoutMenuContents({ children }: any) {
  const pathname = usePathname();
  const router = useRouter();
  const { query } = useKBar();
  const [toggleNav, setToggleNav] = useState<boolean>(true);
  const [menu, setMenu] = useState<any>(null);
  const [userGuide, setUserGuide] = useState<any[]>([]);
  const isDownloadingUserGuide = useRef(false);

  const goToUrl = async (url: any) => {
    router.push("/en/authorization/" + url); // ถ้าจะสองภาษาเติม lng แทน /en
  };

  const getUserGuideZipFileName = (item: any, usedNames: Set<string>) => {
    const fallbackName = `${item?.document_name || "user-guide"}`.trim() || "user-guide";
    const fromUrl = item?.file
      ? decodeURIComponent(String(item.file).substring(String(item.file).lastIndexOf("/") + 1))
          .replace(/^\d+_/, "")
      : "";
    const rawName = fromUrl || fallbackName;
    const hasExtension = /\.[a-zA-Z0-9]+$/.test(rawName);
    const withExtension = hasExtension ? rawName : `${rawName}.pdf`;
    const sanitized = withExtension.replace(/[\\/:*?"<>|]/g, "_");

    if (!usedNames.has(sanitized)) {
      usedNames.add(sanitized);
      return sanitized;
    }

    const extensionIndex = sanitized.lastIndexOf(".");
    const base = extensionIndex >= 0 ? sanitized.slice(0, extensionIndex) : sanitized;
    const ext = extensionIndex >= 0 ? sanitized.slice(extensionIndex) : "";
    let index = 1;
    let candidate = `${base} (${index})${ext}`;
    while (usedNames.has(candidate)) {
      index += 1;
      candidate = `${base} (${index})${ext}`;
    }
    usedNames.add(candidate);
    return candidate;
  };

  const downloadUserGuide = async () => {
    if (isDownloadingUserGuide.current) return;

    const files = (userGuide || []).filter((item: any) => item?.file);
    if (files.length === 0) {
      toast.info("No user guide files available.", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }

    isDownloadingUserGuide.current = true;
    const toastId = toast.loading("Downloading user guide...", {
      position: "bottom-right",
      closeOnClick: false,
      draggable: false,
    });

    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();
      const filesWithName = files.map((item: any) => ({
        item,
        name: getUserGuideZipFileName(item, usedNames),
      }));

      const results = await Promise.all(
        filesWithName.map(async ({ item, name }: any) => {
          const response = await fetch(
            `/api/user-guide-file?url=${encodeURIComponent(item.file)}`
          );

          if (!response.ok) {
            throw new Error(`Failed to download ${item.document_name || item.file}`);
          }

          const blob = await response.blob();
          return { name, blob };
        })
      );

      results.forEach((file) => {
        zip.file(file.name, file.blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "User Guide.zip");

      toast.update(toastId, {
        render: "Download completed.",
        type: "success",
        isLoading: false,
        autoClose: 2000,
        closeOnClick: true,
      });
    } catch (error) {
      toast.update(toastId, {
        render: "Failed to download user guide. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
        closeOnClick: true,
      });
    } finally {
      isDownloadingUserGuide.current = false;
    }
  };

  useEffect(() => {
    const pathUrl = pathname.split("/")[3];
    setMenu(
      tempMenu().find((f: any) => {
        return f?.url === pathUrl;
      })
    );
    console.log('pathname : ', pathname);

    try {
        const userDT: any = getUserValue();

        getService(`/master/parameter/user-guide`).then(response => {
          const userRoleId = userDT?.account_manage?.[0]?.account_role?.[0]?.role_id;
          if(Array.isArray(response)) {
            // filter ให้เห็นเฉพาะ role ตัวเอง
            let filteredDataUserGuide: any = response
            // if (userRoleId !== 1) { // ไม่ใช่ super admin
          
            if (userDT?.account_manage?.[0]?.user_type_id !== 1) { // ไม่ใช่ super admin
                filteredDataUserGuide = response.filter((item: any) => {
                    return (
                        item?.user_guide_match.some((match: any) => match.role_id === userRoleId) ||
                        item?.create_by === userDT?.id // https://app.clickup.com/t/9018502823/86euzxxnn
                    )
                });
            }
            
            setUserGuide(filteredDataUserGuide);
          }
        });
    } catch (err) {
      setUserGuide([])
    }
  }, [pathname]);

  // เอาไว้ set bg
  let main_page = [
    {
      name: 'booking'
    },
    {
      name: 'allocation'
    },
    {
      name: 'dam'
    },
    {
      name: 'balancing'
    },
    {
      name: 'planning'
    },
    {
      name: 'nominations'
    },
    {
      name: 'metering'
    },
    {
      name: 'event'
    },
    {
      name: 'tariff'
    }
  ]

  const currentPath = pathname.split("/")[3];
  const pathSegments = pathname.split("/");
  const showBg = main_page.some((page) => page.name === currentPath) && pathSegments.length <= 4;

  return (
    // เดิมคลุมด้วย element <></>
    <div className="no-scrollbar overflow-y-auto scrollbar-hide h-screen"> 
      <header>
        <section className=" flex justify-between items-center h-[70px] px-2">
          <CustomerLogo
            width={60}
            height={26.25}
            className="pl-4 w-[100px] h-auto"
          />
          <section className="pr-4 flex items-center gap-3 relative">
            {userGuide.length > 0 && <UserGuide downloadUserGuide={downloadUserGuide}/>}
            <HomeBack goToUrl={goToUrl} />
            <Notifys />
            <AppMenu />
            <WaitingListAppMenu />
            {/* <KMenu toggle={query.toggle} /> */}
            <Profile mode="in" />
          </section>
        </section>
        <BreadcrumbsMenu menu={menu} goToUrl={goToUrl} />
      </header>

      <aside className="flex gap-5 mt-2 text-[#757575]">
        {/* pathname */}
        {
          !pathname.includes("/dashboardandreport/waitinglist") && 
          <NavMenu
            toggleNav={toggleNav}
            setToggleNav={setToggleNav}
            menu={menu}
            setMenu={setMenu}
            goToUrl={goToUrl}
          />
        }

        <section
          className={`h-[calc(100vh-135px)] overflow-y-auto scrollbar-hide w-full pr-2 relative ${showBg ? 'bg-[url("/assets/image/bg_menu_04.png")] bg-cover bg-center' : ''}`}
        >
          <motion.div
            key={pathname}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </section>
      </aside>
    </div>
  );
}

function LayoutMenu({ children }: any) {
  const router = useRouter();
  const [kBarMenu, setKBarMenu] = useState([]);

  useEffect(() => {
    let kArr: any = [];
    tempMenu().map((e: any) => {
      if (e?.menu.length > 0) {
        e?.menu.map((eSub: any) => {
          if (eSub?.menu.length > 0) {
            eSub?.menu.map((eSubUrl: any) => {

              if (eSubUrl?.menu.length > 0) {
                eSubUrl?.menu.map((eSubSubUrl: any) => {
                  kArr.push({
                    ...eSubSubUrl,
                    id: String(eSubSubUrl?.id),
                    perform: () => router.push("/authorization/" + eSubSubUrl.url),
                  });
                  return eSubSubUrl;
                })
              } else {
                kArr.push({
                  ...eSubUrl,
                  id: String(eSubUrl?.id),
                  perform: () => router.push("/authorization/" + eSubUrl.url),
                });
                return eSubUrl;

              }

              // ---- original bank ----
              // kArr.push({
              //   ...eSubUrl,
              //   id: String(eSubUrl?.id),
              //   perform: () => router.push("/authorization/" + eSubUrl.url),
              // });
              // return eSubUrl;
            });
          } else {
            kArr.push({
              ...eSub,
              id: String(eSub?.id),
              perform: () => router.push("/authorization/" + eSub.url),
            });
          }
          return eSub;
        });
      } else {
        kArr.push({
          ...e,
          id: String(e?.id),
          perform: () => router.push("/authorization/" + e.url),
        });
      }

      return e;
    });
    setKBarMenu(kArr);
  }, []);

  return (
    <>
      {kBarMenu.length > 0 && (
        <KBarProvider actions={kBarMenu}>
          <KBarPortal>
            <KBarPositioner className="bg-[#63676b7d] z-10">
              <KBarAnimator className="max-w-3xlLspInfo w-3/6 bg-white border-r-8 overflow-hidden shadow-white text-black">
                <KBarSearch
                  defaultPlaceholder="Search..."
                  className="py-4 px-5 text-xs w-full outline-none border-none bg-white text-black "
                />
                <RenderResults />
              </KBarAnimator>
            </KBarPositioner>
          </KBarPortal>
          <LayoutMenuContents children={children} />
        </KBarProvider>
      )}
    </>
  );
}

const ResultItem = React.forwardRef(function ResultItem(
  { action, active }: { action: ActionImpl; active: boolean },
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <div
      ref={ref}
      className={
        active
          ? `px-3 py-2 leading-none rounded text-sm flex items-center justify-between bg-violet-50 cursor-pointer`
          : `px-3 py-2 leading-none rounded text-sm flex items-center justify-between hover:bg-violet-50 cursor-pointer`
      }
    >
      <header className="flex items-center px-5">
        <div className="rounded flex flex-col items-start justify-center relative select-none outline-none hover:bg-violet-50">
          <h1 className="text-md font-bold text-[#464255]"> {action.name} </h1>
          <p className="text-sm py-1 text-[#a6aeb7]"> {action.subtitle} </p>
        </div>
      </header>
      <div className="text-[15px] leading-none text-sm rounded flex justify-between items-center relative select-none outline-none hover:bg-violet-50 ">
        {action.shortcut?.length ? (
          <div
            aria-hidden
            style={{ display: "grid", gridAutoFlow: "column", gap: "4px" }}
          >
            {action.shortcut.map((sc) => (
              <kbd
                key={sc}
                style={{
                  padding: "4px 6px",
                  background: "rgba(0 0 0 / .1)",
                  borderRadius: "4px",
                  fontSize: 14,
                }}
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
});

const RenderResults = () => {
  const { results } = useMatches();
  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => {
        return typeof item === "string" ? (
          <div className="py-3 px-5">
            <h2 className="text-start text-[#00ADEF]"> {item} </h2>{" "}
          </div>
        ) : (
          <ResultItem action={item} active={active} />
        );
      }}
    />
  );
};

export default LayoutMenu;