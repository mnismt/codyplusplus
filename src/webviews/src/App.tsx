import { VIEW } from '../../constants/webview'
import { CommandForm } from './components/CommandForm'
import { CommandList } from './components/CommandList'

function App() {
  const view = window.VIEW

  switch (view) {
    case VIEW.COMMAND_LIST:
      return <CommandList />
    case VIEW.COMMAND_FORM:
      return <CommandForm />
    default:
      return null
  }
}

export default App
