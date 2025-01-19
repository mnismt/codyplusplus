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
import { slugify } from '../../../utils'
import { COMMANDS, postMessage } from '../lib/vscodeApi'

interface FormData {
  name: string
  description: string
  mode: string
  prompt: string
  context: {
    codebase: boolean
    command: string
    currentDir: boolean
    currentFile: boolean
    directoryPath: string
    filePath: string
    none: boolean
    openTabs: boolean
    selection: boolean
  }
}

interface FormErrors {
  name: string
  description: string
  prompt: string
}

export function CustomCommandFormView() {
  const [formData, setFormData] = useState<FormData>({
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
  })
  const [oldId, setOldId] = useState<string>('')
  const [isEditing, setIsEditing] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    description: '',
    prompt: ''
  })

  useEffect(() => {
    if (window.initialState) {
      setFormData({
        name: window.initialState.id,
        description: window.initialState.data.description || '',
        mode: window.initialState.data.mode || 'ask',
        prompt: window.initialState.data.prompt || '',
        context: {
          codebase: window.initialState.data.context?.codebase || false,
          command: window.initialState.data.context?.command || '',
          currentDir: window.initialState.data.context?.currentDir || false,
          currentFile: window.initialState.data.context?.currentFile || false,
          directoryPath: window.initialState.data.context?.directoryPath || '',
          filePath: window.initialState.data.context?.filePath || '',
          none: window.initialState.data.context?.none || false,
          openTabs: window.initialState.data.context?.openTabs || false,
          selection: window.initialState.data.context?.selection || false
        }
      })
      setOldId(window.initialState.id)
      setIsEditing(true)
    }
  }, [])

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.trim() ? '' : 'Command name is required'
      case 'description':
        return value.trim() ? '' : 'Description is required'
      case 'prompt':
        return value.trim() ? '' : 'Prompt is required'
      default:
        return ''
    }
  }

  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    const { name, value } = target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Update error state for the field
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }))
  }

  const handleCheckboxChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const { name, checked } = target
    setFormData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        [name]: checked
      }
    }))
  }

  const handleContextInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const { name, value } = target
    setFormData(prev => ({
      ...prev,
      context: {
        ...prev.context,
        [name]: value
      }
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors = {
      name: validateField('name', formData.name),
      description: validateField('description', formData.description),
      prompt: validateField('prompt', formData.prompt)
    }

    setErrors(newErrors)

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return
    }

    const id = slugify(formData.name)
    const commandData = {
      description: formData.description,
      mode: formData.mode,
      prompt: formData.prompt,
      context: formData.context
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
      <form onSubmit={handleSubmit}>
        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="name">Name</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Command name"
          />
          {errors.name && (
            <small style={{ color: 'var(--vscode-errorForeground)' }}>{errors.name}</small>
          )}
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="description">Description</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Command description"
          />
          {errors.description && (
            <small style={{ color: 'var(--vscode-errorForeground)' }}>{errors.description}</small>
          )}
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="mode">Mode</VscodeLabel>
          <VscodeSingleSelect
            className="form-input form-select"
            name="mode"
            value={formData.mode}
            onChange={handleInputChange}
          >
            <VscodeOption value="ask">Ask</VscodeOption>
            <VscodeOption value="edit">Edit</VscodeOption>
            <VscodeOption value="insert">Insert</VscodeOption>
          </VscodeSingleSelect>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="prompt">Prompt</VscodeLabel>
          <VscodeTextarea
            className="form-input"
            name="prompt"
            value={formData.prompt}
            onChange={handleInputChange}
            placeholder="Command prompt"
            rows={20}
            style={{ minHeight: '150px' }}
          />
          {errors.prompt && (
            <small style={{ color: 'var(--vscode-errorForeground)' }}>{errors.prompt}</small>
          )}
        </VscodeFormGroup>

        <div style={{ marginTop: '0.25rem' }}>
          <h2>Context (optional)</h2>
          <VscodeDivider />
        </div>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="command">Command</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            name="command"
            value={formData.context.command}
            onChange={handleContextInputChange}
            placeholder="Terminal command"
          />
          <small>Terminal command to run and include the output of.</small>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="currentDir">Current Directory</VscodeLabel>
          <VscodeCheckbox
            name="currentDir"
            checked={formData.context.currentDir}
            onChange={handleCheckboxChange}
          >
            Include snippets from the first 10 files in the current directory.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="currentFile">Current File</VscodeLabel>
          <VscodeCheckbox
            name="currentFile"
            checked={formData.context.currentFile}
            onChange={handleCheckboxChange}
          >
            Include snippets from the current file. If the file is too long, only the content
            surrounding the current selection will be included
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="directoryPath">Directory Path</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            name="directoryPath"
            value={formData.context.directoryPath}
            onChange={handleContextInputChange}
            placeholder="Relative directory path"
          />
          <small>
            Include snippets from the first five files within the given relative path of the
            directory. Content will be limited and truncated according to the token limit
          </small>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="filePath">File Path</VscodeLabel>
          <VscodeTextfield
            className="form-input"
            name="filePath"
            value={formData.context.filePath}
            onChange={handleContextInputChange}
            placeholder="Relative file path"
          />
          <small>Include snippets from the specified file.</small>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="none">None</VscodeLabel>
          <VscodeCheckbox
            name="none"
            checked={formData.context.none}
            onChange={handleCheckboxChange}
          >
            Do not include any additional context.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="openTabs">Open Tabs</VscodeLabel>
          <VscodeCheckbox
            name="openTabs"
            checked={formData.context.openTabs}
            onChange={handleCheckboxChange}
          >
            Include snippets from all open editor tabs.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="selection">Selection</VscodeLabel>
          <VscodeCheckbox
            name="selection"
            checked={formData.context.selection}
            onChange={handleCheckboxChange}
          >
            Include the current selection.
          </VscodeCheckbox>
        </VscodeFormGroup>

        <VscodeFormGroup variant="vertical">
          <VscodeLabel htmlFor="codebase">Codebase</VscodeLabel>
          <VscodeCheckbox
            name="codebase"
            checked={formData.context.codebase}
            onChange={handleCheckboxChange}
          >
            Include contextual information from code search based on the prompt of the command.
          </VscodeCheckbox>
          <small>
            Warning: This option is experimental and might change or be removed in the future.
          </small>
        </VscodeFormGroup>

        <VscodeDivider />

        <VscodeButton type="submit">{isEditing ? 'Update' : 'Create'}</VscodeButton>
      </form>
    </main>
  )
}
