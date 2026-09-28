import React, {useEffect, useState} from 'react'
import {Dialog, DialogPanel} from '@headlessui/react'
import {filterByDayFrom, formatDay, formatNumber, generateDaysFromFutureMonth, getEarliestFirstDay, getLatestFirstDay, keepLatestPerGroupByPeriod, mergeDataByGroupMedTermVersionTwo, monthDiffInclusive, trimEdgeZerosToNull} from '@/utils/generalFormatter'
import {Line} from 'react-chartjs-2'

import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement} from 'chart.js'

import annotationPlugin from 'chartjs-plugin-datalabels'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import ChartShortEachShipper from './chartShortTermEachShipper'
import {InputSearch} from '@/components/other/SearchForm'
import BtnSearch from '@/components/other/btnSearch'
import BtnReset from '@/components/other/btnReset'
import MonthYearPickaSearch from '@/components/library/dateRang/monthYearPicker'
import dayjs from 'dayjs'
import getUserValue from '@/utils/getuserValue'

ChartJS.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, annotationPlugin, ChartDataLabels)

type FormExampleProps = {
  data?: any
  dataOriginal?: any
  open?: boolean
  isAll?: boolean
  mode?: any
  shipperGroupData?: any
  entryExitMaster?: any
  areaMaster?: any
  areaMasterDataFilter?: any
  srchStartDateMain?: any
  onClose: () => void
  filterList?: any
}

const ModalFullViewShort: React.FC<FormExampleProps> = ({open, onClose, data, dataOriginal, isAll, shipperGroupData, entryExitMaster, areaMaster, areaMasterDataFilter, mode, srchStartDateMain, filterList}) => {
  // ============================================================
  // USER
  // ============================================================
  const userDT: any = getUserValue()

  /*
   * Shipper User
   * ใช้ pattern เดียวกับ ClientPage
   */
  const isShipperUser = userDT?.account_manage?.[0]?.user_type?.id == 3

  /*
   * Group ของ user ที่กำลัง Login
   */
  const currentShipperGroupId = userDT?.account_manage?.[0]?.group?.id ?? ''

  // ============================================================
  // PROCESS DATA SHORT TERM EACH
  // ============================================================
  const [isFilter, setIsFilter] = useState<any>(false)

  // ============================================================
  // SEARCH
  // ============================================================
  const [key, setKey] = useState(0)

  const [srchStartDate, setSrchStartDate] = useState<Date | null>(null)

  /*
   * ถ้าเป็น Shipper
   * ให้ค่าเริ่มต้นเป็น group ตัวเองทันที
   */
  const [srchShipper, setSrchShipper] = useState<any>(isShipperUser ? currentShipperGroupId : '')

  const [srchEntryExit, setSrchEntryExit] = useState('')

  const [srchArea, setSrchArea] = useState<any>([])

  const [filterData, setFilterData] = useState<any>(data)

  const [optionArea, setoptionArea] = useState<any>([])

  // ============================================================
  // OPEN / CLOSE MODAL
  // ============================================================
  useEffect(() => {
    if (open) {
      /*
       * Area ที่มีอยู่จริงใน Graph
       */
      const filterArea = areaMasterDataFilter?.filter((item: any) => data?.datasets?.some((d: any) => d?.label === item?.name))

      setoptionArea(filterArea)

      // ====================================================
      // มี Filter จาก Main Chart
      // ====================================================
      if (filterList) {
        // =========================
        // Month
        // =========================
        if (filterList?.month) {
          setSrchStartDate(filterList?.month)
        } else {
          setSrchStartDate(null)
        }

        // =========================
        // Shipper
        // =========================
        /*
         * ถ้าเป็น Shipper User
         * ไม่สนค่าจาก filterList
         * บังคับเป็น group ตัวเอง
         */
        const effectiveShipper = isShipperUser ? currentShipperGroupId : filterList?.shipper || ''

        setSrchShipper(effectiveShipper)

        // =========================
        // Entry / Exit
        // =========================
        if (filterList?.entryExit) {
          setSrchEntryExit(filterList?.entryExit)
        } else {
          setSrchEntryExit('')
        }

        // =========================
        // Area
        // =========================
        if (filterList?.area) {
          setSrchArea(filterList?.area)
        } else {
          setSrchArea([])
        }

        // =========================
        // Fetch / Filter
        // =========================
        handleFetch(filterList?.month, effectiveShipper, filterList?.entryExit, filterList?.area)
      } else {
        // =================================================
        // ไม่มี Filter List
        // =================================================
        if (mode && data) {
          /*
           * Shipper Login + Total Graph
           *
           * ห้ามเอาทุก Shipper มารวม
           */
          if (isShipperUser && isAll) {
            setSrchShipper(currentShipperGroupId)

            handleFetch(null, currentShipperGroupId, '', [])
          } else {
            const dataFullview: any = geranateFullView()

            const {months, areas, seriesData} = processData(dataFullview?.data)

            let chartData: any

            chartData = {
              labels: months,

              datasets: areas?.map((areaId: any, index) => {
                const areaData = areaMasterDataFilter?.find((d: any) => d.name === areaId?.name)

                return {
                  label: `${areaId?.name}`,

                  data: seriesData[index],

                  borderColor: areaData?.color,

                  backgroundColor: areaData?.color,

                  fill: false,

                  isEntry: areaData?.entry_exit_id == 1 ? true : false
                }
              })
            }

            setFilterData(chartData)
          }
        }
      }
    } else {
      setSrchStartDate(null)

      /*
       * ถ้าเป็น Shipper
       * ให้ state ยังคงเป็น group ตัวเอง
       */
      setSrchShipper(isShipperUser ? currentShipperGroupId : '')

      setSrchEntryExit('')
      setSrchArea([])
      setIsFilter(false)
    }
  }, [mode, data, open])

  // ============================================================
  // HANDLE FETCH OLD
  // ============================================================
  const handleFetchOld = (month: any, shipper: any, entryExit: any, area: any) => {
    const processNOW = (data: any, date: any) => {
      const earliestDay: any = getEarliestFirstDay(data)

      const lastestDay: any = getLatestFirstDay(data)

      const month_count = monthDiffInclusive(earliestDay, lastestDay)

      const months = generateDaysFromFutureMonth(
        date ? date : dayjs().startOf('month').toDate(),

        month_count
      )

      const areas = Array.from(
        new Map(
          (data || [])
            .flatMap((d: any) =>
              d?.area
                ? [
                    {
                      id: d?.area?.id,

                      name: d?.area?.name
                    }
                  ]
                : []
            )
            ?.map((area: any) => [area.id, area])
        ).values()
      )

      const seriesData = areas?.map((areaId: any) => {
        return months?.map((month) => {
          let hasValue = false

          const totalValue = data
            ?.filter((d: any) => d?.area?.id === areaId?.id)
            ?.reduce((sum: any, current: any) => {
              const monthIndex = current?.day?.findIndex((m: any) => formatDay(m) === month)

              if (monthIndex >= 0) {
                const val = current?.value?.[monthIndex]

                if (val !== null && val !== undefined) {
                  hasValue = true

                  return sum + val
                }
              }

              return sum
            }, 0)

          return hasValue ? totalValue : null
        })
      })

      return {
        months,
        areas,
        seriesData
      }
    }

    // ========================================================
    // SHIPPER PROTECTION
    // ========================================================
    const effectiveShipper = isShipperUser ? currentShipperGroupId : shipper

    // ========================================================
    // FILTER SHIPPER
    // ========================================================
    const dataforFilterShipper: any = dataOriginal?.filter((item: any) => {
      return effectiveShipper ? item?.group?.id == effectiveShipper : true
    })

    // ========================================================
    // FILTER ENTRY EXIT
    // ========================================================
    const dataforFilterEntryExit = dataforFilterShipper?.map((item: any) => {
      const filterInnerData =
        item.data?.filter((innerFind: any) => {
          const entryExitMatch = entryExit ? innerFind?.entry_exit_id == entryExit : true

          return entryExitMatch
        }) || []

      if (filterInnerData?.length > 0) {
        return {
          ...item,
          data: filterInnerData
        }
      } else {
        return {
          ...item,
          data: []
        }
      }
    })

    // ========================================================
    // FILTER AREA
    // ========================================================
    const dataforFilterArea = dataforFilterEntryExit?.map((item: any) => {
      if (area && area?.length > 0) {
        const filterInnerData = item?.data?.filter((innerFind: any) => {
          let checked = area?.find((itemFindSub: any) => itemFindSub == innerFind?.area?.name) || false

          return checked
        })

        if (filterInnerData?.length > 0) {
          return {
            ...item,
            data: filterInnerData
          }
        } else {
          return {
            ...item,
            data: []
          }
        }
      } else {
        return {
          ...item
        }
      }
    })

    // ========================================================
    // RESULT
    // ========================================================
    const resultFilterData: any = dataforFilterArea

    const latestPerGroupShortTerm = keepLatestPerGroupByPeriod(resultFilterData)

    let modifiedDataShort2 = mergeDataByGroupMedTermVersionTwo(latestPerGroupShortTerm)

    const month_date_format = month ? dayjs(month).format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const fromStr = month ? dayjs(month_date_format, ['DD/MM/YYYY', 'YYYY-MM-DD']).startOf('day').format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const filtered = filterByDayFrom(resultFilterData ?? [], fromStr)

    // ========================================================
    // RENDER CHART
    // ========================================================
    const {months, areas, seriesData} = processNOW(
      resultFilterData?.flatMap((d: any) => d?.data),

      month
    )

    const chartDataX = {
      labels: months,

      datasets: areas?.map((areaId: any, index) => {
        const areaData = areaMasterDataFilter?.find((d: any) => d.name === areaId?.name)

        return {
          label: `${areaId?.name}`,

          data: seriesData[index],

          borderColor: areaData?.color,

          backgroundColor: areaData?.color,

          fill: false,

          isEntry: areaData?.entry_exit_id == 1 ? true : false
        }
      })
    }

    const newData = {
      ...chartDataX,

      datasets: chartDataX.datasets.map((ds: any) => ({
        ...ds,
        data: ds.data
      }))
    }

    setFilterData(newData)

    setIsFilter(true)
  }

  // ============================================================
  // HANDLE FETCH
  // ============================================================
  const handleFetch = (month: any, shipper: any, entryExit: any, area: any) => {
    // ========================================================
    // SHIPPER PROTECTION
    // ========================================================
    /*
     * จุดสำคัญ
     *
     * ถ้า user_type.id == 3
     * ต่อให้ส่ง shipper อื่นเข้ามา
     * ก็จะถูก override เป็น group ของตัวเอง
     */
    const effectiveShipper = isShipperUser ? currentShipperGroupId : shipper

    // ========================================================
    // FILTER SHIPPER
    // ========================================================
    const dataforFilterShipper: any = dataOriginal?.filter((item: any) => {
      return effectiveShipper ? item?.group?.id == effectiveShipper : true
    })

    // ========================================================
    // FILTER ENTRY EXIT
    // ========================================================
    const dataforFilterEntryExit = dataforFilterShipper?.map((item: any) => {
      const filterInnerData =
        item.data?.filter((innerFind: any) => {
          const entryExitMatch = entryExit ? innerFind?.entry_exit_id == entryExit : true

          return entryExitMatch
        }) || []

      if (filterInnerData?.length > 0) {
        return {
          ...item,
          data: filterInnerData
        }
      } else {
        return {
          ...item,
          data: []
        }
      }
    })

    // ========================================================
    // FILTER AREA
    // ========================================================
    const dataforFilterArea = dataforFilterEntryExit?.map((item: any) => {
      if (area && area?.length > 0) {
        const filterInnerData = item?.data?.filter((innerFind: any) => {
          let checked = area?.find((itemFindSub: any) => itemFindSub == innerFind?.area?.name) || false

          return checked
        })

        if (filterInnerData?.length > 0) {
          return {
            ...item,
            data: filterInnerData
          }
        } else {
          return {
            ...item,
            data: []
          }
        }
      } else {
        return {
          ...item
        }
      }
    })

    // ========================================================
    // RESULT
    // ========================================================
    const resultFilterData: any = dataforFilterArea

    const latestPerGroupShortTerm = keepLatestPerGroupByPeriod(resultFilterData)

    let modifiedDataShort2 = mergeDataByGroupMedTermVersionTwo(latestPerGroupShortTerm)

    // ========================================================
    // DATE
    // ========================================================
    const month_date_format = month ? dayjs(month).format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const fromStr = month ? dayjs(month_date_format, ['DD/MM/YYYY', 'YYYY-MM-DD']).startOf('day').format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const filtered = filterByDayFrom(resultFilterData ?? [], fromStr)

    // ========================================================
    // RENDER CHART
    // ========================================================
    const {months, areas, seriesData} = processDataX(
      resultFilterData?.flatMap((d: any) => d?.data),

      fromStr
    )

    const chartDataX = {
      labels: months,

      datasets: areas?.map((areaId: any, index) => {
        const areaData = areaMaster?.data?.find((d: any) => d.name === areaId?.name)

        return {
          label: `${areaId?.name}`,

          data: seriesData[index],

          borderColor: areaData?.color,

          backgroundColor: areaData?.color,

          fill: false,

          isEntry: areaData?.entry_exit_id == 1 ? true : false
        }
      })
    }

    const newData = {
      ...chartDataX,

      datasets: chartDataX.datasets.map((ds: any) => ({
        ...ds,
        data: ds.data
      }))
    }

    setFilterData(newData)

    setIsFilter(true)
  }

  // ============================================================
  // PROCESS DATA
  // ============================================================
  const processData = (data: any) => {
    const earliestDay: any = getEarliestFirstDay(data)

    const lastestDay: any = getLatestFirstDay(data)

    const month_count = monthDiffInclusive(earliestDay, lastestDay)

    const months = generateDaysFromFutureMonth(
      srchStartDateMain ? srchStartDateMain : srchStartDate ? srchStartDate : dayjs(earliestDay, 'DD/MM/YYYY').toDate(),

      month_count
    )

    const areas = Array.from(
      new Map(
        (data || [])
          .flatMap((d: any) =>
            d?.area
              ? [
                  {
                    id: d?.area?.id,

                    name: d?.area?.name
                  }
                ]
              : []
          )
          ?.map((area: any) => [area?.id, area])
      ).values()
    )

    const seriesData = areas?.map((areaId: any) => {
      return months?.map((month) => {
        let hasValue = false

        const totalValue = (data || [])
          ?.filter((d: any) => d?.area?.id === areaId?.id)
          ?.reduce((sum: any, current: any) => {
            const monthIndex = current?.day?.findIndex((m: any) => formatDay(m) === month)

            if (monthIndex >= 0) {
              const val = current?.value?.[monthIndex]

              if (val !== null && val !== undefined) {
                hasValue = true

                return sum + val
              }
            }

            return sum
          }, 0)

        return hasValue ? totalValue : null
      })
    })

    return {
      months,
      areas,
      seriesData
    }
  }

  // ============================================================
  // PROCESS DATA X
  // ============================================================
  const processDataX = (data: any, startDate?: string) => {
    const startDayjs = startDate ? dayjs(startDate, 'DD/MM/YYYY') : null

    const earliestDay: any = getEarliestFirstDay(data)

    const lastestDay: any = getLatestFirstDay(data)

    const month_count = monthDiffInclusive(earliestDay, lastestDay)

    const baseDate = startDayjs && startDayjs.isValid() ? startDayjs.toDate() : srchStartDate ? (srchStartDate instanceof Date ? srchStartDate : dayjs(srchStartDate)?.isValid() ? dayjs(srchStartDate).toDate() : dayjs().toDate()) : dayjs().startOf('month').toDate()

    const months = generateDaysFromFutureMonth(baseDate)

    const areas = Array.from(
      new Map(
        (data || [])
          .flatMap((d: any) =>
            d?.area
              ? [
                  {
                    id: d?.area?.id,

                    name: d?.area?.name
                  }
                ]
              : []
          )
          ?.map((area: any) => [area?.id, area])
      ).values()
    )

    const seriesData = areas?.map((areaId: any) => {
      return months?.map((month) => {
        let hasValue = false

        const totalValue = (data || [])
          ?.filter((d: any) => d?.area?.id === areaId?.id)
          ?.reduce((sum: any, current: any) => {
            const monthIndex = current?.day?.findIndex((m: any) => formatDay(m) === month)

            if (monthIndex >= 0) {
              const val = current?.value?.[monthIndex]

              if (val !== null && val !== undefined) {
                hasValue = true

                return sum + val
              }
            }

            return sum
          }, 0)

        return hasValue ? totalValue : null
      })
    })

    return {
      months,
      areas,
      seriesData
    }
  }

  // ============================================================
  // GENERATE FULL VIEW
  // ============================================================
  const geranateFullView = () => {
    const areaMap = new Map<
      string,
      {
        id: number

        nomination_point: string

        customer: string

        area: {
          id: number
          name: string
          color: string
        }

        unit: string

        entry_exit_id: number

        entry_exit: string

        day: string[]

        value: number[]
      }
    >()

    // ========================================================
    // SHIPPER PROTECTION
    // ========================================================
    /*
     * ถ้าเป็น Shipper
     * generate Full View จากข้อมูลของตัวเองเท่านั้น
     */
    const sourceData = isShipperUser ? dataOriginal?.filter((entry: any) => entry?.group?.id == currentShipperGroupId) : dataOriginal

    sourceData?.forEach((entry: any) => {
      entry.data?.forEach((item: any) => {
        const key = item.area.name

        if (!areaMap.has(key)) {
          areaMap.set(key, {
            ...item,

            value: [...item.value],

            day: [...item.day]
          })
        } else {
          const existing = areaMap.get(key)!

          existing.value = existing.value.map((v, i) => v + item.value[i])
        }
      })
    })

    const reducedDataAll = {
      ...(sourceData?.[0] || {}),

      data: Array.from(areaMap.values())
    }

    return reducedDataAll
  }

  // ============================================================
  // HANDLE FIELD SEARCH
  // ============================================================
  const handleFieldSearch = () => {
    // ========================================================
    // SHIPPER PROTECTION
    // ========================================================
    const effectiveShipper = isShipperUser ? currentShipperGroupId : srchShipper

    // ========================================================
    // FILTER SHIPPER
    // ========================================================
    const dataforFilterShipper: any = dataOriginal?.filter((item: any) => {
      return effectiveShipper ? item?.group?.id == effectiveShipper : true
    })

    // ========================================================
    // FILTER ENTRY EXIT
    // ========================================================
    const dataforFilterEntryExit = dataforFilterShipper?.map((item: any) => {
      const filterInnerData =
        item.data?.filter((innerFind: any) => {
          const entryExitMatch = srchEntryExit ? innerFind?.entry_exit_id == srchEntryExit : true

          return entryExitMatch
        }) || []

      if (filterInnerData?.length > 0) {
        return {
          ...item,
          data: filterInnerData
        }
      } else {
        return {
          ...item,
          data: []
        }
      }
    })

    // ========================================================
    // FILTER AREA
    // ========================================================
    const dataforFilterArea = dataforFilterEntryExit?.map((item: any) => {
      if (srchArea && srchArea?.length > 0) {
        const filterInnerData = item?.data?.filter((innerFind: any) => {
          let checked = srchArea?.find((itemFindSub: any) => itemFindSub == innerFind?.area?.name) || false

          return checked
        })

        if (filterInnerData?.length > 0) {
          return {
            ...item,
            data: filterInnerData
          }
        } else {
          return {
            ...item,
            data: []
          }
        }
      } else {
        return {
          ...item
        }
      }
    })

    const resultFilterData: any = dataforFilterArea

    // ========================================================
    // RENDER
    // ========================================================
    const {months, areas, seriesData} = processData(resultFilterData?.flatMap((d: any) => d?.data))

    const chartDataX = {
      labels: months,

      datasets: areas?.map((areaId: any, index) => {
        const areaData = areaMasterDataFilter?.find((d: any) => d.name === areaId?.name)

        return {
          label: `${areaId?.name}`,

          data: seriesData[index],

          borderColor: areaData?.color,

          backgroundColor: areaData?.color,

          fill: false,

          isEntry: areaData?.entry_exit_id == 1 ? true : false
        }
      })
    }

    const newData = {
      ...chartDataX,

      datasets: chartDataX.datasets.map((ds: any) => ({
        ...ds,
        data: ds.data
      }))
    }

    setFilterData(newData)

    setIsFilter(true)
  }

  // ============================================================
  // RESET
  // ============================================================
  const handleReset = () => {
    setSrchStartDate(null)

    setSrchArea([])

    // ========================================================
    // SHIPPER
    // ========================================================
    /*
     * Shipper กด Reset
     * ต้องยังเป็นตัวเองอยู่
     */
    if (isShipperUser) {
      setSrchShipper(currentShipperGroupId)
    } else {
      setSrchShipper('')
    }

    setSrchEntryExit('')

    // ========================================================
    // DATA
    // ========================================================
    /*
     * ถ้าเป็น Shipper
     * ห้าม setFilterData(data)
     * เพราะ data อาจเป็น Total ก่อน filter
     */
    if (isShipperUser) {
      handleFetch(null, currentShipperGroupId, '', [])
    } else {
      setFilterData(data)

      setIsFilter(false)
    }

    setKey((prevKey) => prevKey + 1)
  }

  // ============================================================
  // CHART OPTION
  // ============================================================
  let shortTermOption: any = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,

          pointStyle: 'circle',

          font: {
            size: 12
          },

          boxWidth: 20,

          boxHeight: 12,

          padding: 18,

          generateLabels: (chart: any) => {
            return chart?.data?.datasets?.map((dataset: any, index: any) => ({
              text: dataset.label,

              fillStyle: dataset.backgroundColor,

              strokeStyle: dataset.backgroundColor,

              hidden: !chart.isDatasetVisible(index),

              pointStyle: dataset.isEntry ? 'rect' : 'circle'
            }))
          }
        }
      },

      title: {
        display: true,

        text: 'Total Energy (MMBTU/D)',

        align: 'start',

        position: 'top',

        font: {
          size: 16
        },

        padding: {
          top: 5,

          bottom: 1
        },

        color: '#58585A'
      },

      tooltip: {
        mode: 'index',

        intersect: false,

        backgroundColor: 'white',

        titleColor: 'black',

        bodyColor: 'black',

        borderColor: '#cfcfd1',

        borderWidth: 1,

        callbacks: {
          label: (tooltipItem: any) => {
            const labelName = tooltipItem?.dataset.label

            const value = formatNumber(tooltipItem?.raw)

            return `${labelName} : ${value}`
          }
        }
      },

      datalabels: {
        display: false
      }
    },

    scales: {
      x: {
        title: {
          display: false,

          text: 'Month'
        },

        ticks: {
          autoSkip: false,

          maxRotation: 45,

          minRotation: 0,

          font: {
            size: 11
          }
        }
      },

      y: {
        title: {
          display: false,

          text: 'Value'
        },

        beginAtZero: true
      }
    }
  }

  // ============================================================
  // EACH OPTION
  // ============================================================
  let shortTermEachOption: any = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        position: 'top',

        labels: {
          usePointStyle: true,

          pointStyle: 'circle',

          font: {
            size: 12
          },

          boxWidth: 20,

          boxHeight: 12,

          padding: 18,

          generateLabels: (chart: any) => {
            return chart?.data?.datasets?.map((dataset: any, index: any) => ({
              text: dataset.label,

              fillStyle: dataset.backgroundColor,

              strokeStyle: dataset.backgroundColor,

              hidden: !chart.isDatasetVisible(index),

              pointStyle: dataset.isEntry ? 'rect' : 'circle'
            }))
          }
        }
      },

      title: {
        display: true,

        text: 'Total Energy (MMBTU/D)',

        align: 'start',

        position: 'top',

        font: {
          size: 16
        },

        padding: {
          top: 5,

          bottom: 1
        },

        color: '#58585A'
      },

      tooltip: {
        mode: 'index',

        intersect: false,

        backgroundColor: 'white',

        titleColor: 'black',

        bodyColor: 'black',

        borderColor: '#cfcfd1',

        borderWidth: 1,

        callbacks: {
          label: (tooltipItem: any) => {
            const labelName = tooltipItem?.dataset.label

            const value = formatNumber(tooltipItem?.raw)

            return `${labelName} : ${value}`
          }
        }
      },

      datalabels: {
        display: false
      }
    },

    scales: {
      x: {
        title: {
          display: false,

          text: 'Month'
        }
      },

      y: {
        title: {
          display: false,

          text: 'Value'
        },

        beginAtZero: true
      }
    }
  }

  // ============================================================
  // CLOSE
  // ============================================================
  const handleClose = () => {
    onClose()

    handleReset()
  }

  // ============================================================
  // RESET EFFECT
  // ============================================================
  useEffect(() => {
    if (key > 0) {
      /*
       * ถ้า Shipper
       * Reset แล้ว fetch group ตัวเองเสมอ
       */
      handleFetch(
        null,

        isShipperUser ? currentShipperGroupId : '',

        '',

        []
      )
    }
  }, [key])

  // ============================================================
  // SHIPPER OPTIONS
  // ============================================================
  /*
   * Shipper User
   * dropdown เหลือเฉพาะ Group ตัวเอง
   *
   * User อื่น
   * เห็นทุก Shipper เหมือนเดิม
   */
  const shipperOptions = (isShipperUser ? shipperGroupData?.data?.filter((item: any) => item?.id == currentShipperGroupId) : shipperGroupData?.data)?.map((item: any) => ({
    value: item.id,

    label: item.name
  }))

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Dialog open={open} onClose={handleClose} className="relative z-20">
      <div
        className="
                    fixed
                    inset-0
                    bg-black
                    bg-opacity-45
                    transition-opacity
                "
      />

      <div
        className="
                    fixed
                    inset-0
                    z-10
                    flex
                    items-center
                    justify-center
                "
      >
        <DialogPanel
          className="
                        flex
                        w-auto
                        transform
                        transition-all
                        bg-white
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
          {/* Content */}
          <div
            className="
                            flex
                            w-[87.3dvw]
                            h-[96dvh]
                            overflow-hidden
                            flex-col
                            items-center
                            gap-2
                            p-9
                        "
          >
            <h2
              className="
                                text-lg
                                sm:text-xl
                                font-bold
                                text-gray-700
                                self-start
                            "
            >
              {`Full View : ${mode}`}
            </h2>

            {/* ================================================= */}
            {/* FILTER */}
            {/* ================================================= */}
            <aside
              className="
                                flex
                                flex-wrap
                                gap-3
                                w-full
                            "
            >
              {/* Month */}
              <MonthYearPickaSearch key={'start' + key} label={'Month'} placeHolder={'Select Month'} allowClear onChange={(e: any) => setSrchStartDate(e || null)} valueShow={srchStartDate} />

              {/* ============================================= */}
              {/* SHIPPER */}
              {/* ============================================= */}
              {isAll && (
                <InputSearch
                  id="searchShipper"
                  label="Shipper Name"
                  type="select"
                  value={srchShipper}
                  /*
                   * Shipper User
                   * ล็อก Dropdown
                   */
                  isDisabled={isShipperUser}
                  onChange={(e) => {
                    /*
                     * กันอีกชั้น
                     * Shipper ห้ามเปลี่ยนค่า
                     */
                    if (isShipperUser) {
                      return
                    }

                    setSrchShipper(e.target.value)
                  }}
                  options={shipperOptions}
                />
              )}

              {/* ============================================= */}
              {/* ENTRY / EXIT */}
              {/* ============================================= */}
              <InputSearch
                id="searchEntryExit"
                label="Entry/Exit"
                type="select"
                value={srchEntryExit}
                onChange={(e) => {
                  if (e?.target?.value) {
                    setSrchEntryExit(e.target.value)
                  } else {
                    setSrchEntryExit('')
                  }

                  /*
                   * เปลี่ยน Entry Exit
                   * clear Area
                   */
                  setSrchArea([])
                }}
                options={entryExitMaster?.data?.map((item: any) => ({
                  value: item.id,

                  label: item.name
                }))}
              />

              {/* ============================================= */}
              {/* AREA */}
              {/* ============================================= */}
              <InputSearch
                id="searchArea"
                label="Area"
                type="select-multi-checkbox"
                value={srchArea}
                onChange={(e) => setSrchArea(e.target.value)}
                options={optionArea
                  ?.filter((item: any) => srchEntryExit === '' || item?.entry_exit_id === srchEntryExit)
                  .map((item: any) => ({
                    value: item.name,

                    label: item.name
                  }))}
              />

              {/* ============================================= */}
              {/* SEARCH */}
              {/* ============================================= */}
              <BtnSearch
                handleFieldSearch={() => {
                  handleFetch(
                    srchStartDate,

                    /*
                     * ไม่ต้องเปลี่ยนตรงนี้ก็ได้
                     * เพราะ handleFetch
                     * บังคับ effectiveShipper
                     * อีกชั้นแล้ว
                     */
                    srchShipper,

                    srchEntryExit,

                    srchArea
                  )
                }}
              />

              {/* ============================================= */}
              {/* RESET */}
              {/* ============================================= */}
              <BtnReset handleReset={handleReset} />
            </aside>

            {/* ================================================= */}
            {/* CHART */}
            {/* ================================================= */}
            <div
              className="
                                w-full
                                flex-grow
                                overflow-x-auto
                            "
            >
              {/* ============================================= */}
              {/* TOTAL */}
              {/* ============================================= */}
              {isAll && (
                <div
                  className="
                                        w-full
                                        overflow-x-auto
                                    "
                >
                  <div
                    className="
                                            w-[7500px]
                                            h-[65dvh]
                                        "
                  >
                    <Line data={filterData} options={shortTermOption} />
                  </div>
                </div>
              )}

              {/* ============================================= */}
              {/* EACH SHIPPER */}
              {/* ============================================= */}
              {!isAll &&
                (isFilter ? (
                  <div
                    className="
                                                max-w-[7500px]
                                                w-full
                                                h-[65dvh]
                                            "
                  >
                    <Line data={filterData} options={shortTermEachOption} />
                  </div>
                ) : (
                  <ChartShortEachShipper dataChart={filterData} mode="view" />
                ))}
            </div>

            {/* ================================================= */}
            {/* CLOSE */}
            {/* ================================================= */}
            <div
              className="
                                w-full
                                flex
                                justify-end
                                pt-4
                                sticky
                                bottom-0
                                bg-white
                                p-4
                            "
            >
              <button
                onClick={handleClose}
                className="
                                    w-40
                                    h-10
                                    font-bold
                                    bg-blue-500
                                    text-white
                                    rounded-lg
                                    hover:bg-blue-600
                                    transition
                                "
              >
                {`Close`}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export default ModalFullViewShort
