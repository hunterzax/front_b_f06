import React, {useEffect, useState} from 'react'
import {Dialog, DialogPanel} from '@headlessui/react'
import {filterByMonthFrom, formatMonth, formatMonthX, formatNumber, formatNumberThreeDecimal, generateNext24Months, trimEdgeZerosToNull} from '@/utils/generalFormatter'
import {Line} from 'react-chartjs-2'

import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement} from 'chart.js'

import annotationPlugin from 'chartjs-plugin-datalabels'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import {InputSearch} from '@/components/other/SearchForm'
import BtnSearch from '@/components/other/btnSearch'
import BtnReset from '@/components/other/btnReset'
import MonthYearPickaSearch from '@/components/library/dateRang/monthYearPicker'
import ChartMedEachShipper from './chartMedTermEachShipper'
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
  srchStartYearMedTerm?: any
  onClose: () => void
  filterList?: any
}

const ModalFullViewMedium: React.FC<FormExampleProps> = ({open, onClose, data, dataOriginal, isAll, shipperGroupData, entryExitMaster, areaMaster, areaMasterDataFilter, srchStartYearMedTerm, mode, filterList}) => {
  // ============================================================
  // USER
  // ============================================================
  const userDT: any = getUserValue()

  /*
   * Shipper User
   *
   * ใช้ user_type?.id == 3
   * ตาม ClientPage ตัวหลัก
   */
  const isShipperUser = userDT?.account_manage?.[0]?.user_type?.id == 3

  /*
   * group ของ user ที่ login
   */
  const currentShipperGroupId = userDT?.account_manage?.[0]?.group?.id ?? ''

  // ============================================================
  // PROCESS DATA MEDIUM TERM EACH
  // ============================================================
  const [isFilter, setIsFilter] = useState<any>(false)

  // ============================================================
  // SEARCH
  // ============================================================
  const [key, setKey] = useState(0)

  const [srchStartDate, setSrchStartDate] = useState<Date | null>(null)

  const [srchShipper, setSrchShipper] = useState<any>('')

  const [srchEntryExit, setSrchEntryExit] = useState('')

  const [srchArea, setSrchArea] = useState<any>([])

  const [filterData, setFilterData] = useState<any>(data)

  const [optionArea, setoptionArea] = useState<any>([])

  // ============================================================
  // OPEN MODAL
  // ============================================================
  useEffect(() => {
    if (open) {
      /*
       * หา Area ที่มีอยู่จริงในกราฟ
       */
      const filterArea = areaMasterDataFilter?.filter((item: any) => data?.datasets?.some((d: any) => d?.label === item?.name))

      setoptionArea(filterArea)

      // ====================================================
      // มี filter จากหน้าหลัก
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
         * ถ้าเป็น Shipper
         * บังคับใช้ group ของตัวเอง
         *
         * ไม่สน filterList.shipper
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
        // FILTER DATA
        // =========================
        handleFetch(filterList?.month, effectiveShipper, filterList?.entryExit, filterList?.area)
      } else {
        // ====================================================
        // ไม่มี filterList
        // ====================================================
        if (mode && data) {
          /*
           * ถ้าเป็น Shipper
           *
           * ห้าม generate ข้อมูลรวมทุก Shipper
           * ให้ filter group ตัวเองก่อน
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
      // ====================================================
      // CLOSE MODAL
      // ====================================================
      setSrchStartDate(null)

      /*
       * ปิด Modal แล้ว clear ได้
       * ตอนเปิดใหม่จะ set group ตัวเองให้อัตโนมัติ
       */
      setSrchShipper('')

      setSrchEntryExit('')
      setSrchArea([])
      setIsFilter(false)
    }
  }, [mode, data, open])

  // ============================================================
  // PROCESS DATA
  // ============================================================
  const processData = (data: any) => {
    let months = formatMonthX(data?.[0]?.month)

    if (srchStartDate) {
      months = generateNext24Months(srchStartDate)
    } else if (srchStartYearMedTerm) {
      months = generateNext24Months(srchStartYearMedTerm)
    }

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
      return (months || [])?.map((month: any) => {
        const totalValue = data
          .filter((d: any) => d.area.id === areaId?.id)
          .reduce((sum: any, current: any) => {
            const monthIndex = current.month.findIndex((m: any) => formatMonth(m) === month)

            if (monthIndex >= 0) {
              return sum + current.value[monthIndex]
            }

            return sum
          }, 0)

        return totalValue
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
  const processDataX = (data: any) => {
    let months = formatMonthX(data?.[0]?.month)

    if (srchStartDate) {
      months = generateNext24Months(srchStartDate)
    }

    const areas = Array.from(
      new Map(
        (data || [])
          .flatMap((d: any) =>
            d?.area
              ? [
                  {
                    id: d.area.id,
                    name: d.area.name
                  }
                ]
              : []
          )
          .map((area: any) => [area.id, area])
      ).values()
    )

    const seriesData = areas?.map((areaId: any) => {
      return (months || [])?.map((month: any) => {
        const related = data?.filter((d: any) => d.area.id === areaId?.id)

        let hasValue = false

        const totalValue = related?.reduce((sum: any, current: any) => {
          const monthIndex = current.month.findIndex((m: any) => formatMonth(m) === month)

          if (monthIndex >= 0) {
            const val = current.value[monthIndex]

            if (val === null || val === undefined) {
              return sum
            }

            hasValue = true

            return sum + val
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
        month: string[]
        value: number[]
      }
    >()

    /*
     * SECURITY / SHIPPER FILTER
     *
     * ถ้าเป็น Shipper
     * ใช้เฉพาะ data group ตัวเอง
     */
    const sourceData = isShipperUser ? dataOriginal?.filter((entry: any) => entry?.group?.id == currentShipperGroupId) : dataOriginal

    sourceData?.forEach((entry: any) => {
      entry?.data?.forEach((item: any) => {
        const key = item?.area?.name

        if (!areaMap.has(key)) {
          areaMap?.set(key, {
            ...item,
            value: [...(item?.value || [])],
            day: [...(item?.month || [])]
          })
        } else {
          const existing = areaMap.get(key)!
          if (existing == null) return;
          existing.value = (existing?.value || [])?.map((v: any, i: any) => (v ?? 0) + (item?.value?.[i] ?? 0))
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
  // HANDLE FETCH OLD
  // ============================================================
  const handleFetchOld = (month: any, shipper: any, entryExit: any, area: any) => {
    const processNOW = (data: any, date: any) => {
      let months = formatMonthX(data?.[0]?.month)

      if (date) {
        months = generateNext24Months(date)
      }

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
        return (months || [])?.map((month: any) => {
          const related = data?.filter((d: any) => d.area.id === areaId?.id)

          let hasValue = false

          const totalValue = related?.reduce((sum: any, current: any) => {
            const monthIndex = current.month.findIndex((m: any) => formatMonth(m) === month)

            if (monthIndex >= 0) {
              const val = current.value[monthIndex]

              if (val === null || val === undefined) {
                return sum
              }

              hasValue = true

              return sum + val
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

    /*
     * ถ้า Shipper
     * บังคับ group ตัวเอง
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

    const resultFilterData: any = dataforFilterArea

    // ========================================================
    // NORMALIZE MONTH
    // ========================================================
    let minDate: any = null
    let maxLength: number | null = null

    resultFilterData?.forEach((entry: any) => {
      entry?.data?.forEach((item: any) => {
        if (item == null) return;
        item.month?.forEach((m: string) => {
          const d = dayjs(m, 'DD/MM/YYYY')

          if (!minDate || d.isBefore(minDate)) {
            minDate = d
          }
        })

        if (Array.isArray(item.value) && (maxLength === null || item.value.length > maxLength)) {
          maxLength = item.value.length;
        }
      })
    })

    const baseMonths = Array.from(
      {
        length: maxLength || 24
      },
      (_, i) => minDate?.add(i, 'month').format('DD/MM/YYYY')
    )

    const normalizedData = resultFilterData?.map((entry: any) => ({
      ...entry,
      data: (entry.data || [])?.map((item: any) => ({
        ...item,
        month: baseMonths
      }))
    }))

    // ========================================================
    // FILTER MONTH
    // ========================================================
    const month_date_format = month ? dayjs(month).format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const fromStr = month ? dayjs(month_date_format, ['DD/MM/YYYY', 'YYYY-MM-DD']).startOf('day').format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const filtered = filterByMonthFrom(resultFilterData ?? [], fromStr)

    const {months, areas, seriesData} = processNOW(
      filtered?.flatMap((d: any) => d?.data),
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

      datasets: (chartDataX.datasets || [])?.map((ds: any) => ({
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
     * ถ้า login เป็น Shipper
     * ต่อให้ส่ง shipper อื่นเข้ามา
     * ก็จะถูก override เป็น group ตัวเองทันที
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
          return entryExit ? innerFind?.entry_exit_id == entryExit : true
        }) || []

      return {
        ...item,
        data: filterInnerData
      }
    })

    // ========================================================
    // FILTER AREA
    // ========================================================
    const resultFilterData = dataforFilterEntryExit?.map((item: any) => {
      if (area && area.length > 0) {
        const filterInnerData = item?.data?.filter((innerFind: any) => area.includes(innerFind?.area?.name))

        return {
          ...item,
          data: filterInnerData
        }
      }

      return {
        ...item
      }
    })

    // ========================================================
    // NORMALIZE MONTH
    // ========================================================
    let minDate: any = null
    let maxLength: number | null = null

    resultFilterData?.forEach((entry: any) => {
      entry?.data?.forEach((item: any) => {
        if (item == null) return;
        item.month?.forEach((m: string) => {
          const d = dayjs(m, 'DD/MM/YYYY')

          if (!minDate || d.isBefore(minDate)) {
            minDate = d
          }
        })

        if (Array.isArray(item.value) && (maxLength === null || item.value.length > maxLength)) {
          maxLength = item.value.length
        }
      })
    })

    // ========================================================
    // FILTER MONTH
    // ========================================================
    const month_date_format = month ? dayjs(month).format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const fromStr = month ? dayjs(month_date_format, ['DD/MM/YYYY', 'YYYY-MM-DD']).startOf('day').format('DD/MM/YYYY') : dayjs().startOf('month').format('DD/MM/YYYY')

    const filtered = filterByMonthFrom(resultFilterData ?? [], fromStr)

    // ========================================================
    // RENDER DATA TO CHART
    // ========================================================
    const flatData = filtered?.flatMap((d: any) => d?.data)

    const {months, areas, seriesData} = processDataX(flatData)

    const chartDataX = {
      labels: months,

      datasets: areas?.map((areaId: any, index: number) => {
        const areaData = (areaMaster?.data || [])?.find((d: any) => d.name === areaId?.name)

        return {
          label: `${areaId?.name}`,
          data: seriesData[index],
          borderColor: areaData?.color,
          backgroundColor: areaData?.color,
          fill: false,
          isEntry: areaData?.entry_exit_id == 1
        }
      })
    }

    const newData = {
      ...chartDataX,

      datasets: (chartDataX.datasets || [])?.map((ds: any) => ({
        ...ds,
        data: ds.data
      }))
    }

    setFilterData(newData)
    setIsFilter(true)
  }

  // ============================================================
  // HANDLE FIELD SEARCH
  // ============================================================
  const handleFieldSearch = () => {
    /*
     * ถ้าเป็น Shipper
     * บังคับใช้ Shipper ตัวเอง
     */
    const effectiveShipper = isShipperUser ? currentShipperGroupId : srchShipper

    const dataforFilterShipper: any = dataOriginal?.filter((item: any) => {
      return effectiveShipper ? item?.group?.id == effectiveShipper : true
    })

    // ========================================================
    // ENTRY EXIT
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
    // AREA
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

    const {months, areas, seriesData} = processData(resultFilterData?.flatMap((d: any) => d?.data))

    const chartDataX = {
      labels: months,

      datasets: areas?.map((areaId: any, index) => {
        const areaData = areaMaster?.find((d: any) => d.name === areaId?.name)

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

      datasets: (chartDataX.datasets || [])?.map((ds: any) => ({
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

    /*
     * ถ้าเป็น Shipper
     * Reset แล้วห้ามกลายเป็น blank
     */
    if (isShipperUser) {
      setSrchShipper(currentShipperGroupId)
    } else {
      setSrchShipper('')
    }

    setSrchEntryExit('')

    /*
     * ถ้าเป็น Shipper
     * ไม่ set กลับ data รวม
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
  // CHART OPTIONS
  // ============================================================
  const mediumTermOption: any = {
    responsive: true,

    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: true,

        position: 'top',

        labels: {
          usePointStyle: true,

          font: {
            size: 12,
            weight: 'bold'
          },

          boxWidth: 20,
          boxHeight: 12,
          padding: 18,

          generateLabels: (chart: any) => {
            return chart?.data?.datasets?.map((dataset: any, index: any) => ({
              text: dataset.label,

              fillStyle: dataset.backgroundColor,

              strokeStyle: dataset.borderColor,

              hidden: !chart.isDatasetVisible(index),

              pointStyle: dataset.isEntry ? 'rect' : 'circle'
            }))
          }
        },

        onClick: null
      },

      title: {
        display: true,

        color: '#58585A',

        text: 'Total Energy (MMBTU/D)',

        align: 'start',

        position: 'top',

        font: {
          size: 16
        },

        padding: {
          top: 5,
          bottom: 1
        }
      },

      tooltip: {
        mode: 'nearest',

        enabled: true,

        intersect: false,

        backgroundColor: 'white',

        title: false,

        titleColor: '#767676',

        bodyColor: '#767676',

        padding: 5,

        boxPadding: 5,

        usePointStyle: true,

        callbacks: {
          title: () => null,

          label: (tooltipItem: any) => {
            const labelName = tooltipItem?.dataset?.label

            const value = formatNumberThreeDecimal(tooltipItem?.raw)

            return `${labelName} : ${value}`
          },

          labelColor: function (context: any) {
            return {
              borderColor: context?.dataset?.backgroundColor,

              backgroundColor: context?.dataset?.backgroundColor,

              borderWidth: 0,

              borderRadius: 2
            }
          }
        },

        bodyFont: {
          size: 15,

          family: 'Tahoma',

          weight: 'normal'
        },

        titleFont: {
          size: 14,

          family: 'Tahoma',

          weight: 'bold'
        },

        cornerRadius: 10,

        boxWidth: 50,

        borderColor: 'rgba(0, 0, 0, 0.2)',

        borderWidth: 1,

        borderRadius: 5,

        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
    },

    animation: {
      onSuccess: () => {
        const chart = ChartJS.getChart('MediumtermChart')

        if (chart) {
          const {legend}: any = chart

          legend.top = -8
        }
      }
    }
  }

  // ============================================================
  // EACH OPTION
  // ============================================================
  let mediumTermEachOption: any = {
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
            const labelName = tooltipItem.dataset.label

            const value = formatNumber(tooltipItem.raw)

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
  // RESET KEY
  // ============================================================
  useEffect(() => {
    if (key > 0) {
      /*
       * สำคัญ
       *
       * เดิมส่ง ''
       * ทำให้ Shipper กลับไปเห็นทั้งหมดได้
       *
       * ตอนนี้ถ้า Shipper
       * จะส่ง group ตัวเองเสมอ
       */
      handleFetch(null, isShipperUser ? currentShipperGroupId : '', '', [])
    }
  }, [key])

  // ============================================================
  // SHIPPER OPTIONS
  // ============================================================
  /*
   * ถ้าเป็น shipper
   * options จะเหลือเฉพาะ group ตัวเอง
   *
   * ถ้าไม่ใช่ shipper
   * แสดงเหมือนเดิมทั้งหมด
   */
  const shipperOptions = (isShipperUser ? shipperGroupData?.data?.filter((item: any) => item?.id == currentShipperGroupId) : shipperGroupData?.data)?.map((item: any) => ({
    value: item.id,
    label: item.name
  }))

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Dialog open={open} onClose={onClose} className="relative z-20">
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
                   * Shipper Login
                   * ห้ามเปลี่ยน Shipper
                   */
                  isDisabled={isShipperUser}
                  onChange={(e) => {
                    /*
                     * ป้องกันซ้ำอีกชั้น
                     *
                     * ถ้าเป็น Shipper
                     * ไม่ให้เปลี่ยน state
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
              {/* ENTRY EXIT */}
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
                  /*
                   * ถึงแม้ srchShipper
                   * จะโดนแก้จากที่อื่น
                   *
                   * handleFetch จะ enforce
                   * currentShipperGroupId
                   * อีกชั้น
                   */
                  handleFetch(srchStartDate, srchShipper, srchEntryExit, srchArea)
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
              {/* ALL SHIPPER / TOTAL */}
              {/* ============================================= */}
              {isAll && filterData && (
                <div
                  className="
                                            w-full
                                            overflow-x-auto
                                        "
                >
                  <div
                    className="
                                                w-[4500px]
                                                h-[550px]
                                            "
                  >
                    <Line data={filterData} options={mediumTermOption} />
                  </div>
                </div>
              )}

              {/* ============================================= */}
              {/* EACH SHIPPER */}
              {/* ============================================= */}
              {!isAll &&
                filterData &&
                (isFilter ? (
                  <div
                    className="
                                                    max-w-[4500px]
                                                    w-full
                                                    h-full
                                                "
                  >
                    <Line id="AllmediumLine" data={filterData} options={mediumTermEachOption} />
                  </div>
                ) : (
                  <ChartMedEachShipper dataChart={filterData} />
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
                                pt-2
                                sticky
                                bottom-0
                                bg-white
                                p-2
                            "
            >
              <button
                onClick={onClose}
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

export default ModalFullViewMedium
