import {TextField} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import {UseFormRegisterReturn} from 'react-hook-form'
import {CustomTooltip} from '@/components/other/customToolTip'

type FlowRateAdjustmentTemplateInputProps = {
  register: UseFormRegisterReturn
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  maxLength?: number
}

const textFieldSx = {
  '.MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '14px',
    color: '#464255 !important'
  },
  '.MuiOutlinedInput-notchedOutline': {
    borderColor: '#DFE4EA'
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#DFE4EA !important'
  },
  '&.Mui-focused .MuiOutlinedI nput-notchedOutline': {
    borderColor: '#00ADEF'
  },
  '&.MuiInputBase-input::placeholder': {
    color: '#9CA3AF',
    fontSize: '14px'
  },
  '& .Mui-disabled': {
    color: '#464255 !important'
  },
  '& .MuiOutlinedInput-input::placeholder': {
    fontSize: '14px'
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#00ADEF !important',
    borderWidth: '1px'
  }
}

const FlowRateAdjustmentTemplateInput = ({register, value, onChange, disabled = false, maxLength = 255}: FlowRateAdjustmentTemplateInputProps) => {
  const inputPropsTextField = {
    style: {
      color: disabled ? '#464255' : 'inherit'
    },
    disableUnderline: true
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between pt-4">
        <div className="py-2 text-[14px] font-semibold text-[#58585A]">การสั่งการ (สำหรับการ Generate Emergency Doc.2)</div>
      </div>

      <div className="gap-2 w-full flex items-center pt-4">
        <div className="w-full ">
          <label className={'flex items-center gap-2 mb-2 text-[14px] text-[#464255] font-semibold'}>
            ปริมาณ:
            <CustomTooltip
              title={
                <div>
                  <p>
                    <strong>รูปแบบการกรอกข้อความ:</strong> กรอกเป็นข้อความตามรูปแบบด้านล่าง ระบบจะแทนค่าในวงเล็บปีกกา <code>{'{}'}</code> ด้วยข้อมูลจริงเมื่อ Generate เอกสาร
                  </p>
                  <p>
                    <code>{`{Point} {Energy} หรือ {Volume} (Moment rate ที่มีการปรับ{Increase / Decrease Flow}เท่ากับ {Adj. Rate MMSCFD} หรือ {Adj. Rate MMSCFH}) วันที่/เวลาสั่งการ : วันที่ {Date} เวลา{Hour} น.`}</code>
                  </p>
                  <p>
                    <strong>ความหมายของตัวแปร:</strong>
                  </p>
                  <ul>
                    <li>
                      <strong>
                        {'{'}Point{'}'}:
                      </strong>{' '}
                      ชื่อจุด (Point) เช่น <code>ZAWTIKA</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Energy{'}'}:
                      </strong>{' '}
                      ค่าปรับพลังงาน เช่น <code>35167 MMBTU</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Volume{'}'}:
                      </strong>{' '}
                      ค่าปรับปริมาณ เช่น <code>37 MMSCF</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Increase / Decrease Flow{'}'}:
                      </strong>{' '}
                      ทิศทางการปรับปริมาณ เช่น <code>เพิ่ม</code> หรือ <code>ลด</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Adj. Rate MMSCFD{'}'}:
                      </strong>{' '}
                      อัตราปรับปริมาณหน่วย MMSCFD เช่น <code>179 MMSCFD</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Adj. Rate MMSCFH{'}'}:
                      </strong>{' '}
                      อัตราปรับปริมาณหน่วย MMSCFH เช่น <code>7 MMSCFH</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Date{'}'}:
                      </strong>{' '}
                      วันที่สั่งการ เช่น <code>11/05/2026</code>
                    </li>
                    <li>
                      <strong>
                        {'{'}Hour{'}'}:
                      </strong>{' '}
                      เวลาสั่งการ เช่น <code>15:00</code>
                    </li>
                  </ul>
                  <p>
                    <strong>ตัวอย่างผลลัพธ์:</strong>
                  </p>
                  <p>
                    <code>ZAWTIKA 35167 MMBTU หรือ 37 MMSCF (Moment rate ที่มีการปรับเพิ่มเท่ากับ 179 MMSCFD หรือ 7 MMSCFH) วันที่/เวลาสั่งการ : วันที่ 11/05/2026 เวลา15:00 น.</code>
                  </p>
                </div>
              }
              placement="top-end"
              arrow
            >
              <span className="w-[20px] h-[20px] flex items-center justify-center border border-[#B6B6B6] rounded-lg">
                <InfoOutlinedIcon sx={{fontSize: 16}} />
              </span>
            </CustomTooltip>
          </label>
          <TextField
            {...register}
            value={value || ''}
            label=""
            multiline
            onChange={(e) => {
              if ((e?.target?.value?.length ?? 0) <= maxLength) {
                onChange(e?.target?.value ?? '')
              }
            }}
            placeholder="ระบุรายละเอียด"
            disabled={disabled}
            rows={2}
            sx={textFieldSx}
            className={`${disabled ? 'bg-[#EFECEC] rounded-[8px]' : ''}`}
            InputProps={inputPropsTextField}
            fullWidth
          />
          <div className="flex justify-end text-sm text-[#B6B6B6] mt-1">
            <span className="text-[13px]">
              {value?.length || 0} / {maxLength}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default FlowRateAdjustmentTemplateInput
