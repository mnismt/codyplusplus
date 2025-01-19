import { VIEW } from '../../constants/webview'
import { CustomCommandFormView } from './views/CustomCommandFormView'
import { MainView } from './views/MainView'

function App() {
  const view = window.VIEW

  console.log(`Current view: ${view}`)

  switch (view) {
    case VIEW.MAIN_VIEW:
      return <MainView />
    case VIEW.CUSTOM_COMMAND_FORM_VIEW:
      return <CustomCommandFormView />
    default:
      return null
  }
}

export default App
