"use client";
import { useEffect, useState } from "react";
import { Tune } from "@mui/icons-material";
import { filterStartEndDateNewLogic, findRoleConfigByMenuName, formatDate, formatDateNoTime, formatDateTimeSecNoPlusSeven, formatTime, generateUserPermission } from '@/utils/generalFormatter';
import { InputSearch } from '@/components/other/SearchForm';
import SearchInput from "@/components/other/searchInput";
import { getService } from "@/utils/postService";
import BtnExport from "@/components/other/btnExport";
import { useFetchMasters } from "@/hook/fetchMaster";
import BtnSearch from "@/components/other/btnSearch";
import BtnReset from "@/components/other/btnReset";
import DatePickaSearch from "@/components/library/dateRang/dateSearch";
import PaginationComponent from "@/components/other/globalPagination";
import ColumnVisibilityPopover from "@/components/other/popOverShowHideCol";
import { useAppDispatch } from "@/utils/store/store";
import TableQueryShipperFiles from "./form/table";
import { fetchTermType } from "@/utils/store/slices/termTypeMasterSlice";
import { fetchShipperGroup } from "@/utils/store/slices/shipperGroupSlice";
import ModalFiles from "./form/modalFiles";
import getCookieValue from "@/utils/getCookieValue";
import useRestrictedPage from "@/utils/checkRestrictedPage";
import { decryptData } from "@/utils/encryptionData";
import getUserValue from "@/utils/getuserValue";

const ClientPage = () => {
  const userDT: any = getUserValue();
  const isShipper = userDT?.account_manage?.[0]?.user_type_id === 3;
  const userGroupId = userDT?.account_manage?.[0]?.group?.id;

  // ############### Check Authen ###############
  const token = getCookieValue("v4r2d9z5m3h0c1p0x7l");
  useRestrictedPage(token);

  // ############### PERMISSION ###############
  const [userPermission, setUserPermission] = useState<any>();

  const getPermission = () => {
    try {
      let user_permission: any = typeof window !== 'undefined' ? (localStorage?.getItem("k3a9r2b6m7t0x5w1s8j") || getCookieValue("k3a9r2b6m7t0x5w1s8j")) : null;
      user_permission = user_permission ? decryptData(user_permission) : null;
      let parsed_permission = user_permission;
      if (typeof parsed_permission === 'string') {
        parsed_permission = JSON.parse(parsed_permission);
      }
      const permission = findRoleConfigByMenuName('Query Shipper Files', userDT);
      if (permission) {
        setUserPermission(permission);
      } else if (parsed_permission?.role_config) {
        const updatedUserPermission = generateUserPermission(parsed_permission);
        setUserPermission(updatedUserPermission);
      }
    } catch (error) {
      // Failed to parse user_permission
    }
  };

  // ############### REDUX DATA ###############
  const { shipperGroupData, termTypeMaster } = useFetchMasters();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!shipperGroupData?.data) {
      dispatch(fetchShipperGroup());
    }
    if (!termTypeMaster?.data) {
      dispatch(fetchTermType());
    }
    getPermission();
  }, [dispatch]);

  // ############### FIELD SEARCH ###############
  const [filteredDataTable, setFilteredDataTable] = useState<any>([]);
  const [key, setKey] = useState(0);
  const [srchPlanningCode, setSrchPlanningCode] = useState('');
  const [srchShipper, setSrchShipper] = useState<any>([]);
  const [srchTermType, setSrchTermType] = useState<any>([]);
  const [srchStartDate, setSrchStartDate] = useState<Date | null>(null);
  const [srchEndDate, setSrchEndDate] = useState<Date | null>(null);

  const handleFieldSearch = () => {
    const res_filtered_date: any = filterStartEndDateNewLogic(dataTable, srchStartDate, srchEndDate);
    const result_2 = (Array.isArray(res_filtered_date) ? res_filtered_date : []).filter((item: any) => {
      if (!item) return false;
      const matchPlanningCode = srchPlanningCode
        ? (item?.planning_code || '').toLowerCase().includes(srchPlanningCode.toLowerCase())
        : true;

      const matchShipper = Array.isArray(srchShipper) && srchShipper.length > 0
        ? srchShipper.includes(item?.group_id)
        : true;

      const matchTermType = Array.isArray(srchTermType) && srchTermType.length > 0
        ? srchTermType.includes(String(item?.term_type_id ?? ''))
        : true;

      return matchPlanningCode && matchShipper && matchTermType;
    });
    setCurrentPage(1);
    setFilteredDataTable(result_2);
  };

  const handleReset = () => {
    if (!isShipper) {
      setSrchShipper([]);
    } else {
      setSrchShipper(userGroupId ? [userGroupId] : []);
    }

    setSrchTermType([]);
    setSrchPlanningCode('');
    setSrchStartDate(null);
    setSrchEndDate(null);
    setFilteredDataTable(Array.isArray(dataTable) ? dataTable : []);
    setKey((prevKey) => prevKey + 1);
  };

  // ############### LIKE SEARCH ###############
  const handleSearch = (query: string) => {
    const queryLower = (query || '').toLowerCase().replace(/\s+/g, '')?.trim();

    if (!queryLower) {
      setFilteredDataTable(Array.isArray(dataTable) ? dataTable : []);
      return;
    }

    const filtered = (Array.isArray(dataTable) ? dataTable : []).filter(
      (item: any) => {
        if (!item) return false;

        return (
          (item?.planning_code ? item.planning_code.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||
          (item?.group?.name ? item.group.name.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||
          (item?.term_type?.name ? item.term_type.name.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||

          (item?.shipper_file_submission_date ? formatDate(item.shipper_file_submission_date)?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||
          (item?.shipper_file_submission_date ? formatTime(item.shipper_file_submission_date)?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||
          (item?.shipper_file_submission_date ? formatDateNoTime(item.shipper_file_submission_date)?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||
          (item?.shipper_file_submission_date ? formatDateTimeSecNoPlusSeven(item.shipper_file_submission_date)?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||

          (item?.start_date ? formatDateNoTime(item.start_date)?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false) ||
          (item?.end_date ? formatDateNoTime(item.end_date)?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) : false)
        );
      });
    setCurrentPage(1);
    setFilteredDataTable(filtered);
  };

  // ############### DATA TABLE ###############
  const [dataTable, setData] = useState<any>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      if (isShipper && userGroupId) {
        setSrchShipper([userGroupId]);
      }

      const response: any = await getService(`/master/query-shipper-planning-file`);

      let filtered_res: any = Array.isArray(response) ? response : [];
      if (isShipper && userGroupId) {
        filtered_res = filtered_res.filter((item: any) => item && item?.group?.id === userGroupId);
      }

      setData(filtered_res);
      setFilteredDataTable(filtered_res);

      setIsLoading(true);
    } catch (err) {
      // Error fetching data
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ############### MODAL ALL FILES ###############
  const [mdFileView, setMdFileView] = useState<any>(false);
  const [dataFile, setDataFile] = useState<any>([]);

  const openAllFileModal = (id?: any) => {
    const filtered = (Array.isArray(dataTable) ? dataTable : []).find((item: any) => item?.id === id);
    setDataFile(filtered);
    setMdFileView(true);
  };

  // ############### PAGINATION ###############
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
    setCurrentPage(1);
  };

  const paginatedData = Array.isArray(filteredDataTable)
    ? filteredDataTable.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    )
    : [];

  // ############### COLUMN SHOW/HIDE ###############
  const initialColumns: any = [
    { key: 'term', label: 'Term', visible: true },
    { key: 'planning_code', label: 'Planning Code', visible: true },
    { key: 'file', label: 'File', visible: true },
    { key: 'shipper_name', label: 'Shipper Name', visible: true },
    { key: 'shipper_file_date', label: 'Shipper File Submission Date', visible: true },
    { key: 'start_date', label: 'Start Date', visible: true },
    { key: 'end_date', label: 'End Date', visible: true },
  ];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [columnVisibility, setColumnVisibility] = useState<any>(
    Object.fromEntries(initialColumns.map((column: any) => [column?.key, column?.visible]))
  );

  const handleTogglePopover = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleColumnToggle = (columnKey: string) => {
    setColumnVisibility((prev: any) => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  return (
    <div className=" space-y-2">
      <div className="border-[#DFE4EA] border-[1px] p-4 rounded-xl flex flex-col sm:flex-row gap-2">
        <aside className="flex flex-wrap sm:flex-row gap-2 w-full">

          <InputSearch
            id="searchPlanningCode"
            label="Planning Code"
            value={srchPlanningCode}
            onChange={(e) => setSrchPlanningCode(e.target.value)}
            placeholder="Search Planning Code"
          />

          <InputSearch
            id="searchShipper"
            label="Shipper Name"
            type="select-multi-checkbox"
            value={srchShipper}
            onChange={(e) => setSrchShipper(e.target.value)}
            isDisabled={isShipper}
            options={(Array.isArray(shipperGroupData?.data) ? shipperGroupData.data : [])
              .filter((item: any) => (!isShipper || !userGroupId ? true : item?.id === userGroupId))
              .map((item: any) => ({
                value: item?.id,
                label: item?.name ?? '',
              }))
            }
          />

          <InputSearch
            id="searchTermType"
            label="Term"
            type="select-multi-checkbox"
            placeholder="Select Term"
            value={srchTermType}
            onChange={(e) => setSrchTermType(e.target.value)}
            options={(Array.isArray(termTypeMaster?.data) ? termTypeMaster.data : [])
              .filter((f: any) => f?.id !== 4)
              .map((item: any) => ({
                value: item?.id != null ? String(item.id) : '',
                label: item?.name ?? ''
              }))
            }
          />

          <DatePickaSearch
            key={"start" + key}
            label="Start Date"
            placeHolder="Select Start Date"
            allowClear
            onChange={(e: any) => setSrchStartDate(e ? e : null)}
          />

          <DatePickaSearch
            key={"end" + key}
            label="End Date"
            placeHolder="Select End Date"
            allowClear
            onChange={(e: any) => setSrchEndDate(e ? e : null)}
          />

          <BtnSearch handleFieldSearch={handleFieldSearch} />
          <BtnReset handleReset={handleReset} />
        </aside>
      </div>

      <div className="border-[#DFE4EA] border-[1px] p-4 rounded-xl shadow-sm">
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
              <BtnExport
                textRender={"Export"}
                data={filteredDataTable}
                path="planning/query-shippers-planning-files"
                can_export={Boolean(userPermission?.f_export)}
                columnVisibility={columnVisibility}
                initialColumns={initialColumns}
              />
            </div>
          </div>
        </div>
        <TableQueryShipperFiles
          openAllFileModal={openAllFileModal}
          tableData={paginatedData}
          isLoading={isLoading}
          columnVisibility={columnVisibility}
          userPermission={userPermission}
        />
      </div>

      <PaginationComponent
        totalItems={filteredDataTable?.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <ModalFiles
        data={dataFile}
        open={mdFileView}
        onClose={() => {
          setMdFileView(false);
        }}
      />

      <ColumnVisibilityPopover
        open={open}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
        columnVisibility={columnVisibility}
        handleColumnToggle={handleColumnToggle}
        initialColumns={initialColumns}
      />
    </div>
  );
};

export default ClientPage;