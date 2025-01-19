import { VscodeButton } from '@vscode-elements/react-elements'
import { Edit, MessageSquare, Play, Plus, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { CustomCommandsSchema } from '../../../services/customCommand.service'
import { postMessage } from '../lib/vscodeApi'

type Commands = z.infer<typeof CustomCommandsSchema>

export function MainView() {
  const [commands, setCommands] = useState<Commands>({})

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      const message = event.data
      switch (message.type) {
        case 'refresh':
          setCommands(message.commands)
          break
      }
    }

    window.addEventListener('message', messageHandler)
    postMessage({ type: 'getCommands' })

    return () => {
      window.removeEventListener('message', messageHandler)
    }
  }, [])

  const handleDelete = (commandId: string) => {
    postMessage({ type: 'deleteCommand', commandId })
  }

  const handleEdit = (commandId: string) => {
    postMessage({ type: 'editCommand', commandId })
  }

  const handleExecute = (commandId: string) => {
    postMessage({ type: 'executeCommand', commandId })
  }

  const handleAdd = () => {
    postMessage({ type: 'addCommand' })
  }

  const handleOpenVideo = () => {
    postMessage({ type: 'openTutorialVideo' })
  }

  return (
    <div className="command-list">
      {Object.entries(commands).map(([id, command]) => (
        <div key={id} className="command-item">
          <div className="command-header">
            <span className="command-name">{id}</span>
            <div className="command-actions">
              <VscodeButton onClick={() => handleExecute(id)}>
                <Play size={14} className="icon" />
              </VscodeButton>
              <VscodeButton onClick={() => handleEdit(id)}>
                <Edit size={14} className="icon" />
              </VscodeButton>
              <VscodeButton onClick={() => handleDelete(id)}>
                <Trash size={14} className="icon" />
              </VscodeButton>
            </div>
          </div>
          {command.description && <div className="command-description">{command.description}</div>}
          <div className="command-mode">
            {getIconForMode(command.mode || 'ask')}
            <span className="mode-text">{command.mode || 'ask'}</span>
          </div>
        </div>
      ))}
      {Object.keys(commands).length === 0 && (
        <div className="no-commands">
          <p>Welcome to Cody++ Custom Commands.</p>
          <p>No custom commands found. Get started by adding your first command.</p>
          <div
            style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
          >
            <VscodeButton onClick={() => handleAdd()}>Add Custom Command</VscodeButton>
            <VscodeButton
              onClick={() => {
                handleOpenVideo()
              }}
            >
              Watch Tutorial Video
            </VscodeButton>
          </div>
        </div>
      )}
    </div>
  )
}

function getIconForMode(mode: string): JSX.Element {
  switch (mode) {
    case 'ask':
      return <MessageSquare className="icon" size={14} />
    case 'insert':
      return <Plus className="icon" size={14} />
    case 'edit':
      return <Edit className="icon" size={14} />
    default:
      return <MessageSquare className="icon" size={14} />
  }
}
