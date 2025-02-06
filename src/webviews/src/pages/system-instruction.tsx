import {
  VscodeCollapsible,
  VscodeTabHeader,
  VscodeTabPanel,
  VscodeTabs
} from '@vscode-elements/react-elements'

export function SystemInstruction() {
  return (
    <VscodeCollapsible title="System Instructions" className="collapsible" open>
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
