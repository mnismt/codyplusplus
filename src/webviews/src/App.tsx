import { CommandForm } from './components/CommandForm'
import { CommandList } from './components/CommandList'

function App() {
  const isCommandList = (window as any).isCommandList

  if (isCommandList) {
    return <CommandList />
  }

  return <CommandForm />
}

export default App
