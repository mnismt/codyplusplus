import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { slugify } from '../../utils'

import {
  VSCodeButton,
  VSCodeCheckbox,
  VSCodeDivider,
  VSCodeDropdown,
  VSCodeOption,
  VSCodeTextArea,
  VSCodeTextField
} from '@vscode/webview-ui-toolkit/react'
import { COMMANDS, postMessage } from './lib/vscodeApi'

interface FormData {
  name: string
  description: string
  mode: string
  prompt: string
  context: {
    codebase?: boolean
    command?: string
    currentDir?: boolean
    currentFile?: boolean
    directoryPath?: string
    filePath?: string
    none?: boolean
    openTabs?: boolean
    selection?: boolean
  }
}

function App() {
  const [oldId, setOldId] = useState<string | undefined>(undefined)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  const initialState = (window as any).initialState
  const defaultValues: FormData = initialState
    ? {
        name: initialState.id,
        description: initialState.data.description || '',
        mode: initialState.data.mode || 'ask',
        prompt: initialState.data.prompt || '',
        context: {
          codebase: initialState.data.context?.codebase || false,
          command: initialState.data.context?.command || '',
          currentDir: initialState.data.context?.currentDir || false,
          currentFile: initialState.data.context?.currentFile || false,
          directoryPath: initialState.data.context?.directoryPath || '',
          filePath: initialState.data.context?.filePath || '',
          none: initialState.data.context?.none || false,
          openTabs: initialState.data.context?.openTabs || false,
          selection: initialState.data.context?.selection || false
        }
      }
    : {
        name: '',
        description: '',
        mode: 'ask',
        prompt: '',
        context: {
          codebase: false,
          command: '',
          currentDir: false,
          currentFile: false,
          directoryPath: '',
          filePath: '',
          none: false,
          openTabs: false,
          selection: false
        }
      }

  const { register, handleSubmit, setValue, getValues } = useForm<FormData>({
    defaultValues
  })

  useEffect(() => {
    if (initialState) {
      setOldId(initialState.id)
      setIsEditing(true)
    }
  }, [initialState])

  const onSubmit = (data: FormData) => {
    data.name = slugify(data.name)

    console.log({ data, isEditing, oldId })

    postMessage({
      command: isEditing ? COMMANDS.UPDATE_COMMAND : COMMANDS.CREATE_COMMAND,
      id: data.name,
      oldId: isEditing ? oldId : undefined,
      data: {
        description: data.description,
        mode: data.mode,
        prompt: data.prompt,
        context: data.context
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

      <VSCodeDivider />

      <form className="form" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <h2>General</h2>
          <VSCodeDivider />
        </div>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <VSCodeTextField
            {...register('name', { required: true })}
            placeholder="Command name"
            type="text"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <VSCodeTextField {...register('description')} placeholder="Command description" />
        </div>
        <div className="form-group">
          <label htmlFor="mode" className="form-label">
            Mode
          </label>
          <VSCodeDropdown {...register('mode', { required: true })}>
            <VSCodeOption value="ask">Ask</VSCodeOption>
            <VSCodeOption value="edit">Edit</VSCodeOption>
            <VSCodeOption value="insert">Insert</VSCodeOption>
          </VSCodeDropdown>
        </div>
        <div className="form-group">
          <label htmlFor="prompt" className="form-label">
            Prompt
          </label>
          <VSCodeTextArea
            {...register('prompt', { required: true })}
            placeholder="Command prompt"
            rows={10}
          />
        </div>

        <div style={{ marginTop: '0.25rem' }}>
          <h2>Context</h2>
          <VSCodeDivider />
        </div>

        <div className="form-group">
          <label htmlFor="context.codebase" className="form-label">
            Codebase
          </label>
          <VSCodeCheckbox {...register('context.codebase')}>
            Include contextual information from code search based on the prompt of the command.
          </VSCodeCheckbox>
        </div>
        <div className="form-group">
          <label htmlFor="context.command" className="form-label">
            Command
          </label>
          <VSCodeTextField
            {...register('context.command')}
            placeholder="Terminal command"
            type="text"
          />
          <small>Terminal command to run and include the output of.</small>
        </div>
        <div className="form-group">
          <label htmlFor="context.currentDir" className="form-label">
            Current Directory
          </label>
          <VSCodeCheckbox {...register('context.currentDir')}>
            Include snippets from the first 10 files in the current directory.
          </VSCodeCheckbox>
        </div>
        <div className="form-group">
          <label htmlFor="context.currentFile" className="form-label">
            Current File
          </label>
          <VSCodeCheckbox {...register('context.currentFile')}>
            Include snippets from the current file. If the file is too long, only the content
            surrounding the current selection will be included
          </VSCodeCheckbox>
        </div>
        <div className="form-group">
          <label htmlFor="context.directoryPath" className="form-label">
            Directory Path
          </label>
          <VSCodeTextField
            {...register('context.directoryPath')}
            placeholder="Relative directory path"
            type="text"
          />
          <small>
            Include snippets from the first five files within the given relative path of the
            directory. Content will be limited and truncated according to the token limit
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="context.filePath" className="form-label">
            File Path
          </label>
          <VSCodeTextField
            {...register('context.filePath')}
            placeholder="Relative file path"
            type="text"
          />
          <small>
            Include snippets from the given file path relative to the current workspace. If the file
            is too long, content will be truncated
          </small>
        </div>
        <div className="form-group">
          <label htmlFor="context.none" className="form-label">
            None
          </label>
          <VSCodeCheckbox {...register('context.none')}>
            Provide only the prompt, and no additional context. If `true`, overrides all other
            context settings
          </VSCodeCheckbox>
        </div>
        <div className="form-group">
          <label htmlFor="context.selection" className="form-label">
            Open Tabs
          </label>
          <VSCodeCheckbox {...register('context.openTabs')}>
            Include the text content of opened editor tabs
          </VSCodeCheckbox>
        </div>
        <div className="form-group">
          <label htmlFor="context.selection" className="form-label">
            Selection
          </label>
          <VSCodeCheckbox {...register('context.selection')}>
            Include currently selected code. When not specified, Cody will try to use visible
            content from the current file instead
          </VSCodeCheckbox>
        </div>

        <VSCodeDivider />

        <div>
          <VSCodeButton appearance="primary" type="submit">
            {isEditing ? 'Update' : 'Create'}
          </VSCodeButton>
        </div>
      </form>
    </main>
  )
}

export default App
