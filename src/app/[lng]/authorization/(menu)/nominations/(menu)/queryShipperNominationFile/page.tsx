'use client'

import {useEffect, useMemo, useRef, useState} from 'react'
import {
  adjustEndDateForTab,
  cutUploadFileName,
  filterByDateRange,
  findRoleConfigByMenuName,
  formatDateNoTime,
  generateUserPermission,
  getCurrentWeekSundayYyyyMmDd,
  getDateRangeForApi,
  iconButtonClass,
  toDayjs
} from '@/utils/generalFormatter'
import {InputSearch} from '@/components/other/SearchForm'
import {getService, postService} from '@/utils/postService'
import BtnExport from '@/components/other/btnExport'
import {useFetchMasters} from '@/hook/fetchMaster'
import BtnSearch from '@/components/other/btnSearch'
import BtnReset from '@/components/other/btnReset'
import PaginationComponent from '@/components/other/globalPagination'
import ColumnVisibilityPopover from '@/components/other/popOverShowHideCol'
import {useAppDispatch} from '@/utils/store/store'
import ModalFiles from './form/modalFiles'
import getCookieValue from '@/utils/getCookieValue'
import useRestrictedPage from '@/utils/checkRestrictedPage'
import {fetchNominationType} from '@/utils/store/slices/nominationTypeSlice'
import ModalComment from './form/modalComment'
import getUserValue from '@/utils/getuserValue'
import ModalComponent from '@/components/other/ResponseModal'
import {decryptData} from '@/utils/encryptionData'
import TableNomQueryShipperNomFile from './form/table'
import {Tab, Tabs} from '@mui/material'
import DatePickaSearch from '@/components/library/dateRang/dateSearch'
import {ColumnDef, VisibilityState} from '@tanstack/react-table'
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined'
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded'
import AppTable, {myCustomSortingByDateFn} from '@/components/table/AppTable'
import {useSearchParams} from 'next/navigation'
import OffsetTable from '@/components/table/OffsetTable'
import dayjs from 'dayjs'

const ClientPage = () => {
  // ############### Check Authen ###############
  const userDT: any = getUserValue()
  const token = getCookieValue('v4r2d9z5m3h0c1p0x7l')
  useRestrictedPage(token)

  // ############### PERMISSION ###############
  const [userPermission, setUserPermission] = useState<any>()

  const searchParams = useSearchParams()

  const tab_selected_from_somewhere_else = searchParams.get('tabselected')
  const status_from_somewhere_else = searchParams.get('status')

  const hasStatusFromUrl = Boolean(status_from_somewhere_else)

  const [useParams, setuseParams] = useState<boolean>(false)

  // ############### REDUX DATA ###############
  const {nominationStatMaster} = useFetchMasters()

  const urlStatusId = useMemo(() => {
    if (!status_from_somewhere_else) {
      return null
    }

    const foundStatus = nominationStatMaster?.data?.find(
      (item: any) =>
        item?.name?.trim()?.toLowerCase() ===
        status_from_somewhere_else?.trim()?.toLowerCase()
    )

    return foundStatus?.id ? foundStatus.id.toString() : null
  }, [nominationStatMaster?.data, status_from_somewhere_else])

  const [forceRefetch, setForceRefetch] = useState(true)
  const dispatch = useAppDispatch()

  // ############### FIELD SEARCH ###############
  const [filteredDataTable, setFilteredDataTable] = useState<any>([])
  const [key, setKey] = useState(0)

  const [srchShipper, setSrchShipper] = useState<any>([])
  const [srchContractCode, setSrchContractCode] = useState<any>([])
  const [srchStatus, setSrchStatus] = useState<any>([])

  const [srchStartDate, setSrchStartDate] = useState<Date | null>(
    hasStatusFromUrl ? null : new Date()
  )

  const [srchEndDate, setSrchEndDate] = useState<Date | null>(
    hasStatusFromUrl ? null : new Date()
  )

  // ############### DATA TABLE ###############
  const didMount = useRef(false)

  const [tabIndex, setTabIndex] = useState<any>(
    tab_selected_from_somewhere_else
      ? parseInt(tab_selected_from_somewhere_else)
      : 0
  )

  const [dataTable, setData] = useState<any>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [resetForm, setResetForm] = useState<() => void | null>()

  // ============================================================
  // CONTRACT MASTER
  //
  // dataContractOriginal = Contract ทั้งหมดจาก shipper-data
  // dataContract         = Contract ทั้งหมดจาก shipper-data
  // dataContractFiltered = Contract หลังกรอง Shipper + Date
  // ============================================================
  const [dataContractOriginal, setDataContractOriginal] = useState<any>([])
  const [dataContract, setDataContract] = useState<any>([])
  const [dataContractFiltered, setDataContractFiltered] = useState<any[]>([])

  // ============================================================
  // SHIPPER DATA
  //
  // ดึงจาก:
  // /master/daily-adjustment/shipper-data
  //
  // โดย Filter จาก:
  // srchStartDate -> start_date
  // srchEndDate   -> end_date
  // ============================================================
  const [dataShipper, setDataShipper] = useState<any>([])

  // ############# NEW MODAL CREATE/EDIT/VIEW #############
  const [isModalSuccessOpen, setModalSuccessOpen] = useState(false)
  const [modalModalSuccessMsg, setModalSuccessMsg] = useState('')

  const handleCloseModal = () => setModalSuccessOpen(false)

  const [modalErrorMsg, setModalErrorMsg] = useState('')
  const [isModalErrorOpen, setModalErrorOpen] = useState(false)

  // ############### MODAL ALL FILES ###############
  const [mdFileView, setMdFileView] = useState<any>(false)
  const [dataFile, setDataFile] = useState<any>([])

  // ############### REASON VIEW ###############
  const [mdReasonView, setMdReasonView] = useState(false)
  const [dataReason, setDataReason] = useState<any>([])
  const [dataReasonRow, setDataReasonRow] = useState<any>([])

  // ############### COLUMN SHOW/HIDE ###############
  const initialColumns: any = [
    {
      key: 'status',
      label: 'Status',
      visible: true
    },
    {
      key: 'gas_day',
      label: tabIndex == 0 ? 'Gas Day' : 'Gas Week',
      visible: true
    },
    {
      key: 'shipper_name',
      label: 'Shipper Name',
      visible: true
    },
    {
      key: 'contract_code',
      label: 'Contract Code',
      visible: true
    },
    {
      key: 'file_name',
      label: 'File Name',
      visible: true
    },
    {
      key: 'submission_comment',
      label: 'Submission Comment',
      visible: true
    },
    {
      key: 'file',
      label: 'File',
      visible: true
    }
  ]

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const [columnVisibility, setColumnVisibility] = useState<any>(
    Object.fromEntries(
      (initialColumns || []).map((column: any) => [
        column?.key,
        column?.visible
      ])
    )
  )

  // ############### PAGINATION ###############
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dataTableTotal, setDataTotal] = useState<any>()

  const [globalFilter, setGlobalFilter] = useState('')

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage)
    setCurrentPage(1)
  }

  // ============================================================
  // PERMISSION
  // ============================================================
  const getPermission = () => {
    try {
      let user_permission: any =
        typeof window !== 'undefined'
          ? localStorage?.getItem('k3a9r2b6m7t0x5w1s8j') ||
            getCookieValue('k3a9r2b6m7t0x5w1s8j')
          : null

      user_permission = user_permission
        ? decryptData(user_permission)
        : null

      let parsed_permission = user_permission

      if (typeof parsed_permission === 'string') {
        parsed_permission = JSON.parse(parsed_permission)
      }

      const permission = findRoleConfigByMenuName(
        `Query Shipper' Nomination File`,
        userDT
      )

      if (permission) {
        setUserPermission(permission)
      } else if (parsed_permission?.role_config) {
        const updatedUserPermission =
          generateUserPermission(parsed_permission)

        setUserPermission(updatedUserPermission)
      }
    } catch (error) {
      // Failed to parse user_permission
    }
  }

  useEffect(() => {
    if (forceRefetch || !nominationStatMaster?.data) {
      dispatch(fetchNominationType())
    }

    if (forceRefetch) {
      setForceRefetch(false)
    }

    getPermission()
  }, [dispatch, forceRefetch, nominationStatMaster])

  // ============================================================
  // SEARCH
  // ============================================================
  const handleFieldSearch = () => {
    setIsLoading(false)

    fetchData(
      tabIndex,
      currentPage,
      itemsPerPage
    )
  }

  // ============================================================
  // RESET
  // ============================================================
  const handleReset = async () => {
    setIsLoading(false)

    const resetShipper =
      userDT?.account_manage?.[0]?.user_type_id == 3
        ? [userDT?.account_manage?.[0]?.group?.id]
        : []

    const today = new Date()

    setSrchShipper(resetShipper)
    setSrchStatus([])
    setSrchContractCode([])
    setSrchStartDate(today)
    setSrchEndDate(today)
    setCurrentPage(1)

    setKey((prevKey) => prevKey + 1)

    fetchData(
      tabIndex,
      1,
      itemsPerPage,
      'reset',
      {
        statusIds: [],
        shipperIds: resetShipper,
        contractCodes: [],
        startDate: today,
        endDate: today
      }
    )
  }

  const handleResetFilter = async (
    tab: number
  ) => {
    const resetShipper =
      userDT?.account_manage?.[0]?.user_type_id == 3
        ? [userDT?.account_manage?.[0]?.group?.id]
        : []

    let resetDate: Date

    if (tab === 1) {
      const currentWeekDate =
        getCurrentWeekSundayYyyyMmDd()

      resetDate = dayjs(
        currentWeekDate,
        'YYYY-MM-DD'
      ).toDate()
    } else {
      resetDate = new Date()
    }

    setSrchShipper(resetShipper)
    setSrchStatus([])
    setSrchContractCode([])
    setSrchStartDate(resetDate)
    setSrchEndDate(resetDate)
    setCurrentPage(1)

    setKey((prevKey) => prevKey + 1)

    fetchData(
      tab,
      1,
      itemsPerPage,
      'reset',
      {
        statusIds: [],
        shipperIds: resetShipper,
        contractCodes: [],
        startDate: resetDate,
        endDate: resetDate
      }
    )
  }

  // ============================================================
  // SHIPPER + CONTRACT MASTER
  //
  // Shipper และ Contract ใช้ข้อมูลจาก API เส้นเดียวกัน
  //
  // /master/daily-adjustment/shipper-data
  //
  // เหมือนหน้า Allocation Monthly Report
  // ============================================================
  const fetchMaster = async (
    startDateValue?: Date | null,
    endDateValue?: Date | null
  ) => {
    try {
      const startDate = startDateValue
        ? dayjs(startDateValue).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD')

      const endDate = endDateValue
        ? dayjs(endDateValue).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD')

      const apiUrl =
        `/master/daily-adjustment/shipper-data` +
        `?start_date=${startDate}` +
        `&end_date=${endDate}`

      const res_shipper: any =
        await getService(apiUrl)

      if (
        res_shipper &&
        Array.isArray(res_shipper)
      ) {
        // ======================================================
        // SHIPPER
        // ======================================================
        setDataShipper(res_shipper)

        // ======================================================
        // CONTRACT
        //
        // เหมือนหน้า Allocation Monthly Report
        //
        // Shipper User:
        // เอา Contract เฉพาะ Group ตัวเอง
        //
        // TSO/Other:
        // เอา Contract ของ Shipper ทุกตัว
        // ======================================================
        let contractList: any[] = []

        if (
          userDT?.account_manage?.[0]?.user_type_id == 3
        ) {
          contractList = res_shipper
            .filter(
              (item: any) =>
                item?.id ===
                userDT?.account_manage?.[0]?.group?.id
            )
            .flatMap(
              (item: any) =>
                Array.isArray(item?.contract_code)
                  ? item.contract_code
                  : []
            )
        } else {
          contractList = res_shipper.flatMap(
            (item: any) =>
              Array.isArray(item?.contract_code)
                ? item.contract_code
                : []
          )
        }

        // ======================================================
        // กัน Contract Code ซ้ำ
        // ======================================================
        const uniqueContractList =
          Array.from(
            new Map(
              contractList
                .filter(
                  (item: any) =>
                    item?.contract_code
                )
                .map(
                  (item: any) => [
                    item?.contract_code,
                    item
                  ]
                )
            ).values()
          )

        setDataContractOriginal(
          uniqueContractList
        )

        setDataContract(
          uniqueContractList
        )
      } else {
        setDataShipper([])
        setDataContractOriginal([])
        setDataContract([])
        setDataContractFiltered([])
      }
    } catch (error) {
      setDataShipper([])
      setDataContractOriginal([])
      setDataContract([])
      setDataContractFiltered([])
    }
  }

  // ============================================================
  // GAS DAY FROM / GAS DAY TO เปลี่ยน
  //
  // โหลด Shipper + Contract ใหม่
  // ============================================================
  useEffect(() => {
    fetchMaster(
      srchStartDate,
      srchEndDate
    )
  }, [
    srchStartDate,
    srchEndDate
  ])

  // ============================================================
  // CONTRACT CODE FILTER
  //
  // Logic เหมือนหน้า Allocation Monthly Report
  //
  // 1. Filter ตาม Shipper
  // 2. Filter ตามช่วง Gas Day From - Gas Day To
  // 3. extend_deadline
  //    || terminate_date
  //    || contract_end_date
  //
  // 4. subtract 1 day
  // ============================================================
  useEffect(() => {
    if (
      !Array.isArray(dataContract) ||
      dataContract.length === 0
    ) {
      setDataContractFiltered([])
      return
    }

    // ==========================================================
    // SHIPPER FILTER
    // ==========================================================
    const selectedShipperIds =
      Array.isArray(srchShipper)
        ? srchShipper
            .filter(
              (item: any) =>
                item !== null &&
                item !== undefined
            )
            .map(String)
        : []

    const contractsByShipper =
      dataContract.filter(
        (item: any) => {
          if (
            selectedShipperIds.length === 0
          ) {
            return true
          }

          const contractGroupId =
            item?.group?.id ??
            item?.group_id

          return selectedShipperIds.includes(
            String(contractGroupId)
          )
        }
      )

    // ==========================================================
    // DATE RANGE
    //
    // ถ้า From ไม่มี ใช้ To
    // ถ้า To ไม่มี ใช้ From
    // ถ้าไม่มีทั้งคู่ ใช้วันนี้
    // ==========================================================
    const startDateValue =
      srchStartDate ??
      srchEndDate ??
      new Date()

    let endDateValue: any =
      srchEndDate ??
      srchStartDate ??
      new Date()

    // ==========================================================
    // WEEKLY
    //
    // ใช้ช่วง Gas Week ให้เหมือน fetchData
    // ==========================================================
    if (
      tabIndex === 1 &&
      endDateValue
    ) {
      endDateValue =
        adjustEndDateForTab(
          tabIndex,
          startDateValue,
          endDateValue
        )
    }

    const rangeStart =
      dayjs(
        startDateValue
      ).startOf('day')

    const rangeEnd =
      dayjs(
        endDateValue
      ).endOf('day')

    if (
      !rangeStart.isValid() ||
      !rangeEnd.isValid()
    ) {
      setDataContractFiltered([])
      return
    }

    // ==========================================================
    // CONTRACT DATE FILTER
    // ==========================================================
    const activeContracts =
      contractsByShipper.filter(
        (contract: any) => {
          if (
            !contract ||
            !contract?.contract_start_date
          ) {
            return false
          }

          const contractStart =
            dayjs(
              contract.contract_start_date
            ).startOf('day')

          if (
            !contractStart.isValid()
          ) {
            return false
          }

          /**
           * เหมือนหน้า Allocation Monthly Report
           *
           * ถ้ามี extend_deadline ใช้ก่อน
           * ถ้าไม่มีใช้ terminate_date
           * ถ้าไม่มีอีกใช้ contract_end_date
           */
          const contractEndDate =
            contract?.extend_deadline ||
            contract?.terminate_date ||
            contract?.contract_end_date

          const contractEnd =
            contractEndDate
              ? dayjs(
                  contractEndDate
                )
                  .subtract(1, 'day')
                  .endOf('day')
              : null

          /**
           * Contract ต้อง Overlap กับช่วงที่เลือก
           *
           * Contract:
           * [contractStart ------------- contractEnd]
           *
           * Search:
           *        [rangeStart -------- rangeEnd]
           *
           * contractStart <= rangeEnd
           * &&
           * contractEnd >= rangeStart
           */

          const startIsValid =
            contractStart.isBefore(rangeEnd) ||
            contractStart.isSame(rangeEnd)

          const endIsValid =
            !contractEnd ||
            !contractEnd.isValid() ||
            contractEnd.isAfter(rangeStart) ||
            contractEnd.isSame(rangeStart)

          return (
            startIsValid &&
            endIsValid
          )
        }
      )

    // ==========================================================
    // UNIQUE CONTRACT
    // ==========================================================
    const uniqueContracts =
      Array.from(
        new Map(
          activeContracts
            .filter(
              (item: any) =>
                item?.contract_code
            )
            .map(
              (item: any) => [
                item?.contract_code,
                item
              ]
            )
        ).values()
      )

    setDataContractFiltered(
      uniqueContracts
    )
  }, [
    dataContract,
    srchShipper,
    srchStartDate,
    srchEndDate,
    tabIndex
  ])

  // ============================================================
  // ถ้า Contract ที่เลือกอยู่
  // หายออกจาก Option หลังเปลี่ยน Shipper / Date
  //
  // ให้เอาเฉพาะ Contract ที่ยัง Valid
  // ============================================================
  useEffect(() => {
    if (
      !Array.isArray(srchContractCode) ||
      srchContractCode.length === 0
    ) {
      return
    }

    const validContractCodes =
      new Set(
        dataContractFiltered
          .map(
            (item: any) =>
              item?.contract_code
          )
          .filter(Boolean)
      )

    const validSelected =
      srchContractCode.filter(
        (code: any) =>
          validContractCodes.has(code)
      )

    if (
      validSelected.length !==
      srchContractCode.length
    ) {
      setSrchContractCode(
        validSelected
      )
    }
  }, [dataContractFiltered])

  // ============================================================
  // GLOBAL FILTER
  // ============================================================
  const globalFilterMountedRef =
    useRef(false)

  useEffect(() => {
    if (!globalFilterMountedRef.current) {
      globalFilterMountedRef.current = true
      return
    }

    if (globalFilter.length === 0) {
      setCurrentPage(1)

      fetchData(
        tabIndex,
        1,
        itemsPerPage
      )
    }
  }, [globalFilter])

  // ============================================================
  // FETCH DATA TABLE
  // ============================================================
  type FetchDataOptions = {
    statusIds?: string[]
    shipperIds?: any[]
    contractCodes?: string[]
    startDate?: Date | null
    endDate?: Date | null
  }

  const fetchData = async (
    tab: number = tabIndex,
    offset: number = currentPage,
    limit: number = itemsPerPage,
    reset?: 'reset',
    options?: FetchDataOptions
  ) => {
    setIsLoading(false)

    try {
      const res_file_name: any =
        await getService(
          `/master/query-shipper-nomination-file/get-file-name`
        )

      // ========================================================
      // Shipper User
      // ========================================================
      if (
        userDT?.account_manage?.[0]?.user_type_id == 3
      ) {
        setSrchShipper([
          userDT?.account_manage?.[0]?.group?.id
        ])
      }

      const transdate = (
        date:
          | Date
          | string
          | null
          | undefined
      ): string | null => {
        if (!date) {
          return null
        }

        const parsedDate =
          dayjs(date)

        return parsedDate.isValid()
          ? parsedDate.format(
              'YYYY-MM-DD'
            )
          : null
      }

      const effectiveStartDate =
        options?.startDate !== undefined
          ? options.startDate
          : srchStartDate

      const effectiveEndDate =
        options?.endDate !== undefined
          ? options.endDate
          : srchEndDate

      const newEndDate =
        !effectiveStartDate &&
        !effectiveEndDate
          ? null
          : adjustEndDateForTab(
              tab,
              effectiveStartDate,
              effectiveEndDate
            )

      const currentWeekDate =
        getCurrentWeekSundayYyyyMmDd()

      const currentWeekDateFormatted =
        dayjs(
          currentWeekDate,
          'YYYY-MM-DD'
        ).toDate()

      let dayfrom:
        | string
        | null

      let dayto:
        | string
        | null

      if (
        reset ===
        'reset'
      ) {
        if (
          tab === 0
        ) {
          dayfrom =
            dayjs().format(
              'YYYY-MM-DD'
            )

          dayto =
            dayjs().format(
              'YYYY-MM-DD'
            )
        } else {
          dayfrom =
            transdate(
              currentWeekDateFormatted
            )

          dayto =
            transdate(
              currentWeekDateFormatted
            )
        }
      } else {
        dayfrom =
          transdate(
            effectiveStartDate
          )

        dayto =
          transdate(
            newEndDate
          )
      }

      const effectiveStatusIds =
        options?.statusIds !== undefined
          ? options.statusIds
          : Array.isArray(srchStatus)
            ? srchStatus
            : []

      const effectiveShipperIds =
        options?.shipperIds !== undefined
          ? options.shipperIds
          : Array.isArray(srchShipper)
            ? srchShipper
            : []

      const effectiveContractCodes =
        options?.contractCodes !== undefined
          ? options.contractCodes
          : Array.isArray(srchContractCode)
            ? srchContractCode
            : []

      const newOffset =
        offset - 1

      const body = {
        nomination_type_id:
          tab + 1,

        offset:
          newOffset,

        limit:
          limit,

        gas_day_from:
          dayfrom,

        gas_day_to:
          dayto,

        shipper_id_arr:
          effectiveShipperIds,

        contract_code_arr:
          effectiveContractCodes,

        status_id_arr:
          (
            effectiveStatusIds ||
            []
          ).map(Number),

        search: ''
      }

      const res_api: any =
        await postService(
          `/master/query-shipper-nomination-file/v2`,
          body
        )

      setDataTotal(
        res_api?.total
      )

      const response: any =
        res_api?.data

      const filtered_daily_weekly: any =
        response?.filter(
          (item: any) =>
            tab == 0
              ? item?.nomination_type_id ==
                1
              : item?.nomination_type_id ==
                2
        )

      // ========================================================
      // MAP FILE NAME
      // ========================================================
      const updatedDataDaily =
        (
          filtered_daily_weekly ||
          []
        ).map(
          (item: any) => {
            const find_ =
              res_file_name?.find(
                (
                  itemx: any
                ) =>
                  itemx?.id ==
                  item?.id
              )

            return {
              ...item,

              k_file_name:
                find_
                  ?.query_shipper_nomination_file_url
                  ?.length >
                0
                  ? cutUploadFileName(
                      find_
                        ?.query_shipper_nomination_file_url?.[0]
                        ?.url
                    )
                  : ''
            }
          }
        )

      // ========================================================
      // SHIPPER USER
      // ========================================================
      if (
        userDT?.account_manage?.[0]?.user_type_id ==
        3
      ) {
        const shipperData =
          updatedDataDaily?.filter(
            (
              item: any
            ) =>
              item?.group_id ===
              userDT
                ?.account_manage?.[0]
                ?.group_id
          )

        setData(
          shipperData
        )

        setFilteredDataTable(
          shipperData
        )
      } else {
        setData(
          updatedDataDaily
        )

        setFilteredDataTable(
          updatedDataDaily
        )
      }

      // ========================================================
      // สำคัญ
      //
      // ไม่สร้าง dataContractOriginal จาก response ตรงนี้แล้ว
      //
      // Contract Code ใช้จาก:
      //
      // /master/daily-adjustment/shipper-data
      //
      // เพื่อให้ Logic เหมือน Allocation Monthly Report
      // ========================================================

      setTimeout(() => {
        setIsLoading(
          true
        )
      }, 500)
    } catch (err) {
      // Failed
    } finally {
      // finally
    }
  }

  // ============================================================
  // INITIAL FETCH
  // ============================================================
  const initialFetchRef =
    useRef(false)

  useEffect(() => {
    if (
      initialFetchRef.current
    ) {
      return
    }

    if (
      hasStatusFromUrl &&
      !nominationStatMaster
        ?.data?.length
    ) {
      return
    }

    initialFetchRef.current =
      true

    const initialStatusIds =
      hasStatusFromUrl &&
      urlStatusId
        ? [urlStatusId]
        : []

    if (
      hasStatusFromUrl
    ) {
      setSrchStatus(
        initialStatusIds
      )

      setSrchStartDate(
        null
      )

      setSrchEndDate(
        null
      )

      fetchData(
        tabIndex,
        1,
        itemsPerPage,
        undefined,
        {
          statusIds:
            initialStatusIds,

          startDate:
            null,

          endDate:
            null
        }
      )

      return
    }

    const today =
      new Date()

    setSrchStartDate(
      today
    )

    setSrchEndDate(
      today
    )

    fetchData(
      tabIndex,
      1,
      itemsPerPage,
      undefined,
      {
        statusIds: [],
        startDate:
          today,
        endDate:
          today
      }
    )
  }, [
    hasStatusFromUrl,
    urlStatusId,
    nominationStatMaster?.data,
    tabIndex,
    itemsPerPage
  ])

  // ============================================================
  // FILE MODAL
  // ============================================================
  const openAllFileModal =
    async (
      id?: any,
      data?: any
    ) => {
      const data_file: any =
        await getService(
          `/master/query-shipper-nomination-file/query_shipper_nomination_file_url/${id}`
        )

      const filtered =
        dataTable?.find(
          (item: any) =>
            item.id === id
        )

      const map_data = {
        ...filtered,

        query_shipper_nomination_file_url:
          data_file
      }

      setDataFile(
        map_data
      )

      setMdFileView(true)
    }

  // ============================================================
  // REASON MODAL
  // ============================================================
  const openReasonModal =
    async (
      id: any,
      data: any,
      row: any
    ) => {
      const data_submission: any =
        await getService(
          `/master/query-shipper-nomination-file/submission_comment_query_shipper_nomination_file/${id}`
        )

      setDataReason(
        data_submission
      )

      setDataReasonRow(
        row
      )

      setMdReasonView(
        true
      )
    }

  // ============================================================
  // COLUMN
  // ============================================================
  const handleColumnToggle = (
    columnKey:
      | string
      | VisibilityState
  ) => {
    if (
      typeof columnKey ===
      'string'
    ) {
      setColumnVisibility(
        (prev: any) => ({
          ...prev,

          [columnKey]:
            !prev[
              columnKey
            ]
        })
      )
    } else if (
      typeof columnKey ===
        'object' &&
      columnKey !== null
    ) {
      setColumnVisibility(
        (prev: any) => ({
          ...prev,
          ...columnKey
        })
      )
    }
  }

  // ============================================================
  // TAB CHANGE
  // ============================================================
  const handleChange = (
    event: any,
    newValue: number
  ) => {
    setTabIndex(
      newValue
    )

    handleResetFilter(
      newValue
    )
  }

  const [
    dataExport,
    setDataExport
  ] = useState<any>([])

  // ============================================================
  // TABLE COLUMNS
  // ============================================================
  const columns =
    useMemo<
      ColumnDef<any>[]
    >(
      () => [
        {
          accessorKey:
            'status',

          header:
            'Status',

          enableSorting:
            true,

          align:
            'center',

          accessorFn: (
            row: any
          ) =>
            row
              ?.query_shipper_nomination_status
              ?.name ||
            '',

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div className="flex justify-center items-center">
                <div
                  className="flex min-w-[180px] max-w-[250px] w-auto text-center justify-center rounded-full p-1 text-[#464255]"
                  style={{
                    backgroundColor:
                      String(
                        row
                          ?.query_shipper_nomination_status
                          ?.color ||
                          '#ffffff'
                      )
                  }}
                >
                  {row
                    ?.query_shipper_nomination_status
                    ?.name ??
                    ''}
                </div>
              </div>
            )
          }
        },

        {
          accessorKey:
            'gas_day',

          header:
            tabIndex == 0
              ? 'Gas Day'
              : 'Gas Week',

          enableSorting:
            true,

          accessorFn: (
            row: any
          ) =>
            formatDateNoTime(
              row?.gas_day
            ) || '',

          sortingFn:
            myCustomSortingByDateFn,

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div>
                {row?.gas_day
                  ? formatDateNoTime(
                      row?.gas_day
                    )
                  : ''}
              </div>
            )
          }
        },

        {
          accessorKey:
            'shipper_name',

          header:
            'Shipper Name',

          enableSorting:
            true,

          accessorFn: (
            row: any
          ) =>
            row?.group
              ?.name ||
            '',

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div>
                {row?.group
                  ? row
                      ?.group
                      ?.name ??
                    ''
                  : ''}
              </div>
            )
          }
        },

        {
          accessorKey:
            'contract_code',

          header:
            'Contract Code',

          enableSorting:
            true,

          width: 200,

          accessorFn: (
            row: any
          ) =>
            row
              ?.contract_code
              ?.contract_code ||
            '',

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div>
                {row?.reserve_balancing_gas_contract
                  ? row
                      ?.reserve_balancing_gas_contract
                      ?.res_bal_gas_contract ??
                    ''
                  : row
                      ?.contract_code
                      ?.contract_code ??
                    ''}
              </div>
            )
          }
        },

        {
          accessorKey:
            'file_name',

          header:
            'File Name',

          enableSorting:
            true,

          accessorFn: (
            row: any
          ) =>
            row?.k_file_name ||
            '',

          width: 500,

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div className="flex items-center">
                <span>
                  {row?.k_file_name ??
                    ''}
                </span>
              </div>
            )
          }
        },

        {
          accessorKey:
            'submission_comment',

          header:
            'Submission Comment',

          enableSorting:
            false,

          align:
            'center',

          accessorFn: (
            row: any
          ) => '',

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div className="inline-flex items-center justify-center relative">
                <button
                  type="button"
                  className={
                    iconButtonClass
                  }
                  onClick={() =>
                    row &&
                    openReasonModal(
                      row?.id,
                      row?.submission_comment_query_shipper_nomination_file,
                      row
                    )
                  }
                  disabled={
                    !userPermission?.f_view ||
                    (row
                      ?._count
                      ?.submission_comment_query_shipper_nomination_file ??
                      0) <=
                      0
                  }
                >
                  <ChatBubbleOutlineOutlinedIcon
                    fontSize="inherit"
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-[1px]"
                    sx={{
                      color:
                        'currentColor',
                      fontSize: 18
                    }}
                  />
                </button>

                <span
                  className={`px-2 w-2 text-[#429D3A] ${
                    (row
                      ?._count
                      ?.submission_comment_query_shipper_nomination_file ??
                      0) >
                    0
                      ? 'text-[#ED1B24]'
                      : ''
                  }`}
                >
                  {row
                    ?._count
                    ?.submission_comment_query_shipper_nomination_file ??
                    0}
                </span>
              </div>
            )
          }
        },

        {
          accessorKey:
            'file',

          header:
            'File',

          enableSorting:
            false,

          accessorFn: (
            row: any
          ) => '',

          cell: (
            info
          ) => {
            const row: any =
              info?.row
                ?.original

            if (!row) {
              return null
            }

            return (
              <div className="inline-flex items-center justify-center relative">
                <button
                  type="button"
                  aria-label="Open files"
                  onClick={() =>
                    row &&
                    openAllFileModal(
                      row?.id
                    )
                  }
                  disabled={
                    !userPermission?.f_view ||
                    (row
                      ?._count
                      ?.query_shipper_nomination_file_url ??
                      0) <=
                      0
                  }
                  className={
                    iconButtonClass
                  }
                >
                  <AttachFileRoundedIcon
                    fontSize="inherit"
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-y-[1px]"
                    sx={{
                      color:
                        'currentColor',
                      fontSize: 18
                    }}
                  />
                </button>

                <span className="px-2 text-[#464255]">
                  {row
                    ?._count
                    ?.query_shipper_nomination_file_url ??
                    0}
                </span>
              </div>
            )
          }
        }
      ],
      [
        dataTable,
        userPermission,
        tabIndex
      ]
    )

  // ============================================================
  // PAGINATION
  // ============================================================
  const paginationMountedRef =
    useRef(false)

  useEffect(() => {
    if (
      !paginationMountedRef.current
    ) {
      paginationMountedRef.current =
        true

      return
    }

    setIsLoading(false)

    fetchData(
      tabIndex,
      currentPage,
      itemsPerPage
    )
  }, [
    currentPage,
    itemsPerPage
  ])

  // ============================================================
  // SHIPPER USER
  // ============================================================
  useEffect(() => {
    if (
      userDT
        ?.account_manage?.[0]
        ?.user_type_id ==
      3
    ) {
      setSrchShipper([
        userDT
          ?.account_manage?.[0]
          ?.group?.id
      ])
    }
  }, [tabIndex])

  return (
    <div className="space-y-2">
      {/* =======================================================
          TAB
      ======================================================= */}
      <Tabs
        value={
          tabIndex
        }
        onChange={
          handleChange
        }
        aria-label="tabs"
        sx={{
          marginBottom:
            '-19px !important',

          '& .MuiTabs-indicator':
            {
              display:
                'none'
            },

          '& .Mui-selected':
            {
              color:
                '#58585A !important'
            }
        }}
      >
        {[
          'Daily',
          'Weekly'
        ].map(
          (
            label,
            index
          ) => (
            <Tab
              key={
                label
              }
              label={
                label
              }
              id={`tab-${index}`}
              sx={{
                fontFamily:
                  'Tahoma !important',

                border:
                  '0.5px solid',

                borderColor:
                  '#DFE4EA',

                borderBottom:
                  'none',

                borderTopLeftRadius:
                  '9px',

                borderTopRightRadius:
                  '9px',

                textTransform:
                  'none',

                padding:
                  '8px 16px',

                backgroundColor:
                  tabIndex ===
                  index
                    ? '#FFFFFF'
                    : '#9CA3AF1A',

                color:
                  tabIndex ===
                  index
                    ? '#58585A'
                    : '#9CA3AF',

                '&:hover':
                  {
                    backgroundColor:
                      '#F3F4F6'
                  }
              }}
            />
          )
        )}
      </Tabs>

      {/* =======================================================
          FILTER
      ======================================================= */}
      <div className="border-[#DFE4EA] border-[1px] p-4 rounded-xl rounded-tl-none flex flex-col sm:flex-row gap-2">
        <aside className="flex flex-wrap sm:flex-row gap-2 w-full">
          {/* ===================================================
              GAS DAY / WEEK FROM
          =================================================== */}
          <DatePickaSearch
            key={
              'start' +
              key
            }
            label={
              tabIndex ==
              0
                ? 'Gas Day From'
                : 'Gas Week From'
            }
            placeHolder={
              tabIndex ==
              0
                ? 'Select Gas Day'
                : 'Select Gas Week'
            }
            modeSearch={
              tabIndex ==
              0
                ? 'all_day'
                : 'sunday'
            }
            allowClear
            onChange={(
              e: any
            ) =>
              setSrchStartDate(
                e
                  ? e
                  : null
              )
            }
            defaultValue={
              srchStartDate
            }
          />

          {/* ===================================================
              GAS DAY / WEEK TO
          =================================================== */}
          {tabIndex ==
          0 ? (
            <DatePickaSearch
              key={
                'gas_day_to' +
                key
              }
              label="Gas Day To"
              placeHolder="Select Gas Day To"
              allowClear
              onChange={(
                e: any
              ) =>
                setSrchEndDate(
                  e
                    ? e
                    : null
                )
              }
              customWidth={
                200
              }
              defaultValue={
                srchEndDate
              }
            />
          ) : (
            <DatePickaSearch
              key={`end-${key}-${
                srchStartDate
                  ? 'selected'
                  : 'empty'
              }`}
              label="Gas Week To"
              placeHolder="Select Gas Week"
              modeSearch="sunday"
              isGasWeek={Boolean(
                srchStartDate
              )}
              allowClear
              onChange={(
                e: any
              ) => {
                setSrchEndDate(
                  e ??
                    null
                )
              }}
              defaultValue={
                srchEndDate
              }
            />
          )}

          {/* ===================================================
              SHIPPER NAME
          =================================================== */}
          <InputSearch
            id="searchShipper"
            label="Shipper Name"
            type="select-multi-checkbox"
            value={
              srchShipper
            }
            isDisabled={
              userDT
                ?.account_manage?.[0]
                ?.user_type_id ==
              3
            }
            onChange={(
              e
            ) => {
              const newShipper =
                Array.isArray(
                  e?.target?.value
                )
                  ? e.target.value
                  : []

              setSrchShipper(
                newShipper
              )

              // ==================================================
              // Logic เดิม
              //
              // ถ้าเปลี่ยน Shipper แล้วไม่มี Contract ที่สัมพันธ์
              // ให้ล้าง Contract Code
              // ==================================================
              const selectedIds =
                newShipper.map(
                  String
                )

              const checked =
                dataContractOriginal?.filter(
                  (
                    item: any
                  ) => {
                    const groupId =
                      item?.group?.id ??
                      item?.group_id

                    return selectedIds.includes(
                      String(
                        groupId
                      )
                    )
                  }
                )

              if (
                checked?.length ==
                  0 &&
                srchContractCode?.length >
                  0
              ) {
                setSrchContractCode(
                  []
                )
              }
            }}
            options={(
              Array.isArray(
                dataShipper
              )
                ? dataShipper
                : []
            ).map(
              (
                item: any
              ) => ({
                value:
                  item?.id,

                label:
                  item?.name
              })
            )}
          />

          {/* ===================================================
              CONTRACT CODE

              ใช้ dataContractFiltered
              เหมือน Allocation Monthly Report

              - Filter Shipper
              - Filter Gas Day From / To
              - Filter Contract Active
          =================================================== */}
          <InputSearch
            id="searchContractCode"
            label="Contract Code"
            type="select-multi-checkbox"
            value={
              srchContractCode
            }
            onChange={(
              e
            ) =>
              setSrchContractCode(
                Array.isArray(
                  e?.target?.value
                )
                  ? e.target.value
                  : []
              )
            }
            options={
              dataContractFiltered
                .map(
                  (
                    item: any
                  ) => ({
                    value:
                      item?.contract_code,

                    label:
                      item?.contract_code
                  })
                )
            }
          />

          {/* ===================================================
              STATUS
          =================================================== */}
          <InputSearch
            id="searchStatus"
            label="Status"
            type="select-multi-checkbox"
            value={
              srchStatus
            }
            onChange={(
              e
            ) =>
              setSrchStatus(
                e.target
                  .value
              )
            }
            options={(
              nominationStatMaster?.data ||
              []
            ).map(
              (
                item: any
              ) => ({
                value:
                  item?.id?.toString(),

                label:
                  item?.name
              })
            )}
          />

          <BtnSearch
            handleFieldSearch={
              handleFieldSearch
            }
          />

          <BtnReset
            handleReset={
              handleReset
            }
          />
        </aside>

        <aside className="mt-auto ml-1 w-full sm:w-auto"></aside>
      </div>

      {/* =======================================================
          TABLE
      ======================================================= */}
      <OffsetTable
        data={
          filteredDataTable
        }
        columns={
          columns
        }
        isLoading={
          isLoading
        }
        exportBtn={
          <BtnExport
            textRender={
              'Export'
            }
            data={
              dataExport
            }
            path="nomination/query-shipper-nomination-file"
            can_export={
              userPermission
                ? userPermission?.f_export
                : false
            }
            columnVisibility={
              columnVisibility
            }
            initialColumns={
              initialColumns
            }
          />
        }
        initialColumns={Object.fromEntries(
          (
            initialColumns ||
            []
          ).map(
            (
              column: any
            ) => [
              column.key,
              column.visible
            ]
          )
        )}
        onColumnVisibilityChange={(
          columnKey: any
        ) =>
          handleColumnToggle(
            columnKey
          )
        }
        onFilteredDataChange={(
          filteredData: any
        ) => {
          const newData =
            filteredData ||
            []

          if (
            JSON.stringify(
              dataExport
            ) !==
            JSON.stringify(
              newData
            )
          ) {
            setDataExport(
              newData
            )
          }
        }}
        currentPage={
          currentPage
        }
        itemsPerPage={
          itemsPerPage
        }
        onPageChange={
          handlePageChange
        }
        onItemsPerPageChange={
          handleItemsPerPageChange
        }
        totalItems={
          dataTableTotal
        }
        globalFilter={
          globalFilter
        }
        setGlobalFilter={
          setGlobalFilter
        }
      />

      {/* =======================================================
          SUCCESS MODAL
      ======================================================= */}
      <ModalComponent
        open={
          isModalSuccessOpen
        }
        handleClose={
          handleCloseModal
        }
        title="Success"
        description={`${modalModalSuccessMsg}`}
      />

      {/* =======================================================
          ERROR MODAL
      ======================================================= */}
      <ModalComponent
        open={
          isModalErrorOpen
        }
        handleClose={() => {
          setModalErrorOpen(
            false
          )

          if (
            resetForm
          ) {
            resetForm()
          }
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

      {/* =======================================================
          COMMENT MODAL
      ======================================================= */}
      <ModalComment
        data={
          dataReason
        }
        dataRow={
          dataReasonRow
        }
        open={
          mdReasonView
        }
        onClose={() => {
          setMdReasonView(
            false
          )
        }}
        tabSelected={
          tabIndex
        }
      />

      {/* =======================================================
          FILE MODAL
      ======================================================= */}
      <ModalFiles
        data={
          dataFile
        }
        setModalSuccessOpen={
          setModalSuccessOpen
        }
        open={
          mdFileView
        }
        onClose={() => {
          setMdFileView(
            false
          )
        }}
      />

      {/* =======================================================
          COLUMN VISIBILITY
      ======================================================= */}
      <ColumnVisibilityPopover
        open={
          open
        }
        anchorEl={
          anchorEl
        }
        setAnchorEl={
          setAnchorEl
        }
        columnVisibility={
          columnVisibility
        }
        handleColumnToggle={
          handleColumnToggle
        }
        initialColumns={
          initialColumns
        }
      />
    </div>
  )
}

export default ClientPage