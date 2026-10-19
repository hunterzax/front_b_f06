'use client'

import '@/app/globals.css'

import {ReactNode, useEffect, useMemo, useState} from 'react'
import {useParams, useRouter, useSearchParams} from 'next/navigation'

import FormDocument1 from '@/app/[lng]/authorization/(menu)/event/(menu)/EventOffSpecGas/form/formDocument1'
import {ArrowBackIos} from '@mui/icons-material'
import FormDocument2 from '@/app/[lng]/authorization/(menu)/event/(menu)/EventOffSpecGas/form/formDocument2'
import FormDocument3 from '@/app/[lng]/authorization/(menu)/event/(menu)/EventOffSpecGas/form/formDocument3'
import FormDocument39 from '@/app/[lng]/authorization/(menu)/event/(menu)/EmergencyDifficultDay/form/document/formDocument39'
import FormDocument41 from '@/app/[lng]/authorization/(menu)/event/(menu)/EmergencyDifficultDay/form/document/formDocument41'
import FormDocument7 from '@/app/[lng]/authorization/(menu)/event/(menu)/OFIF/form/document/formDocument7'
import {getService, patchService, postService, putService} from '@/utils/postService'
import ModalComponent from '@/components/other/ResponseModal'

type FormMode = 'create' | 'edit' | 'view'

const EventTemplateFormPage = ({history}:any) => {
  const router = useRouter()

  const searchParams = useSearchParams()

  const params = useParams<{
    lng: string
  }>()

  const [isModalSuccessOpen, setModalSuccessOpen] = useState(false)
  const handleCloseModal = () => {
    setModalSuccessOpen(false)
    handleBack()
  }
  const [modalErrorMsg, setModalErrorMsg] = useState('')
  const [isModalErrorOpen, setModalErrorOpen] = useState(false)
  const [refDoc7, setRefDoc7] = useState<any[]>([])

  const lng = params?.lng || 'en'

  const modeParam = searchParams.get('mode')

  const docId = searchParams.get('doc') || ''

  const templateId = searchParams.get('id') || '' // id สำหรับ edit

  const mode: FormMode = modeParam === 'edit' ? 'edit' : modeParam === 'create' ? 'create' : 'view'

  const eventTemplateMasterPath = `/${lng}` + `/authorization` + `/dam` + `/parameters` + `/systemConfiguration` + `/eventTemplate`

  const [dataTemplate, setDataTemplate] = useState<any>(null)

  const handleBack = () => {
    history ? router.back() : router.push(eventTemplateMasterPath)
    
  }

  const findOnce = async ({id}: any) => {
    const response = await getService(`/master/event-template/once/${templateId}`)
    console.log('response : ', response)
    setDataTemplate(response)
  }

  useEffect(() => {
    if ((mode === 'edit' || mode === 'view') && templateId) {
      findOnce({id: templateId})
    }
  }, [mode, templateId])

  const fnApiCore = async ({data, mode, event_doc_master_id, id}: any) => {
    const {template_name} = data
    if (mode === 'create') {
      const create = await postService(`/master/event-template`, {template_data: data, template_name: template_name, event_doc_master_id})
      console.log('create : ', create)

      const statusCode = create?.response?.data?.statusCode ?? create?.response?.data?.status ?? create?.status ?? create?.statusCode ?? create?.code ?? create?.response?.status
      const errorMsg = create?.response?.data?.error ?? create?.data?.error ?? create?.response?.error ?? create?.error

      if (statusCode === 400 || statusCode === 500) {
        setModalErrorMsg(errorMsg || '')
        setModalErrorOpen(true)
      } else {
        setModalSuccessOpen(true)
      }
    } else if (mode === 'edit') {
      const update = await putService(`/master/event-template/${id}`, {template_data: data, template_name: template_name, event_doc_master_id})
      console.log('update : ', update)

      const statusCode = update?.response?.data?.statusCode ?? update?.response?.data?.status ?? update?.status ?? update?.statusCode ?? update?.code ?? update?.response?.status
      const errorMsg = update?.response?.data?.error ?? update?.data?.error ?? update?.response?.error ?? update?.error

      if (statusCode === 400 || statusCode === 500) {
        setModalErrorMsg(errorMsg || '')
        setModalErrorOpen(true)
      } else {
        setModalSuccessOpen(true)
      }
    }
  }

  const BodyForm = ({children}: {children: ReactNode}) => {
    return (
      <div className="flex h-full gap-2 pt-2 pb-2 overflow-hidden">
        <div className="w-full h-full p-8 border-[#DFE4EA] border-[1px] gap-2 rounded-xl shadow-sm flex flex-col overflow-hidden relative">{children}</div>
      </div>
    )
  }

  const renderTemplateForm = () => {
    switch (docId) {
      case '1':
        return (
          <BodyForm>
            <FormDocument1
              mode={mode}
              data={[]}
              onSubmit={(data: any) => {
                fnApiCore({data, mode, event_doc_master_id: 1, id: templateId})
                console.log('data : ', data)
              }}
              modeOpenDocument={mode}
              setIsOpenDocument={() => {}}
              modeTemplate={true}
              dataTemplate={dataTemplate?.template_data || null} 
            />
          </BodyForm>
        )

      case '2':
        return (
          <BodyForm>
            <FormDocument2
              mode={mode}
              data={[]}
              onSubmit={(data: any) => {
                fnApiCore({data, mode, event_doc_master_id: 2, id: templateId})
                console.log('data : ', data)
              }}
              modeOpenDocument={mode}
              setIsOpenDocument={() => {}}
              modeTemplate={true}
              dataTemplate={dataTemplate?.template_data || null} 
            />
          </BodyForm>
        )

      case '3':
        return (
          <BodyForm>
            <FormDocument3
              mode={mode}
              data={[]}
              onSubmit={(data: any) => {
                fnApiCore({data, mode, event_doc_master_id: 3, id: templateId})
                console.log('data : ', data)
              }}
              modeOpenDocument={mode}
              setIsOpenDocument={() => {}}
              modeTemplate={true}
              dataTemplate={dataTemplate?.template_data || null} 
            />
          </BodyForm>
        )

      case '309':
        return (
          <BodyForm>
            <FormDocument39
              mode={mode}
              data={[]}
              onSubmit={(data: any) => {
                fnApiCore({data, mode, event_doc_master_id: 309, id: templateId})
                console.log('data : ', data)
              }}
              modeOpenDocument={mode}
              setIsOpenDocument={() => {}}
              modeTemplate={true}
              dataTemplate={dataTemplate?.template_data || null}
            />
          </BodyForm>
        )

      case '4':
        return (
          <BodyForm>
            <FormDocument41
              mode={mode}
              data={[]}
              onSubmit={(data: any) => {
                fnApiCore({data, mode, event_doc_master_id: 4, id: templateId})
                console.log('data : ', data)
              }}
              modeOpenDocument={mode}
              setIsOpenDocument={() => {}}
              modeTemplate={true}
              dataTemplate={dataTemplate?.template_data || null}
            />
          </BodyForm>
        )

      case '7':
        return (
          <BodyForm>
            <FormDocument7
              mode={mode}
              data={[]}
              onSubmit={(data: any) => {
                fnApiCore({data, mode, event_doc_master_id: 7, id: templateId})
                console.log('data : ', data)
              }}
              modeOpenDocument={mode}
              setIsOpenDocument={() => {}}
              modeTemplate={true}
              refDoc7={refDoc7}
              //   dataTemplate={{
              //     template_name: 'D7',
              //     longdo_dict: '1',
              //     doc_7_input_date_time_of_the_incident: '2',
              //     doc_7_input_detail_incident: '3',
              //     doc_7_input_time_event_start_date: '2026-10-22',
              //     doc_7_input_time_event_start_time: '15:05',
              //     doc_7_input_note: '4',
              //     event_doc_ofo_type_id: 2,
              //     event_doc_ofo_gas_tranmiss_id: 4,
              //     event_doc_ofo_gas_tranmiss_other: 'd'
              //   }} // data ตอน edit mock
              dataTemplate={dataTemplate?.template_data || null} // data ตอน edit // รอทำ api
            />
          </BodyForm>
        )

      default:
        return null
    }
  }

  useEffect(() => {
    if(docId === '7'){
      getService(`/master/event/ofo/doc7/ref-master`).then(res_ref_doc7 => {
        if(Array.isArray(res_ref_doc7)){
          setRefDoc7(res_ref_doc7)
        }
      });
    }
  }, [docId])
  

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <div className="text-[#464255] px-4 text-[14px] font-bold pt-4">
          <div className="cursor-pointer" onClick={handleBack}>
            <ArrowBackIos style={{fontSize: '14px'}} /> {` Back`}
          </div>
        </div>
      </div>
      {renderTemplateForm()}
      <ModalComponent open={isModalSuccessOpen} handleClose={handleCloseModal} title="Success" description={`Event Template has been ${mode === 'create' ? 'added' : 'saved'}.`} />

      <ModalComponent
        open={isModalErrorOpen}
        handleClose={() => {
          setModalErrorOpen(false)
        }}
        title="Failed"
        description={
          <div>
            <div className="text-center">{`${modalErrorMsg}`}</div>
          </div>
        }
        stat="error"
      />
    </div>
  )
}

export default EventTemplateFormPage
