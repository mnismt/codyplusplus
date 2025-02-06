import { CommandForm } from './components/CommandForm'
import { CustomCommands } from './pages/custom-commands'
import { SystemInstruction } from './pages/system-instruction'

function App() {
  const isCommandList = window.isCommandList

  if (isCommandList) {
    return (
      <div id="main-view">
        <div className="collapsible-section">
          <SystemInstruction />
        </div>
        <div className="collapsible-section">
          <CustomCommands />
        </div>
      </div>
    )
  }

  return <CommandForm />
}

export default App
