import {
  VscodeButton,
  VscodeCheckbox,
  VscodeDivider,
  VscodeFormGroup,
  VscodeLabel,
  VscodeOption,
  VscodeSingleSelect,
  VscodeTextarea,
  VscodeTextfield
} from '@vscode-elements/react-elements'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { slugify } from '../../../utils'
import { COMMANDS, postMessage } from '../lib/vscodeApi'

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

export function CommandForm() {
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

  const { register, handleSubmit } = useForm<FormData>({
    defaultValues
  })

  useEffect(() => {
    if (initialState) {
      setOldId(initialState.id)
      setIsEditing(true)
    }
  }, [initialState])

  const onSubmit = (data: FormData) => {
    const id = slugify(data.name)
    const commandData = {
      description: data.description,
      mode: data.mode,
      prompt: data.prompt,
      context: data.context
    }

    if (isEditing) {
      postMessage({
        command: COMMANDS.UPDATE_COMMAND,
        id,
        oldId,
        data: commandData
      })
    } else {
      postMessage({
        command: COMMANDS.CREATE_COMMAND,
        id,
        data: commandData
      })
    }
  }

  return (
    <main className="container">
      <form onSubmit={handleSubmit(onSubmit)}>
        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="name">Name</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            {...(register('name', { required: true }), { max: undefined })}
            placeholder="Command name"
          />
        </VscodeFormGroup>
        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="description">Description</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            {...(register('description', { required: true }), { max: undefined })}
            placeholder="Command description"
          />
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="mode">Mode</VscodeLabel>
          <VscodeSingleSelect
            className="form-input form-select"
            {...register('mode', { required: true })}
          >
            <VscodeOption className="form-select-option" value="ask">
              Ask
            </VscodeOption>
            <VscodeOption className="form-select-option" value="edit">
              Edit
            </VscodeOption>
            <VscodeOption className="form-select-option" value="insert">
              Insert
            </VscodeOption>
          </VscodeSingleSelect>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="prompt">Prompt</VscodeLabel>
          <VscodeTextarea
            className="form-input"
            {...register('prompt', { required: true })}
            placeholder="Command prompt"
            rows={20}
            style={{ minHeight: '150px' }}
          />
        </VscodeFormGroup>

        <div style={{ marginTop: '0.25rem' }}>
          <h2>Context (optional)</h2>
          <VscodeDivider />
        </div>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.command">Command</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            {...(register('context.command'), { max: undefined })}
            placeholder="Terminal command"
            type="text"
          />
          <small>Terminal command to run and include the output of.</small>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.currentDir">Current Directory</VscodeLabel>
          <VscodeCheckbox {...register('context.currentDir')}>
            Include snippets from the first 10 files in the current directory.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.currentFile">Current File</VscodeLabel>
          <VscodeCheckbox {...register('context.currentFile')}>
            Include snippets from the current file. If the file is too long, only the content
            surrounding the current selection will be included
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.directoryPath">Directory Path</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            {...(register('context.directoryPath'), { max: undefined })}
            placeholder="Relative directory path"
            type="text"
          />
          <small>
            Include snippets from the first five files within the given relative path of the
            directory. Content will be limited and truncated according to the token limit
          </small>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.filePath">File Path</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            {...(register('context.filePath'), { max: undefined })}
            placeholder="Relative file path"
            type="text"
          />
          <small>Include snippets from the specified file.</small>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.none">None</VscodeLabel>
          <VscodeCheckbox {...register('context.none')}>
            Do not include any additional context.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.openTabs">Open Tabs</VscodeLabel>
          <VscodeCheckbox {...register('context.openTabs')}>
            Include snippets from all open editor tabs.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.selection">Selection</VscodeLabel>
          <VscodeCheckbox {...register('context.selection')}>
            Include the current selection.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="context.codebase">Codebase</VscodeLabel>
          <VscodeCheckbox {...register('context.codebase')}>
            Include contextual information from code search based on the prompt of the command.
          </VscodeCheckbox>
          <small>
            Warning: This option is experimental and might change or be removed in the future.
          </small>
        </VscodeFormGroup>

        <VscodeDivider />

        <div>
          <VscodeButton type="submit">{isEditing ? 'Update' : 'Create'}</VscodeButton>
        </div>
      </form>
    </main>
  )
}
