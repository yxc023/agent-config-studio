import { type Component } from "solid-js"

const TitleBar: Component = () => {
  return (
    <div class="h-11 bg-white border-b border-[#e5e5e5] flex items-center px-4 drag-region">
      <span class="text-sm text-[#6e6e73] font-medium pl-16">Agent Config Studio</span>
    </div>
  )
}

export default TitleBar