import { Component, createSignal, Show, JSX } from 'solid-js'

interface TooltipProps {
  content: JSX.Element
  children: JSX.Element
  delay?: number
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [show, setShow] = createSignal(false)
  let timer: number | undefined

  const handleMouseEnter = () => {
    timer = window.setTimeout(() => setShow(true), props.delay ?? 300)
  }

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer)
    setShow(false)
  }

  return (
    <div
      class="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {props.children}
      <Show when={show()}>
        <div class="tooltip-content">{props.content}</div>
      </Show>
    </div>
  )
}