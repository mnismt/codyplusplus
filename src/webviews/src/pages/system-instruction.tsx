import {
  VscodeCollapsible,
  VscodeTabHeader,
  VscodeTabPanel,
  VscodeTabs
} from '@vscode-elements/react-elements'

export function SystemInstruction() {
  return (
    <VscodeCollapsible
      title="System Instruction"
      className="collapsible"
      open
      id="system-instruction"
    >
      <VscodeTabs selectedIndex={0}>
        <VscodeTabHeader slot="header">Chat</VscodeTabHeader>
        <VscodeTabPanel>
          <p></p>
        </VscodeTabPanel>
        <VscodeTabHeader slot="header">Edit</VscodeTabHeader>
        <VscodeTabPanel>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, voluptatum.</p>
        </VscodeTabPanel>
      </VscodeTabs>
    </VscodeCollapsible>
  )
}
