import { VscodeCollapsible } from '@vscode-elements/react-elements'
import { CommandList } from '../components/CommandList'

export function CustomCommands() {
  return (
    <VscodeCollapsible title="Custom Commands" open>
      <div className="p-4">
        <CommandList />
      </div>
    </VscodeCollapsible>
  )
}
