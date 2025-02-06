import { CommandForm } from './components/CommandForm'
import { CustomCommands } from './pages/custom-commands'
import { SystemInstruction } from './pages/system-instruction'

function App() {
  const isCommandList = window.isCommandList

  if (isCommandList) {
    return (
      <div className="flex flex-col gap-4">
        <SystemInstruction />
        <CustomCommands />
      </div>
    )
  }

  return <CommandForm />
}

export default App
