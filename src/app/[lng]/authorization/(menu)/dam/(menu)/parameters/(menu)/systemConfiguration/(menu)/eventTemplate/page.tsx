'use client'

import '@/app/globals.css'

import {useEffect, useMemo, useRef, useState} from 'react'
import {useParams, useRouter} from 'next/navigation'

import ModalComponent from '@/components/other/ResponseModal'

import {deleteService, getService, patchService} from '@/utils/postService'

import ModalAction from './form/modalAction'

import {exportToExcel, findRoleConfigByMenuName, formatDate, formatDateTimeSec, generateUserPermission} from '@/utils/generalFormatter'

import BtnAddNew from '@/components/other/btnAddNew'
import BtnSearch from '@/components/other/btnSearch'
import BtnReset from '@/components/other/btnReset'

import {InputSearch} from '@/components/other/SearchForm'

import ModalViewEmailGroup from './form/modalView'
import ColumnVisibilityPopover from '@/components/other/popOverShowHideCol'
import BtnExport from '@/components/other/btnExport'

import getCookieValue from '@/utils/getCookieValue'
import useRestrictedPage from '@/utils/checkRestrictedPage'

import {decryptData} from '@/utils/encryptionData'

import AppTable from '@/components/table/AppTable'

import {Popover} from '@mui/material'

import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined'
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'

import {ColumnDef, VisibilityState} from '@tanstack/react-table'

import BtnActionTable from '@/components/other/btnActionInTable'

import getUserValue from '@/utils/getuserValue'
import BtnGeneral from '@/components/other/btnGeneral'

/* =========================================================
 * DOC MASTER
 * ========================================================= */

const docMaster = [
  {
    value: '1',
    label: 'Doc.1'
  },
  {
    value: '2',
    label: 'Doc.2'
  },
  {
    value: '3',
    label: 'Doc.3'
  },
  {
    value: '309',
    label: 'Emergency Doc.1'
  },
  {
    value: '4',
    label: 'Emergency Doc.2'
  },
  {
    value: '7',
    label: 'Doc.7'
  }
]

/* =========================================================
 * PAGE
 * ========================================================= */

const ClientPage = () => {
  /* =======================================================
   * ROUTER
   * ======================================================= */

  const router = useRouter()

  const params = useParams<{
    lng: string
  }>()

  const lng = params?.lng || 'en'

  /* =======================================================
   * CHECK AUTH
   * ======================================================= */

  const userDT: any = getUserValue()

  const token = getCookieValue('v4r2d9z5m3h0c1p0x7l')

  useRestrictedPage(token)

  /* =======================================================
   * PERMISSION
   * ======================================================= */

  const [userPermission, setUserPermission] = useState<any>()

  const getPermission = () => {
    try {
      let user_permission: any = getCookieValue('k3a9r2b6m7t0x5w1s8j')

      user_permission = user_permission ? decryptData(user_permission) : null

      user_permission = user_permission ? JSON.parse(user_permission) : null

      const permission = findRoleConfigByMenuName('Email Group For Event', userDT)

      if (permission) {
        setUserPermission(permission)
      } else if (user_permission?.role_config) {
        const updatedUserPermission = generateUserPermission(user_permission)

        setUserPermission(updatedUserPermission)
      }
    } catch (error) {
      console.error('getPermission error:', error)
    }
  }

  /* =======================================================
   * TABLE DATA
   * ======================================================= */

  const [dataTable, setDataTable] = useState<any[]>([])

  const [filteredDataTable, setFilteredDataTable] = useState<any[]>([])

  const [dataExport, setDataExport] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState<boolean>(true)

  /* =======================================================
   * API PROCESSING STATE
   * ======================================================= */

  const [processingActiveId, setProcessingActiveId] = useState<number | null>(null)

  const [processingDeleteId, setProcessingDeleteId] = useState<number | null>(null)

  /* =======================================================
   * MODAL MESSAGE
   * ======================================================= */

  const [isModalSuccessOpen, setModalSuccessOpen] = useState(false)

  const [modalSuccessMsg, setModalSuccessMsg] = useState('')

  const [modalErrorMsg, setModalErrorMsg] = useState('')

  const [isModalErrorOpen, setModalErrorOpen] = useState(false)

  /* =======================================================
   * MODAL HELPERS
   * ======================================================= */

  const showSuccess = (message: string) => {
    setModalSuccessMsg(message)

    setModalSuccessOpen(true)
  }

  const showError = (message: string) => {
    setModalErrorMsg(message)

    setModalErrorOpen(true)
  }

  const getErrorMessage = (error: any, fallback: string): string => {
    const message = error?.response?.data?.message || error?.message || fallback

    if (Array.isArray(message)) {
      return message.join(', ')
    }

    return String(message)
  }

  /* =======================================================
   * CHECK API RESPONSE
   * ======================================================= */

  const assertApiSuccess = (response: any) => {
    if (response === false) {
      throw new Error('API request failed')
    }

    if (response?.success === false) {
      throw new Error(response?.message || 'API request failed')
    }

    if (response?.status === false) {
      throw new Error(response?.message || 'API request failed')
    }

    if (typeof response?.status === 'string' && ['error', 'failed', 'fail'].includes(response.status.toLowerCase())) {
      throw new Error(response?.message || 'API request failed')
    }

    if (typeof response?.status === 'number' && response.status >= 400) {
      throw new Error(response?.message || 'API request failed')
    }

    if (typeof response?.code === 'number' && response.code >= 400) {
      throw new Error(response?.message || 'API request failed')
    }
  }

  /* =======================================================
   * GET API EVENT TEMPLATE
   *
   * GET /master/event-template
   * ======================================================= */

  const getApiInit = async () => {
  try {
    setIsLoading(false)

    const response = await getService(`/master/event-template`)

    console.log('response : ', response)

    setDataTable(response || [])

    setFilteredDataTable(response || [])

    setDataExport(response || [])
  } catch (error: any) {
    console.error('GET Event Template error:', error)

    showError(getErrorMessage(error, 'Unable to load Event Templates.'))
  } finally {
    setIsLoading(true)
  }
}

  /* =======================================================
   * INITIAL
   * ======================================================= */

  useEffect(() => {
    getApiInit()

    getPermission()
  }, [])

  /* =======================================================
   * SEARCH
   * ======================================================= */

  const [srchDoc, setSrchDoc] = useState<any>([])

  const [srchTemplateName, setSrchTemplateName] = useState('')

  const handleFieldSearch = () => {
    const result = dataTable.filter((item: any) => {
      const itemDocId = String(item?.event_doc_master_id || '')

      const itemTemplateName = String(item?.template_name || '')

      const matchDoc = srchDoc?.length > 0 ? srchDoc.includes(itemDocId) : true

      const matchTemplateName = srchTemplateName !== '' ? itemTemplateName.toLowerCase().includes(srchTemplateName.toLowerCase()) : true

      return matchDoc && matchTemplateName
    })

    setFilteredDataTable(result)
  }

  /* =======================================================
   * RESET
   * ======================================================= */

  const handleReset = () => {
    setSrchDoc([])

    setSrchTemplateName('')

    setFilteredDataTable(dataTable)
  }

  /* =======================================================
   * NEW MODAL
   * ======================================================= */

  const [formOpen, setFormOpen] = useState(false)

  const openCreateForm = () => {
    setFormOpen(true)
  }

  /* =======================================================
   * FORM URL
   * ======================================================= */

  const eventTemplateFormPath = `/${lng}` + `/authorization` + `/dam` + `/parameters` + `/systemConfiguration` + `/eventTemplate` + `/form`

  const eventTemplateHistoryPath = `/${lng}` + `/authorization` + `/dam` + `/parameters` + `/systemConfiguration` + `/eventTemplate` + `/history`

  /* =======================================================
   * CREATE
   * ======================================================= */

  const handleFormSubmit = async (data: {event_doc_master_id: string}) => {
    const docId = data?.event_doc_master_id

    if (!docId) {
      return
    }

    setFormOpen(false)

    const query = new URLSearchParams({
      mode: 'create',
      doc: String(docId)
    })

    router.push(`${eventTemplateFormPath}?${query.toString()}`)
  }

  /* =======================================================
   * GET DOC ID
   * ======================================================= */

  const getDocIdFromRow = (row: any) => {
    return String(row?.event_doc_master_id ?? row?.event_doc_master?.id ?? '')
  }

  /* =======================================================
   * VIEW / EDIT
   * ======================================================= */

  const openEditViewForm = (id: any, mode: string) => {
    const selectedRow = dataTable.find((item: any) => String(item?.id) === String(id))

    if (!selectedRow) {
      console.error('Event Template not found:', id)

      return
    }

    const docId = getDocIdFromRow(selectedRow)

    const templateName = selectedRow?.template_name || ''

    const query = new URLSearchParams()

    query.set('mode', mode)

    query.set('id', String(selectedRow?.id))

    if (docId) {
      query.set('doc', String(docId))
    }

    if (templateName) {
      query.set('template', templateName)
    }

    setOpenPopoverId(null)

    setAnchorPopover(null)

    router.push(`${eventTemplateFormPath}?${query.toString()}`)
  }

  /* =======================================================
   * ACTIVE TOGGLE
   *
   *
   * BODY:
   * {
   *   active: true | false
   * }
   * ======================================================= */

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    if (processingActiveId !== null) {
      return
    }

    const nextActive = !currentActive

    try {
      setProcessingActiveId(id)

      /* ===================================
       * API PATCH
       * =================================== */

      const url = `/master/event-template/${id}`

      const payload = {
        active: nextActive
      }

      console.log('PATCH Event Template URL:', url)

      console.log('PATCH Event Template Payload:', payload)

      const response = await patchService(url, payload)

      console.log('PATCH Event Template Response:', response)

      assertApiSuccess(response)

      /* ===================================
       * UPDATE MAIN TABLE
       * =================================== */

      setDataTable((prev) =>
        prev.map((item: any) =>
          String(item?.id) === String(id)
            ? {
                ...item,
                active: nextActive
              }
            : item
        )
      )

      /* ===================================
       * UPDATE FILTERED TABLE
       * =================================== */

      setFilteredDataTable((prev) =>
        prev.map((item: any) =>
          String(item?.id) === String(id)
            ? {
                ...item,
                active: nextActive
              }
            : item
        )
      )

      /* ===================================
       * UPDATE EXPORT DATA
       * =================================== */

      setDataExport((prev) =>
        prev.map((item: any) =>
          String(item?.id) === String(id)
            ? {
                ...item,
                active: nextActive
              }
            : item
        )
      )

      /* ===================================
       * SUCCESS
       * =================================== */

      showSuccess(`Event Template has been ${nextActive ? 'activated' : 'deactivated'} successfully.`)
    } catch (error: any) {
      console.error('PATCH Event Template error:', error)

      showError(getErrorMessage(error, 'Unable to update Event Template status.'))
    } finally {
      setProcessingActiveId(null)
    }
  }

  /* =======================================================
   * DELETE
   *
   * ======================================================= */

  const handleDeleteForm = async (id: number) => {
    if (processingDeleteId !== null) {
      return
    }

    try {
      setProcessingDeleteId(id)

      /* ===================================
       * CLOSE POPOVER
       * =================================== */

      setOpenPopoverId(null)

      setAnchorPopover(null)

      /* ===================================
       * API DELETE
       * =================================== */

    
      const url = `/master/event-template/${id}`

      console.log('DELETE Event Template URL:', url)

      const response = await deleteService(url)

      console.log('DELETE Event Template Response:', response)

      assertApiSuccess(response)

      /* ===================================
       * DELETE MAIN TABLE
       * =================================== */

      setDataTable((prev) => prev.filter((item: any) => String(item?.id) !== String(id)))

      /* ===================================
       * DELETE FILTERED TABLE
       * =================================== */

      setFilteredDataTable((prev) => prev.filter((item: any) => String(item?.id) !== String(id)))

      /* ===================================
       * DELETE EXPORT DATA
       * =================================== */

      setDataExport((prev) => prev.filter((item: any) => String(item?.id) !== String(id)))

      /* ===================================
       * SUCCESS
       * =================================== */

      showSuccess('Event Template has been deleted successfully.')
    } catch (error: any) {
      console.error('DELETE Event Template error:', error)

      showError(getErrorMessage(error, 'Unable to delete Event Template.'))
    } finally {
      setProcessingDeleteId(null)
    }
  }

  /* =======================================================
   * VIEW
   * ======================================================= */

  const [openView, setOpenView] = useState(false)

  const [dataView, setDataView] = useState<any>()

  /* =======================================================
   * HISTORY
   * ======================================================= */

  const openHistoryPage = (id: any) => {
    const selectedRow = dataTable.find((item: any) => String(item?.id) === String(id))

    if (!selectedRow) {
      console.error('Event Template not found:', id)

      return
    }

    const docId = getDocIdFromRow(selectedRow)

    const query = new URLSearchParams({
      id: String(selectedRow?.id),
      doc: String(docId),
      template: selectedRow?.template_name || ''
    })

    setOpenPopoverId(null)

    setAnchorPopover(null)

    router.push(`${eventTemplateHistoryPath}?${query.toString()}`)
  }

  /* =======================================================
   * COLUMNS SHOW/HIDE
   * ======================================================= */

  const initialColumns: any[] = [
    {
      key: 'active',
      label: 'Active',
      visible: true
    },
    {
      key: 'doc',
      label: 'Doc.',
      visible: true
    },
    {
      key: 'template_name',
      label: 'Template Name',
      visible: true
    },
    {
      key: 'create_by',
      label: 'Created by',
      visible: true
    },
    {
      key: 'update_by',
      label: 'Updated by',
      visible: true
    },
    {
      key: 'action',
      label: 'Action',
      visible: true
    }
  ]

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  const [columnVisibility, setColumnVisibility] = useState<any>(Object.fromEntries(initialColumns.map((column: any) => [column.key, column.visible])))

  const handleColumnToggle = (columnKey: string | VisibilityState) => {
    if (typeof columnKey === 'string') {
      setColumnVisibility((prev: any) => ({
        ...prev,
        [columnKey]: !prev[columnKey]
      }))
    } else if (typeof columnKey === 'object' && columnKey !== null) {
      setColumnVisibility((prev: any) => ({
        ...prev,
        ...columnKey
      }))
    }
  }

  /* =======================================================
   * ACTION POPOVER
   * ======================================================= */

  const [openPopoverId, setOpenPopoverId] = useState<any>(null)

  const [anchorPopover, setAnchorPopover] = useState<null | HTMLElement>(null)

  const popoverRef = useRef<HTMLDivElement>(null)

  const togglePopover = (id: any, anchor: any) => {
    if (openPopoverId === id) {
      setOpenPopoverId(null)

      setAnchorPopover(null)

      return
    }

    setOpenPopoverId(id)

    if (anchor) {
      setAnchorPopover(anchor)
    } else {
      setAnchorPopover(null)
    }
  }

  /* =======================================================
   * PERMISSION RENDER
   * ======================================================= */

  const renderPermission: any = () => {
    let permission: any = undefined

    try {
      permission = findRoleConfigByMenuName('Email Group For Event', userDT)
    } catch (error) {
      console.error('renderPermission error:', error)
    }

    return permission || userPermission
  }

  /* =======================================================
   * CLICK OUTSIDE
   * ======================================================= */

  const handleClickOutside = (event: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
      setOpenPopoverId(null)

      setAnchorPopover(null)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  /* =======================================================
   * ACTION MENU
   * ======================================================= */

  const toggleMenu = (mode: 'view' | 'edit' | 'history' | 'delete', id: any) => {
    switch (mode) {
      case 'view':
        openEditViewForm(id, 'view')

        break

      case 'edit':
        openEditViewForm(id, 'edit')

        break

      case 'history':
        openHistoryPage(id)

        break

      case 'delete':
        void handleDeleteForm(id)

        break
    }
  }

  /* =======================================================
   * TABLE COLUMNS
   * ======================================================= */

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      /* ===================================
       * ACTIVE
       * =================================== */

      {
        accessorKey: 'active',

        header: 'Active',

        align: 'center',

        enableSorting: false,

        size: 100,

        accessorFn: (row: any) => row?.active ?? false,

        cell: (info) => {
          const row: any = info?.row?.original

          if (!row) {
            return null
          }

          const isProcessing = processingActiveId !== null

          return (
            <div className="flex items-center justify-center">
              <label
                className={`
                  relative
                  inline-block
                  w-11
                  h-6
                  ${isProcessing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                `}
              >
                <input
                  type="checkbox"
                  checked={Boolean(row?.active)}
                  disabled={isProcessing}
                  className="sr-only peer"
                  onChange={() => {
                    void handleToggleActive(row?.id, Boolean(row?.active))
                  }}
                />

                <span
                  className="
                    slider
                    absolute
                    cursor-pointer
                    top-0
                    left-0
                    right-0
                    bottom-0
                    bg-[#828282]
                    transition
                    duration-400
                    rounded-full
                    peer-checked:bg-[#1473A1]
                  "
                />

                <span
                  className="
                    dot
                    absolute
                    h-5
                    w-5
                    left-0.5
                    bottom-0.5
                    bg-white
                    transition
                    duration-400
                    rounded-full
                    peer-checked:translate-x-full
                  "
                />
              </label>
            </div>
          )
        }
      },

      /* ===================================
       * DOC
       * =================================== */

      {
        accessorKey: 'doc',

        header: 'Doc.',

        enableSorting: true,

        accessorFn: (row: any) => {
          const docId = getDocIdFromRow(row)

          const doc = docMaster.find((item) => String(item.value) === String(docId))

          return doc?.label || ''
        },

        cell: (info) => {
          const row: any = info?.row?.original

          if (!row) {
            return null
          }

          const docId = getDocIdFromRow(row)

          const doc = docMaster.find((item) => String(item.value) === String(docId))

          return <div>{doc?.label || '-'}</div>
        },

        width: 180
      },

      /* ===================================
       * TEMPLATE NAME
       * =================================== */

      {
        accessorKey: 'template_name',

        header: 'Template Name',

        enableSorting: true,

        accessorFn: (row: any) => row?.template_name || '',

        cell: (info) => {
          const row: any = info?.row?.original

          if (!row) {
            return null
          }

          return <div>{row?.template_name || '-'}</div>
        },

        width: 400
      },

      /* ===================================
       * CREATED BY
       * =================================== */

      {
        accessorKey: 'create_by',

        header: 'Created by',

        width: 180,

        enableSorting: true,

        accessorFn: (row: any) => `${row?.create_by_account?.first_name || ''} ${row?.create_by_account?.last_name || ''} ${row?.create_date ? formatDate(row.create_date) : ''}`.trim(),

        cell: (info) => {
          const row: any = info?.row?.original

          if (!row) {
            return null
          }

          return (
            <div>
              <span className="text-[#464255]">
                {row?.create_by_account?.first_name ?? ''} {row?.create_by_account?.last_name ?? ''}
              </span>

              <div className="text-gray-500 text-xs">{row?.create_date ? formatDateTimeSec(row.create_date) : ''}</div>
            </div>
          )
        }
      },

      /* ===================================
       * UPDATED BY
       * =================================== */

      {
        accessorKey: 'update_by',

        header: 'Updated by',

        width: 180,

        enableSorting: true,

        accessorFn: (row: any) => `${row?.update_by_account?.first_name || ''} ${row?.update_by_account?.last_name || ''} ${row?.update_date ? formatDateTimeSec(row.update_date) : ''}`.trim(),

        cell: (info) => {
          const row: any = info?.row?.original

          if (!row) {
            return null
          }

          return (
            <div>
              <span className="text-[#464255]">
                {row?.update_by_account?.first_name ?? ''} {row?.update_by_account?.last_name ?? ''}
              </span>

              <div className="text-gray-500 text-xs">{row?.update_date ? formatDateTimeSec(row.update_date) : ''}</div>
            </div>
          )
        }
      },

      /* ===================================
       * ACTION
       * =================================== */

      {
        accessorKey: 'action',

        id: 'action',

        header: 'Action',

        align: 'center',

        enableSorting: false,

        size: 100,

        cell: (info) => {
          const row: any = info?.row?.original

          if (!row) {
            return null
          }

          const permission: any = renderPermission()

          return <BtnActionTable togglePopover={togglePopover} row_id={row?.id} disable={!permission?.f_view} />
        }
      }
    ],

    [userPermission, dataTable, processingActiveId]
  )

  /* =======================================================
   * RENDER
   * ======================================================= */

  return (
    <div className="space-y-2">
      {/* ================================================
       * SEARCH
       * ================================================ */}

      <div
        className="
          border-[#DFE4EA]
          border-[1px]
          p-4
          rounded-xl
          flex
          flex-col
          sm:flex-row
          gap-2
        "
      >
        <aside
          className="
            flex
            flex-wrap
            sm:flex-row
            gap-2
            w-full
          "
        >
          <InputSearch id="searchDoc" label="Doc." value={srchDoc} type="select-multi-checkbox" onChange={(e) => setSrchDoc(e?.target?.value)} placeholder="Select Doc." options={docMaster} />

          <InputSearch id="searchTemplateName" label="Template Name" value={srchTemplateName} onChange={(e) => setSrchTemplateName(e.target.value)} placeholder="Search Template Name" />

          <BtnSearch handleFieldSearch={handleFieldSearch} />

          <BtnReset handleReset={handleReset} />
        </aside>

        {/* NEW */}

        <aside
          className="
            mt-auto
            ml-1
            w-full
            sm:w-auto
          "
        >
          <div
            className="
              flex
              flex-wrap
              gap-2
              justify-end
            "
          >
            <BtnAddNew openCreateForm={openCreateForm} textRender="New" can_create={userPermission ? userPermission?.f_create : false} />
          </div>
        </aside>
      </div>

      {/* ================================================
       * TABLE
       * ================================================ */}

      <AppTable
        data={filteredDataTable}
        columns={columns}
        isLoading={isLoading}
        exportBtn={ 
            <BtnGeneral
                bgcolor={"#24AB6A"}
                modeIcon={'export'}
                textRender={"Export"}
                generalFunc={() => exportToExcel(filteredDataTable, 'event_template', columnVisibility)}
                can_export={userPermission ? userPermission?.f_export : false}
            /> // <BtnExport textRender="Export" data={dataExport} path="dam/event-template" can_export={userPermission ? userPermission?.f_export : false} columnVisibility={columnVisibility} initialColumns={initialColumns} />
    }
        initialColumns={Object.fromEntries((initialColumns || []).map((column: any) => [column?.key, column?.visible]))}
        onColumnVisibilityChange={(columnKey: any) => handleColumnToggle(columnKey)}
        onFilteredDataChange={(filteredData: any) => {
          const newData = filteredData || []

          if (JSON.stringify(dataExport) !== JSON.stringify(newData)) {
            setDataExport(newData)
          }
        }}
      />

      {/* ================================================
       * NEW MODAL
       * ================================================ */}

      <ModalAction
        open={formOpen}
        docMaster={docMaster}
        onClose={() => {
          setFormOpen(false)
        }}
        onSubmit={handleFormSubmit}
      />

      {/* ================================================
       * SUCCESS MODAL
       * ================================================ */}

      <ModalComponent
        open={isModalSuccessOpen}
        handleClose={() => {
          setModalSuccessOpen(false)
        }}
        title="Success"
        description={modalSuccessMsg}
      />

      {/* ================================================
       * VIEW MODAL
       * ================================================ */}

      <ModalViewEmailGroup
        data={dataView}
        open={openView}
        onClose={() => {
          setOpenView(false)
        }}
      />

      {/* ================================================
       * ERROR MODAL
       * ================================================ */}

      <ModalComponent
        open={isModalErrorOpen}
        handleClose={() => {
          setModalErrorOpen(false)
        }}
        title="Failed"
        description={
          <div>
            <div className="text-center">{modalErrorMsg}</div>
          </div>
        }
        stat="error"
      />

      {/* ================================================
       * COLUMN SHOW/HIDE
       * ================================================ */}

      <ColumnVisibilityPopover open={open} anchorEl={anchorEl} setAnchorEl={setAnchorEl} columnVisibility={columnVisibility} handleColumnToggle={handleColumnToggle} initialColumns={initialColumns} />

      {/* ================================================
       * ACTION POPOVER
       * ================================================ */}

      <Popover
        id="action-menu-popover"
        open={!!anchorPopover}
        anchorEl={anchorPopover}
        onClose={() => {
          setOpenPopoverId(null)

          setAnchorPopover(null)
        }}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right'
        }}
        sx={{
          zIndex: 1300,

          '& .MuiPaper-root': {
            borderRadius: '16px',

            overflow: 'hidden',

            boxShadow: '0 8px 24px rgba(0,0,0,.14)',

            transform: 'translateX(-8px)'
          }
        }}
        className="z-50"
      >
        <div
          ref={popoverRef}
          className="
            w-50
            bg-white
            border
            border-gray-300
            rounded-lg
            shadow-lg
            z-50
          "
        >
          <ul className="py-2">
            {/* ====================================
             * VIEW
             * ==================================== */}

            {userPermission?.f_view && (
              <li
                className="
                  px-4
                  py-2
                  font-bold
                  text-sm
                  text-[#58585A]
                  hover:bg-gray-100
                  cursor-pointer
                  flex
                  items-center
                "
                onClick={() => toggleMenu('view', openPopoverId)}
              >
                <RemoveRedEyeOutlinedIcon
                  sx={{
                    fontSize: 20,
                    marginRight: 2,
                    color: '#58585A'
                  }}
                />
                View
              </li>
            )}

            {/* ====================================
             * EDIT
             * ==================================== */}

            {userPermission?.f_edit && (
              <li
                className="
                  px-4
                  py-2
                  font-bold
                  text-sm
                  text-[#58585A]
                  hover:bg-gray-100
                  cursor-pointer
                  flex
                  items-center
                "
                onClick={() => toggleMenu('edit', openPopoverId)}
              >
                <EditOutlinedIcon
                  sx={{
                    fontSize: 20,
                    marginRight: 2,
                    color: '#58585A'
                  }}
                />
                Edit
              </li>
            )}

            {/* ====================================
             * HISTORY
             * ==================================== */}

            {userPermission?.f_view && (
              <li
                className="
                  px-4
                  py-2
                  font-bold
                  text-sm
                  text-[#58585A]
                  hover:bg-gray-100
                  cursor-pointer
                  flex
                  items-center
                "
                onClick={() => toggleMenu('history', openPopoverId)}
              >
                <RestoreOutlinedIcon
                  sx={{
                    fontSize: 20,
                    marginRight: 2,
                    color: '#58585A'
                  }}
                />
                History
              </li>
            )}

            {/* ====================================
             * DELETE
             * ==================================== */}

            {userPermission?.f_edit && (
              <li
                className={`
                  px-4
                  py-2
                  font-bold
                  text-sm
                  text-[#FF4D4F]
                  hover:bg-red-50
                  flex
                  items-center
                  ${processingDeleteId !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => {
                  if (processingDeleteId !== null) {
                    return
                  }

                  toggleMenu('delete', openPopoverId)
                }}
              >
                <DeleteOutlineOutlinedIcon
                  sx={{
                    fontSize: 20,
                    marginRight: 2,
                    color: '#FF4D4F'
                  }}
                />
                Delete
              </li>
            )}
          </ul>
        </div>
      </Popover>
    </div>
  )
}

export default ClientPage
