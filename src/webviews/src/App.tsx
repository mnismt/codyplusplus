import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { slugify } from '../../utils'
import { COMMANDS, postMessage } from './lib/vscodeApi'
interface FormData {
  name: string
  description: string
  mode: string
  prompt: string
}

function App() {
  const { register, handleSubmit, setValue, getValues } = useForm<FormData>()

  const [oldId, setOldId] = useState<string | undefined>(undefined)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  useEffect(() => {
    const initialState = (window as any).initialState
    // Get initial data from the global window object
    if (initialState) {
      const { id, data } = initialState

      setOldId(id)

      setValue('name', id)
      setValue('description', data.description || '')
      setValue('mode', data.mode || 'ask')
      setValue('prompt', data.prompt || '')

      setIsEditing(true)
    }
  }, [setValue])

  const onSubmit = (data: FormData) => {
    data.name = slugify(data.name)

    postMessage({
      command: isEditing ? COMMANDS.UPDATE_COMMAND : COMMANDS.CREATE_COMMAND,
      id: data.name,
      oldId: isEditing ? oldId : undefined,
      data: {
        description: data.description,
        mode: data.mode,
        prompt: data.prompt
      }
    })

    setValue('name', data.name)
    setOldId(data.name)
  }

  return (
    <main className="container">
      <h1 className="font-bold">
        {isEditing ? `Edit command "${getValues('name')}"` : `Create a new Cody custom command`}
      </h1>

      <hr />

      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            {...register('name', { required: true })}
            type="text"
            className="form-control"
            placeholder="Command name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <input
            {...register('description')}
            type="text"
            className="form-control"
            placeholder="Command description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="mode" className="form-label">
            Mode
          </label>
          <select {...register('mode', { required: true })} className="form-control">
            <option value="ask">Ask</option>
            <option value="edit">Edit</option>
            <option value="insert">Insert</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="prompt" className="form-label">
            Prompt
          </label>
          <textarea
            {...register('prompt', { required: true })}
            className="form-control"
            cols={30}
            rows={10}
            required
            placeholder="Command prompt"
          />
        </div>

        <div>
          <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </main>
  )
}

export default App
