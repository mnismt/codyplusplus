import { VSCodeButton } from '@vscode/webview-ui-toolkit/react'
import { Edit, MessageSquare, Play, Plus, Trash } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { CustomCommandsSchema } from '../../../services/customCommand.service'
import { postMessage } from '../lib/vscodeApi'

type Commands = z.infer<typeof CustomCommandsSchema>

export function CommandList() {
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
              <VSCodeButton appearance="icon" onClick={() => handleExecute(id)}>
                <Play className="icon" /> {/* Use lucide-react Play icon */}
              </VSCodeButton>
              <VSCodeButton appearance="icon" onClick={() => handleEdit(id)}>
                <Edit className="icon" /> {/* Use lucide-react Edit icon */}
              </VSCodeButton>
              <VSCodeButton appearance="icon" onClick={() => handleDelete(id)}>
                <Trash className="icon" /> {/* Use lucide-react Trash icon */}
              </VSCodeButton>
            </div>
          </div>
          {command.description && <div className="command-description">{command.description}</div>}
          <div className="command-mode">
            {getIconForMode(command.mode || 'ask')} {/* Render the icon for the command mode */}
            <span className="mode-text">{command.mode || 'ask'}</span>
          </div>
        </div>
      ))}
      {Object.keys(commands).length === 0 && (
        <div className="no-commands">
          <p>Welcome to Cody++ Custom Commands.</p>
          <p>No custom commands found. Get started by adding your first command.</p>
          <p style={{ marginTop: '1rem' }}>
            <VSCodeButton
              appearance="primary"
              onClick={() => handleAdd()}
              style={{ width: '100%' }}
            >
              Add Custom Command
            </VSCodeButton>
          </p>
          <p>
            <VSCodeButton
              appearance="primary"
              onClick={() => {
                handleOpenVideo()
              }}
              style={{ width: '100%' }}
            >
              Watch Tutorial Video
            </VSCodeButton>
          </p>
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
