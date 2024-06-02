import { COMMANDS, postMessage } from './lib/vscodeApi'

function App() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const mode = formData.get('mode') as string
    const prompt = formData.get('prompt') as string

    postMessage({
      command: COMMANDS.CREATE_COMMAND,
      id: name,
      data: {
        description,
        mode,
        prompt
      }
    })
  }

  return (
    <main className="container">
      <h1 className="font-bold">Create a new command</h1>

      <hr />

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            type="text"
            name="name"
            className="form-control"
            placeholder="Command name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <input
            type="text"
            name="description"
            className="form-control"
            placeholder="Command description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="mode" className="form-label">
            Mode
          </label>
          <select name="mode" className="form-control">
            <option value="ask">Ask</option>
            <option value="edit">Edit</option>
            <option value="insert">Insert</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="prompt" className="form-label">
            Prompt
          </label>
          <textarea
            name="prompt"
            className="form-control"
            cols={30}
            rows={10}
            required
            placeholder="Command prompt"
          />
        </div>

        <div>
          <button type="submit">Create</button>
        </div>
      </form>
    </main>
  )
}

export default App
