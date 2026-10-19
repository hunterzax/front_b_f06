'use client'

import React, {useEffect} from 'react'
import {Controller, SubmitHandler, useForm} from 'react-hook-form'
import {Dialog, DialogBackdrop, DialogPanel} from '@headlessui/react'
import {MenuItem, Select} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

type DocOption = {
  value: string
  label: string
}

export type EventTemplateSelectDocForm = {
  event_doc_master_id: string
}

type ModalActionProps = {
  open: boolean
  docMaster: DocOption[]
  onClose: () => void
  onSubmit: (data: EventTemplateSelectDocForm) => void | Promise<void>
}

const ModalAction: React.FC<ModalActionProps> = ({open, docMaster, onClose, onSubmit}) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting}
  } = useForm<EventTemplateSelectDocForm>({
    defaultValues: {
      event_doc_master_id: ''
    }
  })

  /*
   * ทุกครั้งที่เปิด Modal ใหม่
   * ให้ clear Doc. ที่เคยเลือกไว้
   */
  useEffect(() => {
    if (open) {
      reset({
        event_doc_master_id: ''
      })
    }
  }, [open, reset])

  /*
   * Close / Cancel
   */
  const handleClose = () => {
    reset({
      event_doc_master_id: ''
    })

    onClose()
  }

  /*
   * Add
   */
  const handleAdd: SubmitHandler<EventTemplateSelectDocForm> = async (data) => {
    await onSubmit(data)
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      {/* BACKDROP */}
      <DialogBackdrop
        transition
        className="
          fixed
          inset-0
          bg-black/45
          transition-opacity

          data-[closed]:opacity-0

          data-[enter]:duration-300
          data-[enter]:ease-out

          data-[leave]:duration-200
          data-[leave]:ease-in
        "
      />

      {/* WRAPPER */}
      <div
        className="
          fixed
          inset-0
          z-10
          w-screen
          overflow-y-auto
        "
      >
        <div
          className="
            flex
            min-h-full
            items-center
            justify-center
            p-4
          "
        >
          <DialogPanel
            transition
            className="
              w-full
              max-w-[600px]
              transform
              overflow-hidden
              rounded-[20px]
              bg-white
              shadow-xl
              transition-all

              data-[closed]:translate-y-4
              data-[closed]:opacity-0

              data-[closed]:sm:translate-y-0
              data-[closed]:sm:scale-95

              data-[enter]:duration-300
              data-[enter]:ease-out

              data-[leave]:duration-200
              data-[leave]:ease-in
            "
          >
            <form onSubmit={handleSubmit(handleAdd)} className="p-8">
              {/* TITLE */}
              <h2
                className="
                  mb-8
                  text-xl
                  font-bold
                  text-[#00ADEF]
                "
              >
                New Event Template
              </h2>

              {/* DOC */}
              <div>
                <label
                  htmlFor="event_doc_master_id"
                  className="
                    mb-2
                    block
                    text-sm
                    font-light
                    text-[#464255]
                  "
                >
                  <span className="text-red-500">*</span> Doc.
                </label>

                <Controller
                  name="event_doc_master_id"
                  control={control}
                  rules={{
                    required: 'Select Doc.'
                  }}
                  render={({field}) => (
                    <Select
                      {...field}
                      id="event_doc_master_id"
                      fullWidth
                      displayEmpty
                      value={field.value || ''}
                      IconComponent={(props) => <ExpandMoreIcon {...props} fontSize="medium" />}
                      onChange={(e) => {
                        field.onChange(String(e.target.value))
                      }}
                      renderValue={(value) => {
                        if (!value) {
                          return (
                            <span
                              className="
                                text-[14px]
                                text-[#9CA3AF]
                                px-3
                              "
                            >
                              Select Doc.
                            </span>
                          )
                        }

                        const selectedDoc = docMaster.find((item) => String(item.value) === String(value))

                        return (
                          <span
                            className="
                              text-[14px]
                              text-[#464255]
                              px-3
                            "
                          >
                            {selectedDoc?.label || ''}
                          </span>
                        )
                      }}
                      sx={{
                        height: '44px',

                        borderRadius: '8px',

                        fontSize: '14px',

                        backgroundColor: '#FFFFFF',

                        '.MuiOutlinedInput-notchedOutline': {
                          borderColor: errors.event_doc_master_id ? '#FF0000' : '#DFE4EA'
                        },

                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: errors.event_doc_master_id ? '#FF0000' : '#BFC5CE'
                        },

                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: errors.event_doc_master_id ? '#FF0000' : '#00ADEF'
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 48 * 5 + 8
                          }
                        }
                      }}
                    >
                      {docMaster.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />

                {errors.event_doc_master_id && (
                  <p
                    className="
                      mt-1
                      text-sm
                      text-red-500
                    "
                  >
                    {errors.event_doc_master_id.message}
                  </p>
                )}
              </div>

              {/* BUTTON */}
              <div
                className="
                  mt-8
                  flex
                  justify-end
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="
                    h-[44px]
                    w-[167px]
                    rounded-lg
                    bg-[#F3F4F6]
                    font-light
                    text-[#464255]
                    transition

                    hover:bg-[#E5E7EB]

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    h-[44px]
                    w-[167px]
                    rounded-lg
                    bg-[#00ADEF]
                    font-semibold
                    text-white
                    transition

                    hover:bg-[#0099D8]

                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Add
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

export default ModalAction
