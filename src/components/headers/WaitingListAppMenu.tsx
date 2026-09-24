"use client";
import {
  /* @ts-ignore */
  Menu,
  /* @ts-ignore */
  MenuHandler,
  /* @ts-ignore */
  MenuList,
  /* @ts-ignore */
  MenuItem,
  /* @ts-ignore */
  Button,
} from "@material-tailwind/react";
import tempMenu from "./tempMenu";
import { useRouter } from "next/navigation";
import { getService } from "@/utils/postService";
import { useEffect, useState } from "react";
import ViewAgendaOutlinedIcon from "@mui/icons-material/ViewAgendaOutlined";
import WSClient from "../other/wsClient";

function WaitingListAppMenu() {
  const router = useRouter();
  const [menuWL, setmenuWL] = useState<any>([]);

  const [LD, setLD] = useState(false)

  const handleClick = async (data: any) => {
    router.push(
      `/en/authorization/dashboardandreport/waitinglist?menu=${data}`,
    );
  };

  const fetchData = async () => {
    try {
      const wl = (tempMenu() || [])?.filter((f: any) =>
        [101, 201, 601, 801]?.includes(f?.id),
      );

      const listWL_BOOK = [
        "Capacity Contract Management",
        "Capacity Contract Management (Saved)",
        "Capacity Contract Management (Confirmed)",
        "Capacity Contract List",
        "Capacity Contract List (Saved)",
        "Capacity Contract List (Confirmed)",
        "Release Capacity Management",
      ];
      const listWL_ALLO = ["Allocation Management", "Allocation Review"];
      const listWL_NOM = [
        "Daily Query Shipper Nomination File",
        "Weekly Query Shipper Nomination File",
        "Daily Management",
        "Weekly Management",
        "Daily Adjustment",
      ];
      const listWL_EVENT = ["Offspec Gas", "Emergency/Difficult Day", "OFO/IF", 'Offspec Gas (Acknowledge)', 'Emergency/Difficult Day (Acknowledge)', 'OFO/IF (Acknowledge)'];


      let wl_ = [];
      const tempWL = localStorage.getItem("WL");
      if (tempWL) {
        wl_ = JSON.parse(tempWL);
      } else {
        setLD(true)
        wl_ = await getService(`/master/waiting-list`);
        localStorage.setItem("WL", JSON.stringify(wl_));
        setLD(false)
      }
      let nData = wl?.map((e: any) => {
        if (e?.url === "booking") {
          const cal_ = listWL_BOOK?.reduce(
            (accumulator, currentValue) =>
              accumulator + (wl_?.[currentValue]?.remainingTasks || 0),
            0,
          );
          return {
            ...e,
            val_: cal_,
          };
        } else if (e?.url === "allocation") {
          const cal_ = listWL_ALLO?.reduce(
            (accumulator, currentValue) =>
              accumulator + (wl_?.[currentValue]?.remainingTasks || 0),
            0,
          );
          return {
            ...e,
            val_: cal_,
          };
        } else if (e?.url === "nominations") {
          const cal_ = listWL_NOM?.reduce(
            (accumulator, currentValue) =>
              accumulator + (wl_?.[currentValue]?.remainingTasks || 0),
            0,
          );
          return {
            ...e,
            val_: cal_,
          };
        } else if (e?.url === "event") {
          const cal_ = listWL_EVENT?.reduce(
            (accumulator, currentValue) =>
              accumulator + (wl_?.[currentValue]?.remainingTasks || 0),
            0,
          );
          return {
            ...e,
            val_: cal_,
          };
        } else {
          return e;
        }
      });

      setmenuWL(nData);
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      <WSClient refreshNotifications={fetchData} />
      <Menu>
        <MenuHandler>
          <Button
            variant="text"
            className="p-0 m-0 -ml-2 flex items-center gap-2"
          >
            <ViewAgendaOutlinedIcon className=" text-[#58585A]" />
          </Button>
        </MenuHandler>

        <div className="flex">
          <MenuList className="grid grid-cols-3 p-0">
            <div className="text-[#8A99AF] col-span-3 px-4 py-3 font-bold">
              {" "}
              {`Waiting List Menu`}{" "}
            </div>
            {LD && "Load API ..."}
            {menuWL.map((item: any, ix: number) => {
              return (
                <MenuItem
                  key={ix}
                  className=" w-[120px] h-[120px] border rounded-none grid items-center justify-center bg-[#ffffff] text-[#374151] text-xs"
                  onClick={() => handleClick(item?.menus_config_id)}
                >
                  <div className="grid items-center justify-center text-[#9CA3AF]">
                    {item?.icon}
                  </div>
                  <div className="grid items-center justify-center text-center pt-2 text-[#374151]">
                    {item?.val_ || 0}
                  </div>
                  <div className="grid items-center justify-center text-center pt-2 text-[#374151]">
                    {item?.name}
                  </div>
                </MenuItem>
              );
            })}
          </MenuList>
        </div>
      </Menu>
    </>
  );
}

export default WaitingListAppMenu;
