'use client'
import {useEffect, useMemo, useRef, useState} from 'react'
import {
  addSumPerRow,
  addTotalPerRow,
  exportToExcel,
  exportToExcelAllShipperNominationReport,
  findRoleConfigByMenuName,
  formatNumberFourDecimal,
  formatNumberFourDecimalNoComma,
  formatNumberThreeDecimal,
  generateUserPermission,
  getCurrentWeekSundayYyyyMmDd,
  isAllWeekly,
  liftWeeklyForDate,
  mergeDaily_AddOuterAndRowsFromWeekly,
  roundTo3,
  roundTo4,
  sumDataNomShipperReport,
  sumDataNomShipperReportConcept,
  toDayjs
} from '@/utils/generalFormatter'
import {getService} from '@/utils/postService'
import {useFetchMasters} from '@/hook/fetchMaster'
import BtnSearch from '@/components/other/btnSearch'
import BtnReset from '@/components/other/btnReset'
import ColumnVisibilityPopover from '@/components/other/popOverShowHideCol'
import {useAppDispatch} from '@/utils/store/store'
import {fetchShipperGroup} from '@/utils/store/slices/shipperGroupSlice'
import getCookieValue from '@/utils/getCookieValue'
import useRestrictedPage from '@/utils/checkRestrictedPage'
import getUserValue from '@/utils/getuserValue'
import ModalComponent from '@/components/other/ResponseModal'
import {decryptData} from '@/utils/encryptionData'
import {Popover, Tab, Tabs} from '@mui/material'
import DatePickaSearch from '@/components/library/dateRang/dateSearch'
import dayjs from 'dayjs'
import TableSkeleton from '@/components/material_custom/DefaultSkeleton'
import ViewPage from './form/viewPage/viewPage'
import {InputSearch} from '@/components/other/SearchForm'
import AppTable from '@/components/table/AppTable'
import {ColumnDef} from '@tanstack/react-table'
import BtnActionTable from '@/components/other/btnActionInTable'
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined'
import BtnGeneral from '@/components/other/btnGeneral'
import {parseToNumber} from '@/utils/number'

interface ClientProps {
  params: {
    lng: string
  }
}



const ClientPage: React.FC<ClientProps> = () => {
  // #region  Check Authen
  const userDT: any = getUserValue()
  const token = getCookieValue('v4r2d9z5m3h0c1p0x7l')
  useRestrictedPage(token)

  // ############### COLUMN SHOW/HIDE ###############
  const initialColumns: any = [
    {key: 'gas_day', label: 'Gas Day', visible: true},
    {key: 'shipper_name', label: 'Shipper Name', visible: true},
    {key: 'capacity_right', label: 'Capacity Right (MMBTU/D)', visible: true},
    {
      key: 'nominated_value',
      label: 'Nominated Value (MMBTU/D)',
      visible: true
    },
    {key: 'overusage', label: 'Overusage (MMBTU/D)', visible: true},
    {key: 'imbalance', label: 'Imbalance (MMBTU/D)', visible: true},
    {key: 'action', label: 'Action', visible: true}
  ]

  // #region STATE
  const [dataTable, setData] = useState<any>([])
  const [tk, settk] = useState<boolean>(false)
  const [filteredDataTable, setFilteredDataTable] = useState<any>([])
  const [filtered_weekly_all, set_filtered_weekly_all] = useState<any>([])
  const [key, setKey] = useState(0)
  const [srchStartDate, setSrchStartDate] = useState<Date | null>(dayjs().add(1, 'day').toDate()) // วันที่ใช้ filter ข้อมูล default วันพรุ่งนี้
  const [srchShipper, setSrchShipper] = useState<any>([])
  const [forceRefetch, setForceRefetch] = useState(true)
  const [userPermission, setUserPermission] = useState<any>()
  const [tabIndex, setTabIndex] = useState(0) // 0=daily, 1=weekly
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [resetForm, setResetForm] = useState<() => void | null>()
  const [dataOriginal, setDataOriginal] = useState<any>([])
  const [dataDailyOriginal, setDataDailyOriginal] = useState<any>([])
  const [dataWeeklyOriginal, setDataWeeklyOriginal] = useState<any>([])
  const [dataShipper, setDataShipper] = useState<any>([])
  const [rawData, setRawData] = useState<any>([])
  const [isModalSuccessOpen, setModalSuccessOpen] = useState(false)
  const [modalModalSuccessMsg, setModalSuccessMsg] = useState('')
  const handleCloseModal = () => setModalSuccessOpen(false)
  const [modalErrorMsg, setModalErrorMsg] = useState('')
  const [isModalErrorOpen, setModalErrorOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [paginatedData, setPaginatedData] = useState<any[]>([])
  const [columnVisibility, setColumnVisibility] = useState<any>(Object.fromEntries(initialColumns.map((column: any) => [column?.key, column?.visible])))
  const [subTabIndex, setSubTabIndex] = useState(0)
  const [subTabIndexview, setsubTabIndexview] = useState(0)
  const [viewOpen, setViewOpen] = useState(false)
  const [viewDataMain, setViewDataMain] = useState<any>([])
  const [selectprops, setselectprops] = useState([
    {
      id: 0,
      gas_props: dayjs().add(1, 'day').toDate(),
      shipper: null
    },
    {
      id: 1,
      gas_props: dayjs().add(1, 'day').toDate(),
      shipper: null
    },
    {
      id: 2,
      gas_props: new Date(getCurrentWeekSundayYyyyMmDd()),
      shipper: null
    }
  ])
  const [openPopoverId, setOpenPopoverId] = useState(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [anchorPopover, setAnchorPopover] = useState<null | HTMLElement>(null)
  const [dataExport, setDataExport] = useState<any>([])
  const [resetInitial, setresetInitial] = useState<boolean>(false)

  // #region REDUX DATA
  const {shipperGroupData} = useFetchMasters()
  const dispatch = useAppDispatch()
  // #region PERMISSION
  let user_permission: any = typeof window !== 'undefined' ? (localStorage?.getItem('k3a9r2b6m7t0x5w1s8j') || getCookieValue('k3a9r2b6m7t0x5w1s8j')) : null
  user_permission = user_permission ? decryptData(user_permission) : null

  const getPermission = () => {
    try {
      let parsed_permission = user_permission
      if (typeof parsed_permission === 'string') {
        parsed_permission = JSON.parse(parsed_permission) // Convert JSON string to object
      }

      const permission = findRoleConfigByMenuName(`Shipper Nomination Report`, userDT)
      if (permission) {
        setUserPermission(permission)
      } else if (parsed_permission?.role_config) {
        const updatedUserPermission = generateUserPermission(parsed_permission)
        setUserPermission(updatedUserPermission)
      }
    } catch (error) {
      // Failed to parse user_permission:
    }
  }

  function sortByDate(resultAll: any[]) {
    return (resultAll || []).sort((a, b) => {
      const dateA = new Date((a?.gas_day_text || '').split('/').reverse().join('/'))
      const dateB = new Date((b?.gas_day_text || '').split('/').reverse().join('/'))
      return dateA.getTime() - dateB.getTime() // เปรียบเทียบวันที่
    })
  }

  function convertWeeklyDataToArray(item: any) {
    const dayIndexMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    }

    return Object.entries(item?.weeklyDay || {})
      .map(([day, data]: any) => ({
        day,
        ...data,
        shipper_name: item?.shipper_name || null,
        id: item?.id,
        tabIndex: dayIndexMap[day] ?? -1 // fallback เผื่อเจอชื่อวันแปลก
      }))
      .sort((a, b) => a.tabIndex - b.tabIndex)
  }

  // #region field search
  const handleFieldSearchNew = async (tabIndexP?: any, srchStartDateP?: any) => {
    const tabIndex_ = tabIndexP !== undefined ? tabIndexP : tabIndex
    const srchStartDate_ = srchStartDateP ? dayjs(srchStartDateP)?.format('YYYY-MM-DD') : srchStartDate

    setIsLoading(false)
    // dayjs(isFixDay)?.format('YYYY-MM-DD')

    let url = `/master/query-shipper-nomination-file/shipper-nomination-report?tab=${tabIndex_}`
    if (srchStartDate_) {
      const startDate = toDayjs(srchStartDate_)
      url += `&gasDay=${startDate.isValid() ? startDate.format('YYYY-MM-DD') : srchStartDate_}`
    }
    const response: any = await getService(url)
    console.log('response : ', response);
    let dataToFilter = response
    
    // ถ้า user เป็น shipper
    if (userDT?.account_manage?.[0]?.user_type_id == 3) {
      dataToFilter = (Array.isArray(dataToFilter) ? dataToFilter : [])?.filter((item: any) => item?.shipper_name == userDT?.account_manage?.[0]?.group?.name)
    }

    switch (tabIndex_) {
      case 0:
        // =========== ALL NEW ===========
        

        console.log('dataToFilter : ', dataToFilter);
        // const merged: any = mergeDaily_AddOuterAndRowsFromWeekly(dataToFilter)
        const merged: any = dataToFilter
        console.log('merged : ', merged);

        const res_is_all_weekly = isAllWeekly(merged) // true ถ้าทุกตัวมี nomination_type.id === 2
        if (res_is_all_weekly) {
          dataToFilter = liftWeeklyForDate(merged, toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).format('DD/MM/YYYY') : '') // ถ้ามันเป็น weekly หมด จะเข้าไปเอาใน weeklyDay มาแสดง
        } else {
          // ถ้ามี daily เอาแค่ daily
          const type_daily = (Array.isArray(merged) ? merged : [])?.filter((item: any) => item?.nomination_type?.id == 1) // เดิมโรงงาน
          //   const type_daily = merged
          // ถ้าชื่อ shipper_name ไม่ซ้ำและเป็น nomination_type.id == 2 ให้เอามาด้วย
          const nameCounts = (Array.isArray(merged) ? merged : []).reduce((acc: Record<string, number>, it: any) => {
            const name = it?.shipper_name ?? ''
            acc[name] = (acc[name] ?? 0) + 1
            return acc
          }, {})

          const ddddd = (Array.isArray(merged) ? merged : []).filter((it: any) => {
            const typeId = it?.nomination_type?.id
            const name = it?.shipper_name ?? ''
            // return typeId === 2 && nameCounts[name] === 1
            return typeId === 2
          })
          const only_one_shipper_type_weekly: any = liftWeeklyForDate(ddddd, toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).format('DD/MM/YYYY') : '')

          dataToFilter = [...(Array.isArray(type_daily) ? type_daily : []), ...(Array.isArray(only_one_shipper_type_weekly) ? only_one_shipper_type_weekly : [])]
        }
        dataToFilter = addSumPerRow(dataToFilter) 
        // nominatedValueMMBTUD

        const groupedByShipperNameNew = Object.values(
          (Array.isArray(dataToFilter) ? dataToFilter : []).reduce((groups: any, item: any) => {
            const shipperName = item?.shipper_name ?? 'UNKNOWN'

            if (!groups[shipperName]) {
              groups[shipperName] = []
            }

            groups[shipperName].push(item)

            return groups
          }, {})
        )
        dataToFilter = (Array.isArray(groupedByShipperNameNew) ? groupedByShipperNameNew : [])?.map((e_: any) => {
          if (Array.isArray(e_) && e_.length > 1) {
            const id_ = e_?.map((newDataRow: any) => newDataRow?.id)?.flat()
            const contractAll = e_?.map((newDataRow: any) => newDataRow?.contractAll)?.flat()
            const dataRow = e_
              ?.map((newDataRow: any) => newDataRow?.dataRow)
              ?.flat()
              ?.map((d_: any) => {
                const {...nD} = d_ || {}
                return {
                  ...nD,
                  gas_day: toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).format('DD/MM/YYYY') : ''
                }
              })

            const dataRowNew = Object.values(
              (dataRow || []).reduce((groups: any, item: any) => {
                const area_text = item?.area_text ?? 'UNKNOWN'

                if (!groups[area_text]) {
                  groups[area_text] = []
                }

                groups[area_text].push(item)

                return groups
              }, {})
            )

            const dataRowNew_ = (Array.isArray(dataRowNew) ? dataRowNew : [])?.map((dn: any) => {
              if (Array.isArray(dn) && dn.length > 1) {
                const contractAll_ = dn?.map((newDataRow: any) => newDataRow?.contractAll)?.flat()
                const capacityRightMMBTUD_ = dn?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.capacityRightMMBTUD || 0), 0)
                const nominatedValueMMBTUD_ = dn?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.nominatedValueMMBTUD || 0), 0)
                const overusageMMBTUD_ = dn?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.overusageMMBTUD || 0), 0)
                const conceptPointZone_ = Object.values(
                  dn
                    ?.flatMap((item: any) => item?.conceptPointZone ?? [])
                    ?.reduce((result_: any, concept: any) => {
                      const zoneText = concept?.zone_text
                      if (!zoneText) return result_
                      if (!result_[zoneText]) {
                        result_[zoneText] = {
                          zone_text: zoneText,
                          zone: []
                        }
                      }
                      result_[zoneText].zone.push(...(concept?.zone ?? []))
                      return result_
                    }, {})
                )
                const nominaionPointZone_ = Object.values(
                  dn
                    ?.flatMap((item: any) => item?.nominaionPointZone ?? [])
                    ?.reduce((result_: any, concept: any) => {
                      const zoneText = concept?.zone_text
                      if (!zoneText) return result_
                      if (!result_[zoneText]) {
                        result_[zoneText] = {
                          zone_text: zoneText,
                          zone: []
                        }
                      }
                      result_[zoneText].zone.push(...(concept?.zone ?? []))
                      return result_
                    }, {})
                )

                const nominaionPointZone_convert_daily = (Array.isArray(nominaionPointZone_) ? nominaionPointZone_ : [])?.map((cv: any) => {
                  const {zone, ...nCv} = cv || {}
                  const zone_ = (Array.isArray(zone) ? zone : [])?.map((cvZone: any) => {
                    const {data_temp, ...ncvZone} = cvZone || {}
                    
                    if (cvZone?.nom?.nomination_type_id === 2) {
                      // console.log('- data_temp : ', cvZone?.data_temp?.[3]);
                      // console.log('- data_temp : ', cvZone?.data_temp?.[38]);
                      // console.log('- cvZone : ', cvZone);
                      const numDay_ = toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).day() : 0

                      const weeklyValue = parseToNumber(data_temp?.[14 + numDay_]) ?? 0

                      // ค่ารายชั่วโมง key 14-37
                      const valWeeklyHr = !!cvZone?.data_temp?.[38] ? weeklyValue : weeklyValue / 24
                      
                      if(cvZone?.data_temp?.[3] === "LMPT1" && cvZone?.data_temp?.[9] === "MMSCFD"){
                        console.log('srchStartDate_ : ', srchStartDate_);
                        console.log('numDay_ : ', numDay_);
                        console.log('cvZone : ', cvZone);
                        console.log('data_temp : ', data_temp);
                        console.log('cvZone?.data_temp : ', cvZone?.data_temp?.[3]); 
                        console.log('weeklyValue : ', weeklyValue); 
                        console.log('valWeeklyHr : ', valWeeklyHr);
                        console.log('- - - -');
                      }
                      // const valWeeklyHr = weeklyValue 

                      const hourlyEntries = Array.from({length: 24}, (_, index) => ({
                        key: index + 14,
                        value: valWeeklyHr
                      }))

                      // รวมค่าจาก key 14-37
                      const valWeeklyTotal = hourlyEntries.reduce((sum, item) => sum + (item?.value ?? 0), 0)

                      const newDataTemp = Object.fromEntries([
                        // key 0-13
                        ...Array.from({length: 14}, (_, key) => [key, data_temp?.[key] ?? '']),

                        // key 14-37
                        ...(hourlyEntries || [])?.map((item) => [item?.key, String(item?.value ?? '')]),

                        // key 38 = ผลรวม key 14-37
                        [38, String(valWeeklyTotal)]
                      ])

                      return {
                        ...ncvZone,
                        data_temp: newDataTemp
                      }
                    } else {
                      return cvZone
                    }
                  })

                  return {
                    ...nCv,
                    zone: zone_
                  }
                })

                const conceptPointZone_convert_daily = (Array.isArray(conceptPointZone_) ? conceptPointZone_ : [])?.map((cv: any) => {
                  const {zone, ...nCv} = cv || {}
                  const zone_ = (Array.isArray(zone) ? zone : [])?.map((cvZone: any) => {
                    const {data_temp, ...ncvZone} = cvZone || {}
                    if (cvZone?.nom?.nomination_type_id === 2) {
                      const numDay_ = toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).day() : 0
                      const valWeeklyTotal = String(parseToNumber(data_temp?.[14 + numDay_]))
                      const valWeeklyHr: any = String(Number(parseToNumber(data_temp?.[14 + numDay_])) / 24)

                      const newDataTemp = Object.fromEntries([
                        // key 0 - 13 จากข้อมูลเดิม
                        ...Array.from({length: 14}, (_, key) => [key, data_temp?.[key] ?? '']),

                        // key 14 - 37 จาก valWeeklyHr
                        ...Array.from({length: 24}, (_, index) => [index + 14, valWeeklyHr]),

                        // key 38 จาก valWeeklyTotal
                        [38, valWeeklyTotal]
                      ])
                      return {
                        ...ncvZone,
                        data_temp: newDataTemp
                      }
                    } else {
                      return cvZone
                    }
                  })

                  return {
                    ...nCv,
                    zone: zone_
                  }
                })

                return {
                  areaObj: dn?.[0]?.areaObj,
                  area_text: dn?.[0]?.area_text,
                  capacityRightMMBTUD: capacityRightMMBTUD_,
                  conceptPointZone: conceptPointZone_convert_daily,
                  contract_code_id_arr: contractAll_,
                  nominaionPointZone: nominaionPointZone_convert_daily,
                  gas_day: toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).format('DD/MM/YYYY') : '',
                  nominatedValueMMBTUD: nominatedValueMMBTUD_,
                  overusageMMBTUD: overusageMMBTUD_,
                  shipper_name: dn?.[0]?.shipper_name,
                  weeklyDay: null,
                  zoneObj: dn?.[0]?.zoneObj,
                  zone_text: dn?.[0]?.zone_text
                }
              } else {
                return dn?.[0]
              }
            })
            console.log('dataRowNew_ : ', dataRowNew_);
            const capacityRightMMBTUD = e_?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.capacityRightMMBTUD || 0), 0)
            const imbalanceMMBTUD = e_?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.imbalanceMMBTUD || 0), 0)
            const nominatedValueMMBTUD = e_?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.nominatedValueMMBTUD || 0), 0)
            const overusageMMBTUD = e_?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.overusageMMBTUD || 0), 0)
            const tmpOverUseage = e_?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.tmpOverUseage || 0), 0)
            const tmpSumCapacityRightMMBTUD = e_?.reduce((accumulator: any, currentValue: any) => accumulator + (currentValue?.tmpSumCapacityRightMMBTUD || 0), 0)
            return {
              capacityRightMMBTUD: capacityRightMMBTUD,
              contractAll: contractAll,
              dataRow: dataRowNew_,
              gas_day: toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).format('DD/MM/YYYY') : '',
              gas_day_text: toDayjs(srchStartDate_)?.isValid() ? toDayjs(srchStartDate_).format('DD/MM/YYYY') : '',
              id: e_?.[0]?.id,
              id_: id_,
              imbalanceMMBTUD: imbalanceMMBTUD,
              nominatedValueMMBTUD: nominatedValueMMBTUD,
              nomination_type: null, // 1 2
              overusageMMBTUD: overusageMMBTUD,
              shipper_name: e_?.[0]?.shipper_name,
              tmpOverUseage: tmpOverUseage,
              tmpSumCapacityRightMMBTUD: tmpSumCapacityRightMMBTUD,
              weeklyDay: null
            }
          } else {
            return e_?.[0]
          }
        })

        break
      case 1:
        const filtered_daily = (Array.isArray(dataToFilter) ? dataToFilter : []).filter((item: any) => item && item?.nomination_type?.id == 1) // daily

        const data_with_sum = addSumPerRow(filtered_daily) // <-- วิธีนี้ไม่ถูก แต่รีบอะ
        setDataDailyOriginal(data_with_sum)
        dataToFilter = data_with_sum
        break
      case 2:
        const filtered_weekly = (Array.isArray(dataToFilter) ? dataToFilter : []).filter((item: any) => item && item?.nomination_type?.id == 2) // weekly
        setDataWeeklyOriginal(filtered_weekly)
        dataToFilter = Array.isArray(filtered_weekly) && filtered_weekly.length > 0 ? filtered_weekly : (dataWeeklyOriginal || [])

        break
    }
    const result_2 = (Array.isArray(dataToFilter) ? dataToFilter : []).filter((item: any) => {
      if (!item) return false
      return (Array.isArray(srchShipper) && srchShipper.length > 0) ? srchShipper.includes(item?.shipper_name) : true
    })

    if (Array.isArray(response) && response.length > 0 && tabIndex_ === 2) {
      const resultAll = (Array.isArray(result_2) ? result_2 : []).map((item: any) => convertWeeklyDataToArray(item))
      const sortresult = sortByDate(resultAll.flat())
      set_filtered_weekly_all(sortresult)
    } else {
      set_filtered_weekly_all([])
    }
    setselectprops((pre) => (Array.isArray(pre) ? pre : []).map((item: any) => (item?.id == tabIndex_ ? {...item, gas_props: srchStartDate_, shipper: srchShipper} : item)))
    setData(result_2)
    setFilteredDataTable(result_2)

    console.log('# result_2 : ', result_2);

  //   const test = tableData?.nominaionPointZone[0]?.zone?.filter((f:any) => f?.data_temp?.[3] === "LMPT1" && f?.data_temp?.[9] === "MMSCFD")
  // console.log('[LMPT1] test : ', test);

    setCurrentPage(1)
    setTimeout(() => {
      setIsLoading(true)
    }, 300)
  }

  const fetchDataInit = async () => {
    const res_shipper_name = await getService(`/master/account-manage/group-master?user_type=3`)
    setDataShipper(res_shipper_name)
    if (userDT?.account_manage?.[0]?.user_type_id == 3) {
      setSrchShipper([userDT?.account_manage?.[0]?.group?.name])
    }
  }

  const handleReset = async (tabIDX: any) => {
    if (userDT?.account_manage?.[0]?.user_type_id !== 3) {
      setSrchShipper([])
    }

    if (tabIDX < 2) {
      const selectDate = dayjs().add(1, 'day').toDate()
      setselectprops((pre) => pre?.map((item: any) => (item?.id == tabIndex ? {...item, gas_props: selectDate, shipper: null} : item)))
      onchangeGasdate(dayjs().add(1, 'day').toDate(), tabIDX)

      //   fetchOnlyData(tabIDX, selectDate) // กันโหลด data ซ้ำจากของเดิม
      handleFieldSearchNew(tabIDX, selectDate)
    } else {
      const selectDate = new Date(getCurrentWeekSundayYyyyMmDd())
      setselectprops((pre) => pre?.map((item: any) => (item?.id == tabIndex ? {...item, gas_props: selectDate, shipper: null} : item)))
      onchangeGasdate(new Date(getCurrentWeekSundayYyyyMmDd()), tabIDX)

      //   fetchOnlyData(tabIDX, selectDate) // กันโหลด data ซ้ำจากของเดิม
      handleFieldSearchNew(tabIDX, selectDate)
    }
    settk(!tk)
    setKey((prevKey) => prevKey + 1)
  }

  const handleSearch = (query: string, tabIDX?: any) => {
    let tab: any = tabIDX || tabIndex
    const queryLower = query?.replace(/\s+/g, '')?.toLowerCase()?.trim() || ''
    let filtered: any = []

    if (tab === 0 || tab === 1) {
      filtered = (filteredDataTable || [])?.filter((item: any) => {
        return (
          item?.gas_day_text?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          item?.shipper_name?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(item?.capacityRightMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(item?.nominatedValueMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(item?.overusageMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(item?.imbalanceMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          item?.capacityRightMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          item?.nominatedValueMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          item?.overusageMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          item?.imbalanceMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower)
        )
      })
    } else if (tab === 2) {
      const tabdayIndex: any = [
        {id: 0, day: 'sunday'},
        {id: 1, day: 'monday'},
        {id: 2, day: 'tuesday'},
        {id: 3, day: 'wednesday'},
        {id: 4, day: 'thursday'},
        {id: 5, day: 'friday'},
        {id: 6, day: 'saturday'},
        {id: 7, day: 'all'}
      ]

      let filter_weekly_sunday = (filteredDataTable || [])?.filter((item: any) => item?.gas_day_text == (srchStartDate && dayjs(srchStartDate)?.isValid() ? dayjs(srchStartDate).format('DD/MM/YYYY') : ''))
      filtered = (filter_weekly_sunday || [])?.filter((item: any) => {
        const dayKey = tabdayIndex?.[subTabIndex]?.day
        const dayObj = dayKey ? item?.weeklyDay?.[dayKey] : null
        return (
          dayObj?.gas_day_text?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          item?.shipper_name?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(dayObj?.capacityRightMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(dayObj?.nominatedValueMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(dayObj?.overusageMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimal(dayObj?.imbalanceMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimalNoComma(dayObj?.capacityRightMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimalNoComma(dayObj?.nominatedValueMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimalNoComma(dayObj?.overusageMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          formatNumberFourDecimalNoComma(dayObj?.imbalanceMMBTUD)?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          dayObj?.capacityRightMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          dayObj?.nominatedValueMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          dayObj?.overusageMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower) ||
          dayObj?.imbalanceMMBTUD?.toString()?.replace(/\s+/g, '')?.toLowerCase()?.trim()?.includes(queryLower)
        )
      })
    }

    setPaginatedData((filtered || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
  }

  const handleColumnToggle = (columnKey: string) => {
    setColumnVisibility((prev: any) => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  const handleChangeSubTab = (event: any, newValue: any) => {
    // 0 = 1-6 Hr
    // 1 = 7-12 Hr
    // 2 = 13-18 Hr
    // 3 = 19-24 Hr
    // 4 = All Day
    setSubTabIndex(newValue)
    setresetInitial(true)

    //sub tab all
    handleSearch('')
  }

  const getVisibleHours = () => {
    switch (subTabIndex) {
      case 0:
        return hours.slice(0, 6) // H1 - H6
      case 1:
        return hours.slice(6, 12) // H7 - H12
      case 2:
        return hours.slice(12, 18) // H13 - H18
      case 3:
        return hours.slice(18, 24) // H19 - H24
      case 4:
        return hours // All hours
      default:
        return []
    }
  }

  const handleChange = (event: any, newValue: any) => {
    setIsLoading(false)

    let tabIDX: any = newValue
    setTabIndex((pre: any) => tabIDX)
    settk(!tk)

    const selectedProp = selectprops?.find((item) => item?.id == tabIDX)

    onchangeGasdate(selectedProp?.gas_props, tabIDX)

    if (userDT?.account_manage?.[0]?.user_type_id !== 3) {
      setSrchShipper(selectedProp?.shipper ? selectedProp?.shipper : [])
    }
    // fetchOnlyData(tabIDX, selectedProp?.gas_props)
    handleFieldSearchNew(tabIDX, selectedProp?.gas_props)
  }

  const openViewForm = async (id: any) => {
    let filteredData: any
    if (tabIndex === 0) {
      filteredData = dataTable?.find((item: any) => item?.id === id)
    } else if (tabIndex === 1) {
      filteredData = dataDailyOriginal?.find((item: any) => item?.id === id)
    } else if (tabIndex === 2) {
      filteredData = dataWeeklyOriginal?.find((item: any) => item?.id === id)
    }
    // console.log('filteredData : ', filteredData);
    setViewDataMain(filteredData)
    setViewOpen(true)
  }

  const togglePopover = (id: any, anchor: any, subtab: any) => {
    if (openPopoverId === id) {
      setOpenPopoverId(null) // Close the popover if it's already open
      setAnchorPopover(null)
    } else {
      setOpenPopoverId(id) // Open the popover for the clicked row
      setsubTabIndexview(subtab)
      if (anchor) {
        setAnchorPopover(anchor)
      } else {
        setAnchorPopover(null)
      }
    }

    settk(!tk)
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
      setOpenPopoverId(null)
      setAnchorPopover(null)
    }
  }

  const toggleMenu = (mode: any, id: any) => {
    switch (mode) {
      case 'view':
        openViewForm(id)
        setOpenPopoverId(null) // close popover
        setAnchorPopover(null)
        break
    }
  }

  const hours = Array.from({length: 24}, (_, i) => ({
    key: `h${i + 1}`,
    label: `H${i + 1}`,
    timeRange: `${String(i).padStart(2, '0')}:01 - ${String(i + 1).padStart(2, '0')}:00`
  }))

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'gas_day_text',
        header: 'Gas Day',
        enableSorting: true,
        accessorFn: (row: any) => row?.gas_day_text || '',
        cell: (info) => {
          const row: any = info?.row?.original
          return <div>{row?.gas_day_text ? row?.gas_day_text : ''}</div>
        }
      },
      {
        accessorKey: 'shipper_name',
        header: 'Shipper Name',
        enableSorting: true,
        accessorFn: (row: any) => row?.shipper_name || '',
        cell: (info) => {
          const row: any = info?.row?.original
          return <div>{row?.shipper_name ? row?.shipper_name : ''}</div>
        }
      },
      {
        accessorKey: 'tmpSumCapacityRightMMBTUD',
        header: 'Capacity Right (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const raw = row?.tmpSumCapacityRightMMBTUD
          if (!raw) return ''

          const fixed = formatNumberFourDecimal(raw) // เช่น 10,000.0000
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น 10000.0000
          const rounded = !isNaN(parseFloat(raw)) ? parseFloat(raw).toString() : '' // เช่น 10000

          return `${fixed} ${noComma} ${rounded}`
        },
        sortDescFirst: false,
        cell: (info) => {
          const row: any = info?.row?.original
          return <div className="text-right">{row?.tmpSumCapacityRightMMBTUD ? formatNumberThreeDecimal(row?.tmpSumCapacityRightMMBTUD) : '0.000'}</div>
        }
      },
      {
        accessorKey: 'nominated_value',
        header: 'Nominated Value (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const raw = row?.nominatedValueMMBTUD
          if (!raw) return ''

          const fixed = formatNumberFourDecimal(raw) // เช่น 10,000.0000
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น 10000.0000
          const rounded = !isNaN(parseFloat(raw)) ? parseFloat(raw).toString() : '' // เช่น 10000

          return `${fixed} ${noComma} ${rounded}`
        },
        sortDescFirst: true,
        cell: (info) => {
          const row: any = info?.row?.original
          return <div className="text-right">{row?.nominatedValueMMBTUD === null || row?.nominatedValueMMBTUD === undefined ? null : (row?.nominatedValueMMBTUD ? formatNumberThreeDecimal(row?.nominatedValueMMBTUD) : '0.000')}</div>
        }
      },
      {
        accessorKey: 'tmpOverUseage',
        header: 'Overusage (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const raw = row?.tmpOverUseage
          if (!raw) return ''

          const fixed = formatNumberFourDecimal(raw) // เช่น 10,000.0000
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น 10000.0000
          const rounded = !isNaN(parseFloat(raw)) ? parseFloat(raw).toString() : '' // เช่น 10000

          return `${fixed} ${noComma} ${rounded}`
        },
        cell: (info) => {
          const row: any = info?.row?.original
          return <div className="text-right">{row?.overusageMMBTUD ? formatNumberThreeDecimal(row?.overusageMMBTUD) : '0.000'}</div>
        }
      },
      {
        accessorKey: 'imbalance',
        header: 'Imbalance (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const raw = row?.imbalanceMMBTUD
          if (!raw) return ''

          const fixed = formatNumberFourDecimal(raw) // เช่น 10,000.0000
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น 10000.0000
          const rounded = !isNaN(parseFloat(raw)) ? parseFloat(raw).toString() : '' // เช่น 10000

          return `${fixed} ${noComma} ${rounded}`
        },
        cell: (info) => {
          const row: any = info?.row?.original
          return <div className="text-right">{row?.imbalanceMMBTUD ? formatNumberThreeDecimal(row?.imbalanceMMBTUD) : '0.000'}</div>
        }
      },
      {
        accessorKey: 'action',
        id: 'actions',
        header: 'Action',
        align: 'center',
        enableSorting: false,
        size: 100,
        cell: (info) => {
          const row: any = info?.row?.original
          return <BtnActionTable togglePopover={togglePopover} row_id={row?.id} disable={userPermission?.b_manage ? false : true} />
        }
      }
    ],
    [userPermission, user_permission, tabIndex, subTabIndex]
  )

  const columnsWeekly = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'gas_day',
        header: 'Gas Day',
        enableSorting: true,
        accessorFn: (row: any) => {
          return row?.gas_day_text && subTabIndex < 7 ? (dayjs(row.gas_day_text, 'DD/MM/YYYY')?.isValid() ? dayjs(row.gas_day_text, 'DD/MM/YYYY').add(subTabIndex, 'day').format('DD/MM/YYYY') : row.gas_day_text) : (row?.gas_day_text ?? '')
        },
        cell: (info) => {
          const row: any = info?.row?.original
          return <div>{row?.gas_day_text && subTabIndex < 7 ? (dayjs(row.gas_day_text, 'DD/MM/YYYY')?.isValid() ? dayjs(row.gas_day_text, 'DD/MM/YYYY').add(subTabIndex, 'day').format('DD/MM/YYYY') : row.gas_day_text) : (row?.gas_day_text ?? '')}</div>
        }
      },
      {
        accessorKey: 'shipper_name',
        header: 'Shipper Name',
        enableSorting: true,
        accessorFn: (row: any) => row?.shipper_name || '',
        cell: (info) => {
          const row: any = info?.row?.original
          return <div>{row?.shipper_name ? row?.shipper_name : ''}</div>
        }
      },
      {
        accessorKey: 'capacity_right',
        header: 'Capacity Right (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

          const rawSrc = subTabIndex < 7 ? row?.weeklyDay?.[dayKeys[subTabIndex]]?.capacityRightMMBTUD : row?.capacityRightMMBTUD

          if (rawSrc == null) return ''

          const num = typeof rawSrc === 'number' ? rawSrc : Number(String(rawSrc).replace(/,/g, '').trim())

          if (!Number.isFinite(num)) return ''

          const fixed = formatNumberThreeDecimal(num) // เช่น "10,000.0000"
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น "10000.0000"
          const rounded = !isNaN(parseFloat(noComma)) ? parseFloat(noComma).toString() : '' // เช่น "10000"

          return `${fixed} ${noComma} ${rounded}`
        },
        cell: (info) => {
          const row: any = info?.row?.original
          return (
            <div className="text-right">
              {subTabIndex < 7 ? (formatNumberThreeDecimal(row?.weeklyDay?.[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][subTabIndex]]?.capacityRightMMBTUD) ?? '0.000') : (formatNumberThreeDecimal(row?.capacityRightMMBTUD) ?? '0.000')}
            </div>
          )
        }
      },
      {
        accessorKey: 'nominated_value',
        header: 'Nominated Value (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const rawSrc = subTabIndex < 7 ? row?.weeklyDay?.[dayKeys[subTabIndex]]?.nominatedValueMMBTUD : row?.nominatedValueMMBTUD
          if (rawSrc == null) return ''

          const num = typeof rawSrc === 'number' ? rawSrc : Number(String(rawSrc).replace(/,/g, '').trim())

          if (!Number.isFinite(num)) return ''

          const fixed = formatNumberThreeDecimal(num) // เช่น "10,000.0000"
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น "10000.0000"
          const rounded = !isNaN(parseFloat(noComma)) ? parseFloat(noComma).toString() : '' // เช่น "10000"

          return `${fixed} ${noComma} ${rounded}`
        },
        cell: (info) => {
          const row: any = info?.row?.original
          return (
            <div className="text-right">
              {subTabIndex < 7 ? (formatNumberThreeDecimal(row?.weeklyDay?.[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][subTabIndex]]?.nominatedValueMMBTUD) ?? '0.000') : (formatNumberThreeDecimal(row?.nominatedValueMMBTUD) ?? '0.000')}
            </div>
          )
        }
      },
      {
        accessorKey: 'overusage',
        header: 'Overusage (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const rawSrc = subTabIndex < 7 ? row?.weeklyDay?.[dayKeys[subTabIndex]]?.overusageMMBTUD : row?.overusageMMBTUD
          if (rawSrc == null) return ''

          const num = typeof rawSrc === 'number' ? rawSrc : Number(String(rawSrc).replace(/,/g, '').trim())

          if (!Number.isFinite(num)) return ''

          const fixed = formatNumberThreeDecimal(num) // เช่น "10,000.0000"
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น "10000.0000"
          const rounded = !isNaN(parseFloat(noComma)) ? parseFloat(noComma).toString() : '' // เช่น "10000"

          return `${fixed} ${noComma} ${rounded}`
        },
        cell: (info) => {
          const row: any = info?.row?.original

          let calSod = 0
          let resultCalSod = 0

          if (subTabIndex < 7) {
            calSod = row?.weeklyDay?.[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][subTabIndex]]?.capacityRightMMBTUD - row?.weeklyDay?.[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][subTabIndex]]?.nominatedValueMMBTUD
            resultCalSod = calSod > 0 ? 0 : Math.abs(calSod)
          } else {
            calSod = row?.capacityRightMMBTUD - row?.nominatedValueMMBTUD
            resultCalSod = calSod > 0 ? 0 : Math.abs(calSod)
          }

          return <div className="text-right">{formatNumberThreeDecimal(resultCalSod)}</div>
        }
      },
      {
        accessorKey: 'imbalance',
        header: 'Imbalance (MMBTU/D)',
        enableSorting: true,
        accessorFn: (row: any) => {
          const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          const rawSrc = subTabIndex < 7 ? row?.weeklyDay?.[dayKeys[subTabIndex]]?.imbalanceMMBTUD : row?.imbalanceMMBTUD
          if (rawSrc == null) return ''

          const num = typeof rawSrc === 'number' ? rawSrc : Number(String(rawSrc).replace(/,/g, '').trim())

          if (!Number.isFinite(num)) return ''

          const fixed = formatNumberThreeDecimal(num) // เช่น "10,000.0000"
          const noComma = fixed?.replace(/,/g, '') || '' // เช่น "10000.0000"
          const rounded = !isNaN(parseFloat(noComma)) ? parseFloat(noComma).toString() : '' // เช่น "10000"

          return `${fixed} ${noComma} ${rounded}`
        },
        cell: (info) => {
          const row: any = info?.row?.original
          return <div className="text-right">{subTabIndex < 7 ? (formatNumberThreeDecimal(row?.weeklyDay?.[['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][subTabIndex]]?.imbalanceMMBTUD) ?? '0.000') : (formatNumberThreeDecimal(row?.imbalanceMMBTUD) ?? '0.000')}</div>
        }
      },
      {
        accessorKey: 'action',
        id: 'actions',
        header: 'Action',
        align: 'center',
        enableSorting: false,
        size: 100,
        cell: (info) => {
          const row: any = info?.row?.original
          const tabIDX: any = row?.tabIndex
          return <BtnActionTable togglePopover={togglePopover} row_id={row?.id} disable={userPermission?.b_manage ? false : true} subTabIndexview={tabIDX} />
        }
      }
    ],
    [userPermission, user_permission, tabIndex, subTabIndex]
  )

  const onchangeGasdate: any = (e: any, tabidx: any) => {
    let value = e ? e : null
    setSrchStartDate(value ? value : '')
    settk(!tk)
    if (!value) {
      setKey((prevKey) => prevKey + 1)
    }
  }

  useEffect(() => {
    fetchDataInit()
  }, [])

  useEffect(() => {
    if (forceRefetch || !shipperGroupData?.data) {
      dispatch(fetchShipperGroup())
    }

    // Reset forceRefetch after fetching
    if (forceRefetch) {
      setForceRefetch(false) // Reset the flag after triggering the fetch
    }
    getPermission()
  }, [dispatch, forceRefetch, shipperGroupData]) // Watch for forceRefetch changes

  useEffect(() => {
    // fetchOnlyData(tabIndex,srchStartDate)
    handleFieldSearchNew()
  }, [resetForm])

  useEffect(() => {
    if (filteredDataTable && tabIndex == 0) {
      setPaginatedData(filteredDataTable.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
    }

    if (filteredDataTable && tabIndex == 1) {
      setPaginatedData(filteredDataTable.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
    }

    if (filteredDataTable && tabIndex == 2) {
      setPaginatedData(filteredDataTable?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage))
    }
  }, [filteredDataTable, currentPage, itemsPerPage, tabIndex])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [popoverRef])

  useEffect(() => {
    getVisibleHours()
  }, [subTabIndex])

  // useEffect(() => {
  //   console.log('dataTable : ', dataTable)
  // }, [dataTable])

  // useEffect(() => {
  //   // console.log('filteredDataTable : ', filteredDataTable);
  //   console.log('dataTable : ', dataTable) // use
  //   console.log('dataDailyOriginal : ', dataDailyOriginal)
  //   console.log('dataWeeklyOriginal : ', dataWeeklyOriginal)

  //   // tabIndex == 0 ?
  //   // exportToExcel(dataTable, 'shipper-nom-report-tab-0', columnVisibility)
  //   // tabIndex == 1 ?
  //   // exportToExcel(dataTable, 'shipper-nom-report-tab-0', columnVisibility)
  //   // tabIndex == 2 ?
  //   // exportToExcel(dataTable, 'shipper-nom-report-tab-weekly', columnVisibility, {subTabIndex: subTabIndex})
  //   // ----------------------

  //   // # viewPage
  //   // exportToExcel(
  //   //   filteredDataTable?.dataRow, // เอาแค่ที่ filter มา export
  //   //   'shipper-nom-report-view',
  //   //   columnVisibility,
  //   //   {
  //   //     tabIndex: tabIndex,
  //   //     subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview,
  //   //     tableData: tableData
  //   //   }
  //   // )
  //   // ----------------------

  //   // # detailPage
  //   // exportToExcel(tabMain === 0 ? sortedData : sortedDataTabConcept, 'shipper-nom-report-detail', columnVisibility, {
  //   //   tabMainIndex: tabMainIndex, // จากหน้าแรก daily/weekly = 0, daily = 1, weekly = 2
  //   //   subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
  //   //   tabEachZoneIndex: tabMain, // จากหน้า detail tab entry/exit = 0, concept point = 1
  //   //   tableData: tableData,
  //   //   gasDay: gasDay,
  //   //   day_text: getDayNameBySubTabIndex(subTabIndex < 7 ? subTabIndex : subTabIndexview),
  //   //   date: dayjs(tableData.gas_day, 'DD/MM/YYYY')
  //   //     .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
  //   //     .format('DD/MM/YYYY')
  //   // })
  //   // ----------------------

  //   // 'shipper-nom-report-tab-0' | 'shipper-nom-report-tab-weekly'
  //   const enwExportAll = [
  //     {typeExport: 'pageInfo', nameSheet: 'Main', data: dataTable, config: {columnVisibility, type: tabIndex == 2 ? 'shipper-nom-report-tab-weekly' : 'shipper-nom-report-tab-0', subTabIndex: 7}},
  //     ...dataTable?.flatMap((e: any) => {
  //       const viewData = e?.dataRow?.length > 0 ? addTotalPerRow(e?.dataRow) : []
  //       return [
  //         {
  //           typeExport: 'pageView',
  //           nameSheet: `View Page - ${e?.shipper_name}`,
  //           data: viewData,
  //           config: {
  //             columnVisibility,
  //             type: 'shipper-nom-report-view',
  //             extra_obj: {
  //               tabIndex: tabIndex,
  //               subTabIndex: tabIndex === 2 ? 7 : 0,
  //               tableData: e
  //             }
  //           }
  //         },
  //         ...viewData?.map((d: any) => {
  //           return {typeExport: 'pageDetail', nameSheet: `Detail Page - ${e?.shipper_name} [${d?.area_text}] - Nomination Point / Concept Point`, data: d, config: {type: 'shipper-nom-report-detail'}}
  //         }) // nom concept ต้องแยกมาอีก
  //       ]
  //     })
  //   ]

  //   // console.log('enwExportAll : ', enwExportAll)
  // }, [filteredDataTable, dataTable, dataDailyOriginal, dataWeeklyOriginal])

  
  const enwExportAll_ = (tabMainIndex:number) => {
    // tabIndex == 0 ?
    // exportToExcel(dataTable, 'shipper-nom-report-tab-0', columnVisibility)
    // tabIndex == 1 ?
    // exportToExcel(dataTable, 'shipper-nom-report-tab-0', columnVisibility)
    // tabIndex == 2 ?
    // exportToExcel(dataTable, 'shipper-nom-report-tab-weekly', columnVisibility, {subTabIndex: subTabIndex})
    // ----------------------

    // # viewPage
    // exportToExcel(
    //   filteredDataTable?.dataRow, // เอาแค่ที่ filter มา export
    //   'shipper-nom-report-view',
    //   columnVisibility,
    //   {
    //     tabIndex: tabIndex,
    //     subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview,
    //     tableData: tableData
    //   }
    // )
    // ----------------------

    // # detailPage
    // exportToExcel(tabMain === 0 ? sortedData : sortedDataTabConcept, 'shipper-nom-report-detail', columnVisibility, {
    //   tabMainIndex: tabMainIndex, // จากหน้าแรก daily/weekly = 0, daily = 1, weekly = 2
    //   subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
    //   tabEachZoneIndex: tabMain, // จากหน้า detail tab entry/exit = 0, concept point = 1
    //   tableData: tableData,
    //   gasDay: gasDay,
    //   day_text: getDayNameBySubTabIndex(subTabIndex < 7 ? subTabIndex : subTabIndexview),
    //   date: dayjs(tableData.gas_day, 'DD/MM/YYYY')
    //     .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
    //     .format('DD/MM/YYYY')
    // })
    // ----------------------
    const getDayNameBySubTabIndex = (subTabIndex: number) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      return days[subTabIndex] || ''
    }

    const columnVisibility_N = {
        "supply_demand": true,
        "area": true,
        "nomination_point": true,
        "unit": true,
        "type": true,
        "entry_exit": true,
        "wi": true,
        "hv": true,
        "sg": true,
        "h1": true,
        "h2": true,
        "h3": true,
        "h4": true,
        "h5": true,
        "h6": true,
        "h7": true,
        "h8": true,
        "h9": true,
        "h10": true,
        "h11": true,
        "h12": true,
        "h13": true,
        "h14": true,
        "h15": true,
        "h16": true,
        "h17": true,
        "h18": true,
        "h19": true,
        "h20": true,
        "h21": true,
        "h22": true,
        "h23": true,
        "h24": true,
        "total": true,
        "week_day": true
    }
    const columnVisibility_C = {
        "zone": true,
        "supply_demand": true,
        "concept_id": true,
        "unit": true,
        "entry_exit": true,
        "h1": true,
        "h2": true,
        "h3": true,
        "h4": true,
        "h5": true,
        "h6": true,
        "h7": true,
        "h8": true,
        "h9": true,
        "h10": true,
        "h11": true,
        "h12": true,
        "h13": true,
        "h14": true,
        "h15": true,
        "h16": true,
        "h17": true,
        "h18": true,
        "h19": true,
        "h20": true,
        "h21": true,
        "h22": true,
        "h23": true,
        "h24": true,
        "total": true,
        "week_day": true
    }
    const enwExportAll = [
      {typeExport: 'pageInfo', nameSheet: 'Main', data: tabIndex == 2 ? (subTabIndex === 7 ? dataExport : dataExport?.map((da:any) => {
        return {
          ...da,
          gas_day_text: dayjs(da?.gas_day_text, 'DD/MM/YYYY')
                  .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                  .format('DD/MM/YYYY'),
        }
      })) : dataTable || [], config: {
        columnVisibility, type: tabIndex == 2 ? 'shipper-nom-report-tab-weekly' : 'shipper-nom-report-tab-0',
        extra_obj:{
          subTabIndex: subTabIndex,
        }
      }},
      
      ...(dataTable || []).flatMap((e: any, ix:number) => {
        const date_ = `${tabIndex === 2 ? (subTabIndex === 7 ? "All" : dayjs(e?.gas_day_text, "DD/MM/YYYY").add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day').format("DDMMYY")) : dayjs(e?.gas_day_text, "DD/MM/YYYY").format("DDMMYY")}`
        let viewData = e?.dataRow?.length > 0 ? addTotalPerRow(e?.dataRow) : []
        const cpEast = viewData.find((f:any) => f?.zone_text === "EAST")
        const cpWest = viewData.find((f:any) => f?.zone_text === "WEST")
        const cpEastWest = viewData.find((f:any) => f?.zone_text === "EAST-WEST")
        const newCP = [
          cpEast,
          cpWest,
          cpEastWest,
        ].filter((f:any) => !!f)
          return [
          {
            typeExport: 'pageView',
            nameSheet: `${date_}-View-${e?.shipper_name}`,
            data: viewData,
            config: {
              columnVisibility: {
                  "gas_day": true,
                  "area": true,
                  "capacity_right": true,
                  "nominated_value": true,
                  "overusage": true,
                  "total": true,
                  "action": true
              },
              type: 'shipper-nom-report-view',
              extra_obj: {
                tabIndex: tabIndex,
                // subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview,
                subTabIndex: subTabIndex,
                tableData: e
              }
            }
          },
          ...(
            tabIndex === 2 ? [
              {
                  typeExport: 'pageDetail', 
                  nameSheet: `${subTabIndex === 7 ? "All" : dayjs(e?.gas_day_text, "DD/MM/YYYY").add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day').format("DDMMYY")}-NP-${e?.shipper_name}`, 
                  data: viewData.map((d:any, ix:number) => {
                    return sumDataNomShipperReport(d?.nominaionPointZone[0]?.zone)
                  }).flat(),
                  config: {
                    columnVisibility: columnVisibility_N,
                    type: 'shipper-nom-report-detail',
                    extra_obj:{
                      shipper_name: e?.shipper_name, 
                      tabMainIndex: tabMainIndex, // จากหน้าแรก daily/weekly = 0, daily = 1, weekly = 2// subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
                      subTabIndex: subTabIndex, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
                      tabEachZoneIndex: 0, // จากหน้า detail tab entry/exit = 0, concept point = 1
                      tableData: viewData.map((d:any, ix:number) => {
                        return d
                      }).flat(),
                      gasDay: tabIndex === 2 ? dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY') : e?.gas_day_text,
                      day_text: getDayNameBySubTabIndex(subTabIndex),
                      date: tabIndex === 2 ? (subTabIndex === 7 ? "All" : dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY')) : e?.gas_day_text
                    }
                  }
                }
            ]
            : [
                {
                  typeExport: 'pageDetail', 
                  nameSheet: `${dayjs(e?.gas_day_text, "DD/MM/YYYY").format("DDMMYY")}-NP-${e?.shipper_name}`, 
                  data: viewData.map((d:any, ix:number) => {
                    return sumDataNomShipperReport(d?.nominaionPointZone[0]?.zone)
                  }).flat(),
                  config: {
                    columnVisibility: columnVisibility_N,
                    type: 'shipper-nom-report-detail',
                    extra_obj:{
                      shipper_name: e?.shipper_name, 
                      tabMainIndex: tabMainIndex, // จากหน้าแรก daily/weekly = 0, daily = 1, weekly = 2
                      subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
                      tabEachZoneIndex: 0, // จากหน้า detail tab entry/exit = 0, concept point = 1
                      tableData: viewData.map((d:any, ix:number) => {
                        return d
                      }).flat(),
                      gasDay: dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY'),
                      day_text: getDayNameBySubTabIndex(subTabIndex),
                      date: dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY')
                    }
                  }
                }
            ]
          ),

          ...(
            tabIndex === 2 ? [
              {
                  typeExport: 'pageDetail', 
                  nameSheet: `${subTabIndex === 7 ? "All" : dayjs(e?.gas_day_text, "DD/MM/YYYY").add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day').format("DDMMYY")}-CP-${e?.shipper_name}`, 
                  data: newCP.map((d:any, ix:number) => {
                    return sumDataNomShipperReportConcept(d?.conceptPointZone[0]?.zone)
                  }).flat(),
                  config: {
                    columnVisibility: columnVisibility_C,
                    type: 'shipper-nom-report-detail',
                    extra_obj:{
                      shipper_name: e?.shipper_name, 
                      tabMainIndex: tabMainIndex, // จากหน้าแรก daily/weekly = 0, daily = 1, weekly = 2
                      subTabIndex: subTabIndex, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
                      tabEachZoneIndex: 1, // จากหน้า detail tab entry/exit = 0, concept point = 1
                      tableData: newCP.map((d:any, ix:number) => {
                        return d
                      }).flat(),
                      gasDay: tabIndex === 2 ? dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY') : e?.gas_day_text,
                      day_text: getDayNameBySubTabIndex(subTabIndex),
                      date: tabIndex === 2 ? (subTabIndex === 7 ? "All" : dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY')) : e?.gas_day_text
                    }
                  }
                }
            ]
            : [
                {
                  typeExport: 'pageDetail', 
                  nameSheet: `${dayjs(e?.gas_day_text, "DD/MM/YYYY").format("DDMMYY")}-CP-${e?.shipper_name}`, 
                  data: newCP.map((d:any, ix:number) => {
                    return sumDataNomShipperReportConcept(d?.conceptPointZone[0]?.zone)
                  }).flat(),
                  config: {
                    columnVisibility: columnVisibility_C,
                    type: 'shipper-nom-report-detail',
                    extra_obj:{
                      shipper_name: e?.shipper_name, 
                      tabMainIndex: tabMainIndex, // จากหน้าแรก daily/weekly = 0, daily = 1, weekly = 2
                      subTabIndex: subTabIndex < 7 ? subTabIndex : subTabIndexview, // จาก tab weekly -> tab ย่อยรายวัน sunday = 0, monday = 1, ... , saturday = 6
                      tabEachZoneIndex: 1, // จากหน้า detail tab entry/exit = 0, concept point = 1
                      tableData: newCP.map((d:any, ix:number) => {
                        return d
                      }).flat(),
                      gasDay: dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY'),
                      day_text: getDayNameBySubTabIndex(subTabIndex),
                      date: dayjs(e?.gas_day_text, 'DD/MM/YYYY')
                        .add(subTabIndex < 7 ? subTabIndex : subTabIndexview, 'day')
                        .format('DD/MM/YYYY')
                    }
                  }
                }
            ]
          ),

        ]
      })
    ]
    console.log('enwExportAll : ', enwExportAll)
    exportToExcelAllShipperNominationReport(enwExportAll)
  }

  return (
    <div className=" space-y-2">
      {/* TABLE MAIN */}
      {!viewOpen && (
        <>
          <div className="border-[#DFE4EA] border-[1px] p-4 rounded-xl  flex flex-col sm:flex-row gap-2">
            <aside className="flex flex-wrap sm:flex-row gap-2 w-full">
              {tabIndex == 0 || tabIndex == 1 ? (
                <DatePickaSearch
                  defaultValue={srchStartDate}
                  key={'start' + key}
                  label={'Gas Day'}
                  placeHolder={'Select Gas Day'}
                  allowClear
                  onChange={(e: any) => {
                    let value: any = e ? e : null
                    setSrchStartDate(value ? value : '')
                  }}
                />
              ) : (
                <DatePickaSearch
                  defaultValue={srchStartDate}
                  key={'start' + key}
                  label={'Gas Week'}
                  modeSearch={'sunday'}
                  placeHolder={'Select Gas Week'}
                  allowClear
                  onChange={(e: any) => {
                    let value: any = e ? e : null
                    setSrchStartDate(value ? value : '')
                  }}
                />
              )}

              <InputSearch
                id="searchShipper"
                label="Shipper Name"
                type="select-multi-checkbox"
                value={srchShipper}
                isDisabled={userDT?.account_manage?.[0]?.user_type_id == 3 ? true : false}
                onChange={(e) => {
                  setSrchShipper(e.target.value)
                }}
                options={dataShipper
                  ?.filter((item: any) => (userDT?.account_manage?.[0]?.user_type_id == 3 ? item?.id === userDT?.account_manage?.[0]?.group?.id : true))
                  .map((item: any) => ({
                    value: item.name,
                    label: item.name
                  }))}
              />

              <BtnSearch handleFieldSearch={() => handleFieldSearchNew()} />
              <BtnReset handleReset={() => handleReset(tabIndex)} />
            </aside>
            <aside className="mt-auto ml-1 w-full sm:w-auto">{/* BtnGeneral */}</aside>
          </div>

          <Tabs
            value={tabIndex}
            onChange={handleChange}
            aria-label="tabs"
            sx={{
              marginBottom: '-19px !important',
              '& .MuiTabs-indicator': {
                display: 'none' // Remove the underline
              },
              '& .Mui-selected': {
                color: '#58585A !important'
              }
            }}
          >
            {['Daily/Weekly', 'Daily', 'Weekly']?.map((label, index) => (
              <Tab
                key={label}
                label={label}
                id={`tab-${index}`}
                sx={{
                  fontFamily: 'Tahoma !important',
                  border: '0.5px solid',
                  borderColor: '#DFE4EA',
                  borderBottom: 'none',
                  borderTopLeftRadius: '9px',
                  borderTopRightRadius: '9px',
                  textTransform: 'none',
                  padding: '8px 16px',
                  backgroundColor: tabIndex === index ? '#FFFFFF' : '#9CA3AF1A',
                  color: tabIndex === index ? '#58585A' : '#9CA3AF',
                  '&:hover': {
                    backgroundColor: '#F3F4F6'
                  }
                }}
              />
            ))}
          </Tabs>

          <div className="border-[#DFE4EA] border-[1px] p-4 rounded-tl-none rounded-xl shadow-sm">
            {!isLoading ? (
              <TableSkeleton />
            ) : tabIndex == 0 ? (
              <>
                {/* ================== NEW TABLE ==================*/}
                <AppTable
                  data={filteredDataTable}
                  columns={columns}
                  isLoading={isLoading}
                  exportBtn={
                    <BtnGeneral
                      bgcolor={'#24AB6A'}
                      modeIcon={'export'}
                      textRender={'Export'}
                      disable={dataExport?.length <= 0 ? true : false}
                      // generalFunc={() => exportToExcel(filteredDataTable, 'shipper-nom-report-tab-0', columnVisibility)}
                      generalFunc={() => enwExportAll_(0)}
                      can_export={userPermission ? userPermission?.f_export : false}
                    />
                  }
                  initialColumns={Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible]))}
                  onColumnVisibilityChange={(columnKey: any) => handleColumnToggle(columnKey)}
                  onFilteredDataChange={(filteredData: any) => {
                    const newData = filteredData || []
                    if (JSON.stringify(dataExport) !== JSON.stringify(newData)) {
                      setDataExport(newData)
                    }
                  }}
                  border={false}
                  fixHeight={false}
                />
              </>
            ) : tabIndex == 1 ? (
              <AppTable
                data={filteredDataTable}
                columns={columns}
                isLoading={isLoading}
                exportBtn={
                  <BtnGeneral
                    bgcolor={'#24AB6A'}
                    modeIcon={'export'}
                    textRender={'Export'}
                    disable={dataExport?.length <= 0 ? true : false}
                    // generalFunc={() => exportToExcel(filteredDataTable, 'shipper-nom-report-tab-0', columnVisibility)}
                    generalFunc={() => enwExportAll_(1)}
                    can_export={userPermission ? userPermission?.f_export : false}
                  />
                }
                initialColumns={Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible]))}
                onColumnVisibilityChange={(columnKey: any) => handleColumnToggle(columnKey)}
                onFilteredDataChange={(filteredData: any) => {
                  const newData = filteredData || []
                  if (JSON.stringify(dataExport) !== JSON.stringify(newData)) {
                    setDataExport(newData)
                  }
                }}
                border={false}
                fixHeight={false}
              />
            ) : tabIndex == 2 ? (
              <AppTable
                data={subTabIndex == 7 ? filtered_weekly_all : filteredDataTable}
                columns={columnsWeekly}
                isLoading={isLoading}
                filterProps={
                  tabIndex === 2 && (
                    <Tabs
                      value={subTabIndex}
                      onChange={handleChangeSubTab}
                      aria-label="wrapped label tabs example"
                      sx={{
                        '& .Mui-selected': {
                          color: '#00ADEF !important',
                          fontWeight: 'bold !important'
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: '#00ADEF !important',
                          width: '59px !important',
                          transform: 'translateX(17%)',
                          bottom: '10px'
                        },
                        '& .MuiTab-root': {
                          minWidth: 'auto !important'
                        }
                      }}
                    >
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'All'].map((label, index) => (
                        <Tab
                          key={label}
                          label={label}
                          id={`tab-${index}`}
                          sx={{
                            fontFamily: 'Tahoma !important',
                            textTransform: 'none',
                            padding: '8px 16px',
                            minWidth: '35px',
                            maxWidth: '85px',
                            flexShrink: 0,
                            color: subTabIndex === index ? '#58585A' : '#9CA3AF'
                          }}
                        />
                      ))}
                    </Tabs>
                  )
                }
                exportBtn={
                  <BtnGeneral
                    bgcolor={'#24AB6A'}
                    modeIcon={'export'}
                    textRender={'Export'}
                    disable={dataExport?.length <= 0 ? true : false}
                    // generalFunc={() => exportToExcel(dataExport, 'shipper-nom-report-tab-weekly', columnVisibility, {subTabIndex: subTabIndex})}
                    generalFunc={() => enwExportAll_(2)}
                    can_export={userPermission ? userPermission?.f_export : false}
                  />
                }
                initialColumns={Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible]))}
                onColumnVisibilityChange={(columnKey: any) => handleColumnToggle(columnKey)}
                onFilteredDataChange={(filteredData: any) => {
                  const newData = filteredData || []
                  if (JSON.stringify(dataExport) !== JSON.stringify(newData)) {
                    setDataExport(newData)
                  }
                }}
                border={false}
                fixHeight={false}
                resetInitial={resetInitial}
                setresetInitial={setresetInitial}
              />
            ) : (
              <></>
            )}
          </div>
        </>
      )}

      {/* VIEW PAGE */}
      {viewOpen && (
        <ViewPage
          userPermission={userPermission}
          tableData={viewDataMain}
          setViewOpen={setViewOpen}
          subTabIndex={subTabIndex} // ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
          tabIndex={tabIndex} // all, daily, weekly
          subTabIndexview={subTabIndexview}
        />
      )}

      <ModalComponent open={isModalSuccessOpen} handleClose={handleCloseModal} title="Success" description={`${modalModalSuccessMsg}`} />

      <ModalComponent
        open={isModalErrorOpen}
        handleClose={() => {
          setModalErrorOpen(false)
          if (resetForm) resetForm()
        }}
        title="Failed"
        description={
          <div>
            <div className="text-center">{`${modalErrorMsg}`}</div>
          </div>
        }
        stat="error"
      />

      <Popover
        id="action-menu-popover"
        open={!!anchorPopover}
        anchorEl={anchorPopover}
        onClose={() => setAnchorPopover(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        sx={{
          borderRadius: '20px',
          overflow: 'hidden'
        }}
        className="z-50"
      >
        <div ref={popoverRef} className="w-50 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <ul className="py-2">
            {userPermission?.b_manage && (
              <li
                className="px-4 py-2 font-bold text-sm text-[#58585A] hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  toggleMenu('view', openPopoverId)
                }}
              >
                <RemoveRedEyeOutlinedIcon sx={{fontSize: 20, marginRight: 2, color: '#58585A'}} /> {`View`}
              </li>
            )}
          </ul>
        </div>
      </Popover>
    </div>
  )
}

export default ClientPage
