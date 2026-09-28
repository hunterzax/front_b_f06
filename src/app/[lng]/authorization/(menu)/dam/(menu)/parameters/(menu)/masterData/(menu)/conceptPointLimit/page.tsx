"use client";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { Button } from "@material-tailwind/react";
import { useEffect, useMemo, useState } from "react";
import ModalComponent from "@/components/other/ResponseModal";
import { findRoleConfigByMenuName, formatDate, generateUserPermission, toDayjs } from '@/utils/generalFormatter';
import { InputSearch } from '@/components/other/SearchForm';
import { useAppDispatch } from "@/utils/store/store";
import { getService } from "@/utils/postService";
import DatePickaSearch from "@/components/library/dateRang/dateSearch";
import { fetchShipperGroup } from "@/utils/store/slices/shipperGroupSlice";
import ModalLimit from "./form/modalLimit";
import BtnExport from "@/components/other/btnExport";
import { useFetchMasters } from "@/hook/fetchMaster";
import BtnSearch from "@/components/other/btnSearch";
import BtnReset from "@/components/other/btnReset";
import ColumnVisibilityPopover from "@/components/other/popOverShowHideCol";
import getCookieValue from "@/utils/getCookieValue";
import useRestrictedPage from "@/utils/checkRestrictedPage";
import { decryptData } from "@/utils/encryptionData";
import AppTable from "@/components/table/AppTable";
import { ColumnDef, Row, SortingState, VisibilityState } from "@tanstack/react-table";
import getUserValue from "@/utils/getuserValue";

interface ClientProps {
  params: {
    lng: string;
  };
}

const ClientPage: React.FC<ClientProps> = (props) => {

  // ############### Check Authen ###############
  const userDT: any = getUserValue();
  const token = getCookieValue("v4r2d9z5m3h0c1p0x7l");
  useRestrictedPage(token);

  // SEARCH STATE
  const [key, setKey] = useState(0);

  // ############### PERMISSION ###############
  const [userPermission, setUserPermission] = useState<any>();
  let user_permission: any = getCookieValue("k3a9r2b6m7t0x5w1s8j");
  user_permission = user_permission ? decryptData(user_permission) : null;

  const getPermission = () => {
    try {
      user_permission = user_permission ? JSON.parse(user_permission) : null; // Convert JSON string to object

      const permission = findRoleConfigByMenuName('Concept Point Limit', userDT)
      if (permission) {
        setUserPermission(permission);
      } else if (user_permission?.role_config) {
        const updatedUserPermission = generateUserPermission(user_permission);
        setUserPermission(updatedUserPermission);
      }
    } catch (error) {
      // Failed to parse user_permission:
    }
  }

  useEffect(() => {
    getPermission();
    handleGetMaster();
  }, [])

  // ############### REDUX DATA ###############
  // const [areaMasterFetch, setAreaMasterFetch] = useState<any>([]);
  const { shipperGroupData } = useFetchMasters();
  const [forceRefetch, setForceRefetch] = useState(true);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (forceRefetch) {
      dispatch(fetchShipperGroup());
      // dispatch(fetchTypeConceptPoint());
    }
    if (forceRefetch) {
      setForceRefetch(false);
    }
  }, [dispatch, shipperGroupData, forceRefetch]);

  // ############### PAGINATION (SERVER SIDE) ###############
  const [pagination, setPagination] = useState({
      pageIndex: 0,
      pageSize: 10,
  });

  // ############### SORTING (SERVER SIDE) ###############
  const [sorting, setSorting] = useState<SortingState>([]);

  // ############### LIKE SEARCH ###############
  const [querySearch, setQuerySearch] = useState<string>('');

  // ############### FIELD SEARCH ###############
  const [filteredDataTable, setFilteredDataTable] = useState<any>([]);
  const [dataExport, setDataExport] = useState<any>([]);
  const [conceptPoint, setConceptPoint] = useState<any[]>([]);
  const [typeConceptPointMaster, setTypeConceptPointMaster] = useState<any>([]);
  // const [conceptPointLimit, setConceptPointLimit] = useState<any[]>([]);
  const [srchShipperGroup, setSrchShipperGroup] = useState<any>([]);
  const [srchConceptPoint, setSrchConceptPoint] = useState<any>([]);
  const [srchStartDate, setSrchStartDate] = useState<Date | null>(null);
  const [srchEndDate, setSrchEndDate] = useState<Date | null>(null);
  const [filterList, setFilterList] = useState<{
    srchStartDate: Date | null,
    srchEndDate: Date | null,
    srchShipperGroup: any[],
    srchConceptPoint: any[]
  }>({
    srchStartDate: null,
    srchEndDate: null,
    srchShipperGroup: [],
    srchConceptPoint: [],
  });

  const handleGetMaster = async () => {
    try {
    const res_type_concept_point: any = await getService(`/master/asset/type-concept-point`);
    if(Array.isArray(res_type_concept_point)) {
      setTypeConceptPointMaster(res_type_concept_point)
    }
    } catch (error) {
      setTypeConceptPointMaster([])
    }

    try {
      // DATA CONCEPT POINT
      let url = `/master/asset/concept-point-query`

      if(srchStartDate) {
        const startDate = toDayjs(srchStartDate);
        if(startDate.isValid()) {
          url += `?start_date=${startDate.format("YYYY-MM-DD")}`
        }
      }

      if(srchEndDate) {
        const endDate = toDayjs(srchEndDate);
        if(endDate.isValid()) {
          if(url.includes('?')) {
            url += `&end_date=${endDate.format("YYYY-MM-DD")}`
          } else {
            url += `?end_date=${endDate.format("YYYY-MM-DD")}`
          }
        }
      }

      const res = await getService(url)

      if(Array.isArray(res)) {
        console.log('res : ', res);
        setConceptPoint(res)
      }

    } catch (error) {
        setConceptPoint([])
    }

  }

  // ############### DATA TABLE ###############
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFieldSearch = async () => {
    setFilterList({
      srchStartDate: srchStartDate,
      srchEndDate: srchEndDate,
      srchShipperGroup: srchShipperGroup,
      srchConceptPoint: srchConceptPoint,
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSrchConceptPoint([])
    setSrchShipperGroup([])
    setSrchStartDate(null);
    setSrchEndDate(null);
    setFilterList({
      srchStartDate: null,
      srchEndDate: null,
      srchShipperGroup: [],
      srchConceptPoint: [],
    });
    setKey((prevKey) => prevKey + 1);
  };

  const handleQueryOnChange = (query: string) => {
      setQuerySearch(query);
  };

  // const handleQueryKeyPress = (query: string) => {
  //     setQuerySearch(query);
  //     fetchData({startDate: filterList.srchStartDate, endDate: filterList.srchEndDate, shipperGroup: filterList.srchShipperGroup, conceptPoint: filterList.srchConceptPoint, query: query});
  // };
const handleQueryKeyPress = (query: string) => {
    setQuerySearch(query);
    fetchData({
        startDate: filterList.srchStartDate,
        endDate: filterList.srchEndDate,
        shipperGroup: filterList.srchShipperGroup,
        conceptPoint: filterList.srchConceptPoint,
        query: query
    });
};

  const fetchData = async ({offset, limit, startDate, endDate, shipperGroup, conceptPoint, query}: {offset?: number, limit?: number, startDate?: Date | null, endDate?: Date | null, shipperGroup?: any[], conceptPoint?: any[], query?: string}) => {
      const loadingTimer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
    try {
      const lim = typeof limit === 'number' ? limit : pagination.pageSize;
      const off = typeof offset === 'number' ? offset : (pagination.pageIndex * lim);

      const qTrim = (query ?? '').toString().trim();
      const queryLower = qTrim.toLowerCase()//.replace(/\s+/g, '');
      
    
      let url = `/master/asset/limit-concept-point-history?limit=${lim}&offset=${off}${querySearch ? `&q=${queryLower}` : ''}`

      if (startDate) {
          url += `&startDate=${toDayjs(startDate).format('YYYY-MM-DD')}`
      }

      if (endDate) {
          url += `&endDate=${toDayjs(endDate).format('YYYY-MM-DD')}`
      }

      if ((shipperGroup || []).length > 0) {
          url += `&groupId=${shipperGroup}`
      }

      if ((conceptPoint || []).length > 0) {
          url += `&conceptPointId=${conceptPoint}`
      }

      if (sorting?.length > 0) {
          const s = sorting[0];
          url += `&orderByName=${encodeURIComponent(String(s.id))}&orderBy=${s.desc ? 'desc' : 'asc'}`;
      }

      const response: any = await getService(url);
      setTotalItems(response?.total)

      let data = response?.data || []

      setFilteredDataTable(data);
      settk(!tk);

    } catch (err) {
      // setError(err.message);
    } finally {
      clearTimeout(loadingTimer);
      setIsLoading(true);
    }
  };

  // ############# NEW MODAL CREATE/EDIT/VIEW  #############
  const [isModalSuccessOpen, setModalSuccessOpen] = useState(false);
  const handleCloseModal = () => setModalSuccessOpen(false);

  const [formLimitOpen, setFormLimitOpen] = useState(false);

  const [modalErrorMsg, setModalErrorMsg] = useState('');
  const [isModalErrorOpen, setModalErrorOpen] = useState(false);
  const [modalModalSuccessMsg, setModalSuccessMsg] = useState('');

  const openLimitForm = (mode: any) => {
    setFormLimitOpen(true);
  };

  // ############### COLUMN SHOW/HIDE ###############
  const initialColumns: any = [
    { key: 'group.name', label: 'Shipper name', visible: true },
    { key: 'concept_point.concept_point', label: 'Concept point', visible: true },
    { key: 'create_date', label: 'Created date', visible: true },
    { key: 'deleted_date', label: 'Deleted date', visible: true },
    { key: 'create_by', label: 'Created by', visible: true },
    { key: 'deleted_by', label: 'Deleted by', visible: true }
  ];

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const [columnVisibility, setColumnVisibility] = useState<any>(
    Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible]))
  );

  const handleColumnToggle = (columnKey: string | VisibilityState) => {
    if (typeof columnKey === 'string') {
      // Handle string case - single column toggle
      setColumnVisibility((prev: any) => ({
        ...prev,
        [columnKey]: !prev[columnKey]
      }));
    } else if (typeof columnKey === 'object' && columnKey !== null) {
      // Handle VisibilityState object case - bulk column visibility update
      setColumnVisibility((prev: any) => ({
        ...prev,
        ...columnKey
      }));
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "group.name",
        header: "Shipper name",
        enableSorting: true,
        cell: ({ getValue, row }: { getValue: () => any, row: Row<any> }) => {
          const value = getValue()
          return (
            <div>{value ? value : ''}</div>
          )
        },
      },
      {
        accessorKey: "concept_point.concept_point",
        header: "Concept point",
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
          accessorKey: "create_date",
          header: "Created date",
          enableSorting: true,
          accessorFn: (row) => `${row?.create_date ? formatDate(row?.create_date) : ''}`,
          cell: (info) => {
              const row: any = info?.row?.original
              return (
                  <div>
                      <span className={`text-[#464255]`}>{row?.create_date ? formatDate(row?.create_date) : ''}</span>
                  </div>
              )
          }
      },
      {
          accessorKey: "deleted_date",
          header: "Deleted date",
          enableSorting: true,
          accessorFn: (row) => `${row?.deleted_date ? formatDate(row?.deleted_date) : ''}`,
          cell: (info) => {
              const row: any = info?.row?.original
              return (
                  <div>
                      <span className={`text-[#464255]`}>{row?.deleted_date ? formatDate(row?.deleted_date) : ''}</span>
                  </div>
              )
          }
      },
      {
          accessorKey: "create_by",
          header: "Created by",
          enableSorting: true,
          accessorFn: (row) => `${`${row?.create_by_account?.first_name} ` || ''}${row?.create_by_account?.last_name}`,
          cell: (info) => {
              const row: any = info?.row?.original
              return (
                  <div>
                      <span className={`text-[#464255]`}>{row?.create_by_account?.first_name} {row?.create_by_account?.last_name}</span>
                  </div>
              )
          }
      },
      {
          accessorKey: "deleted_by",
          header: "Deleted by",
          enableSorting: true,
          accessorFn: (row) => `${`${row?.update_by_account?.first_name} ` || ''}${row?.update_by_account?.last_name}`,
          cell: (info) => {
              const row: any = info?.row?.original
              return (
                  <div>
                      <span className={`text-[#464255]`}>{row?.update_by_account?.first_name} {row?.update_by_account?.last_name}</span>
                  </div>
              )
          }
      },
    ], []
  )

  const [tk, settk] = useState(false);


  useEffect(() => {
    const off = pagination.pageIndex * pagination.pageSize;
    fetchData({
      offset: off,
      limit: pagination.pageSize,
      startDate: filterList.srchStartDate,
      endDate: filterList.srchEndDate,
      shipperGroup: filterList.srchShipperGroup,
      conceptPoint: filterList.srchConceptPoint,
      query: querySearch
    });
  }, [pagination.pageIndex, pagination.pageSize, sorting, filterList]);

  return (
    <div className=" space-y-2">
      <div className="border-[#DFE4EA] border-[1px] p-4 rounded-xl flex flex-col sm:flex-row gap-2">
        <aside className="flex flex-wrap sm:flex-row gap-2 w-full">

          <DatePickaSearch
            key={"start" + key}
            label="Start Date"
            placeHolder="Select Start Date"
            allowClear
            onChange={(e: any) => {
              setSrchStartDate(e ? e : null)
              setSrchShipperGroup([])
              setSrchConceptPoint([])
            }}
          />

          <DatePickaSearch
            key={"end" + key}
            label="End Date"
            placeHolder="Select End Date"
            allowClear
            onChange={(e: any) => {
              setSrchEndDate(e ? e : null)
              setSrchShipperGroup([])
              setSrchConceptPoint([])
            }}
          />

          <InputSearch
            id="srchShipperGroup"
            label="Shipper Name"
            type="select-multi-checkbox"
            value={srchShipperGroup}
            onChange={(e) => setSrchShipperGroup(e?.target?.value || [])}
            options={(Array.isArray(shipperGroupData?.data) ? (shipperGroupData?.data || []) : [])
              .filter((item: any) => {
                if(!item) return false;
                const itemStartDate = item.start_date ? new Date(item.start_date) : null;
                const itemEndDate = item.end_date ? new Date(item.end_date) : null;
                if(srchStartDate && srchEndDate) {
                  return !!itemStartDate && itemStartDate <= srchEndDate && (!itemEndDate || itemEndDate >= srchStartDate)
                }
                else if(srchStartDate) {
                  return !!itemStartDate && itemStartDate <= srchStartDate && (!itemEndDate || itemEndDate >= srchStartDate)
                }
                else if(srchEndDate) {
                  return !!itemStartDate && itemStartDate <= srchEndDate && (!itemEndDate || itemEndDate >= srchEndDate)
                }
                return true
              })
              .map((item: any) => ({
                value: item?.id ? item.id.toString() : '',
                label: item?.name ?? ''
              }))
            }
            customWidth={250}
          />

          <InputSearch
            id="searchConceptPoint"
            label="Concept Point"
            type="select-multi-checkbox"
            value={srchConceptPoint}
            onChange={(e) => setSrchConceptPoint(e?.target?.value || [])}
            options={(conceptPoint || [])
              .filter((item: any) => {
                if(!item) return false;
                const itemStartDate = item.start_date ? new Date(item.start_date) : null;
                const itemEndDate = item.end_date ? new Date(item.end_date) : null;
                if(srchStartDate && srchEndDate) {
                  return !!itemStartDate && itemStartDate <= srchEndDate && (!itemEndDate || itemEndDate >= srchStartDate)
                }
                else if(srchStartDate) {
                  return !!itemStartDate && itemStartDate <= srchStartDate && (!itemEndDate || itemEndDate >= srchStartDate)
                }
                else if(srchEndDate) {
                  return !!itemStartDate && itemStartDate <= srchEndDate && (!itemEndDate || itemEndDate >= srchEndDate)
                }

                // const hasLimit = conceptPointLimit.some((limit: any) => limit.concept_point_id === item.id && (srchShipperGroup.length == 0 ? true : srchShipperGroup.includes(`${limit.group_id}`)))

                return true
              })
              .map((item: any) => ({
                value: item?.id ? item.id.toString() : '',
                label: item?.concept_point ?? ''
              }))
            }
          />

          <BtnSearch handleFieldSearch={handleFieldSearch} />
          <BtnReset handleReset={handleReset} />
        </aside>

        <aside className="mt-auto pl-1">
          <div className="flex gap-2">
            {
              userPermission?.f_create && <>
                <Button className="flex items-center justify-center gap-3 px-2  h-[44px] w-[190px] bg-[#36B1AB] font-light normal-case" onClick={() => openLimitForm('create-period')}>
                  <span>{`Concept Point Limit`}</span>
                  <AddCircleIcon style={{ fontSize: "16px" }} />
                </Button>
              </>
            }
          </div>
        </aside>
      </div>

      {/* ================== NEW TABLE ==================*/}
      <AppTable
        data={filteredDataTable}
        columns={columns}
        isLoading={isLoading}
        exportBtn={
          <BtnExport
            textRender={"Export"}
            path="dam/concept-point-limit"
            specificData={
                {
                  startDate: filterList.srchStartDate,
                  endDate: filterList.srchEndDate,
                  shipperGroup: filterList.srchShipperGroup,
                  conceptPoint: filterList.srchConceptPoint,
                  // query: querySearch
                }
            }
            can_export={userPermission ? userPermission?.f_export : false} columnVisibility={columnVisibility} initialColumns={initialColumns}
          />
        }
        initialColumns={Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible]))}
        onColumnVisibilityChange={(columnKey: any) => handleColumnToggle(columnKey)}
        onFilteredDataChange={(filteredData: any) => {
          const newData = filteredData || [];
          // Check if the filtered data is different from current dataExport
          if (JSON.stringify(dataExport) !== JSON.stringify(newData)) {
            setDataExport(newData);
          }
        }}
        pagination={pagination}
        setPagination={setPagination}
        manualPagination={true}
        totalItems={totalItems}
        sorting={sorting}
        setSorting={(next) => {
            setSorting(next);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        }}
        onQueryChange={handleQueryOnChange}
        onQueryKeyDown={handleQueryKeyPress}
        // onQueryBlur={handleQueryKeyPress} // https://app.clickup.com/t/9018502823/z92046r0fb
      />

      <ModalComponent
        open={isModalSuccessOpen}
        handleClose={handleCloseModal}
        title="Success"
        description={modalModalSuccessMsg}
      />

      <ModalComponent
        open={isModalErrorOpen}
        handleClose={() => {
          setModalErrorOpen(false);
        }}
        title="Failed"
        description={
          <div>
            <div className="text-center">
              {`${modalErrorMsg}`}
            </div>
          </div>
        }
        stat="error"
      />

      <ModalLimit
        open={formLimitOpen}
        typeConceptData={typeConceptPointMaster}
        shipperGroupData={Array.isArray(shipperGroupData?.data) ? (shipperGroupData?.data || []) : []}
        conceptPointData={conceptPoint || []}
        actionBy={userDT}
        setModalSuccessMsg={setModalSuccessMsg}
        setModalSuccessOpen={setModalSuccessOpen}
        setModalErrorMsg={setModalErrorMsg}
        setModalErrorOpen={setModalErrorOpen}
        onClose={() => {
          const off = pagination.pageIndex * pagination.pageSize;
          fetchData({
            offset: off,
            limit: pagination.pageSize,
            startDate: filterList.srchStartDate,
            endDate: filterList.srchEndDate,
            shipperGroup: filterList.srchShipperGroup,
            conceptPoint: filterList.srchConceptPoint,
            query: querySearch
          });
          setFormLimitOpen(false);
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