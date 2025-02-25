import { VscodeCollapsible } from '@vscode-elements/react-elements'
import { CommandList } from '../components/CommandList'

export function CustomCommands() {
  return (
    <VscodeCollapsible title="Custom Commands" id="custom-commands">
      <div style={{ minHeight: 0, flex: 1, overflowY: 'auto' }}>
        <CommandList />
      </div>
    </VscodeCollapsible>
  )
}
