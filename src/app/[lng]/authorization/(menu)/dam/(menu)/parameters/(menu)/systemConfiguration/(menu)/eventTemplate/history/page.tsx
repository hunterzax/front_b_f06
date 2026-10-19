'use client'

import '@/app/globals.css'

import {useEffect, useState} from 'react'

import {useParams, useRouter, useSearchParams} from 'next/navigation'

import {IconButton} from '@mui/material'

import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined'
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import KeyboardArrowLeftOutlinedIcon from '@mui/icons-material/KeyboardArrowLeftOutlined'
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined'

import ModalComponent from '@/components/other/ResponseModal'

import getCookieValue from '@/utils/getCookieValue'
import useRestrictedPage from '@/utils/checkRestrictedPage'
import {getService} from '@/utils/postService'

/* =========================================================
 * TYPES
 * ========================================================= */

type HistoryItem = {
  id: number

  event_template_id: number

  action_date: string

  edited_by: {
    id: number
    first_name: string
    last_name: string
  }

  detail: {
    action?: string
    template_name?: string
    field?: string
    old_value?: any
    new_value?: any

    [key: string]: any
  }

  raw?: any
}

/* =========================================================
 * DOCUMENT LABEL
 * ========================================================= */

const getDocumentDescription = (docId: string) => {
  switch (String(docId)) {
    case '1':
      return 'เทมเพลตเอกสารแจ้งเตือนคุณภาพก๊าซฯ 1'

    case '2':
      return 'เทมเพลตเอกสารแจ้งเตือนคุณภาพก๊าซฯ 2'

    case '3':
      return 'เทมเพลตเอกสารแจ้งเตือนคุณภาพก๊าซฯ 3'

    case '309':
      return 'เทมเพลต Emergency Doc.1'

    case '4':
      return 'เทมเพลต Emergency Doc.2'

    case '7':
      return 'เทมเพลตเอกสารแจ้งเตือนคุณภาพก๊าซฯ 7'

    default:
      return 'Event Template'
  }
}

/* =========================================================
 * DATE FORMAT
 * ========================================================= */

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const day = String(date.getDate()).padStart(2, '0')

  const month = String(date.getMonth() + 1).padStart(2, '0')

  const year = date.getFullYear()

  const hour = String(date.getHours()).padStart(2, '0')

  const minute = String(date.getMinutes()).padStart(2, '0')

  const second = String(date.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hour}:${minute}:${second}`
}

/* =========================================================
 * CSV ESCAPE
 * ========================================================= */

const escapeCsv = (value: any) => {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value)

  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

/* =========================================================
 * PARSE JSON
 *
 * รองรับกรณีหลังบ้านส่ง value/detail
 * เป็น JSON String
 * ========================================================= */

const parseJsonValue = (value: any) => {
  if (value === null || value === undefined) {
    return {}
  }

  if (typeof value === 'object') {
    return value
  }

  if (typeof value !== 'string') {
    return {}
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    return {
      value
    }
  }
}

/* =========================================================
 * NORMALIZE API RESPONSE
 *
 * รองรับ response หลายแบบ เช่น:
 *
 * [
 *   {...}
 * ]
 *
 * หรือ
 *
 * {
 *   data: [
 *     {...}
 *   ]
 * }
 *
 * รวมถึงรองรับ history table เดิม:
 *
 * id
 * id_value
 * value
 * time
 * create_by_account
 * ========================================================= */

const normalizeHistoryData = (response: any, templateId: string): HistoryItem[] => {
  let rows: any[] = []

  if (Array.isArray(response)) {
    rows = response
  } else if (Array.isArray(response?.data)) {
    rows = response.data
  } else if (Array.isArray(response?.result)) {
    rows = response.result
  } else if (Array.isArray(response?.items)) {
    rows = response.items
  } else if (Array.isArray(response?.data?.data)) {
    rows = response.data.data
  }

  return rows.map((item: any, index: number) => {
    /*
     * detail
     *
     * API ใหม่:
     * item.detail
     *
     * history table เดิม:
     * item.value
     */
    const detail = parseJsonValue(item?.detail ?? item?.value ?? item?.data ?? {})

    /*
     * Edited By
     *
     * รองรับหลายชื่อ relation
     */
    const editedBy = item?.edited_by ?? item?.update_by_account ?? item?.create_by_account ?? detail?.update_by_account ?? detail?.create_by_account ?? {}

    /*
     * Event Template ID
     */
    const eventTemplateId = item?.event_template_id ?? item?.id_value ?? detail?.event_template_id ?? templateId

    /*
     * Action Date
     */
    const actionDate = item?.action_date ?? item?.time ?? item?.update_date ?? item?.create_date ?? detail?.update_date ?? detail?.create_date ?? ''

    /*
     * Action
     */
    const action = detail?.action ?? item?.action ?? item?.method ?? ''

    /*
     * Template Name
     */
    const templateName = detail?.template_name ?? item?.template_name ?? detail?.name ?? ''

    /*
     * Field
     */
    const field = detail?.field ?? item?.field ?? ''

    /*
     * Old Value
     */
    const oldValue = detail?.old_value ?? detail?.oldValue ?? item?.old_value ?? item?.oldValue ?? null

    /*
     * New Value
     */
    const newValue = detail?.new_value ?? detail?.newValue ?? item?.new_value ?? item?.newValue ?? null

    return {
      id: Number(item?.id) || index + 1,

      event_template_id: Number(eventTemplateId) || 0,

      action_date: String(actionDate || ''),

      edited_by: {
        id: Number(editedBy?.id) || 0,

        first_name: editedBy?.first_name ?? '',

        last_name: editedBy?.last_name ?? ''
      },

      detail: {
        ...detail,

        action,

        template_name: templateName,

        field,

        old_value: oldValue,

        new_value: newValue
      },

      raw: item
    }
  })
}

/* =========================================================
 * PAGE
 * ========================================================= */

const EventTemplateHistoryPage = () => {
  /* =====================================================
   * ROUTER
   * ===================================================== */

  const router = useRouter()

  const params = useParams<{
    lng: string
  }>()

  const searchParams = useSearchParams()

  const lng = params?.lng || 'en'

  /* =====================================================
   * AUTH
   * ===================================================== */

  const token = getCookieValue('v4r2d9z5m3h0c1p0x7l')

  useRestrictedPage(token)

  /* =====================================================
   * QUERY PARAM
   * ===================================================== */

  const templateId = searchParams.get('id') || ''

  const docId = searchParams.get('doc') || ''

  const templateName = searchParams.get('template') || '-'

  /* =====================================================
   * DATA
   * ===================================================== */

  const [historyData, setHistoryData] = useState<HistoryItem[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [loadError, setLoadError] = useState('')

  /* =====================================================
   * GET API INIT
   * ===================================================== */

  const getApiInit = async () => {
    if (!templateId) {
      setHistoryData([])

      return
    }

    try {
      setIsLoading(true)

      setLoadError('')

      const response: any = await getService(`/master/event-template/history/${templateId}`)

      console.log('event template history response : ', response)

      const rows = normalizeHistoryData(response, templateId)

      console.log('event template history normalize : ', rows)

      setHistoryData(rows)

      /*
       * ถ้าจำนวน page ลดลง
       * ให้กลับไปหน้าแรก
       */
      setPage(1)
    } catch (error) {
      console.error('get event template history error : ', error)

      setHistoryData([])

      setLoadError('Unable to load history data.')
    } finally {
      setIsLoading(false)
    }
  }

  /* =====================================================
   * CALL API
   * ===================================================== */

  useEffect(() => {
    if (!templateId) {
      return
    }

    getApiInit()
  }, [templateId])

  /* =====================================================
   * PAGINATION
   * ===================================================== */

  const [page, setPage] = useState<number>(1)

  const [rowsPerPage, setRowsPerPage] = useState<number>(10)

  const totalPages = Math.max(1, Math.ceil(historyData.length / rowsPerPage))

  const currentPage = Math.min(page, totalPages)

  const startIndex = (currentPage - 1) * rowsPerPage

  const endIndex = startIndex + rowsPerPage

  const paginatedData = historyData.slice(startIndex, endIndex)

  /* =====================================================
   * DETAIL
   * ===================================================== */

  const [detailOpen, setDetailOpen] = useState(false)

  const [selectedDetail, setSelectedDetail] = useState<HistoryItem | null>(null)

  const openDetail = (item: HistoryItem) => {
    const query = new URLSearchParams()

    query.set('mode', 'view')

    /*
     * event_template.id
     */
    query.set('id', String(item?.event_template_id))

    /*
     * Doc
     */
    if (docId) {
      query.set('doc', String(docId))
    }

    /*
     * Template Name
     */
    if (templateName && templateName !== '-') {
      query.set('template', templateName)
    }

    /*
     * History ID
     */
    query.set('historyId', String(item?.id))

    router.push(`/${lng}` + `/authorization` + `/dam` + `/parameters` + `/systemConfiguration` + `/eventTemplate` + `/history` + `/form` + `?${query.toString()}`)
  }

  const closeDetail = () => {
    setDetailOpen(false)

    setTimeout(() => {
      setSelectedDetail(null)
    }, 300)
  }

  /* =====================================================
   * BACK
   * ===================================================== */

  const handleBack = () => {
    router.back()
  }

  /* =====================================================
   * EXPORT CSV
   * ===================================================== */

  const handleExport = () => {
    if (historyData.length === 0) {
      return
    }

    const headers = ['Action Date', 'Edited By', 'Action', 'Field', 'Old Value', 'New Value']

    const rows = historyData.map((item) => [formatDateTime(item.action_date), `${item?.edited_by?.first_name || ''} ${item?.edited_by?.last_name || ''}`.trim(), item?.detail?.action || '', item?.detail?.field || '', item?.detail?.old_value ?? '', item?.detail?.new_value ?? ''])

    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')

    /*
     * UTF-8 BOM
     */
    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;'
    })

    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')

    link.href = url

    link.download = `event-template-history-${templateName}.csv`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  /* =====================================================
   * RENDER
   * ===================================================== */

  return (
    <div className="w-full">
      {/* ===============================================
       * BACK
       * =============================================== */}

      <div className="mb-4">
        <button
          type="button"
          onClick={handleBack}
          className="
              inline-flex
              items-center
              gap-1
              text-[14px]
              text-[#464255]
              hover:text-[#1473A1]
              transition-colors
            "
        >
          <ArrowBackIosNewOutlinedIcon
            sx={{
              fontSize: 13
            }}
          />

          <span>Back</span>
        </button>
      </div>

      {/* ===============================================
       * MAIN CARD
       * =============================================== */}

      <div
        className="
            w-full
            min-h-[520px]
            border
            border-[#DFE4EA]
            rounded-xl
            bg-white
            p-5
          "
      >
        {/* =============================================
         * HEADER
         * ============================================= */}

        <div
          className="
              flex
              flex-col
              sm:flex-row
              sm:items-end
              justify-between
              gap-4
              mb-4
            "
        >
          <div>
            <h1
              className="
                  text-[16px]
                  font-semibold
                  text-[#464255]
                  mb-1
                "
            >
              History : {templateName}
            </h1>

            <p
              className="
                  text-[13px]
                  text-[#58585A]
                "
            >
              {getDocumentDescription(docId)}
            </p>
          </div>

          {/* EXPORT */}
          
        </div>

        {/* =============================================
         * TABLE
         * ============================================= */}

        <div
          className="
              w-full
              overflow-x-auto
            "
        >
          <table
            className="
                w-full
                border-collapse
                table-fixed
              "
          >
            <thead>
              <tr
                className="
                    bg-[#147AA4]
                    text-white
                  "
              >
                <th
                  className="
                      w-[35%]
                      text-left
                      px-5
                      py-[11px]
                      text-[13px]
                      font-semibold
                      first:rounded-l-[2px]
                    "
                >
                  <div
                    className="
                        flex
                        items-center
                        justify-between
                      "
                  >
                    Action Date
                    <span
                      className="
                          text-white/50
                          text-[10px]
                        "
                    >
                      ↕
                    </span>
                  </div>
                </th>

                <th
                  className="
                      w-[45%]
                      text-left
                      px-5
                      py-[11px]
                      text-[13px]
                      font-semibold
                    "
                >
                  <div
                    className="
                        flex
                        items-center
                        justify-between
                      "
                  >
                    Edited By
                    <span
                      className="
                          text-white/50
                          text-[10px]
                        "
                    >
                      ↕
                    </span>
                  </div>
                </th>

                <th
                  className="
                      w-[20%]
                      text-center
                      px-5
                      py-[11px]
                      text-[13px]
                      font-semibold
                      last:rounded-r-[2px]
                    "
                >
                  Detail
                </th>
              </tr>
            </thead>

            <tbody>
              {/* =======================================
               * LOADING
               * ======================================= */}

              {isLoading ? (
                <tr>
                  <td
                    colSpan={3}
                    className="
                        text-center
                        text-[#9CA3AF]
                        py-12
                        text-[14px]
                      "
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="
                            w-[18px]
                            h-[18px]
                            border-2
                            border-[#1473A1]
                            border-t-transparent
                            rounded-full
                            animate-spin
                          "
                      />

                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                /* =====================================
                 * ERROR
                 * ===================================== */

                <tr>
                  <td
                    colSpan={3}
                    className="
                        text-center
                        text-red-500
                        py-12
                        text-[14px]
                      "
                  >
                    {loadError}
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="
                          border-b
                          border-[#E9ECEF]
                          hover:bg-[#FAFCFD]
                          transition-colors
                        "
                  >
                    {/* ACTION DATE */}

                    <td
                      className="
                            px-5
                            py-[12px]
                            text-[13px]
                            text-[#464255]
                          "
                    >
                      {formatDateTime(item.action_date)}
                    </td>

                    {/* EDITED BY */}

                    <td
                      className="
                            px-5
                            py-[12px]
                            text-[13px]
                            text-[#464255]
                          "
                    >
                      {item?.edited_by?.first_name || ''} {item?.edited_by?.last_name || ''}
                    </td>

                    {/* DETAIL */}

                    <td
                      className="
                            px-5
                            py-[8px]
                            text-center
                          "
                    >
                      <IconButton
                        size="small"
                        onClick={() => openDetail(item)}
                        sx={{
                          width: 26,

                          height: 26,

                          borderRadius: '4px',

                          color: '#1473A1',

                          '&:hover': {
                            backgroundColor: '#EAF6FB'
                          }
                        }}
                      >
                        <RemoveRedEyeOutlinedIcon
                          sx={{
                            fontSize: 17
                          }}
                        />
                      </IconButton>
                    </td>
                  </tr>
                ))
              ) : (
                /* =====================================
                 * EMPTY
                 * ===================================== */

                <tr>
                  <td
                    colSpan={3}
                    className="
                        text-center
                        text-[#9CA3AF]
                        py-12
                        text-[14px]
                      "
                  >
                    No history data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===============================================
       * PAGINATION
       * =============================================== */}

      <div
        className="
            mt-3
            flex
            flex-col
            sm:flex-row
            items-center
            justify-between
            gap-3
          "
      >
        {/* SHOW */}

        <div
          className="
              flex
              items-center
              gap-2
              text-[13px]
              text-[#58585A]
            "
        >
          <span>Show</span>

          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value))

              setPage(1)
            }}
            className="
                h-[34px]
                min-w-[58px]
                px-2
                bg-white
                border
                border-[#DFE4EA]
                rounded-full
                outline-none
                cursor-pointer
                text-[13px]
              "
          >
            <option value={10}>10</option>

            <option value={20}>20</option>

            <option value={50}>50</option>
          </select>
        </div>

        {/* PAGE */}

        <div
          className="
              flex
              items-center
              gap-2
            "
        >
          <IconButton
            size="small"
            disabled={currentPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            sx={{
              width: 30,

              height: 30
            }}
          >
            <KeyboardArrowLeftOutlinedIcon
              sx={{
                fontSize: 20
              }}
            />
          </IconButton>

          <button
            type="button"
            className="
                min-w-[32px]
                h-[32px]
                px-2
                rounded-[4px]
                bg-[#1473A1]
                text-white
                text-[13px]
              "
          >
            {currentPage}
          </button>

          <IconButton
            size="small"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            sx={{
              width: 30,

              height: 30
            }}
          >
            <KeyboardArrowRightOutlinedIcon
              sx={{
                fontSize: 20
              }}
            />
          </IconButton>
        </div>
      </div>

      {/* ===============================================
       * DETAIL MODAL
       *
       * ตอนนี้ไม่ได้เปิดจากปุ่มตา
       * เพราะ openDetail พาไปหน้า history/form
       *
       * เก็บไว้ได้ เผื่อใช้งานภายหลัง
       * =============================================== */}

      <ModalComponent
        open={detailOpen}
        handleClose={closeDetail}
        title="History Detail"
        description={
          <div
            className="
                w-full
                min-w-[420px]
              "
          >
            <div
              className="
                  grid
                  grid-cols-[140px_1fr]
                  gap-y-4
                  text-[14px]
                  text-left
                "
            >
              <div className="font-semibold text-[#464255]">Action Date</div>

              <div className="text-[#58585A]">{formatDateTime(selectedDetail?.action_date)}</div>

              <div className="font-semibold text-[#464255]">Edited By</div>

              <div className="text-[#58585A]">
                {selectedDetail?.edited_by?.first_name || ''} {selectedDetail?.edited_by?.last_name || ''}
              </div>

              <div className="font-semibold text-[#464255]">Action</div>

              <div className="text-[#58585A]">{selectedDetail?.detail?.action || '-'}</div>

              <div className="font-semibold text-[#464255]">Field</div>

              <div className="text-[#58585A]">{selectedDetail?.detail?.field || '-'}</div>

              <div className="font-semibold text-[#464255]">Old Value</div>

              <div
                className="
                    px-3
                    py-2
                    rounded
                    bg-[#FFF4F4]
                    text-[#D14343]
                    break-all
                  "
              >
                {selectedDetail?.detail?.old_value === null || selectedDetail?.detail?.old_value === undefined ? '-' : String(selectedDetail?.detail?.old_value)}
              </div>

              <div className="font-semibold text-[#464255]">New Value</div>

              <div
                className="
                    px-3
                    py-2
                    rounded
                    bg-[#EFFAF5]
                    text-[#168A53]
                    break-all
                  "
              >
                {selectedDetail?.detail?.new_value === null || selectedDetail?.detail?.new_value === undefined ? '-' : String(selectedDetail?.detail?.new_value)}
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}

export default EventTemplateHistoryPage
